import { TILE_SIZE } from "./constants.js";
import { SEATS } from "./hallLayout.js";

/**
 * Seat rules, shared by the room and the scene so "near enough to sit" and
 * "where do I end up" cannot disagree.
 */

/** Where a seated player's feet go, in pixels. */
export function seatAnchor(seat) {
  return { x: seat.x * TILE_SIZE + TILE_SIZE / 2, y: (seat.y + 1) * TILE_SIZE };
}

/** The cushion in front of a seat: where a standing player is put back down. */
export function seatStandTile(seat) {
  return { x: seat.x, y: seat.y + 1 };
}

export function isSeatIndex(value) {
  return Number.isInteger(value) && value >= 0 && value < SEATS.length;
}

/**
 * Everyone currently sitting, as { sessionId, seatIndex, player } entries.
 * Works on the server schema and on a plain Map, so tests can use either.
 *
 * @returns {{ sessionId: string, seatIndex: number, player: object }[]}
 */
export function seatedPlayers(state) {
  const seated = [];

  state?.players?.forEach((player, sessionId) => {
    if (player.seat >= 0) seated.push({ sessionId, seatIndex: player.seat, player });
  });

  return seated;
}
