# WI-SL-011: CLI `history` Command

**AC:** AC-010 — CLI completeness
**Status:** in_progress
**Source Specs:** specs/skills.spec.dir/skills/sip-082-cli-history-speclang-v0.md

## Goal
Add `speclang history` command to `bin/speclang`. It provides git-integrated change tracking for specification files.

## Verification
- `./bin/speclang history --help` shows options
- `./bin/speclang history` shows spec history (git log)
- Aliases `speclang log` and `speclang changes` work
- `--format=json` outputs valid JSON
- `--format=timeline` shows visual timeline
- `--compare v1.0.0..HEAD` works
- `--author`, `--since`, `--until` filters work
- `--stat` shows statistics
- `npm run build && npm test` passes

## Requirements (from SIP 82)
1. **Basic history:** `speclang history [spec]` — shows git log for all or specific spec
2. **Options:** --all, --block, --author, --since, --until, --compare, --format (text|json|timeline), --follow, --stat, --blame
3. **Aliases:** `speclang log`, `speclang changes`
4. **Text format:** Shows commit hash, date, author, message, blocks changed per commit
5. **JSON format:** Structured output with file/commits/author/stats
6. **Timeline format:** Month-grouped visual timeline with tree characters
7. **Compare mode:** Shows diff between two versions with block-level changes
8. **Statistics:** Commits, authors, files, blocks added/modified/removed

## Scope (THIS TICK ONLY)
- Install `simple-git` npm package
- Add `history` command entry in bin/speclang with all options
- Add aliases (log, changes)
- Implement text, JSON, and timeline output formats
- Implement compare mode, stat mode, filters
- Skip: blame mode (line-level attribution — complex, follow-up)
