import { afterEach, describe, expect, it } from "vitest";

import {
  ACCESSORY_IDS,
  BODY_IDS,
  HAIR_IDS,
  OUTFIT_IDS,
  defaultCharacter,
} from "@pixel-hall/shared/character.js";

import {
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
  WALK_FRAMES,
  composeCharacter,
  composeCharacterSpritesheet,
} from "./index.js";

function pixelData(canvas) {
  return Array.from(canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data);
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("composeCharacter", () => {
  it("returns a canvas of the expected size", () => {
    const canvas = composeCharacter(defaultCharacter());

    expect(canvas.width).toBe(SPRITE_WIDTH);
    expect(canvas.height).toBe(SPRITE_HEIGHT);
    expect(SPRITE_WIDTH).toBe(16);
    expect(SPRITE_HEIGHT).toBe(24);
  });

  it("draws pixels and changes them when the colours change", () => {
    const base = pixelData(composeCharacter(defaultCharacter()));
    const recoloured = pixelData(
      composeCharacter({
        ...defaultCharacter(),
        colors: { ...defaultCharacter().colors, outfit: "#d96ad9" },
      }),
    );

    expect(base.some((value) => value !== 0)).toBe(true);
    expect(recoloured).not.toEqual(base);
  });

  it("draws every body, hair, outfit and accessory combination", () => {
    for (const body of BODY_IDS) {
      for (const hair of HAIR_IDS) {
        for (const outfit of OUTFIT_IDS) {
          for (const accessory of ACCESSORY_IDS) {
            const canvas = composeCharacter({ ...defaultCharacter(), body, hair, outfit, accessory });
            expect(canvas.width).toBe(SPRITE_WIDTH);
          }
        }
      }
    }
  });
});

describe("composeCharacterSpritesheet", () => {
  it("lays out 4 directions of 3 walk frames", () => {
    const sheet = composeCharacterSpritesheet(defaultCharacter());

    expect(sheet.width).toBe(SPRITE_WIDTH * WALK_FRAMES);
    expect(sheet.height).toBe(SPRITE_HEIGHT * 4);
  });

  it("animates the walk frames", () => {
    const sheet = pixelData(composeCharacterSpritesheet(defaultCharacter()));
    const frameSize = SPRITE_WIDTH * SPRITE_HEIGHT * 4;
    const firstFrame = sheet.slice(0, frameSize);
    const secondFrame = sheet.slice(frameSize, frameSize * 2);

    expect(secondFrame).not.toEqual(firstFrame);
  });
});
