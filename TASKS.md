# Task log

Short to-do for the current phase. The authoritative, append-only record is
`PROGRESS_LOG.md`; the rules are in `CLAUDE.md`.

## Prompt 5 - Multiplayer hall

- [x] server/src/state/HallState.js: Player + HallState with defineTypes
- [x] server/src/rooms/HallRoom.js: onAuth, single session per user, validated moves, snap
- [x] shared: PLAYER_SPEED + isStandablePosition so client and server agree
- [x] client: join hall, remote players, interpolation, reconnect overlay
- [x] Tests: @colyseus/testing suite (join, move, wall, teleport, dup user, leave, 31st)
- [x] Run the whole suite, update PROGRESS_LOG.md, commit

## Next

- [ ] Prompt 6 - see the status board in PROGRESS_LOG.md (not started)
