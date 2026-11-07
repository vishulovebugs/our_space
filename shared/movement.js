import { TILE_SIZE } from "./constants.js";

/**
 * Movement rules, in tile coordinates. Pure functions, so the client and the
 * server can agree on what "walkable" means.
 */

export function tileKey(x, y) {
  return `${x},${y}`;
}

/**
 * @param {{ columns: number, rows: number, blocked: Set<string> }} layout
 */
export function isWalkable(layout, tileX, tileY) {
  if (!Number.isInteger(tileX) || !Number.isInteger(tileY)) return false;
  if (tileX < 0 || tileY < 0 || tileX >= layout.columns || tileY >= layout.rows) return false;

  return !layout.blocked.has(tileKey(tileX, tileY));
}

/**
 * Nearest walkable tile to a position, searching outwards by rings so the
 * result is deterministic. Returns null only if the layout has no floor.
 *
 * @returns {{ x: number, y: number } | null}
 */
export function clampToWalkable(layout, tileX, tileY) {
  if (isWalkable(layout, tileX, tileY)) return { x: tileX, y: tileY };

  const maxRadius = Math.max(layout.columns, layout.rows);

  for (let radius = 1; radius <= maxRadius; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;

        const x = tileX + dx;
        const y = tileY + dy;
        if (isWalkable(layout, x, y)) return { x, y };
      }
    }
  }

  return null;
}

/** Euclidean distance in tiles. */
export function tileDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Chebyshev distance: true when b is within `radius` tiles of a, diagonals included. */
export function isNearby(a, b, radius = 1) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) <= radius;
}

export function pixelToTile(value) {
  return Math.floor(value / TILE_SIZE);
}

export function tileCentre(tile) {
  return {
    x: tile.x * TILE_SIZE + TILE_SIZE / 2,
    y: tile.y * TILE_SIZE + TILE_SIZE / 2,
  };
}

/**
 * Whether a sprite whose feet are at (x, y) in pixels is standing on floor.
 * Shared so client prediction and server validation cannot drift apart.
 */
export function isStandablePosition(layout, x, y) {
  return isWalkable(layout, pixelToTile(x), pixelToTile(y - 1));
}
