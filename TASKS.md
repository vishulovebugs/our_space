# Task log

Short to-do for the current phase. The authoritative, append-only record is
`PROGRESS_LOG.md`; the rules are in `CLAUDE.md`.

## Prompt 6 - Couch seats

- [x] shared: seat anchors with a facing direction, seatAnchor/seatStandTile/isSeatIndex/seatedPlayers
- [x] server: "sit" and "stand" with range, free-seat and index validation; moves ignored while seated
- [x] client: "Press E to sit" prompt, seated pose, E/Esc to stand, bridge events
- [x] Tests: sit, taken seat, too far, move ignored, stand/disconnect frees seat, invalid indexes
- [x] Run the whole suite, update PROGRESS_LOG.md, commit

## Next

- [ ] Prompt 7 - see the status board in PROGRESS_LOG.md (not started)
