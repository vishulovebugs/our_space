# Pixel Hall - Progress Log
Append-only. One entry per prompt/step. Newest at the bottom.
## Status board
| Prompt | Title | Status | Commit | Tests (pass/fail) | Date |
|--------|-------|--------|--------|-------------------|------|
| 0 | Project rules and progress log | done | this commit (chore: add project rules (CLAUDE.md) and progress log) | 0/0 | 2026-11-08 |
| 1 | Monorepo scaffold (npm workspaces, Vitest) | done | this commit (feat: monorepo scaffold with client, server, shared) | 5/0 | 2026-11-08 |
| 2 | Auth: sign up / sign in with unique usernames | done | this commit (feat: auth with unique usernames) | 25/0 | 2026-11-08 |
| 3 | Pixel character designer | done | this commit (feat: character creator with procedural pixel sprites) | 47/0 | 2026-11-08 |
| 4 | The hall: movement, curved couch, 5 seats | done | this commit (feat: pixel hall scene with walking player) | 71/0 | 2026-11-08 |
| 5 | Multiplayer hall with Colyseus | done | this commit (feat: multiplayer hall with server-validated movement) | 78/0 | 2026-11-08 |
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

### Prompt 2 - Auth with unique usernames  (2026-11-08 00:30)
- Status: done
- Commit: this commit (a commit cannot contain its own hash; short hash reported in the step's final report) - "feat: auth with unique usernames"
- What was built:
  - server/db/schema.sql - citext extension, profiles table (id, username citext unique, character jsonb, created_at), username_format check constraint, RLS: select for anon+authenticated, insert/update only own row
  - shared/validators.js - USERNAME_PATTERN, validateUsername, validatePassword (min 8), plus validators.test.js including a drift guard against schema.sql
  - client/src/lib/supabase.js - browser client from VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
  - client/src/pages/Login.jsx - two modes, live debounced username availability check, inline validation, pixel theme; Welcome.jsx + App.jsx session restore and Log out; styles.css with "Press Start 2P"
  - client/src/pages/Login.test.jsx and updated App.test.jsx (Supabase client mocked)
  - server/auth.js - verifyToken: test tokens in NODE_ENV=test, HS256 Supabase JWT verification otherwise; auth.test.js
  - client/.env.example and server/.env.example extended with the Supabase values
- Tests: 25 passed, 0 failed - client 4 (App.test.jsx 1, pages/Login.test.jsx 3), server 8 (server.test.js 1, auth.test.js 7), shared 13 (constants.test.js 3, validators.test.js 10). `npm run build --workspace client` exits 0.
- Decisions made:
  - Supabase JWTs are verified as HS256 with SUPABASE_JWT_SECRET using node:crypto: no network call, no new dependency. Asymmetric (ES256/RS256) signing keys are not supported yet - recorded as TODO for Prompt 12.
  - The username comes from user_metadata.username in the token payload (null when absent).
  - The test bypass reads NODE_ENV on every call, not at import time, so a test build cannot arm it in a normal server.
  - The create-account form inserts the profiles row immediately after signUp because the insert policy requires auth.uid() = id; with email confirmation enabled there is no session yet, so the form tells the user to confirm first.
  - Availability uses .eq() on the citext column (case-insensitive by type) instead of ilike, which avoids pattern-escaping holes.
  - The select policy covers anon as well as authenticated because the availability check runs before sign-in.
  - Added @supabase/supabase-js to the client, and declared @pixel-hall/shared as a dependency of client and server now that both import it.
  - shared/package.json now exposes "./validators.js" in its exports map.
  - The login screen keeps the <h1>Pixel Hall</h1> heading, so the Prompt 1 App test still asserts the real UI.
- Deviations: none
- Problems hit and fixes:
  - First run of the suite failed: "./validators.js" is not exported under the conditions [...] from package @pixel-hall/shared. Root cause: the exports map only declared ".". Fix: added "./validators.js"; suite green afterwards.
  - Two .env.example writes failed through the editor patch path; they were rewritten from the shell.
- Manual checks for the human:
  1. Supabase -> Project settings -> API: put the Project URL and anon key in client/.env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) and the JWT secret in server/.env (SUPABASE_JWT_SECRET). Both .env files are git-ignored.
  2. Supabase -> Authentication -> Sign In / Providers -> Email: turn OFF "Confirm email" (otherwise no session is returned and the profile row is not created).
  3. Supabase -> SQL editor: run server/db/schema.sql once.
  4. `npm run dev`, open http://localhost:5173.
  5. Create account "Pixel_Cat" with any email and an 8+ character password - you should land on "Welcome, Pixel_Cat".
  6. Log out, then Create account with "pixel_cat" (and again with "PIXEL_CAT"): the form must show "Username taken" with submit disabled.
- Known issues / TODO for later:
  - Email confirmation must stay off until a confirmation flow exists (no profile row is created when signUp returns no session).
  - Only HS256 JWTs are verified; if the Supabase project uses asymmetric signing keys, verification will fail until Prompt 12 adds JWKS support.
  - The character column exists but nothing writes it yet (Prompt 3).
- Next prompt: 3

### Prompt 3 - Character designer  (2026-11-08 00:35)
- Status: done
- Commit: this commit (a commit cannot contain its own hash; short hash reported in the step's final report) - "feat: character creator with procedural pixel sprites"
- What was built:
  - shared/character.js - BODY_IDS (3), HAIR_IDS (6), OUTFIT_IDS (5), ACCESSORY_IDS (4, including "none"), per-slot colour lists plus CHARACTER_PALETTE (14 colours), CHARACTER_MAX_BYTES (512), defaultCharacter, randomCharacter(rng), validateCharacter, nextScreen(profile)
  - shared/character.test.js - validation, palette sanity, randomization and routing
  - client/src/sprites/art.js - rectangle-based layers for every body/hair/outfit/accessory on a 16x24 grid, walk swing offsets, mirroring, RGBA pixel buffers
  - client/src/sprites/index.js - composeCharacter (16x24 canvas) and composeCharacterSpritesheet (48x96: 4 directions x 3 frames)
  - client/src/test/canvasMock.js and setup.js - pixel-storing canvas mock for jsdom, wired through vite.config.js setupFiles
  - client/src/pages/CharacterCreator.jsx - scaled live preview, four pickers, colour swatches, Randomize and Save
  - client/src/App.jsx - loads the profile after login, routes to creator or hall through nextScreen, and writes profiles.character on save
  - client/src/styles.css - creator layout
- Tests: 47 passed, 0 failed - client 12 (App 1, Login 3, CharacterCreator 3, sprites 5), server 8, shared 27. `npm run build --workspace client` exits 0.
- Decisions made:
  - Art is built from rectangles rather than hand-drawn 24-row pixel grids: eighteen hand-drawn grids would be hundreds of lines of data for the same output, and rectangles scale with each body's geometry. Still fully procedural, still no image files.
  - The pixel buffer builder (buildCharacterPixels) is separate from the canvas code (composeCharacter), so the art logic is pure and the canvas layer stays thin.
  - Wrote a small canvas mock instead of adding jest-canvas-mock: those mocks do not round-trip putImageData/getImageData, and the prompt requires comparing real pixel data. No new dependency.
  - "right" is generated by mirroring "left", so only three poses are ever drawn.
  - randomCharacter lives in shared with an injectable rng, which keeps the component thin and makes the 100-run validity check cover the 0 and 1 edges of the random range.
  - The creator exposes its live character as data-character on <main> so the 100-randomize test checks real component state without a test-only prop.
  - One palette for every slot (the spec says reject colours outside the palette); the per-slot lists only drive the swatch UI and random defaults.
  - shared/package.json now exports "./character.js" - the same exports-map trap as Prompt 2.
- Deviations: none
- Problems hit and fixes:
  - shared/character.test.js failed with "expected 13 to be 14": #4a7cc2 appeared in both HAIR_COLORS and OUTFIT_COLORS. Fix: the outfit violet became #e8894a; the palette is now 14 distinct colours.
- Manual checks for the human:
  1. `npm run dev`, then sign in with a fresh account (or one whose character is null) - the creator appears instead of the welcome screen.
  2. Cycle the pickers, change a few swatches, press Randomize, then Save.
  3. Reload the page: the creator is skipped and "Welcome, <username>" shows. Log out and back in: still skipped, because the character is stored in profiles.character.
  4. Optional: `select username, character from profiles;` in the Supabase SQL editor to see the stored JSON.
- Known issues / TODO for later:
  - The walk spritesheet is generated but nothing animates it yet (Prompt 4 consumes it).
  - The "hall" screen is still the Prompt 2 Welcome placeholder.
- Next prompt: 4

### Prompt 4 - Hall scene with walking player  (2026-11-08 00:44)
- Status: done
- Commit: this commit (a commit cannot contain its own hash; short hash reported in the step's final report) - "feat: pixel hall scene with walking player"
- What was built:
  - shared/hallLayout.js - 30x20 tile room, perimeter walls, couch back arc plus armrests, five seat tiles, TV (6x2 on the north wall), three cabinets (CHESS, TANKERS, CAVE on the east wall), door in the south wall, rectTiles helper, HALL_LAYOUT with wallKeys and the blocked set
  - shared/movement.js - tileKey, isWalkable, clampToWalkable (ring search), tileDistance, isNearby, pixelToTile, tileCentre
  - client/src/game/bridge.js - createEventBridge (on/off/emit, on returns its unsubscribe) plus the shared gameBridge instance
  - client/src/game/textures.js - procedural floor, wall, couch back, couch seat, TV, door and three arcade textures
  - client/src/game/scenes/HallScene.js - draws the room and props, builds the player sheet from composeCharacterSpritesheet, four-direction walk animations, axis-by-axis collision through shared isWalkable, camera follow, username label, and E/SPACE emitting interact:seat / interact:tv / interact:arcade for the nearest prop within two tiles
  - client/src/components/GameCanvas.jsx - Phaser game (pixelArt, roundPixels, FIT, 320x240), spawn data handed over in preBoot, destroyed on unmount
  - client/src/pages/Hall.jsx - canvas plus Links out button; App now routes here, and the old Welcome placeholder is gone
  - client/vite.config.js - Phaser aliased to its ESM build
  - tests: shared/hallLayout.test.js, shared/movement.test.js, client/src/game/bridge.test.js, client/src/game/scenes/HallScene.test.js
- Tests: 71 passed, 0 failed - client 19, server 8, shared 44. `npm run build --workspace client` exits 0 (Vite warns the Phaser chunk exceeds 500 kB).
- Decisions made:
  - The couch's five cushions are walkable floor tiles in front of a solid back arc, so seats never overlap couch tiles (keeping the "no two objects overlap" rule true) and a player can stand at a seat until sitting arrives in Prompt 5.
  - Collision is implemented in shared/movement.js instead of Arcade Physics bodies, so the server can enforce the same rules later from one implementation.
  - Depth is sorted by y, so the player walks behind props; "right" sprites are the mirrored "left" frames.
  - `import * as Phaser` rather than a default import, because Phaser's ESM build only has named exports.
  - Phaser is aliased to dist/phaser.esm.js in the client Vite config, since the package "main" points at the source tree that needs the dev-only phaser3spectorjs package.
  - Hall.jsx keeps a Log out button until the door handles logging out (Prompt 10).
  - Deleted Welcome.jsx: this prompt replaced the placeholder it existed for.
- Deviations: none
- Problems hit and fixes:
  - Client test files failed with "Cannot find module 'phaser3spectorjs'". Root cause: Vitest resolved Phaser's "main" (src/phaser.js), which requires that dev-only package. Fix: resolve.alias maps phaser to dist/phaser.esm.js in client/vite.config.js.
  - After that: "TypeError: Cannot read properties of undefined (reading 'Scene')". Root cause: the ESM build has named exports only, so `import Phaser from "phaser"` was undefined. Fix: `import * as Phaser from "phaser"` in the scene, GameCanvas and the test.
- Manual checks for the human:
  1. `npm run dev`, sign in with a profile that already has a character - the hall renders with floor, walls, purple couch, TV, three cabinets and the door.
  2. WASD or the arrow keys: the player walks with a four-direction animation and the camera follows.
  3. Try to walk into a wall, the couch, the TV, a cabinet and the door - all blocked.
  4. Walk next to a cabinet and press E or Space: nothing visible happens yet (React subscribes to the bridge in a later prompt), but the event fires.
- Known issues / TODO for later:
  - The Phaser scene is only import-tested, never booted in CI, so rendering and movement are unverified by tests.
  - Interactions are emitted but have no React subscriber yet.
  - The bundle is ~1.4 MB because Phaser sits in the main chunk; there is no touch/click-to-move.
- Next prompt: 5

### Prompt 5 - Multiplayer hall with Colyseus  (2026-11-08 00:54)
- Status: done
- Commit: this commit (a commit cannot contain its own hash; short hash reported in the step's final report) - "feat: multiplayer hall with server-validated movement"
- What was built:
  - server/src/state/HallState.js - Player schema (id, username, x, y, dir, character string, seat int8 defaulting to -1) and HallState with players: MapSchema, declared with defineTypes (no decorators)
  - server/src/supabase.js - loadProfile(token, userId): anon key plus the player's own bearer token, so RLS still applies; no service-role key
  - server/src/rooms/HallRoom.js - onAuth through server/auth.js (test mode takes the test token and options.character), maxClients = MAX_PLAYERS_PER_HALL, one session per userId (the older connection gets leave(4000)), move handling that rejects non-finite, unwalkable and too-far positions (PLAYER_SPEED * elapsed + 8px) and answers with a "snap" message, player removed on leave
  - shared/constants.js - PLAYER_SPEED = 90; shared/movement.js - isStandablePosition(layout, x, y), the single standability rule both sides use
  - client/src/game/scenes/HallScene.js - joins the room after the scene loads, local prediction plus reconciliation against the server, remote players built from their character JSON with username labels, lerped motion, move messages throttled to 50ms, leave detected and a bounded reconnect loop emitting connection:lost/connection:restored
  - client/src/pages/Hall.jsx - "Reconnecting..." overlay; token plumbed App -> Hall -> GameCanvas -> scene registry; styles.css gains the overlay
  - server/src/rooms/HallRoom.test.js - the seven required cases with @colyseus/testing
  - server/.env.example - SUPABASE_URL and SUPABASE_ANON_KEY documented
- Tests: 78 passed, 0 failed - client 19, server 15 (server.test 1, auth.test 7, HallRoom.test 7), shared 44. `npm run build --workspace client` exits 0 (same Phaser chunk warning).
- Decisions made:
  - The client SDK for a 0.18 server is @colyseus/sdk 0.18.9; the older colyseus.js package was installed first and removed. @colyseus/schema is a direct server dependency because defineTypes is only exported from it in 5.0.45.
  - The character travels as a JSON string in the schema: MapSchema and scalar fields are all the state needs, and a nested object type would buy nothing.
  - Movement validation is speed-budget based (elapsed time since the last accepted move, +8px slack) rather than per-frame checks, so a dropped or batched message does not falsely reject a legal walk.
  - Safety is server-authoritative but the client still predicts locally, then reconciles whenever the server position differs by more than 24px; small differences are left to the interpolation to hide.
  - The test suite boots its own defineServer instance through @colyseus/testing's boot(), which listens on port 2568, so the dev server on 2567 is never touched.
  - Tests poll the client state with a bounded waitUntil helper instead of waiting for patches: the second player often arrives inside the initial state, and waiting for a patch that never comes just hangs.
  - Reconnect attempts are capped at five with a 2s delay; when they run out the overlay stays up rather than pretending the player is still online.
- Deviations: none
- Problems hit and fixes:
  - Vitest could not resolve "../auth.js" from src/rooms: auth.js lives at the server root. Fix: ../../auth.js.
  - The first test waited for a patch after both clients joined and timed out. Fix: poll for the expected state instead (waitUntil).
  - server/.env.example failed to patch through the editor path again (same as Prompts 2 and 4); rewritten from the shell.
- Manual checks for the human:
  1. `npm run dev`, window A: sign in as account one and open the hall.
  2. Window B (a second browser profile or a private window): sign in as account two, open the hall.
  3. Each window shows both characters with usernames; walking in one window moves that character in the other, smoothly, with the right facing.
  4. Sign in again as account one in a third window: the first window's connection is closed and only the newest one keeps the character.
  5. Stop the server, wait a moment: "Reconnecting..." appears; start it again and press nothing - the overlay clears once a rejoin succeeds.
- Known issues / TODO for later:
  - Seats are in the schema (seat = -1) but sitting is not implemented yet; the move handler never sets it.
  - The reconnect loop keeps the old token, so a session that expired during the drop will keep failing until the page is reloaded.
  - Remote players are never rendered in a test: Phaser is still only import-tested, so the manual check above is the only verification of the visuals.
- Next prompt: 6

## Decisions and changes
- 2026-11-08 - User instruction: commit after every phase (in addition to the one-commit-per-prompt rule in section 5). Applied from Prompt 0 onward.
- 2026-11-08 - User instruction: keep a to-do list for the current phase. TASKS.md holds it.
