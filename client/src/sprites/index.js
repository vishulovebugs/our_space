import {
  SPRITE_DIRECTIONS,
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
  WALK_FRAMES,
  buildCharacterPixels,
} from "./art.js";

export { SPRITE_DIRECTIONS, SPRITE_HEIGHT, SPRITE_WIDTH, WALK_FRAMES };

/**
 * One frame of the character, 16x24, layers stacked and tinted.
 *
 * @param {object} character
 * @returns {HTMLCanvasElement}
 */
export function composeCharacter(character) {
  const canvas = document.createElement("canvas");
  canvas.width = SPRITE_WIDTH;
  canvas.height = SPRITE_HEIGHT;

  const context = canvas.getContext("2d");
  context.putImageData(toImageData(context, buildCharacterPixels(character)), 0, 0);

  return canvas;
}

/**
 * 3 walk frames per direction, 4 directions: 48x96, one direction per row.
 *
 * @param {object} character
 * @returns {HTMLCanvasElement}
 */
export function composeCharacterSpritesheet(character) {
  const canvas = document.createElement("canvas");
  canvas.width = SPRITE_WIDTH * WALK_FRAMES;
  canvas.height = SPRITE_HEIGHT * SPRITE_DIRECTIONS.length;

  const context = canvas.getContext("2d");

  SPRITE_DIRECTIONS.forEach((direction, row) => {
    for (let frame = 0; frame < WALK_FRAMES; frame++) {
      const pixels = buildCharacterPixels(character, { direction, frame });
      const image = toImageData(context, pixels);
      context.putImageData(image, frame * SPRITE_WIDTH, row * SPRITE_HEIGHT);
    }
  });

  return canvas;
}

/**
 * The static seated pose, front facing. Sitting has no walk cycle, so this is
 * one frame; the body is shifted down so the feet still land on the origin.
 *
 * @param {object} character
 * @returns {HTMLCanvasElement}
 */
export function composeSeatedSprite(character) {
  const canvas = document.createElement("canvas");
  canvas.width = SPRITE_WIDTH;
  canvas.height = SPRITE_HEIGHT;

  const context = canvas.getContext("2d");
  context.putImageData(toImageData(context, buildCharacterPixels(character, { sitting: true })), 0, 5);

  return canvas;
}

function toImageData(context, pixels) {
  const image = context.createImageData(SPRITE_WIDTH, SPRITE_HEIGHT);
  image.data.set(pixels);
  return image;
}
