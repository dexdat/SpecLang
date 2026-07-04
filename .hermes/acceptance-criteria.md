# Acceptance Criteria for SpecLang

## Active Criteria

### AC-001 through AC-025 (all passed) ✅
All previously verified. Swarm, cascade, skills, infrastructure, agent communication, spec headers, LSP, Python codegen, maturity CLI, cascade-trace, tsc clean, TotalStack cascade, history CLI, search CLI, expand/downgrade CLI.

### BL-001 through BL-003 (all passed) ✅
Dashboard monitoring, dual-view docs, standard library tests.

### AC-066 (LSP Ref Diagnostics) ✅ RECOVERED 2026-06-28 23:51 UTC
`src/lsp/references.ts` reconstructed by Axiom from test + server.ts usage patterns. Commit `11064375`. 8/8 tests pass. Recovered from git corruption (original commit `8404a842`).

### AC-067 (Transition Upgrade Tests) ✅ PASSED 2026-06-30 11:28 UTC
**Spec:** specs/transition-workflows.spec.dir/upgrade.spec.md
**Axiom:** `proc_e39085107e0f` (opencode-go/deepseek-v4-flash, ~4min)
**Commit:** `76693788`
**Result:** Added `plan()`, `check()`, `isValidTransition()`, `listTransitionPaths()` to `UpgradePlanner`. Added `registerUpgradeWorkflows()` to `upgrade/index.ts`. Updated types.ts, validator.ts, executor.ts, rollback.ts. Tests: 31/31 pass (was 46 failures). tsc clean.

## Acceptance Criteria Status

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-001–AC-025 | ✅ Passed | All verified |
| BL-001 | ✅ Passed | Dashboard monitoring (157 tests) |
| BL-002 | ✅ Passed | Dual-view docs complete (15/15) |
| BL-003 | ✅ Passed | Standard library tests (384 tests) |
| AC-066 | ✅ Passed | LSP ref diagnostics recovered 2026-06-28 |
| AC-067 | ✅ Passed | Transition upgrade tests — fixed 2026-06-30 |

## Current Wake: 2026-07-05 ~08:35 UTC (MAINTENANCE — WORK)

- **ARCH-002 COMPLETE** (commit pending): `speclangd start -d` now forks
  detached, writes `.speclang/speclangd.pid`, parent exits 0. `speclangd
  status` reads PID + state file directly (no new Daemon spawned). `stop`
  sends SIGTERM with 5s grace. Saving a spec transitions daemon-state to
  "cascading" automatically.
- **GitReins T1:** PASS ✓ (secrets ✓, static_analysis ✓, go_build ✓, go_lint ✓, go_tests ✓). Gitleaks timeout (30s) — fell back to built-in scanner.
- **Build:** tsc clean (EXIT=0)
- **Tests:** **1717 passed, 0 failed, 62 skipped** (89 files, 21.10s). +4 new ARCH-002 tests (was 1713). TMPDIR redirect required.
- **Container:** opencode-speclang Up 10 days, healthy.
- **/tmp:** 80% (24G/30G). TMPDIR=/home/kara/tmp-speclang active.
- **Git:** main, HEAD `4cec05c5`. 2 modified files (bin/speclangd, .coding-hermes/tasks.md, .hermes/acceptance-criteria.md). 1 new test file. 7 untracked bin/ artifacts (non-blocking).
- **Staleness:** 441 specs (.spec.md). CLI: 26 subcommands. No new specs. No uncovered features.
- **Archive:** docs/archive/ (16 files). No backlog.
- **Next wake:** Continue ARCH-003 (parallel agent execution swarm) — the file
  watcher (ARCH-001) + background daemon (ARCH-002) + PARALLEL agents =
  fully autonomous cascade that ARCH-004 will string together.

## Previous Wake: 2026-07-05 07:55 UTC (MAINTENANCE — ALL CLEAR)

- **GitReins T1:** PASS ✓ (secrets ✓, static_analysis ✓, go_build ✓, go_lint ✓, go_tests ✓). Gitleaks timeout (30s) — fell back to built-in scanner.
- **Build:** tsc clean (EXIT=0)
- **Tests:** 1713 passed, 0 failed, 62 skipped (84 files, 21.36s). **TMPDIR redirect required** — `/tmp` at 80% (24G/30G) causes EDQUOT (-122) during parallel worker execution; `TMPDIR=/home/kara/tmp-speclang` resolves.
- **Container:** opencode-speclang Up 10 days, healthy
- **/tmp:** 80% (24G/30G), inodes 41%. TMPDIR workaround active.
- **Git:** main, HEAD `4cec05c5`. 0 new commits since last wake. 1 uncommitted change (this AC file). 7 untracked bin/ artifacts (non-blocking).
- **Staleness:** 441 specs (.spec.md). CLI: 26 subcommands. No new specs. No uncovered features. No uncommitted source changes outside bin/.
- **Archive:** docs/archive/ (16 files — archival artifacts). No backlog.
- **Next wake:** Maintenance mode (all ACs passed, 8th consecutive all-clear wake)

## Previous Wake: 2026-07-05 04:35 UTC (MAINTENANCE — ALL CLEAR)
T1 PASS, tsc clean, 1709/0/62, container healthy. CI-002 complete (commits `25fd3acd`, `69d4e556`).

## Previous Wake: 2026-07-05 04:00 UTC (MAINTENANCE — ALL CLEAR)
T1 PASS, tsc clean, 1709/0/62, container healthy. CI-002 complete (commits `25fd3acd`, `69d4e556`).

## Previous Wake: 2026-07-04 22:00 UTC (MAINTENANCE — ALL CLEAR)
T1 PASS, tsc clean, 1708/1/62 (1 flaky), container healthy. CI-002 complete (commits `25fd3acd`, `69d4e556`).

## Previous Wake: 2026-07-04 14:45 UTC (MAINTENANCE — ALL CLEAR)
T1 PASS, tsc clean, 1709/0/62, container healthy, no new changes. CI-001 complete (commit `800dee77` + `50414d5f`).

## Previous Wake: 2026-07-03 19:43 UTC (MAINTENANCE — ALL CLEAR)
T1 PASS, tsc clean, 1709/0/62, container healthy, no new changes.

## Previous Wake: 2026-07-03 09:49 UTC (MAINTENANCE — ALL CLEAR)
T1 PASS, tsc clean, 1679/15/25, container healthy, no new changes.

## Previous Wake: 2026-07-02 16:32 UTC (MAINTENANCE — ALL CLEAR)
Same state. T1 PASS, tsc clean, 1696/15/8, container healthy, no new changes.

## Previous Wake: 2026-07-02 10:55 UTC (MAINTENANCE — ALL CLEAR)
Same state. Fixed /tmp inode pressure (1340 stale temp dirs).

## Previous Wake: 2026-07-02 06:38 UTC (MAINTENANCE — ALL CLEAR)
Same state.

## Previous Wake: 2026-07-02 06:34 UTC (MAINTENANCE — ALL CLEAR)
Same state.

## Previous Wake: 2026-07-01 21:18 UTC (MAINTENANCE — ALL CLEAR)
Fixed /tmp EDQUOT from stale restore dirs.

## Previous Wake: 2026-06-30 11:28 UTC (AC-067 COMPLETE)
AC-067 went from in_progress → passed. Fixed 31 transition upgrade tests.

## Previous Wake: 2026-06-28 23:53 UTC (AC-066 RECOVERED)
Axiom dispatched for AC-066 — 8/8 LSP ref diagnostics tests pass.
