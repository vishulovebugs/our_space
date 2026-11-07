import { TILE_SIZE } from "./constants.js";
import { tileKey } from "./movement.js";

/**
 * The hall, as data. Both the Phaser scene and the server read these positions,
 * so the room only exists in one place.
 */

export const HALL_COLUMNS = 30;
export const HALL_ROWS = 20;
export const HALL_WIDTH = HALL_COLUMNS * TILE_SIZE;
export const HALL_HEIGHT = HALL_ROWS * TILE_SIZE;

/**
 * The curved couch: five cushions along an arc, each with a back behind it.
 * `facing` is the direction a seated player looks - the couch back is north,
 * so every cushion faces the room to the south.
 */
export const SEATS = [
  { id: "seat-1", x: 10, y: 11, facing: "down" },
  { id: "seat-2", x: 12, y: 10, facing: "down" },
  { id: "seat-3", x: 14, y: 9, facing: "down" },
  { id: "seat-4", x: 16, y: 10, facing: "down" },
  { id: "seat-5", x: 18, y: 11, facing: "down" },
];

/** Solid part of the couch: the arc of back cushions plus two armrests. */
export const COUCH_TILES = [
  { x: 10, y: 10 },
  { x: 12, y: 9 },
  { x: 14, y: 8 },
  { x: 16, y: 9 },
  { x: 18, y: 10 },
  { x: 9, y: 11 },
  { x: 19, y: 11 },
];

/** North wall, straight above the middle of the couch. */
export const TV = { id: "tv", x: 12, y: 0, w: 6, h: 2 };

export const ARCADE_CABINETS = [
  { id: "chess", label: "CHESS", x: 28, y: 5, w: 1, h: 2 },
  { id: "tankers", label: "TANKERS", x: 28, y: 9, w: 1, h: 2 },
  { id: "cave", label: "CAVE", x: 28, y: 13, w: 1, h: 2 },
];

/** A gap in the south wall. Walking into it logs the player out (later prompt). */
export const DOOR = { id: "door", x: 14, y: 19, w: 2, h: 1 };

/** @returns {{ x: number, y: number }[]} */
export function rectTiles(rect) {
  const tiles = [];

  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      tiles.push({ x, y });
    }
  }

  return tiles;
}

function perimeterWalls(columns, rows) {
  const walls = [];

  for (let x = 0; x < columns; x++) {
    walls.push({ x, y: 0 }, { x, y: rows - 1 });
  }
  for (let y = 1; y < rows - 1; y++) {
    walls.push({ x: 0, y }, { x: columns - 1, y });
  }

  return walls;
}

const WALL_TILES = perimeterWalls(HALL_COLUMNS, HALL_ROWS);
const PROP_TILES = [
  ...rectTiles(TV),
  ...COUCH_TILES,
  ...ARCADE_CABINETS.flatMap(rectTiles),
];

export const HALL_LAYOUT = {
  columns: HALL_COLUMNS,
  rows: HALL_ROWS,
  wallTiles: WALL_TILES,
  wallKeys: new Set(WALL_TILES.map((tile) => tileKey(tile.x, tile.y))),
  seats: SEATS,
  props: { tv: TV, couch: COUCH_TILES, arcades: ARCADE_CABINETS, door: DOOR },
  /** Walls plus everything solid: what the player cannot stand on. */
  blocked: new Set([...WALL_TILES, ...PROP_TILES].map((tile) => tileKey(tile.x, tile.y))),
};
