# SpecLang CI — Coding Hermes Tasks

## Active

- [x] **CI-004: Wire GitReins Tier 2 into CI** (commit bd96cf83)
  - Run `gitreins judge` on changed files in CI
  - Annotate PRs with per-criterion PASS/FAIL
  - Implementation: `review` job in `.github/workflows/ci.yml` (13 steps),
    `specs/ci.spec.md` §Tier 2 LLM Evaluation (8 new AC items),
    `.gitreins/tasks.yaml` (gitignored, 8 PR-shaped criteria)
  - Uses DeepSeek V4 Flash via DEEPSEEK_API_KEY; verdict posted as
    single idempotent PR comment (`<!-- gitreins-tier2 -->` marker)
  - Tier 2 is ADVISORY (continue-on-error: true) — does not block Tier 1
  - Validation: build clean, vitest 1709/62/0 (no regression), Tier 1 PASS
  - **NOT PUSHED** — GitHub Actions changes require review per cron rule

- [x] **CI-001: Fix 15 pre-existing test failures** (commit 800dee77)
  - 15 tests failing since git corruption recovery (same 8 files)
  - Requires `TMPDIR=/home/kara/tmp-speclang` (default /tmp hits EDQUOT)
  - Acceptance: `npx vitest run` → 1709 passed, 62 skipped, 0 failed ✓
  - Workdir: `/home/kara/SpecLang`

- [x] **CI-002: Fix /tmp EDQUOT — make tests run without TMPDIR workaround** (commit 25fd3acd)
  - /tmp is a 30G tmpfs, 80% full, 24K stale Chrome dirs
  - Tests should not require a custom TMPDIR
  - Either: clean /tmp, mount tmpfs elsewhere, or configure vitest tmp dir
  - Acceptance: `npx vitest run` passes without TMPDIR env var

- [x] **CI-003: Set up GitHub Actions CI pipeline** (commit 64132309)
  - Build + test on push/PR to main
  - Lint (tsc, ESLint if configured)
  - GitReins guard (secrets, static_analysis)
  - Acceptance: `.github/workflows/ci.yml` exists, green run on GitHub
  - Implementation: `specs/ci.spec.md` (spec) + `.github/workflows/ci.yml` (working file)
  - Single Node 20 job (replaces 3-version matrix)
  - 9 steps: checkout, setup-node, install, build, test, lint (continue-on-error), gitreins install, gitreins guard, artifact upload
  - Concurrency group + 15min timeout
  - **NOT PUSHED** — GitHub Actions changes require review per cron rule

## [x] Fix CI: SpecLang CI — linter step fails (exit code 127) — check lint command config (commit 5820daaf)
- **Priority:** medium
- **CI Run:** https://github.com/dexdat/SpecLang/actions/runs/28683977186
- **Root cause:** `npm run lint` invokes `eslint src/**/*.ts` but the `eslint` binary is not installed (CI-005 lands lint config). The prior `continue-on-error: true` did not catch this because the failure happens BEFORE the guard evaluates — exit 127 propagates as a job failure.
- **Fix:** Replaced unconditional `npm run lint` with a config-file probe — checks for `eslint.config.{js,mjs,cjs}` or `.eslintrc.{js,json}` before invoking. Step exits 0 when absent (matches `specs/ci.spec.md §2` graceful-degradation contract).
- **Files:** `.github/workflows/ci.yml` (+15/-7), `specs/ci.spec.md` (3 lines updated to reflect probe-based approach)
- **Acceptance:** YAML well-formed, spec+workflow aligned, vitest 1709 passed / 62 skipped / 0 failed (20.94s)
- **NOT PUSHED** — GitHub Actions changes require review per cron rule

- [x] **ARCH-001: Automatic file watching — daemon detects spec changes** (commit 255184a4)
  - Coordinator must currently be invoked explicitly
  - Add inotify/fs.watch on specs/ directory
  - On change: trigger assemble → cascade → regenerate
  - Acceptance: save a `.spec.md` file → cascade fires within 2s without manual invocation
  - **CRITICAL FIX**: The Watcher's `matchPattern` glob → regex converter had a
    substring-replacement bug. `**` → `.*` followed by `*` → `[^/]*` would
    collapse `**/*.spec.md` into `.[^/]*` (single-segment), so multi-directory
    spec files were silently ignored. The watcher was effectively a no-op.
  - **Implementation**: New `globToRegex()` method with `**/` and `/**` placeholders
    + 4 end-to-end acceptance tests in `tests/daemon/arch001-file-watching.test.ts`
  - **Validation**: build clean, vitest 1713 passed / 62 skipped / 0 failed
    (was 1709; +4 new tests). Push: main 255184a4.
  - Note: ARCH-002/003/004 build on this — daemon mode + parallel agents
    + autonomous cascade are now unblocked.

- [x] **ARCH-002: Background daemon mode — speclangd runs as a service** (commit 55d52b55)
  - speclangd start -d → forks detached, writes PID, parent exits 0
  - speclangd status → reads PID + state file (no new Daemon spawned — avoids race)
  - speclangd stop → SIGTERM + PID file cleanup, daemon shuts down gracefully
  - Save spec → daemon transitions to "cascading", filesChanged populated
  - Implementation:
    - Rewrote `bin/speclangd` (313 lines) — split into per-case handlers,
      each lazy-loading `dist/src/daemon/daemon.js` to avoid loading the
      daemon module for `start -d`/`stop`/`status` (which never need it).
    - Added `.speclang/speclangd.pid` and `.speclang/speclangd.log` paths.
    - Parent → child uses `child_process.spawn({detached: true})` with
      `SPECLANGD_CHILD=1` env so the child bypasses its own PID-record check.
    - `status` reads `.speclang/daemon-state.json` directly — never
      instantiates a fresh Daemon (was creating new ones that raced with
      the live daemon over the state file).
    - Stop kills, waits up to 5s for graceful exit, removes PID file.
  - Tests: `tests/daemon/arch002-background-daemon.test.ts` — 4 end-to-end
    tests covering start/status/cascade/stop via `child_process.execFile`.
  - Validation: tsc clean, vitest **1717 passed / 62 skipped / 0 failed**
    (was 1713; +4 new ARCH-002 tests).

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
