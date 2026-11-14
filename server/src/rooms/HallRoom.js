import { Room } from "colyseus";

import { MAX_PLAYERS_PER_HALL, PLAYER_SPEED, TILE_SIZE } from "@pixel-hall/shared";
import { ARCADE_RANGE, arcadeById } from "@pixel-hall/shared/arcade.js";
import { CHAT_MESSAGE_MAX } from "@pixel-hall/shared/chatParser.js";
import { HALL_LAYOUT, SEATS } from "@pixel-hall/shared/hallLayout.js";
import {
  clampToWalkable,
  isStandablePosition,
  pixelToTile,
  tileCentre,
  tileDistance,
} from "@pixel-hall/shared/movement.js";
import { isSeatIndex, seatAnchor, seatStandTile, seatedPlayers } from "@pixel-hall/shared/seats.js";
import { currentPosition } from "@pixel-hall/shared/tvSync.js";
import { parseYouTubeUrl } from "@pixel-hall/shared/youtube.js";

import { verifyToken } from "../../auth.js";
import { loadProfile } from "../supabase.js";
import { HallState, Player } from "../state/HallState.js";

/** Slack for timer jitter and rounding, in pixels. */
const MOVE_TOLERANCE_PX = 8;

/** How close to a seat anchor a player must stand to sit down. */
const SIT_RANGE_PX = 24;

/** Chat rate limit: at most 5 messages in any 10 second window, per player. */
const CHAT_MAX_PER_WINDOW = 5;
const CHAT_WINDOW_MS = 10_000;

/** How much chat a player gets when they open the terminal. */
const CHAT_HISTORY_LIMIT = 30;

/** The TV remote: one new video per player every 5 seconds. */
const TV_PLAY_COOLDOWN_MS = 5_000;

const SPAWN_TILE = { x: 14, y: 17 };
const DIRECTIONS = ["down", "left", "right", "up"];

export class HallRoom extends Room {
  onCreate() {
    this.maxClients = MAX_PLAYERS_PER_HALL;
    this.setState(new HallState());

    // sessionId lookups that do not belong in synchronised state.
    this.sessionByUser = new Map();
    this.lastMoveAt = new Map();

    // Chat lives in memory only: it is never written to the database.
    this.chatHistory = [];
    this.chatSentAt = new Map();
    this.tvPlayAt = new Map();

    this.onMessage("move", (client, payload) => this.handleMove(client, payload));
    this.onMessage("sit", (client, payload) => this.handleSit(client, payload));
    this.onMessage("stand", (client) => this.handleStand(client));
    this.onMessage("chat", (client, payload) => this.handleChat(client, payload));
    this.onMessage("chat:open", (client) => this.handleChatOpen(client));
    this.onMessage("tv:play", (client, payload) => this.handleTvPlay(client, payload));
    this.onMessage("tv:pause", (client) => this.handleTvPause(client));
    this.onMessage("tv:resume", (client) => this.handleTvResume(client));
    this.onMessage("tv:stop", (client) => this.handleTvStop(client));
    this.onMessage("arcade:enter", (client, payload) => this.handleArcadeEnter(client, payload));
  }

  async onAuth(_client, options) {
    const auth = await verifyToken(options?.token);

    // Tests never touch the network: the character rides along in options.
    if (process.env.NODE_ENV === "test") {
      return {
        userId: auth.userId,
        username: auth.username ?? "player",
        character: normalizeCharacter(options?.character),
      };
    }

    const profile = await loadProfile(options.token, auth.userId);

    return {
      userId: auth.userId,
      username: profile.username ?? auth.username ?? "player",
      character: normalizeCharacter(profile.character),
    };
  }

  onJoin(client) {
    const auth = client.auth;

    // One connection per account: the newest one wins.
    const previousSessionId = this.sessionByUser.get(auth.userId);
    if (previousSessionId) {
      this.clients.find((other) => other.sessionId === previousSessionId)?.leave(4000);
      this.dropPlayer(previousSessionId);
    }

    this.sessionByUser.set(auth.userId, client.sessionId);

    const player = new Player();
    player.id = auth.userId;
    player.username = auth.username;
    player.character = auth.character;
    player.x = SPAWN_TILE.x * TILE_SIZE + TILE_SIZE / 2;
    player.y = (SPAWN_TILE.y + 1) * TILE_SIZE;
    player.dir = "down";

    this.state.players.set(client.sessionId, player);
    this.lastMoveAt.set(client.sessionId, Date.now());
  }

  onLeave(client) {
    this.dropPlayer(client.sessionId);
    this.refreshHost();

    const userId = client.auth?.userId;
    if (userId && this.sessionByUser.get(userId) === client.sessionId) {
      this.sessionByUser.delete(userId);
    }
  }

  /**
   * Every move is checked twice: the target must be floor, and it must be
   * reachable at walking speed since the last accepted move. Anything else
   * snaps the client back to the authoritative position.
   */
  handleMove(client, payload) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    // Sitting pins the player to the seat: moves are ignored, not applied.
    if (player.seat >= 0) return;

    const x = payload?.x;
    const y = payload?.y;
    const dir = DIRECTIONS.includes(payload?.dir) ? payload.dir : player.dir;

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return this.snap(client, player);
    }

    const now = Date.now();
    const elapsedSeconds = Math.max(0, (now - (this.lastMoveAt.get(client.sessionId) ?? now)) / 1000);
    const allowedDistance = PLAYER_SPEED * elapsedSeconds + MOVE_TOLERANCE_PX;
    const movedDistance = Math.hypot(x - player.x, y - player.y);

    if (movedDistance > allowedDistance || !isStandablePosition(HALL_LAYOUT, x, y)) {
      return this.snap(client, player);
    }

    player.x = x;
    player.y = y;
    player.dir = dir;
    this.lastMoveAt.set(client.sessionId, now);
  }

  /** Sitting is allowed only on a free seat, close by, and only once. */
  handleSit(client, payload) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    if (player.seat >= 0) {
      return this.fail(client, "You are already seated.");
    }

    if (!isSeatIndex(payload?.seatIndex)) {
      return this.fail(client, "That seat does not exist.");
    }

    const seatIndex = payload.seatIndex;

    if (this.seatIsTaken(seatIndex)) {
      return this.fail(client, "That seat is taken.");
    }

    const anchor = seatAnchor(SEATS[seatIndex]);
    if (Math.hypot(anchor.x - player.x, anchor.y - player.y) > SIT_RANGE_PX) {
      return this.fail(client, "You are too far from that seat.");
    }

    player.seat = seatIndex;
    player.x = anchor.x;
    player.y = anchor.y;
    player.dir = SEATS[seatIndex].facing ?? "down";
    this.lastMoveAt.set(client.sessionId, Date.now());
  }

  /** Standing puts the player back on the floor in front of the cushion. */
  handleStand(client) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    if (player.seat < 0) {
      return this.fail(client, "You are not seated.");
    }

    const front = seatStandTile(SEATS[player.seat]);
    const tile = clampToWalkable(HALL_LAYOUT, front.x, front.y) ?? SPAWN_TILE;
    const centre = tileCentre(tile);

    player.seat = -1;
    player.x = centre.x;
    player.y = (tile.y + 1) * TILE_SIZE;
    player.dir = "down";
    this.lastMoveAt.set(client.sessionId, Date.now());

    // Leaving the couch gives up the remote, and may end the show.
    this.refreshHost();
  }

  /**
   * Arcades are floor furniture: a player must be standing, the cabinet must
   * exist, and they must actually be next to it. No game logic lives here yet.
   */
  handleArcadeEnter(client, payload) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    if (player.seat >= 0) {
      return this.fail(client, "Stand up to play an arcade.");
    }

    const arcade = arcadeById(payload?.id);
    if (!arcade) {
      return this.fail(client, "That arcade does not exist.");
    }

    const standing = { x: pixelToTile(player.x), y: pixelToTile(player.y - 1) };
    if (tileDistance(standing, arcade) > ARCADE_RANGE) {
      return this.fail(client, "You are too far from that arcade.");
    }

    player.activity = arcade.id;
    client.send("arcade:entered", { ok: true, id: arcade.id });
  }

  /**
   * Chat is a privilege of the couch: only seated players may send, and only
   * seated players receive. Text is cleaned and rate limited before it goes out.
   */
  handleChat(client, payload) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    if (player.seat < 0) {
      return this.fail(client, "Only seated players can chat.");
    }

    const text = sanitizeChat(payload?.text);
    if (text === "") return;

    const now = Date.now();
    const recent = (this.chatSentAt.get(client.sessionId) ?? []).filter(
      (at) => now - at < CHAT_WINDOW_MS,
    );

    if (recent.length >= CHAT_MAX_PER_WINDOW) {
      this.chatSentAt.set(client.sessionId, recent);
      return this.fail(client, "Too fast. Wait a moment.");
    }

    recent.push(now);
    this.chatSentAt.set(client.sessionId, recent);

    const message = { username: player.username, text, ts: now };

    this.chatHistory.push(message);
    if (this.chatHistory.length > CHAT_HISTORY_LIMIT) this.chatHistory.shift();

    this.sendToSeated("chat", message);
  }

  /** Opening the terminal replays the last few lines, seated players only. */
  handleChatOpen(client) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    if (player.seat < 0) {
      return this.fail(client, "Only seated players can chat.");
    }

    client.send("chat:history", { messages: [...this.chatHistory] });
  }

  /**
   * Anyone seated may put a video on, and doing so makes them the host. The
   * link is parsed on the server: only a real 11-character video id is stored.
   */
  handleTvPlay(client, payload) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    if (player.seat < 0) {
      return this.fail(client, "Only seated players can use the TV.");
    }

    const now = Date.now();
    if (now - (this.tvPlayAt.get(client.sessionId) ?? 0) < TV_PLAY_COOLDOWN_MS) {
      return this.fail(client, "Wait a moment before changing the video.");
    }

    const videoId = parseYouTubeUrl(payload?.url);
    if (!videoId) {
      return this.fail(client, "That is not a YouTube link.");
    }

    this.tvPlayAt.set(client.sessionId, now);

    const tv = this.state.tv;
    tv.videoId = videoId;
    tv.startedAt = now;
    tv.position = 0;
    tv.playing = true;
    tv.hostId = player.id;
  }

  handleTvPause(client) {
    const tv = this.requireTvHost(client);
    if (!tv) return;

    const now = Date.now();
    tv.position = currentPosition(tv, now);
    tv.startedAt = now;
    tv.playing = false;
  }

  handleTvResume(client) {
    const tv = this.requireTvHost(client);
    if (!tv) return;

    tv.startedAt = Date.now();
    tv.playing = true;
  }

  handleTvStop(client) {
    const tv = this.requireTvHost(client);
    if (!tv) return;

    this.stopTv();
  }

  /** Pause, resume and stop are the host's alone. */
  requireTvHost(client) {
    const player = this.state.players.get(client.sessionId);
    const tv = this.state.tv;

    if (!player) return null;

    if (player.seat < 0) {
      this.fail(client, "Only seated players can use the TV.");
      return null;
    }

    if (!tv.videoId) {
      this.fail(client, "Nothing is playing.");
      return null;
    }

    if (tv.hostId !== player.id) {
      this.fail(client, "Only the host controls the TV.");
      return null;
    }

    return tv;
  }

  /**
   * The remote follows the couch: if the host is no longer seated, the next
   * seated player takes over, and with nobody left seated the TV stops.
   */
  refreshHost() {
    const tv = this.state.tv;
    if (!tv.videoId) return;

    const seated = [];
    for (const client of this.clients) {
      const player = this.state.players.get(client.sessionId);
      if (player && player.seat >= 0) seated.push(player);
    }

    if (seated.length === 0) {
      this.stopTv();
      return;
    }

    if (!seated.some((player) => player.id === tv.hostId)) {
      tv.hostId = seated[0].id;
    }
  }

  stopTv() {
    const tv = this.state.tv;
    tv.videoId = "";
    tv.startedAt = 0;
    tv.position = 0;
    tv.playing = false;
    tv.hostId = "";
  }

  /** A standing player is not in the chat space at all, not even as a listener. */
  sendToSeated(type, payload) {
    for (const other of this.clients) {
      const player = this.state.players.get(other.sessionId);
      if (player && player.seat >= 0) other.send(type, payload);
    }
  }

  seatIsTaken(seatIndex) {
    return seatedPlayers(this.state).some((entry) => entry.seatIndex === seatIndex);
  }

  fail(client, message) {
    client.send("error", { message });
  }

  snap(client, player) {
    client.send("snap", { x: player.x, y: player.y, dir: player.dir });
  }

  dropPlayer(sessionId) {
    this.state.players.delete(sessionId);
    this.lastMoveAt.delete(sessionId);
    this.chatSentAt.delete(sessionId);
    this.tvPlayAt.delete(sessionId);
  }
}

/**
 * Removes HTML tags and control characters, collapses whitespace and caps the
 * length. The server trusts no text, including its own broadcast.
 */
function sanitizeChat(value) {
  if (typeof value !== "string") return "";

  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, CHAT_MESSAGE_MAX)
    .trim();
}

function normalizeCharacter(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return JSON.stringify(value);
  return "";
}
