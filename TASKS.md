# Task log

Short to-do for the current phase. The authoritative, append-only record is
`PROGRESS_LOG.md`; the rules are in `CLAUDE.md`.

## Prompt 9 - North-wall TV

- [x] shared: parseYouTubeUrl for watch/youtu.be/shorts/embed, currentPosition for play/pause maths
- [x] server: tv schema, tv:play (seated, parsed, host) plus host-only pause/resume/stop, 1 play per 5s, host handover and auto-stop
- [x] client: "Press V to open TV" hint, DOM panel with the IFrame Player API, 2s drift seek, mute with Unmute, sprite flicker for standing players
- [x] Tests: URL parser (valid/invalid/lookalike/playlist/javascript:), position maths, seated-only start, non-host rejection, host handover, auto-stop, malformed link, rate limit
- [x] Run the whole suite, update PROGRESS_LOG.md, commit

## Next

- [ ] Prompt 7 - Tankers cabinet (top-down tank battle), see PROGRESS_LOG.md
