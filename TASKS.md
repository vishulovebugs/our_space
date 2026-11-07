# Task log

Short to-do for the current phase. The authoritative, append-only record is
`PROGRESS_LOG.md`; the rules are in `CLAUDE.md`.

## Prompt 4 - Hall scene with walking player

- [x] shared/hallLayout.js: 30x20 room, walls, couch arc, 5 seats, TV, 3 cabinets, door
- [x] shared/movement.js: isWalkable, clampToWalkable, distance helpers
- [x] client/src/game: bridge, procedural textures, HallScene (player, camera, anims)
- [x] GameCanvas component + Hall page, route after the creator
- [x] Tests: walkability, clamping, layout reachability/overlaps, bridge, scene import
- [x] Run the whole suite, update PROGRESS_LOG.md, commit

## Next

- [ ] Prompt 5 - see the status board in PROGRESS_LOG.md (not started)
