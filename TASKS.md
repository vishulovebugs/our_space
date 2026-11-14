# Task log

Short to-do for the current phase. The authoritative, append-only record is
`PROGRESS_LOG.md`; the rules are in `CLAUDE.md`.

## Prompt 6c - Arcade cabinet framework and lobby shell

- [x] shared: ARCADES, arcadeById, nearestArcade with a shared range constant
- [x] server: player.activity in the schema, "arcade:enter" validated for standing, existence and distance
- [x] client: "Press E to play <name>" prompt, ArcadeLobby modal, GameShell overlay with slot and Exit, no walking behind the UI
- [x] Tests: nearestArcade range/closest/miss, server enter/far/unknown/seated/leave, GameShell slot and Exit
- [x] Run the whole suite, update PROGRESS_LOG.md, commit

## Next

- [ ] Prompt 7 - Tankers cabinet (top-down tank battle), see PROGRESS_LOG.md
