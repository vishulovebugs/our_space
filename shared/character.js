/**
 * The character model: what a player designs before entering the hall.
 * Pure data and validation only - drawing lives in client/src/sprites.
 */

export const BODY_IDS = ["slim", "round", "tall"];

export const HAIR_IDS = ["short", "bob", "mohawk", "spiky", "long", "bald"];

export const OUTFIT_IDS = ["tee", "hoodie", "dress", "labcoat", "overalls"];

export const ACCESSORY_IDS = ["none", "glasses", "cap", "scarf"];

/** Any of these may be used for skin, hair or outfit. */
export const SKIN_COLORS = ["#f2c9a0", "#c98d5f", "#8d5524", "#5c3a21"];
export const HAIR_COLORS = ["#2b2b3a", "#8b5e3c", "#e8d56a", "#c24a4a", "#4a7cc2"];
export const OUTFIT_COLORS = ["#3fae7a", "#d96ad9", "#e8894a", "#f0f0f0", "#1f2430"];

export const CHARACTER_PALETTE = [...SKIN_COLORS, ...HAIR_COLORS, ...OUTFIT_COLORS];

/** Cap on the stored JSON, so a crafted profile cannot bloat the row. */
export const CHARACTER_MAX_BYTES = 512;

const FIELDS = ["body", "hair", "outfit", "accessory", "colors"];
const COLOR_KEYS = ["skin", "hair", "outfit"];

/** @returns {{ body: string, hair: string, outfit: string, accessory: string, colors: { skin: string, hair: string, outfit: string } }} */
export function defaultCharacter() {
  return {
    body: "slim",
    hair: "short",
    outfit: "tee",
    accessory: "none",
    colors: { skin: "#f2c9a0", hair: "#2b2b3a", outfit: "#3fae7a" },
  };
}

/**
 * @param {number} [rng] injectable random source, so the pick is testable
 */
export function randomCharacter(rng = Math.random) {
  const pick = (list) => list[Math.min(list.length - 1, Math.floor(rng() * list.length))];

  return {
    body: pick(BODY_IDS),
    hair: pick(HAIR_IDS),
    outfit: pick(OUTFIT_IDS),
    accessory: pick(ACCESSORY_IDS),
    colors: {
      skin: pick(SKIN_COLORS),
      hair: pick(HAIR_COLORS),
      outfit: pick(OUTFIT_COLORS),
    },
  };
}

/**
 * @param {unknown} value
 * @returns {{ ok: boolean, error: string | null }}
 */
export function validateCharacter(value) {
  if (!isPlainObject(value)) {
    return fail("Character must be an object");
  }

  const keys = Object.keys(value);
  if (keys.length !== FIELDS.length || !FIELDS.every((field) => keys.includes(field))) {
    return fail("Character must have exactly: body, hair, outfit, accessory, colors");
  }

  if (!BODY_IDS.includes(value.body)) return fail("Unknown body");
  if (!HAIR_IDS.includes(value.hair)) return fail("Unknown hair");
  if (!OUTFIT_IDS.includes(value.outfit)) return fail("Unknown outfit");
  if (!ACCESSORY_IDS.includes(value.accessory)) return fail("Unknown accessory");

  if (!isPlainObject(value.colors)) return fail("colors must be an object");

  const colorKeys = Object.keys(value.colors);
  if (colorKeys.length !== COLOR_KEYS.length || !COLOR_KEYS.every((key) => colorKeys.includes(key))) {
    return fail("colors must have exactly: skin, hair, outfit");
  }

  for (const key of COLOR_KEYS) {
    const color = value.colors[key];
    if (typeof color !== "string" || !CHARACTER_PALETTE.includes(color.toLowerCase())) {
      return fail(`${key} colour is not in the palette`);
    }
  }

  if (JSON.stringify(value).length > CHARACTER_MAX_BYTES) {
    return fail("Character payload is too large");
  }

  return { ok: true, error: null };
}

/**
 * Which screen a signed-in player belongs on: the creator until they have a
 * valid character stored on their profile.
 *
 * @param {{ character?: unknown } | null | undefined} profile
 * @returns {"creator" | "hall"}
 */
export function nextScreen(profile) {
  const character = isPlainObject(profile) ? profile.character : undefined;
  return validateCharacter(character).ok ? "hall" : "creator";
}

function fail(error) {
  return { ok: false, error };
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
