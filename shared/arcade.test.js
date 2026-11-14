import { describe, expect, it } from "vitest";

import { ARCADES, ARCADE_RANGE, arcadeById, nearestArcade } from "./arcade.js";

describe("ARCADES", () => {
  it("lists the three cabinets in their hall positions", () => {
    expect(ARCADES.map((arcade) => arcade.id)).toEqual(["chess", "tankers", "cave"]);
    expect(ARCADES.map((arcade) => arcade.name)).toEqual(["Chess", "Tankers", "Colossal Cave"]);
    expect(ARCADES.map(({ x, y }) => ({ x, y }))).toEqual([
      { x: 28, y: 5 },
      { x: 28, y: 9 },
      { x: 28, y: 13 },
    ]);
  });

  it("finds a cabinet by id, and nothing for an unknown one", () => {
    expect(arcadeById("tankers").name).toBe("Tankers");
    expect(arcadeById("pinball")).toBeNull();
    expect(arcadeById(undefined)).toBeNull();
  });
});

describe("nearestArcade", () => {
  it("returns the cabinet the player is standing next to", () => {
    expect(nearestArcade({ x: 27, y: 5 }, ARCADE_RANGE)?.id).toBe("chess");
    expect(nearestArcade({ x: 28, y: 6 }, ARCADE_RANGE)?.id).toBe("chess");
    expect(nearestArcade({ x: 27, y: 13 }, ARCADE_RANGE)?.id).toBe("cave");
  });

  it("returns null when the player is out of range", () => {
    expect(nearestArcade({ x: 14, y: 17 }, ARCADE_RANGE)).toBeNull();
    expect(nearestArcade({ x: 26, y: 5 }, 1)).toBeNull();
  });

  it("picks the closer cabinet when two are in range", () => {
    // Chess at (28,5) is 3 tiles away, Tankers at (28,9) is 1.
    expect(nearestArcade({ x: 28, y: 8 }, 4)?.id).toBe("tankers");
    expect(nearestArcade({ x: 28, y: 6 }, 4)?.id).toBe("chess");
  });
});
