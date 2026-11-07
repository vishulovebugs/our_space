/**
 * Constants shared by the client and the server.
 * Pure data only: no DOM, no network, no Node APIs.
 */

export const GAME_NAME = "Pixel Hall";

/** Size of one tile in the hall, in pixels. */
export const TILE_SIZE = 16;

export const MAX_PLAYERS_PER_HALL = 30;

/** Walking speed in pixels per second. The server validates moves against it. */
export const PLAYER_SPEED = 90;
