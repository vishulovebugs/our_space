# Task log

Short to-do for the current phase. The authoritative, append-only record is
`PROGRESS_LOG.md`; the rules are in `CLAUDE.md`.

## Prompt 8 - Colossal Cave Adventure cabinet

- [x] shared/adventure/data.js: original 25-room cave, five treasures, locked grate and vault, lake and rowboat
- [x] shared/adventure/parser.js: verbs, synonyms, abbreviations, 4-letter truncation, friendly unknown answer
- [x] shared/adventure/engine.js: pure deterministic step, lamp battery, dark deaths, scoring, win, save/load requests
- [x] Supabase: adventure_saves with RLS plus the adventure_leaderboard view
- [x] client: CaveGame terminal in GameShell with scrollback, arrow-key history, SAVE/LOAD, QUIT/Esc
- [x] adventure.test-walkthrough.json and the regression test that wins with 100 points
- [x] Run the whole suite, update PROGRESS_LOG.md, commit

## Next

- [ ] Prompt 10 - South door exits the hall and logs the player out, see PROGRESS_LOG.md
