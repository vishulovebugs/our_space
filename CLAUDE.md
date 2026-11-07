# Pixel Hall - Project Rules

=====================================================================
1. PRODUCT
=====================================================================
- Login page: sign in or create account. Usernames are unique per user (case-insensitive). New users design a pixel character before entering the world.
- The hall: a room with a curved couch in the centre. Players can sit on it (5 seats).
- Dark chat space: seated players can open a pitch-black, text-only chat. "/t message" sends, "/q" leaves. Nothing else is shown, just monospace text. Only seated players see these messages.
- Three arcade cabinets: Chess, Tankers (top-down tank battle), and Colossal Cave Adventure (an original text adventure inspired by the 1976 classic, not a copy of its data).
- A TV on the north wall: seated players can stream a YouTube video, synced for all seated players via the official YouTube IFrame Player API only.
- A door in the south wall: walking into it logs the player out and returns to the login page.

=====================================================================
2. TECH STACK (fixed, do not substitute)
=====================================================================
- JavaScript only, ES modules. NO TypeScript. No .ts or .tsx files anywhere. Use JSDoc comments for types where helpful.
- Monorepo using npm workspaces:
    client/  = React + Vite (JSX) + Phaser 3
    server/  = Node + Express + Colyseus
    shared/  = pure JS used by both (constants, validators, layout, game logic). No DOM, no network, no Node-only APIs in shared/.
- Supabase for auth and Postgres. chess.js for chess rules. Vitest for all tests. Playwright only for the final end-to-end test.
- Before using Colyseus or @colyseus/schema, check the current docs and use the JavaScript-friendly API (defineTypes, no decorators). Do not rely on memory for library APIs; verify against installed versions and docs.

=====================================================================
3. ARCHITECTURE PRINCIPLES
=====================================================================
- The server is authoritative. Never trust the client: validate every message's shape, size, rate, and game-rule legality on the server.
- Game rules and validation live in shared/ or server/ as small PURE functions so they are easy to unit test. React and Phaser code stays thin.
- No game logic duplicated between client and server; import it from shared/.
- Art is generated procedurally in code (canvas / pixel arrays). No external image or audio files unless I ask.
- Secrets live in git-ignored .env files. Always provide .env.example files. Never log tokens, passwords, or emails.
- Any test-only auth bypass must be impossible when NODE_ENV is not "test".
- Prefer small files with one responsibility. Name things consistently. Comment the "why", not the "what".

=====================================================================
4. THE LOG FILE: PROGRESS_LOG.md (mandatory)
=====================================================================
This file is the project's memory. If PROGRESS_LOG.md already exists in the repo root, READ IT FIRST and keep everything already in it. Never delete or rewrite old entries, only append. If it does not exist, create it with this header:

```
# Pixel Hall - Progress Log
Append-only. One entry per prompt/step. Newest at the bottom.
## Status board
| Prompt | Title | Status | Commit | Tests (pass/fail) | Date |
|--------|-------|--------|--------|-------------------|------|
```

Keep that status board table updated (one row per prompt, statuses: not started / in progress / done / blocked). Below it, after finishing each prompt, append an entry in exactly this format:

```
### Prompt <N> - <title>  (<YYYY-MM-DD HH:MM>)
- Status: done | blocked
- Commit: <short hash> "<commit message>"
- What was built: <3-8 bullets, files and modules created or changed>
- Tests: <total passed> passed, <failed> failed (list new test files)
- Decisions made: <any choice not dictated by the prompt, and why>
- Deviations: <anything done differently from the prompt, and why, or "none">
- Problems hit and fixes: <errors, root cause, fix, or "none">
- Manual checks for the human: <exact steps, or "none">
- Known issues / TODO for later: <or "none">
- Next prompt: <N+1>
```

Log rules:

- The log update goes into the SAME commit as the work (update the log, then commit). Do not leave the log change uncommitted.
- Be honest. Record failures, skipped items, and workarounds. Never write "all tests pass" unless you just ran them and saw it.
- If a prompt ends blocked, log it with status "blocked", the exact error, and what you tried. Do not move on.
- If I tell you something verbally that changes the plan (a new rule, a changed decision), record it under a "## Decisions and changes" section at the bottom of the log with the date.
- At the start of each session or prompt: read CLAUDE.md, read PROGRESS_LOG.md, run `git log --oneline -10` and `git status`, and tell me in two lines where we are and which prompt is next. If the log and git history disagree, tell me before doing anything.

=====================================================================
5. RULES FOR EVERY STEP
=====================================================================
1. Do exactly what the current prompt asks. Do nothing from later prompts. If a prompt depends on something from an earlier prompt that is missing in the log or the repo, stop and tell me.
2. Before coding, state a short plan (files you will create or change). For anything ambiguous, make the simplest reasonable choice, log it under "Decisions made", and continue. Only ask me when a wrong guess would be expensive.
3. Write the automated tests listed in the prompt. Tests must test real behaviour, not just that code runs. Run the new tests, then run ALL earlier tests too (npm test at the root).
4. If any test fails, find the root cause and fix the code. Never delete, skip, or weaken a test to make it pass. Never use .skip or .only in committed code. If a test itself is genuinely wrong, tell me why before changing it and log it.
5. Do not install packages beyond what the prompt needs. Pin nothing exotic. If you add a dependency, note it in the log with a one-line reason.
6. Only when everything passes: update PROGRESS_LOG.md, then `git add -A` and `git commit` using the exact commit message given in the prompt. One commit per prompt. No force pushes, no history rewriting, no amending earlier commits. Do not push to any remote unless I ask.
7. Do not commit secrets, node_modules, dist, or .env files. Check `git status` before committing.
8. Do not start dev servers and leave them running at the end of a step. Kill any background processes you started.
9. If you get stuck in a loop (same failure three times), stop, explain the root cause in plain words, list two options, and wait for me.

=====================================================================
6. DEFINITION OF DONE (all must be true)
=====================================================================
- Every item in the prompt's BUILD section exists and works.
- Every test listed in the prompt exists and passes; earlier tests still pass.
- No TypeScript files, no leftover debug logs, no commented-out dead code.
- PROGRESS_LOG.md has the new entry and an updated status board row.
- Work is committed with the exact commit message and the working tree is clean.

=====================================================================
7. FINAL REPORT FORMAT (end every step with this, keep it short)
=====================================================================
- Built: 3-6 bullets
- Tests: X passed, Y failed (total across the whole repo)
- Commit: <hash> "<message>"
- Log: confirm PROGRESS_LOG.md was updated
- Manual checks for me: exact steps to try in the browser, or "none"
- Next: the next prompt number and title
