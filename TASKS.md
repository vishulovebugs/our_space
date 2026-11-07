# Task log

Short to-do for the current phase. The authoritative, append-only record is
`PROGRESS_LOG.md`; the rules are in `CLAUDE.md`.

## Prompt 2 - Auth with unique usernames

- [x] server/db/schema.sql: citext, profiles table, username check constraint, RLS
- [x] shared/validators.js: validateUsername + validatePassword, with tests
- [x] client: Login page (two modes), live debounced username check, pixel theme
- [x] client: session restore + Welcome screen with Log out
- [x] server/auth.js: verifyToken with test-only bypass, with tests
- [x] Supabase client library installed (client), shared workspace linked
- [x] Run the whole suite, update PROGRESS_LOG.md, commit

## Next

- [ ] Prompt 3 - see the status board in PROGRESS_LOG.md (not started)
