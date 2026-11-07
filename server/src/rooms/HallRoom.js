import { Room } from "colyseus";

import { MAX_PLAYERS_PER_HALL, PLAYER_SPEED, TILE_SIZE } from "@pixel-hall/shared";
import { HALL_LAYOUT, SEATS } from "@pixel-hall/shared/hallLayout.js";
import { clampToWalkable, isStandablePosition, tileCentre } from "@pixel-hall/shared/movement.js";
import { isSeatIndex, seatAnchor, seatStandTile, seatedPlayers } from "@pixel-hall/shared/seats.js";

import { verifyToken } from "../../auth.js";
import { loadProfile } from "../supabase.js";
import { HallState, Player } from "../state/HallState.js";

/** Slack for timer jitter and rounding, in pixels. */
const MOVE_TOLERANCE_PX = 8;

/** How close to a seat anchor a player must stand to sit down. */
const SIT_RANGE_PX = 24;

const SPAWN_TILE = { x: 14, y: 17 };
const DIRECTIONS = ["down", "left", "right", "up"];

export class HallRoom extends Room {
  onCreate() {
    this.maxClients = MAX_PLAYERS_PER_HALL;
    this.setState(new HallState());

    // sessionId lookups that do not belong in synchronised state.
    this.sessionByUser = new Map();
    this.lastMoveAt = new Map();

    this.onMessage("move", (client, payload) => this.handleMove(client, payload));
    this.onMessage("sit", (client, payload) => this.handleSit(client, payload));
    this.onMessage("stand", (client) => this.handleStand(client));
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
  }
}

function normalizeCharacter(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return JSON.stringify(value);
  return "";
}
