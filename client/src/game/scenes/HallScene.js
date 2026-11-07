import * as Phaser from "phaser";

import { TILE_SIZE } from "@pixel-hall/shared";
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
import { isNearby, isWalkable, pixelToTile, tileDistance } from "@pixel-hall/shared/movement.js";

import {
  SPRITE_DIRECTIONS,
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
  WALK_FRAMES,
  composeCharacterSpritesheet,
} from "../../sprites/index.js";
import { gameBridge } from "../bridge.js";
import { createHallTextures } from "../textures.js";

const WALK_SPEED = 90;
const INTERACT_RANGE = 2;
const SPAWN_TILE = { x: 14, y: 17 };
const SHEET_KEY = "player-sheet";

export class HallScene extends Phaser.Scene {
  constructor() {
    super({ key: "hall" });
  }

  create() {
    const spawn = this.registry.get("spawn") ?? {};

    createHallTextures(this);
    this.drawRoom();
    this.createPlayer(spawn.character ?? defaultCharacter());
    this.createNameLabel(spawn.username ?? "");
    this.createInput();

    this.facing = "down";
    this.cameras.main.setBounds(0, 0, HALL_WIDTH, HALL_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
  }

  update(_time, delta) {
    const step = (WALK_SPEED * delta) / 1000;

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

    if (
      Phaser.Input.Keyboard.JustDown(this.keys.interact) ||
      Phaser.Input.Keyboard.JustDown(this.keys.interactAlt)
    ) {
      this.emitNearestInteraction();
    }
  }

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

  createPlayer(character) {
    const sheet = composeCharacterSpritesheet(character);

    if (this.textures.exists(SHEET_KEY)) this.textures.remove(SHEET_KEY);

    // The sheet is a canvas: register it, then carve out the 12 frames by hand.
    const texture = this.textures.addCanvas(SHEET_KEY, sheet);
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

    SPRITE_DIRECTIONS.forEach((direction, row) => {
      if (this.anims.exists(`walk-${direction}`)) return;

      this.anims.create({
        key: `walk-${direction}`,
        frames: [0, 1, 2].map((column) => ({ key: SHEET_KEY, frame: row * WALK_FRAMES + column })),
        frameRate: 8,
        repeat: -1,
      });
    });

    this.player = this.add
      .sprite(
        SPAWN_TILE.x * TILE_SIZE + TILE_SIZE / 2,
        SPAWN_TILE.y * TILE_SIZE + TILE_SIZE,
        SHEET_KEY,
        0,
      )
      .setOrigin(0.5, 1);
  }

  createNameLabel(username) {
    this.nameLabel = this.add
      .text(this.player.x, this.player.y - SPRITE_HEIGHT - 2, username, {
        fontFamily: "monospace",
        fontSize: "6px",
        color: "#e8e8f0",
      })
      .setOrigin(0.5, 1)
      .setDepth(10000);
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

  /** Feet-first collision: the tile just above the sprite's bottom edge. */
  canStand(x, y) {
    return isWalkable(HALL_LAYOUT, pixelToTile(x), pixelToTile(y - 1));
  }

  updatePose(vx, vy) {
    if (vx === 0 && vy === 0) {
      this.player.anims.stop();
      this.player.setFrame(SPRITE_DIRECTIONS.indexOf(this.facing) * WALK_FRAMES);
      return;
    }

    this.facing =
      Math.abs(vx) >= Math.abs(vy) ? (vx < 0 ? "left" : "right") : vy < 0 ? "up" : "down";

    this.player.anims.play(`walk-${this.facing}`, true);
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

function rectCentre(rect) {
  return { x: rect.x + Math.floor(rect.w / 2), y: rect.y + Math.floor(rect.h / 2) };
}
