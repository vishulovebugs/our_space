/**
 * Where the video is, right now, in seconds.
 *
 * tvState is { position (seconds at startedAt), startedAt (ms), playing }. The
 * same function runs on both sides, so the client can work out the expected
 * position without extra messages - only its own clock matters.
 */
export function currentPosition(tvState, now = Date.now()) {
  const position = Number.isFinite(tvState?.position) ? tvState.position : 0;

  if (!tvState?.playing) return Math.max(0, position);

  const startedAt = Number.isFinite(tvState.startedAt) ? tvState.startedAt : now;

  // A client clock behind the server's, or a future startedAt, must not rewind
  // the video: only time that has passed counts.
  const elapsed = Math.max(0, (now - startedAt) / 1000);

  return Math.max(0, position + elapsed);
}
