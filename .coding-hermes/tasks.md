# SpecLang CI — Coding Hermes Tasks

## Active

- [x] **CI-001: Fix 15 pre-existing test failures** (commit 800dee77)
  - 15 tests failing since git corruption recovery (same 8 files)
  - Requires `TMPDIR=/home/kara/tmp-speclang` (default /tmp hits EDQUOT)
  - Acceptance: `npx vitest run` → 1709 passed, 62 skipped, 0 failed ✓
  - Workdir: `/home/kara/SpecLang`

- [ ] **CI-002: Fix /tmp EDQUOT — make tests run without TMPDIR workaround**
  - /tmp is a 30G tmpfs, 80% full, 24K stale Chrome dirs
  - Tests should not require a custom TMPDIR
  - Either: clean /tmp, mount tmpfs elsewhere, or configure vitest tmp dir
  - Acceptance: `npx vitest run` passes without TMPDIR env var

- [ ] **CI-003: Set up GitHub Actions CI pipeline**
  - Build + test on push/PR to main
  - Lint (tsc, ESLint if configured)
  - GitReins guard (secrets, static_analysis)
  - Acceptance: `.github/workflows/ci.yml` exists, green run on GitHub

- [ ] **CI-004: Wire GitReins Tier 2 into CI**
  - Run `gitreins judge` on changed files in CI
  - Annotate PRs with per-criterion PASS/FAIL
  - Acceptance: CI job runs evaluator and reports verdicts

- [ ] **ARCH-001: Automatic file watching — daemon detects spec changes**
  - Coordinator must currently be invoked explicitly
  - Add inotify/fs.watch on specs/ directory
  - On change: trigger assemble → cascade → regenerate
  - Acceptance: save a `.spec.md` file → cascade fires within 2s without manual invocation

- [ ] **ARCH-002: Background daemon mode — speclangd runs as a service**
  - Everything currently runs in foreground
  - Wire `speclangd` to stay resident, watch files, and cascade on change
  - Acceptance: `speclangd start` → daemon runs, `speclangd status` reports healthy, save spec → auto-cascade

- [ ] **ARCH-003: Parallel agent execution — swarm instead of sequential**
  - Agents currently invoked one at a time via Task tool
  - Spawn multiple Pi Agent workers concurrently when cascade fans out
  - Acceptance: cascade with 5 independent specs → all 5 codegen agents run in parallel, wall time ≤ slowest agent

- [ ] **ARCH-004: Autonomous cascade — remove user-controlled gating**
  - User currently decides when to continue the cascade
  - Daemon + file watcher + parallel agents = fully autonomous pipeline
  - Acceptance: save a top-level spec → cascade propagates through all dependencies → assembled output regenerated → no user interaction

## Backlog

- [ ] **CI-005: Pre-commit hook hardening**
  - Verify hook blocks secrets, enforces build, and runs diff-mode tests
  - Add `npm run assemble` to pre-commit pipeline
  - Acceptance: `git commit` with broken build → blocked

- [ ] **CI-006: Test coverage reporting**
  - Generate coverage with vitest (c8 or v8 provider)
  - Upload to GitHub Actions artifact
  - Acceptance: CI job shows coverage % in summary
