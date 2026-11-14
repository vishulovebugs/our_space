import { describe, expect, it } from "vitest";

import { currentPosition } from "./tvSync.js";

describe("currentPosition", () => {
  it("advances with time while playing", () => {
    const tv = { position: 0, startedAt: 1_000, playing: true };

    expect(currentPosition(tv, 1_000)).toBe(0);
    expect(currentPosition(tv, 4_000)).toBe(3);
    expect(currentPosition(tv, 11_500)).toBe(10.5);
  });

  it("adds the position the video started from", () => {
    const tv = { position: 30, startedAt: 1_000, playing: true };

    expect(currentPosition(tv, 3_000)).toBe(32);
  });

  it("stays fixed while paused", () => {
    const tv = { position: 12.5, startedAt: 1_000, playing: false };

    expect(currentPosition(tv, 1_000)).toBe(12.5);
    expect(currentPosition(tv, 900_000)).toBe(12.5);
  });

  it("never goes negative", () => {
    expect(currentPosition({ position: -5, startedAt: 1_000, playing: true }, 1_000)).toBe(0);
    expect(currentPosition({ position: 10, startedAt: 5_000, playing: true }, 1_000)).toBe(10);
    expect(currentPosition({ position: 0, startedAt: Number.NaN, playing: true }, 500)).toBe(0);
  });

  it("handles a stopped or missing state", () => {
    expect(currentPosition(undefined, 0)).toBe(0);
    expect(currentPosition({}, 0)).toBe(0);
    expect(currentPosition({ videoId: "" }, 1_000)).toBe(0);
  });
});
