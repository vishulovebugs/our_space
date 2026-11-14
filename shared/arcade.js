import { tileDistance } from "./movement.js";

/**
 * The three cabinets, as data. Positions match ARCADE_CABINETS in
 * hallLayout.js; the scene, the prompt and the server all read this list so
 * "near a cabinet" cannot mean three different things.
 */
export const ARCADES = [
  { id: "chess", name: "Chess", x: 28, y: 5 },
  { id: "tankers", name: "Tankers", x: 28, y: 9 },
  { id: "cave", name: "Colossal Cave", x: 28, y: 13 },
];

/** How many tiles away a cabinet can still be played. */
export const ARCADE_RANGE = 2;

/** @returns {{ id: string, name: string, x: number, y: number } | null} */
export function arcadeById(id) {
  return ARCADES.find((arcade) => arcade.id === id) ?? null;
}

/**
 * Closest cabinet within maxDistance tiles of a tile position, or null.
 * Ties keep the first cabinet, so the answer never depends on iteration luck.
 *
 * @param {{ x: number, y: number }} pos
 * @returns {{ id: string, name: string, x: number, y: number } | null}
 */
export function nearestArcade(pos, maxDistance = ARCADE_RANGE) {
  let nearest = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const arcade of ARCADES) {
    const distance = tileDistance(pos, arcade);

    if (distance > maxDistance || distance >= nearestDistance) continue;

    nearest = arcade;
    nearestDistance = distance;
  }

  return nearest;
}
