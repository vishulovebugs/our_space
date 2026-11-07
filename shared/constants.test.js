import { describe, expect, it } from "vitest";

import { GAME_NAME, MAX_PLAYERS_PER_HALL, TILE_SIZE } from "./constants.js";

describe("shared constants", () => {
  it("names the game", () => {
    expect(GAME_NAME).toBe("Pixel Hall");
  });

  it("uses 16 pixel tiles", () => {
    expect(TILE_SIZE).toBe(16);
  });

  it("allows 30 players per hall", () => {
    expect(MAX_PLAYERS_PER_HALL).toBe(30);
  });
});
