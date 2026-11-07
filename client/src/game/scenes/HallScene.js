import * as Phaser from "phaser";

import { Client } from "@colyseus/sdk";

import { PLAYER_SPEED, TILE_SIZE } from "@pixel-hall/shared";
import { defaultCharacter } from "@pixel-hall/shared/character.js";
import {
  ARCADE_CABINETS,
  COUCH_TILES,
  DOOR,
  HALL_HEIGHT,
  HALL_LAYOUT,
  HALL_WIDTH,
  SEATS,
  TV,
} from "@pixel-hall/shared/hallLayout.js";
import {
  isNearby,
  isStandablePosition,
  pixelToTile,
  tileDistance,
} from "@pixel-hall/shared/movement.js";

import {
  SPRITE_DIRECTIONS,
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
  WALK_FRAMES,
  composeCharacterSpritesheet,
} from "../../sprites/index.js";
import { gameBridge } from "../bridge.js";
import { createHallTextures } from "../textures.js";

const INTERACT_RANGE = 2;
const SPAWN_TILE = { x: 14, y: 17 };
const SEND_INTERVAL_MS = 50;
const SNAP_THRESHOLD_PX = 24;
const RECONNECT_DELAY_MS = 2000;
const RECONNECT_ATTEMPTS = 5;
const DEFAULT_SERVER_URL = "ws://localhost:2567";
const LOCAL_TEXTURE_KEY = "player-local";

export class HallScene extends Phaser.Scene {
  constructor() {
    super({ key: "hall" });
  }

  create() {
    const spawn = this.registry.get("spawn") ?? {};

    this.token = spawn.token;
    this.character = spawn.character ?? defaultCharacter();
    this.username = spawn.username ?? "";
    this.room = null;
    this.remote = new Map();
    this.shuttingDown = false;
    this.reconnecting = false;
    this.lastSentAt = 0;
    this.lastSent = { x: 0, y: 0 };
    this.facing = "down";

    createHallTextures(this);
    this.drawRoom();
    this.createLocalPlayer();
    this.createInput();

    this.cameras.main.setBounds(0, 0, HALL_WIDTH, HALL_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    this.joinHall();
  }

  update(_time, delta) {
    const step = (PLAYER_SPEED * delta) / 1000;

    const left = this.keys.left.isDown || this.cursors.left.isDown;
    const right = this.keys.right.isDown || this.cursors.right.isDown;
    const up = this.keys.up.isDown || this.cursors.up.isDown;
    const down = this.keys.down.isDown || this.cursors.down.isDown;

    let vx = (right ? 1 : 0) - (left ? 1 : 0);
    let vy = (down ? 1 : 0) - (up ? 1 : 0);

    if (vx !== 0 && vy !== 0) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }

    // One axis at a time, so the player slides along a wall instead of sticking.
    if (vx !== 0 && this.canStand(this.player.x + vx * step, this.player.y)) {
      this.player.x += vx * step;
    }
    if (vy !== 0 && this.canStand(this.player.x, this.player.y + vy * step)) {
      this.player.y += vy * step;
    }

    this.updatePose(vx, vy);
    this.player.setDepth(this.player.y);
    this.nameLabel.setPosition(this.player.x, this.player.y - SPRITE_HEIGHT - 2);
    this.updateRemotePlayers();
    this.sendMove();

    if (
      Phaser.Input.Keyboard.JustDown(this.keys.interact) ||
      Phaser.Input.Keyboard.JustDown(this.keys.interactAlt)
    ) {
      this.emitNearestInteraction();
    }
  }

  shutdown() {
    this.shuttingDown = true;
    this.clearRemotePlayers();
    this.room?.leave();
    this.room = null;
  }

  // ---- networking -------------------------------------------------------

  async joinHall() {
    const client = new Client(import.meta.env.VITE_SERVER_URL ?? DEFAULT_SERVER_URL);

    this.room = await client.joinOrCreate("hall", {
      token: this.token,
      character: JSON.stringify(this.character),
    });

    this.room.onStateChange((state) => this.syncPlayers(state));
    this.room.onMessage("snap", (position) => {
      this.player.x = position.x;
      this.player.y = position.y;
    });
    this.room.onLeave(() => this.handleSocketClosed());
  }

  handleSocketClosed() {
    if (this.shuttingDown || this.reconnecting) return;

    this.reconnecting = true;
    gameBridge.emit("connection:lost");
    this.reconnect();
  }

  async reconnect() {
    for (let attempt = 0; attempt < RECONNECT_ATTEMPTS; attempt++) {
      await wait(RECONNECT_DELAY_MS);
      if (this.shuttingDown) return;

      try {
        this.clearRemotePlayers();
        await this.joinHall();
        this.reconnecting = false;
        gameBridge.emit("connection:restored");
        return;
      } catch {
        // Still down: keep trying until the attempts run out.
      }
    }

    this.reconnecting = false;
  }

  syncPlayers(state) {
    const players = state?.players;
    if (!players) return;

    const seen = new Set();

    players.forEach((remote, sessionId) => {
      if (sessionId === this.room?.sessionId) {
        this.reconcileOwnPosition(remote);
        return;
      }

      seen.add(sessionId);
      this.upsertRemotePlayer(sessionId, remote);
    });

    for (const sessionId of [...this.remote.keys()]) {
      if (!seen.has(sessionId)) this.removeRemotePlayer(sessionId);
    }
  }

  /** The server has the last word: a big mismatch means we were snapped back. */
  reconcileOwnPosition(remote) {
    if (Math.hypot(remote.x - this.player.x, remote.y - this.player.y) > SNAP_THRESHOLD_PX) {
      this.player.x = remote.x;
      this.player.y = remote.y;
    }
  }

  sendMove() {
    if (!this.room || this.reconnecting) return;

    const now = this.time.now;
    const movedEnough =
      Math.abs(this.player.x - this.lastSent.x) > 0.5 || Math.abs(this.player.y - this.lastSent.y) > 0.5;
    if (!movedEnough || now - this.lastSentAt < SEND_INTERVAL_MS) return;

    this.lastSentAt = now;
    this.lastSent = { x: this.player.x, y: this.player.y };
    this.room.send("move", { x: this.player.x, y: this.player.y, dir: this.facing });
  }

  // ---- players ----------------------------------------------------------

  createLocalPlayer() {
    this.registerCharacter(LOCAL_TEXTURE_KEY, this.character);

    this.player = this.add
      .sprite(
        SPAWN_TILE.x * TILE_SIZE + TILE_SIZE / 2,
        (SPAWN_TILE.y + 1) * TILE_SIZE,
        LOCAL_TEXTURE_KEY,
        0,
      )
      .setOrigin(0.5, 1);

    this.nameLabel = this.add
      .text(this.player.x, this.player.y - SPRITE_HEIGHT - 2, this.username, {
        fontFamily: "monospace",
        fontSize: "6px",
        color: "#e8e8f0",
      })
      .setOrigin(0.5, 1)
      .setDepth(10000);
  }

  upsertRemotePlayer(sessionId, remote) {
    let view = this.remote.get(sessionId);

    if (!view) {
      const textureKey = `player-${sessionId}`;
      this.registerCharacter(textureKey, parseCharacter(remote.character));

      const sprite = this.add.sprite(remote.x, remote.y, textureKey, 0).setOrigin(0.5, 1);
      const label = this.add
        .text(remote.x, remote.y - SPRITE_HEIGHT - 2, remote.username ?? "", {
          fontFamily: "monospace",
          fontSize: "6px",
          color: "#7cf5c4",
        })
        .setOrigin(0.5, 1)
        .setDepth(10000);

      view = { sprite, label, textureKey, targetX: remote.x, targetY: remote.y, dir: remote.dir ?? "down" };
      this.remote.set(sessionId, view);
    }

    view.targetX = remote.x;
    view.targetY = remote.y;
    view.dir = remote.dir ?? view.dir;
  }

  removeRemotePlayer(sessionId) {
    const view = this.remote.get(sessionId);
    if (!view) return;

    view.sprite.destroy();
    view.label.destroy();
    this.textures.remove(view.textureKey);
    this.remote.delete(sessionId);
  }

  clearRemotePlayers() {
    for (const sessionId of [...this.remote.keys()]) {
      this.removeRemotePlayer(sessionId);
    }
  }

  /** Lerp toward the last position the server sent, so players glide. */
  updateRemotePlayers() {
    for (const view of this.remote.values()) {
      view.sprite.x += (view.targetX - view.sprite.x) * 0.25;
      view.sprite.y += (view.targetY - view.sprite.y) * 0.25;
      view.sprite.setDepth(view.sprite.y);
      view.label.setPosition(view.sprite.x, view.sprite.y - SPRITE_HEIGHT - 2);

      const moving =
        Math.abs(view.targetX - view.sprite.x) > 1 || Math.abs(view.targetY - view.sprite.y) > 1;

      if (moving) {
        this.playWalk(view.sprite, view.textureKey, view.dir);
      } else {
        view.sprite.anims.stop();
        view.sprite.setFrame(SPRITE_DIRECTIONS.indexOf(view.dir) * WALK_FRAMES);
      }
    }
  }

  registerCharacter(textureKey, character) {
    if (this.textures.exists(textureKey)) return;

    const texture = this.textures.addCanvas(textureKey, composeCharacterSpritesheet(character));

    let index = 0;
    for (let row = 0; row < SPRITE_DIRECTIONS.length; row++) {
      for (let column = 0; column < WALK_FRAMES; column++) {
        texture.add(
          index++,
          0,
          column * SPRITE_WIDTH,
          row * SPRITE_HEIGHT,
          SPRITE_WIDTH,
          SPRITE_HEIGHT,
        );
      }
    }
  }

  playWalk(sprite, textureKey, dir) {
    const key = `walk-${textureKey}-${dir}`;

    if (!this.anims.exists(key)) {
      this.anims.create({
        key,
        frames: [0, 1, 2].map((column) => ({
          key: textureKey,
          frame: SPRITE_DIRECTIONS.indexOf(dir) * WALK_FRAMES + column,
        })),
        frameRate: 8,
        repeat: -1,
      });
    }

    sprite.anims.play(key, true);
  }

  // ---- room -------------------------------------------------------------

  drawRoom() {
    for (let y = 0; y < HALL_LAYOUT.rows; y++) {
      for (let x = 0; x < HALL_LAYOUT.columns; x++) {
        const key = `${x},${y}`;
        const texture = HALL_LAYOUT.wallKeys.has(key) ? "tile-wall" : "tile-floor";

        this.add.image(x * TILE_SIZE, y * TILE_SIZE, texture).setOrigin(0, 0).setDepth(0);
      }
    }

    for (const tile of COUCH_TILES) {
      this.add
        .image(tile.x * TILE_SIZE, tile.y * TILE_SIZE + 8, "couch-back")
        .setOrigin(0, 0)
        .setDepth(tile.y * TILE_SIZE + TILE_SIZE);
    }

    for (const seat of SEATS) {
      this.add
        .image(seat.x * TILE_SIZE + TILE_SIZE / 2, seat.y * TILE_SIZE + TILE_SIZE / 2, "couch-seat")
        .setDepth(seat.y * TILE_SIZE + TILE_SIZE - 1);
    }

    this.add
      .image(TV.x * TILE_SIZE, TV.y * TILE_SIZE, "tv")
      .setOrigin(0, 0)
      .setDepth(TV.y * TILE_SIZE + TV.h * TILE_SIZE);

    for (const cabinet of ARCADE_CABINETS) {
      this.add
        .image(cabinet.x * TILE_SIZE, cabinet.y * TILE_SIZE, `arcade-${cabinet.id}`)
        .setOrigin(0, 0)
        .setDepth(cabinet.y * TILE_SIZE + cabinet.h * TILE_SIZE);

      this.add
        .text(cabinet.x * TILE_SIZE + TILE_SIZE / 2, cabinet.y * TILE_SIZE - 2, cabinet.label, {
          fontFamily: "monospace",
          fontSize: "6px",
          color: "#7cf5c4",
        })
        .setOrigin(0.5, 1)
        .setDepth(cabinet.y * TILE_SIZE + cabinet.h * TILE_SIZE);
    }

    this.add
      .image(DOOR.x * TILE_SIZE, DOOR.y * TILE_SIZE, "door")
      .setOrigin(0, 0)
      .setDepth(DOOR.y * TILE_SIZE + TILE_SIZE);
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      up: "W",
      down: "S",
      left: "A",
      right: "D",
      interact: "E",
      interactAlt: "SPACE",
    });
  }

  canStand(x, y) {
    return isStandablePosition(HALL_LAYOUT, x, y);
  }

  updatePose(vx, vy) {
    if (vx === 0 && vy === 0) {
      this.player.anims.stop();
      this.player.setFrame(SPRITE_DIRECTIONS.indexOf(this.facing) * WALK_FRAMES);
      return;
    }

    this.facing =
      Math.abs(vx) >= Math.abs(vy) ? (vx < 0 ? "left" : "right") : vy < 0 ? "up" : "down";

    this.playWalk(this.player, LOCAL_TEXTURE_KEY, this.facing);
  }

  emitNearestInteraction() {
    const standing = { x: pixelToTile(this.player.x), y: pixelToTile(this.player.y - 1) };

    const candidates = [
      ...SEATS.map((seat) => ({
        event: "interact:seat",
        payload: { seatId: seat.id },
        tile: { x: seat.x, y: seat.y },
      })),
      {
        event: "interact:tv",
        payload: { tvId: TV.id },
        tile: rectCentre(TV),
      },
      ...ARCADE_CABINETS.map((cabinet) => ({
        event: "interact:arcade",
        payload: { cabinet: cabinet.id, label: cabinet.label },
        tile: rectCentre(cabinet),
      })),
    ].filter((candidate) => isNearby(standing, candidate.tile, INTERACT_RANGE));

    if (candidates.length === 0) return;

    candidates.sort((a, b) => tileDistance(standing, a.tile) - tileDistance(standing, b.tile));
    gameBridge.emit(candidates[0].event, candidates[0].payload);
  }
}

function parseCharacter(value) {
  if (typeof value !== "string" || value === "") return defaultCharacter();

  try {
    return JSON.parse(value);
  } catch {
    return defaultCharacter();
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rectCentre(rect) {
  return { x: rect.x + Math.floor(rect.w / 2), y: rect.y + Math.floor(rect.h / 2) };
}
