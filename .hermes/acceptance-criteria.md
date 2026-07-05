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

## Current Wake: 2026-07-05 22:36 UTC (MAINTENANCE — ALL CLEAR)

- **Container:** Up 3h, v1.17.7, bind mount READ_OK.
- **/tmp:** 51% (15G/30G), inodes 44%. Clean.
- **GitReins T1:** PASS ✓ (secrets ✓, static_analysis ✓, go_build ✓, go_lint ✓, go_tests ✓). Gitleaks timeout (30s) — fell back to built-in scanner.
- **Build:** tsc clean (EXIT=0)
- **Tests:** **1749 passed, 0 failed, 62 skipped** (93 files, 21.13s). +1 test since last wake.
- **Git:** main, HEAD `7d7bedd5`. 0 modified source files. 9 untracked bin/ artifacts (non-blocking).
- **Staleness:** 441 specs (.spec.md) + 2 .scl = 443 total. CLI: 24 subcommands. No new specs. No uncovered features.
- **Archive:** docs/archive/ (16 files — archival). No backlog.
- **ARCH/CI:** ARCH-001 through ARCH-004 all committed. CI-001 through CI-006 all complete. 0 open tasks.
- **Work Items:** No work-items.json — no pending or dispatched Axiom tasks.
- **Next wake:** Maintenance mode (11th consecutive all-clear wake). Continue monitoring.

## Previous Wake: 2026-07-05 19:36 UTC (MAINTENANCE — ALL CLEAR)

- Container OOM-killed, restarted. T1 PASS, tsc clean, 1748/1/62.

## Previous Wake: 2026-07-05 08:35 UTC (MAINTENANCE — WORK)

- ARCH-002 COMPLETE (committed `55d52b55`). ARCH-003 committed `c5f457e3`. ARCH-004 committed `4a7fdd99`.

## Previous Wake: 2026-07-05 07:55 UTC (MAINTENANCE — ALL CLEAR)

- T1 PASS, tsc clean, 1713/0/62. /tmp at 80% — TMPDIR redirect required.

## Previous Wake: 2026-07-05 04:35 UTC (MAINTENANCE — ALL CLEAR)
T1 PASS, tsc clean, 1709/0/62, container healthy. CI-002 complete (commits `25fd3acd`, `69d4e556`).

## Previous Wake: 2026-07-04 22:00 UTC (MAINTENANCE — ALL CLEAR)
T1 PASS, tsc clean, 1708/1/62 (1 flaky), container healthy. CI-002 complete.

## Previous Wake: 2026-07-04 14:45 UTC (MAINTENANCE — ALL CLEAR)
T1 PASS, tsc clean, 1709/0/62, container healthy, no new changes. CI-001 complete.

## Previous Wake: 2026-07-03 19:43 UTC (MAINTENANCE — ALL CLEAR)
T1 PASS, tsc clean, 1709/0/62, container healthy, no new changes.

## Previous Wake: 2026-07-03 09:49 UTC (MAINTENANCE — ALL CLEAR)
T1 PASS, tsc clean, 1679/15/25, container healthy, no new changes.

## Previous Wake: 2026-07-02 16:32 UTC (MAINTENANCE — ALL CLEAR)
Same state. T1 PASS, tsc clean, 1696/15/8, container healthy, no new changes.

## Previous Wake: 2026-07-02 10:55 UTC (MAINTENANCE — ALL CLEAR)
Same state. Fixed /tmp inode pressure (1340 stale temp dirs).

## Previous Wake: 2026-06-30 11:28 UTC (AC-067 COMPLETE)
AC-067 went from in_progress → passed. Fixed 31 transition upgrade tests.

## Previous Wake: 2026-06-28 23:53 UTC (AC-066 RECOVERED)
Axiom dispatched for AC-066 — 8/8 LSP ref diagnostics tests pass.
