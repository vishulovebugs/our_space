# Task log

Short to-do for the current phase. The authoritative, append-only record is
`PROGRESS_LOG.md`; the rules are in `CLAUDE.md`.

## Prompt 1 - Monorepo scaffold

- [x] Root package.json with npm workspaces (client, server, shared) + dev/test scripts
- [x] shared/: constants.js (GAME_NAME, TILE_SIZE, MAX_PLAYERS_PER_HALL)
- [x] client/: Vite + React rendering "Pixel Hall", Phaser 3 installed
- [x] server/: Express + Colyseus on 2567, GET /health, "hall" room type
- [x] .gitignore, .env.example in client and server
- [x] Tests: constants, /health, App render, client build exits 0
- [x] Run the whole suite, update PROGRESS_LOG.md, commit

## Next

- [ ] Prompt 2 - see the status board in PROGRESS_LOG.md (not started)
