import { describe, expect, it } from "vitest";

import {
  ARCADE_CABINETS,
  COUCH_TILES,
  DOOR,
  HALL_COLUMNS,
  HALL_ROWS,
  HALL_LAYOUT,
  SEATS,
  TV,
  rectTiles,
} from "./hallLayout.js";
import { isWalkable } from "./movement.js";

function neighbours(tile) {
  return [
    { x: tile.x + 1, y: tile.y },
    { x: tile.x - 1, y: tile.y },
    { x: tile.x, y: tile.y + 1 },
    { x: tile.x, y: tile.y - 1 },
  ];
}

function interactables() {
  return [
    { name: "tv", tiles: rectTiles(TV) },
    { name: "door", tiles: rectTiles(DOOR) },
    ...ARCADE_CABINETS.map((cabinet) => ({ name: cabinet.id, tiles: rectTiles(cabinet) })),
    ...SEATS.map((seat) => ({ name: seat.id, tiles: [{ x: seat.x, y: seat.y }] })),
  ];
}

describe("hall layout", () => {
  it("is a 30x20 tile room", () => {
    expect(HALL_COLUMNS).toBe(30);
    expect(HALL_ROWS).toBe(20);
    expect(HALL_LAYOUT.blocked.size).toBeGreaterThan(0);
  });

  it("has five seats and the three labelled cabinets", () => {
    expect(SEATS).toHaveLength(5);
    expect(ARCADE_CABINETS.map((cabinet) => cabinet.label)).toEqual(["CHESS", "TANKERS", "CAVE"]);
  });

  it("keeps the tv on the north wall and the door in the south wall", () => {
    expect(TV.y).toBe(0);
    expect(DOOR.y).toBe(HALL_ROWS - 1);
  });

  it("puts every interactable next to a walkable tile", () => {
    for (const { name, tiles } of interactables()) {
      const reachable = tiles.some(
        (tile) =>
          isWalkable(HALL_LAYOUT, tile.x, tile.y) ||
          neighbours(tile).some((neighbour) => isWalkable(HALL_LAYOUT, neighbour.x, neighbour.y)),
      );

      expect(reachable, `${name} has no walkable tile to stand on`).toBe(true);
    }
  });

  it("does not overlap two objects", () => {
    const objects = [
      { name: "tv", tiles: rectTiles(TV) },
      { name: "door", tiles: rectTiles(DOOR) },
      { name: "couch", tiles: COUCH_TILES },
      ...ARCADE_CABINETS.map((cabinet) => ({ name: cabinet.id, tiles: rectTiles(cabinet) })),
      ...SEATS.map((seat) => ({ name: seat.id, tiles: [{ x: seat.x, y: seat.y }] })),
    ];

    const taken = new Map();

    for (const { name, tiles } of objects) {
      for (const tile of tiles) {
        const key = `${tile.x},${tile.y}`;

        expect(taken.has(key), `${name} overlaps ${taken.get(key)} at ${key}`).toBe(false);
        taken.set(key, name);
      }
    }
  });
});
