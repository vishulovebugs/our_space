# Task log

Short to-do for the current phase. The authoritative, append-only record is
`PROGRESS_LOG.md`; the rules are in `CLAUDE.md`.

## Prompt 6b - Seated-only terminal chat

- [x] shared: parseInput for "/t <message>", "/q" and ignored input
- [x] server: seated-only "chat", sanitising, 5-per-10s rate limit, seated-only broadcast, 30-message history on "chat:open"
- [x] client: "Press T to open chat" hint, black monospace overlay, /t sends, /q closes, closes on stand or disconnect
- [x] Tests: parser, seated/standing delivery, sanitising, rate limit, late history, overlay component
- [x] Run the whole suite, update PROGRESS_LOG.md, commit

## Next

- [ ] Prompt 7 - Tankers cabinet (top-down tank battle), see PROGRESS_LOG.md
