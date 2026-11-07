import { describe, expect, it } from "vitest";

import {
  ACCESSORY_IDS,
  BODY_IDS,
  CHARACTER_PALETTE,
  HAIR_IDS,
  OUTFIT_IDS,
  defaultCharacter,
  nextScreen,
  randomCharacter,
  validateCharacter,
} from "./character.js";

describe("validateCharacter", () => {
  it("accepts the default character", () => {
    expect(validateCharacter(defaultCharacter())).toEqual({ ok: true, error: null });
  });

  it("rejects an unknown hair id", () => {
    expect(validateCharacter({ ...defaultCharacter(), hair: "curly" }).ok).toBe(false);
  });

  it("rejects a colour outside the palette", () => {
    const character = defaultCharacter();
    character.colors.outfit = "#123456";

    expect(validateCharacter(character)).toEqual({
      ok: false,
      error: "outfit colour is not in the palette",
    });
  });

  it("rejects missing fields", () => {
    const character = defaultCharacter();
    delete character.colors;

    expect(validateCharacter(character).ok).toBe(false);
    expect(validateCharacter({}).ok).toBe(false);
    expect(validateCharacter(null).ok).toBe(false);
  });

  it("rejects extra fields", () => {
    expect(validateCharacter({ ...defaultCharacter(), hat: "big" }).ok).toBe(false);
    expect(validateCharacter({ ...defaultCharacter(), colors: { ...defaultCharacter().colors, eye: "#f0f0f0" } }).ok).toBe(false);
  });

  it("rejects a huge payload", () => {
    const character = { ...defaultCharacter(), padding: "x".repeat(4000) };

    expect(validateCharacter(character).ok).toBe(false);
  });

  it("rejects junk in the option fields", () => {
    expect(validateCharacter({ ...defaultCharacter(), body: 42 }).ok).toBe(false);
    expect(validateCharacter({ ...defaultCharacter(), accessory: "jetpack" }).ok).toBe(false);
  });
});

describe("randomCharacter", () => {
  it("always yields a valid character", () => {
    for (let i = 0; i < 100; i++) {
      expect(validateCharacter(randomCharacter()).ok).toBe(true);
    }
  });

  it("stays valid at the edges of the random range", () => {
    expect(validateCharacter(randomCharacter(() => 0)).ok).toBe(true);
    expect(validateCharacter(randomCharacter(() => 0.9999999)).ok).toBe(true);
    expect(validateCharacter(randomCharacter(() => 1)).ok).toBe(true);
  });
});

describe("palette", () => {
  it("only holds distinct lowercase hex colours", () => {
    expect(new Set(CHARACTER_PALETTE).size).toBe(CHARACTER_PALETTE.length);

    for (const color of CHARACTER_PALETTE) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("exposes the option lists the pickers need", () => {
    expect(BODY_IDS).toHaveLength(3);
    expect(HAIR_IDS).toHaveLength(6);
    expect(OUTFIT_IDS).toHaveLength(5);
    expect(ACCESSORY_IDS).toHaveLength(4);
    expect(ACCESSORY_IDS).toContain("none");
  });
});

describe("nextScreen", () => {
  it("sends a profile without a character to the creator", () => {
    expect(nextScreen({ username: "pixel_cat", character: null })).toBe("creator");
    expect(nextScreen({})).toBe("creator");
    expect(nextScreen(null)).toBe("creator");
  });

  it("sends a profile with a character to the hall", () => {
    expect(nextScreen({ character: defaultCharacter() })).toBe("hall");
  });

  it("sends a corrupted character back to the creator", () => {
    expect(nextScreen({ character: { ...defaultCharacter(), hair: "nope" } })).toBe("creator");
  });
});
