# WI-SL-010: CLI `build` Command

**AC:** AC-010 — CLI completeness
**Status:** completed ✅
**Completed:** 2026-06-18 16:23 UTC
**Evidence:** Build command added with --clean, --watch, --json flags. compile alias works. 2070 lines. 2154 tests pass. Commit: 73f1e4d.
**Source Specs:** specs/skills.spec.dir/skills/sip-081-cli-build-speclang-v0.md

## Goal
Add `speclang build` command to `bin/speclang`. It compiles specs to code, delegating to the existing generate infrastructure.

## Verification
- `./bin/speclang build --help` shows options
- `./bin/speclang build` compiles specs to code (delegates to generate)
- `./bin/speclang build --target=typescript` works
- `./bin/speclang build --dry-run` shows what would be built
- `./bin/speclang build --clean` cleans output first
- `./bin/speclang build --watch` watches for changes (can be simple polling)
- `npm run build && npm test` passes

## Requirements (from SIP 81)
1. **Basic build:** `speclang build [specs...]` — compiles all or specified specs
2. **Options:** --target (default: typescript), --output (default: src/generated), --dry-run, --clean, --watch
3. **Implementation:** Delegate to existing `generateCommand` in dist/src/cli/commands/generate.js
4. **Watch mode:** Simple fs.watch on specs/ directory, rebuild on change
5. **Clean:** Remove output directory before building

## Scope (THIS TICK ONLY)
- Add `build` command entry in bin/speclang
- Wire it to the existing generate infrastructure
- Add --watch (basic), --clean, --dry-run flags
- Skip: incremental caching, profiling, source maps, multi-target parallel build
- Those are follow-on improvements
