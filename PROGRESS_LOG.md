# Pixel Hall - Progress Log
Append-only. One entry per prompt/step. Newest at the bottom.
## Status board
| Prompt | Title | Status | Commit | Tests (pass/fail) | Date |
|--------|-------|--------|--------|-------------------|------|
| 0 | Project rules and progress log | done | this commit (chore: add project rules (CLAUDE.md) and progress log) | 0/0 | 2026-11-08 |
| 1 | Monorepo scaffold (npm workspaces, Vitest) | done | this commit (feat: monorepo scaffold with client, server, shared) | 5/0 | 2026-11-08 |
| 2 | Auth: sign up / sign in with unique usernames | not started | - | - | - |
| 3 | Pixel character designer | not started | - | - | - |
| 4 | The hall: movement, curved couch, 5 seats | not started | - | - | - |
| 5 | Dark chat space (/t, /q) | not started | - | - | - |
| 6 | Arcade shell + Chess cabinet (chess.js) | not started | - | - | - |
| 7 | Tankers cabinet (top-down tank battle) | not started | - | - | - |
| 8 | Colossal Cave Adventure cabinet (original text adventure) | not started | - | - | - |
| 9 | North-wall TV: synced YouTube IFrame playback | not started | - | - | - |
| 10 | South door: exit logs the player out | not started | - | - | - |
| 11 | Procedural pixel art pass | not started | - | - | - |
| 12 | Hardening: validation, rate limits, auth-bypass guard | not started | - | - | - |
| 13 | Playwright end-to-end test and polish | not started | - | - | - |

### Prompt 0 - Project rules and progress log  (2026-11-08 00:11)
- Status: done
- Commit: this commit (a commit cannot contain its own hash; short hash reported in the step's final report) - "chore: add project rules (CLAUDE.md) and progress log"
- What was built:
  - CLAUDE.md - sections 1-7 of the project rules, word for word
  - PROGRESS_LOG.md - this file: header, status board for Prompts 0-13, Prompt 0 entry
  - .gitignore - node_modules, dist, coverage, .env, .DS_Store
  - TASKS.md - short to-do for the current phase, points at this log as the authoritative record
  - (previous step) removed package.json, package-lock.json, node_modules; committed separately as "chore: start fresh - remove previous project files"
- Tests: 0 passed, 0 failed (no test framework installed yet; none requested in this prompt)
- Decisions made:
  - Only Prompt 0 has a known title, so the titles for Prompts 1-13 are provisional placeholders derived from section 1 (PRODUCT) and are expected to be corrected when each prompt arrives.
  - The Commit field of an entry names the commit by message instead of by hash, because the log is committed together with the work and a commit cannot record its own hash. The real short hash is given in the final report of each step.
  - TASKS.md is kept as a short current-phase to-do so there is one authoritative append-only record (PROGRESS_LOG.md) and one live checklist, instead of two competing logs.
  - The old commit 0bf6a0f ("phase2") was left in history; the deletion of the previous project files was committed as its own commit rather than being folded into the rule-file commit.
- Deviations: none
- Problems hit and fixes: none
- Manual checks for the human: open CLAUDE.md and PROGRESS_LOG.md and confirm the section text and the status board look right
- Known issues / TODO for later:
  - Prompt titles 1-13 in the status board are provisional.
- Next prompt: 1

### Prompt 1 - Monorepo scaffold  (2026-11-08 00:21)
- Status: done
- Commit: this commit (a commit cannot contain its own hash; short hash reported in the step's final report) - "feat: monorepo scaffold with client, server, shared"
- What was built:
  - package.json - root manifest: npm workspaces client/server/shared, scripts dev (concurrently), dev:client, dev:server, test (npm run test --workspaces --if-present)
  - shared/ - constants.js (GAME_NAME, TILE_SIZE, MAX_PLAYERS_PER_HALL), package.json exporting it, constants.test.js
  - client/ - Vite + React (index.html, vite.config.js, src/main.jsx, src/App.jsx rendering "Pixel Hall"), src/App.test.jsx, .env.example
  - server/ - src/server.js (createApp with GET /health, createGameServer wiring Express + Colyseus + the "hall" room type), src/index.js (listens on PORT or 2567), src/rooms/HallRoom.js (empty Room subclass), src/server.test.js, .env.example
  - .gitignore - already covered node_modules, dist, coverage, .env from Prompt 0
  - Dependencies added: concurrently + vitest (root dev), react, react-dom, phaser@^3.90.0 (client), vite, @vitejs/plugin-react, jsdom, @testing-library/react, @testing-library/dom (client dev), colyseus, express, @colyseus/ws-transport (server)
- Tests: 5 passed, 0 failed - shared/constants.test.js (3), server/src/server.test.js (1), client/src/App.test.jsx (1). `npm run build --workspace client` exits 0.
- Decisions made:
  - Used the Colyseus 0.18 API (defineServer + defineRoom + WebSocketTransport) instead of the legacy `new Server({ server })` form. Verified against docs.colyseus.io/server and docs.colyseus.io/room, then against the installed colyseus 0.18.12.
  - @colyseus/ws-transport is an explicit server dependency because the documented defineServer setup builds the transport from it; it is also what lets the test bind an ephemeral port.
  - createApp() and createGameServer() are separate so the test can listen on port 0 without starting the socket layer differently from production; the test still boots the real Express+Colyseus stack.
  - vitest is a root devDependency and each workspace owns a `test` script (`vitest run`); the root `test` fans out with --workspaces --if-present, which keeps the suite one command as required.
  - phaser is pinned to ^3.90.0: a plain `npm install phaser` resolved Phaser 4.2.1, but the product spec requires Phaser 3. It installs into client/node_modules because the version differs from the hoisted tree.
  - dev script uses `node --watch` rather than nodemon, to avoid an extra dependency.
  - ESLint was left out; the prompt marks lint as optional.
  - The client .env.example declares VITE_SERVER_URL although nothing reads it until the client connects to the room in a later prompt.
- Deviations: none
- Problems hit and fixes:
  - `npm install phaser` pulled Phaser 4.2.1. Root cause: npm defaults to the latest major. Fix: re-installed with phaser@^3 (3.90.0) and confirmed the version in client/package.json.
  - The manual smoke test's server survived the subshell kill (`cd server && node ... &` puts a subshell in $!), leaving port 2567 listening. Root cause: the recorded PID was the subshell, not node. Fix: found the listener with lsof, killed PID 4808 directly, and confirmed port 2567 is free again.
- Manual checks for the human:
  - `npm run dev`, then open http://localhost:5173 - the page shows "Pixel Hall".
  - `curl http://localhost:2567/health` while the dev server runs - returns {"status":"ok"}.
- Known issues / TODO for later:
  - The "hall" room is registered but has no state, no seats and no clients yet, by design for this prompt.
  - Prompt titles 2-13 in the status board are still provisional.
- Next prompt: 2

## Decisions and changes
- 2026-11-08 - User instruction: commit after every phase (in addition to the one-commit-per-prompt rule in section 5). Applied from Prompt 0 onward.
- 2026-11-08 - User instruction: keep a to-do list for the current phase. TASKS.md holds it.
