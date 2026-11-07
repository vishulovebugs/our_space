import { describe, expect, it } from "vitest";

import { COUCH_TILES, HALL_COLUMNS, HALL_LAYOUT, HALL_ROWS, SEATS } from "./hallLayout.js";
import {
  clampToWalkable,
  isNearby,
  isWalkable,
  pixelToTile,
  tileCentre,
  tileDistance,
} from "./movement.js";

describe("isWalkable", () => {
  it("accepts open floor", () => {
    expect(isWalkable(HALL_LAYOUT, 5, 5)).toBe(true);
    expect(isWalkable(HALL_LAYOUT, SEATS[0].x, SEATS[0].y)).toBe(true);
  });

  it("rejects walls", () => {
    expect(isWalkable(HALL_LAYOUT, 0, 5)).toBe(false);
    expect(isWalkable(HALL_LAYOUT, 5, 0)).toBe(false);
    expect(isWalkable(HALL_LAYOUT, HALL_COLUMNS - 1, 5)).toBe(false);
  });

  it("rejects couch tiles", () => {
    for (const tile of COUCH_TILES) {
      expect(isWalkable(HALL_LAYOUT, tile.x, tile.y)).toBe(false);
    }
  });

  it("rejects out-of-bounds tiles", () => {
    expect(isWalkable(HALL_LAYOUT, -1, 5)).toBe(false);
    expect(isWalkable(HALL_LAYOUT, 5, -1)).toBe(false);
    expect(isWalkable(HALL_LAYOUT, HALL_COLUMNS, 5)).toBe(false);
    expect(isWalkable(HALL_LAYOUT, 5, HALL_ROWS)).toBe(false);
  });

  it("rejects fractional coordinates", () => {
    expect(isWalkable(HALL_LAYOUT, 2.5, 3)).toBe(false);
  });
});

describe("clampToWalkable", () => {
  it("leaves a walkable tile where it is", () => {
    expect(clampToWalkable(HALL_LAYOUT, 5, 5)).toEqual({ x: 5, y: 5 });
  });

  it("pushes a wall position back to the nearest walkable tile", () => {
    const clamped = clampToWalkable(HALL_LAYOUT, 0, 5);

    expect(clamped).not.toBeNull();
    expect(isWalkable(HALL_LAYOUT, clamped.x, clamped.y)).toBe(true);
    expect(isNearby(clamped, { x: 0, y: 5 }, 1)).toBe(true);
  });

  it("pushes a position inside the couch out of it", () => {
    const seatBack = COUCH_TILES[2];
    const clamped = clampToWalkable(HALL_LAYOUT, seatBack.x, seatBack.y);

    expect(isWalkable(HALL_LAYOUT, clamped.x, clamped.y)).toBe(true);
    expect(isNearby(clamped, seatBack, 1)).toBe(true);
  });

  it("finds floor from a corner of the map", () => {
    const clamped = clampToWalkable(HALL_LAYOUT, -3, -3);

    expect(isWalkable(HALL_LAYOUT, clamped.x, clamped.y)).toBe(true);
  });
});

describe("distance helpers", () => {
  it("measures tile distance", () => {
    expect(tileDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it("treats diagonals as nearby within the radius", () => {
    expect(isNearby({ x: 5, y: 5 }, { x: 6, y: 6 }, 1)).toBe(true);
    expect(isNearby({ x: 5, y: 5 }, { x: 8, y: 5 }, 2)).toBe(false);
    expect(isNearby({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(true);
  });
});

describe("pixel helpers", () => {
  it("converts pixels to tiles and back", () => {
    expect(pixelToTile(0)).toBe(0);
    expect(pixelToTile(15)).toBe(0);
    expect(pixelToTile(16)).toBe(1);
    expect(tileCentre({ x: 2, y: 3 })).toEqual({ x: 40, y: 56 });
  });
});
