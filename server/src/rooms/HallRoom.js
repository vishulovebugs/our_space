import { Room } from "colyseus";

import { MAX_PLAYERS_PER_HALL, PLAYER_SPEED, TILE_SIZE } from "@pixel-hall/shared";
import { HALL_LAYOUT } from "@pixel-hall/shared/hallLayout.js";
import { isStandablePosition } from "@pixel-hall/shared/movement.js";

import { verifyToken } from "../../auth.js";
import { loadProfile } from "../supabase.js";
import { HallState, Player } from "../state/HallState.js";

/** Slack for timer jitter and rounding, in pixels. */
const MOVE_TOLERANCE_PX = 8;

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
