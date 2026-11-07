# Pixel Hall - Progress Log
Append-only. One entry per prompt/step. Newest at the bottom.
## Status board
| Prompt | Title | Status | Commit | Tests (pass/fail) | Date |
|--------|-------|--------|--------|-------------------|------|
| 0 | Project rules and progress log | done | this commit (chore: add project rules (CLAUDE.md) and progress log) | 0/0 | 2026-11-08 |
| 1 | Monorepo scaffold (npm workspaces, Vitest) | not started | - | - | - |
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

## Decisions and changes
- 2026-11-08 - User instruction: commit after every phase (in addition to the one-commit-per-prompt rule in section 5). Applied from Prompt 0 onward.
- 2026-11-08 - User instruction: keep a to-do list for the current phase. TASKS.md holds it.
