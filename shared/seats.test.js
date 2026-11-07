import { describe, expect, it } from "vitest";

import { SEATS } from "./hallLayout.js";
import { HALL_LAYOUT } from "./hallLayout.js";
import { isWalkable } from "./movement.js";
import { isSeatIndex, seatAnchor, seatStandTile, seatedPlayers } from "./seats.js";

describe("seat geometry", () => {
  it("puts the anchor on the bottom edge of the cushion, centred", () => {
    expect(seatAnchor(SEATS[2])).toEqual({ x: 14 * 16 + 8, y: 10 * 16 });
    expect(seatAnchor({ x: 0, y: 0 })).toEqual({ x: 8, y: 16 });
  });

  it("gives every seat a facing direction", () => {
    for (const seat of SEATS) {
      expect(seat.facing).toBe("down");
    }
  });

  it("stands players up on walkable floor in front of the seat", () => {
    for (const seat of SEATS) {
      const tile = seatStandTile(seat);

      expect(tile).toEqual({ x: seat.x, y: seat.y + 1 });
      expect(isWalkable(HALL_LAYOUT, tile.x, tile.y)).toBe(true);
    }
  });
});

describe("isSeatIndex", () => {
  it("accepts the five seat indexes", () => {
    for (let index = 0; index < SEATS.length; index++) {
      expect(isSeatIndex(index)).toBe(true);
    }
  });

  it("rejects everything else", () => {
    for (const value of [-1, 5, 2.5, "a", "2", null, undefined, Number.NaN]) {
      expect(isSeatIndex(value)).toBe(false);
    }
  });
});

describe("seatedPlayers", () => {
  it("returns only the seated players", () => {
    const state = {
      players: new Map([
        ["a", { seat: 2, username: "alice" }],
        ["b", { seat: -1, username: "bob" }],
      ]),
    };

    expect(seatedPlayers(state)).toEqual([
      { sessionId: "a", seatIndex: 2, player: { seat: 2, username: "alice" } },
    ]);
  });

  it("handles a missing state", () => {
    expect(seatedPlayers(undefined)).toEqual([]);
    expect(seatedPlayers({})).toEqual([]);
  });
});
