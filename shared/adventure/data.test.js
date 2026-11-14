import { describe, expect, it } from "vitest";

import {
  INVENTORY_LIMIT,
  ITEMS,
  LAMP_BATTERY,
  MAX_SCORE,
  ROOMS,
  SCORE_ROOM,
  START_ROOM,
  TREASURES,
  TREASURE_POINTS,
} from "./data.js";

describe("the cave map", () => {
  it("has about twenty-five rooms", () => {
    expect(Object.keys(ROOMS)).toHaveLength(25);
    expect(ROOMS[START_ROOM]).toBeDefined();
  });

  it("points every exit at a real room", () => {
    for (const [id, room] of Object.entries(ROOMS)) {
      for (const [direction, target] of Object.entries(room.exits)) {
        expect(ROOMS[target], `${id}.${direction} -> ${target}`).toBeDefined();
      }
    }
  });

  it("makes every exit two-way", () => {
    for (const [id, room] of Object.entries(ROOMS)) {
      for (const [direction, target] of Object.entries(room.exits)) {
        const back = Object.values(ROOMS[target].exits);

        expect(back, `${id}.${direction} has no way back from ${target}`).toContain(id);
      }
    }
  });

  it("locks the grate and the vault with real keys", () => {
    expect(ROOMS.cabin.locked.down.key).toBe("brassKey");
    expect(ROOMS.cabin.locked.down.name).toBe("steel grate");
    expect(ROOMS.crypt.locked.south.key).toBe("ironKey");
    expect(ROOMS.crypt.locked.south.name).toBe("vault door");
  });

  it("places only real items in rooms", () => {
    for (const [id, room] of Object.entries(ROOMS)) {
      for (const itemId of room.items ?? []) {
        expect(ITEMS[itemId], `${id} holds ${itemId}`).toBeDefined();
      }
    }
  });

  it("puts every treasure somewhere findable and scores it once", () => {
    const placed = Object.values(ROOMS).flatMap((room) => room.items ?? []);

    for (const treasure of TREASURES) {
      expect(ITEMS[treasure].treasure).toBe(true);
      expect(placed, `${treasure} is not in any room`).toContain(treasure);
    }

    expect(TREASURES).toHaveLength(5);
    expect(MAX_SCORE).toBe(TREASURES.length * TREASURE_POINTS);
    expect(MAX_SCORE).toBe(100);
  });

  it("keeps the scoring room and the lamp battery sensible", () => {
    expect(ROOMS[SCORE_ROOM]).toBeDefined();
    expect(SCORE_ROOM).toBe(START_ROOM);
    expect(LAMP_BATTERY).toBeGreaterThan(10);
    expect(INVENTORY_LIMIT).toBeGreaterThan(4);
  });

  it("has a dark section and a way to light it", () => {
    const darkRooms = Object.values(ROOMS).filter((room) => room.dark);

    expect(darkRooms.length).toBeGreaterThanOrEqual(5);
    expect(Object.values(ROOMS).flatMap((room) => room.items ?? [])).toContain("lamp");
  });
});
