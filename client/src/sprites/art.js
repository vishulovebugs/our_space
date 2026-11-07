/**
 * Procedural character art.
 *
 * Every layer is a handful of rectangles on a 16x24 grid, rasterised into an
 * RGBA buffer. No image files ship with the project; client/src/sprites/index.js
 * turns a buffer into a canvas.
 */

export const SPRITE_WIDTH = 16;
export const SPRITE_HEIGHT = 24;

/** Row order of the walk spritesheet. */
export const SPRITE_DIRECTIONS = ["down", "left", "right", "up"];
export const WALK_FRAMES = 3;

const OUTLINE = "#141420";

/** Geometry per body type: head, torso, two arms, two legs. */
const BODIES = {
  slim: {
    head: { x: 5, y: 3, w: 6, h: 6 },
    neck: { x: 7, y: 9, w: 2, h: 1 },
    torso: { x: 5, y: 10, w: 6, h: 6 },
    arms: [
      { x: 3, y: 10, w: 2, h: 6 },
      { x: 11, y: 10, w: 2, h: 6 },
    ],
    legs: [
      { x: 5, y: 16, w: 2, h: 5 },
      { x: 9, y: 16, w: 2, h: 5 },
    ],
  },
  round: {
    head: { x: 4, y: 3, w: 8, h: 6 },
    neck: { x: 7, y: 9, w: 2, h: 1 },
    torso: { x: 4, y: 10, w: 8, h: 5 },
    arms: [
      { x: 2, y: 10, w: 2, h: 5 },
      { x: 12, y: 10, w: 2, h: 5 },
    ],
    legs: [
      { x: 4, y: 15, w: 3, h: 5 },
      { x: 9, y: 15, w: 3, h: 5 },
    ],
  },
  tall: {
    head: { x: 5, y: 2, w: 6, h: 6 },
    neck: { x: 7, y: 8, w: 2, h: 1 },
    torso: { x: 5, y: 9, w: 6, h: 7 },
    arms: [
      { x: 3, y: 9, w: 2, h: 7 },
      { x: 11, y: 9, w: 2, h: 7 },
    ],
    legs: [
      { x: 5, y: 16, w: 2, h: 8 },
      { x: 9, y: 16, w: 2, h: 8 },
    ],
  },
};

/** Each outfit returns the rectangles it paints over the body. */
const OUTFITS = {
  tee: ({ torso, arms, legs }) => [
    torso,
    ...arms.map((arm) => ({ ...arm, h: 2 })),
    ...legs.map((leg) => ({ ...leg, h: 2 })),
  ],
  hoodie: ({ torso, arms }) => [
    torso,
    { x: torso.x, y: torso.y - 1, w: torso.w, h: 1 },
    ...arms,
  ],
  dress: ({ torso }) => [
    torso,
    { x: torso.x - 2, y: torso.y + torso.h, w: torso.w + 4, h: 3 },
  ],
  labcoat: ({ torso, arms }) => [
    torso,
    { x: torso.x, y: torso.y + torso.h, w: torso.w, h: 3 },
    ...arms.map((arm) => ({ ...arm, h: Math.min(arm.h, 4) })),
  ],
  overalls: ({ torso, legs }) => [torso, ...legs],
};

const HAIRS = {
  short: (head) => [{ x: head.x - 1, y: head.y - 1, w: head.w + 2, h: 3 }],
  bob: (head) => [
    { x: head.x - 1, y: head.y - 1, w: head.w + 2, h: 3 },
    { x: head.x - 1, y: head.y + 2, w: 1, h: head.h - 2 },
    { x: head.x + head.w, y: head.y + 2, w: 1, h: head.h - 2 },
  ],
  mohawk: (head) => [{ x: head.x + Math.floor(head.w / 2) - 1, y: head.y - 3, w: 2, h: 3 }],
  spiky: (head) => [
    { x: head.x, y: head.y - 2, w: 2, h: 2 },
    { x: head.x + 2, y: head.y - 1, w: 2, h: 1 },
    { x: head.x + 4, y: head.y - 2, w: 2, h: 2 },
  ],
  long: (head) => [
    { x: head.x - 1, y: head.y - 1, w: head.w + 2, h: 3 },
    { x: head.x - 1, y: head.y + 2, w: 2, h: head.h + 2 },
    { x: head.x + head.w - 1, y: head.y + 2, w: 2, h: head.h + 2 },
  ],
  bald: () => [],
};

const ACCESSORIES = {
  none: () => [],
  glasses: (head) => [{ rect: { x: head.x, y: head.y + 3, w: head.w, h: 1 }, tone: "outline" }],
  cap: (head) => [{ rect: { x: head.x - 1, y: head.y - 1, w: head.w + 3, h: 2 }, tone: "dark" }],
  scarf: (head) => [{ rect: { x: head.x, y: head.y + head.h, w: head.w, h: 1 }, tone: "dark" }],
};

/**
 * @param {{ body: string, hair: string, outfit: string, accessory: string, colors: { skin: string, hair: string, outfit: string } }} character
 * @param {{ direction?: string, frame?: number }} [pose]
 * @returns {Uint8ClampedArray} RGBA pixels, SPRITE_WIDTH * SPRITE_HEIGHT * 4 long
 */
export function buildCharacterPixels(character, { direction = "down", frame = 0 } = {}) {
  const buffer = new Uint8ClampedArray(SPRITE_WIDTH * SPRITE_HEIGHT * 4);

  const body = BODIES[character?.body] ?? BODIES.slim;
  const colors = character?.colors ?? {};
  const skin = rgb(colors.skin ?? "#f2c9a0");
  const hairColor = rgb(colors.hair ?? "#2b2b3a");
  const outfit = rgb(colors.outfit ?? "#3fae7a");

  const hairstyle = HAIRS[character?.hair] ?? HAIRS.short;
  const outfitStyle = OUTFITS[character?.outfit] ?? OUTFITS.tee;
  const accessory = ACCESSORIES[character?.accessory] ?? ACCESSORIES.none;

  // "right" is "left" mirrored, so only three poses are actually drawn.
  const mirrored = direction === "right";
  const pose = mirrored ? "left" : direction;
  const swing = walkSwing(frame);

  const legs = body.legs.map((leg, index) => shifted(leg, swing.legs[index]));
  const arms = body.arms.map((arm, index) => shifted(arm, swing.arms[index]));

  fillRect(buffer, body.neck, skin);
  drawPlate(buffer, body.torso, skin);
  arms.forEach((arm) => fillRect(buffer, arm, skin));
  legs.forEach((leg) => fillRect(buffer, leg, skin));
  drawPlate(buffer, body.head, skin);

  outfitStyle({ torso: body.torso, arms, legs }).forEach((rect) => drawPlate(buffer, rect, outfit));

  hairstyle(body.head).forEach((rect) => drawPlate(buffer, rect, hairColor));

  accessory(body.head).forEach(({ rect, tone }) => {
    drawPlate(buffer, rect, tone === "outline" ? rgb(OUTLINE) : darken(outfit));
  });

  drawFace(buffer, body.head, pose);

  if (mirrored) mirror(buffer);

  return buffer;
}

function walkSwing(frame) {
  if (frame === 1) return { legs: [-1, 0], arms: [0, -1] };
  if (frame === 2) return { legs: [0, -1], arms: [-1, 0] };
  return { legs: [0, 0], arms: [0, 0] };
}

function drawFace(buffer, head, pose) {
  const eyeColor = rgb(OUTLINE);
  const eyeY = head.y + 3;

  if (pose === "up") return;
  if (pose === "left") {
    setPixel(buffer, head.x + 1, eyeY, eyeColor);
    return;
  }

  setPixel(buffer, head.x + 1, eyeY, eyeColor);
  setPixel(buffer, head.x + head.w - 2, eyeY, eyeColor);
}

function shifted(rect, dy = 0) {
  return dy === 0 ? rect : { ...rect, y: rect.y + dy };
}

/** Dark border plus fill for anything big enough to hold one. */
function drawPlate(buffer, rect, color) {
  if (rect.w <= 0 || rect.h <= 0) return;

  if (rect.w <= 2 || rect.h <= 2) {
    fillRect(buffer, rect, color);
    return;
  }

  fillRect(buffer, rect, rgb(OUTLINE));
  fillRect(
    buffer,
    { x: rect.x + 1, y: rect.y + 1, w: rect.w - 2, h: rect.h - 2 },
    color,
  );
}

function fillRect(buffer, rect, color) {
  const xStart = Math.max(0, rect.x);
  const yStart = Math.max(0, rect.y);
  const xEnd = Math.min(SPRITE_WIDTH, rect.x + rect.w);
  const yEnd = Math.min(SPRITE_HEIGHT, rect.y + rect.h);

  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      setPixel(buffer, x, y, color);
    }
  }
}

function setPixel(buffer, x, y, color) {
  if (x < 0 || y < 0 || x >= SPRITE_WIDTH || y >= SPRITE_HEIGHT) return;

  const index = (y * SPRITE_WIDTH + x) * 4;
  buffer[index] = color[0];
  buffer[index + 1] = color[1];
  buffer[index + 2] = color[2];
  buffer[index + 3] = color[3];
}

function mirror(buffer) {
  const copy = buffer.slice();

  for (let y = 0; y < SPRITE_HEIGHT; y++) {
    for (let x = 0; x < SPRITE_WIDTH; x++) {
      const from = (y * SPRITE_WIDTH + x) * 4;
      const to = (y * SPRITE_WIDTH + (SPRITE_WIDTH - 1 - x)) * 4;
      buffer[to] = copy[from];
      buffer[to + 1] = copy[from + 1];
      buffer[to + 2] = copy[from + 2];
      buffer[to + 3] = copy[from + 3];
    }
  }
}

function rgb(hex) {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((character) => character + character)
          .join("")
      : clean;
  const value = Number.parseInt(full, 16);

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255, 255];
}

function darken(color, amount = 0.55) {
  return [
    Math.round(color[0] * amount),
    Math.round(color[1] * amount),
    Math.round(color[2] * amount),
    255,
  ];
}
