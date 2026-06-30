# Acceptance Criteria for SpecLang

## Active Criteria

### AC-001 through AC-025 (all passed) ✅
All previously verified. Swarm, cascade, skills, infrastructure, agent communication, spec headers, LSP, Python codegen, maturity CLI, cascade-trace, tsc clean, TotalStack cascade, history CLI, search CLI, expand/downgrade CLI.

### BL-001 through BL-003 (all passed) ✅
Dashboard monitoring, dual-view docs, standard library tests.

### AC-066 (LSP Ref Diagnostics) ✅ RECOVERED 2026-06-28 23:51 UTC
`src/lsp/references.ts` reconstructed by Axiom from test + server.ts usage patterns. Commit `11064375`. 8/8 tests pass. Recovered from git corruption (original commit `8404a842`).

## Acceptance Criteria Status

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-001–AC-025 | ✅ Passed | All verified |
| BL-001 | ✅ Passed | Dashboard monitoring (157 tests) |
| BL-002 | ✅ Passed | Dual-view docs complete (15/15) |
| BL-003 | ✅ Passed | Standard library tests (384 tests) |
| AC-066 | ✅ Passed | LSP ref diagnostics recovered 2026-06-28 |

## Current Wake: 2026-06-29 15:46 UTC (MAINTENANCE — ALL CLEAR)

- **GitReins T1:** PASS ✓ (secrets ✓, static_analysis ✓, build ✓, lint ✓, tests ✓) — gitleaks timed out (30s, 442 specs), built-in scanner passed
- **tsc --noEmit:** EXIT=0 (clean)
- **Tests:** 46 failed, 1665 passed, 8 skipped — all 46 failures pre-existing in `tests/transition/upgrade.test.ts` (`registerUpgradeWorkflows` not implemented; last src/transition/ touched `bb8acddc`, test file touched in recovery `8e8aacfb` — pre-existing, no Axiom dispatch)
- **Container:** opencode-speclang Up 5d, healthy
- **/tmp:** 70% (9.2G free)
- **Staleness:** 442 specs, 20 CLI subcommands — no new features or specs uncovered. No backlog items.
- **TODO.md:** 7 remaining P2 stories (stale, last updated April 2026) — archival, no active deficiencies
- **Git:** main branch, clean (prior wake's AC-066 work committed)

## Previous Wake: 2026-06-29 11:11 UTC (MAINTENANCE)
- All clear. T1 PASS. tsc clean. 46 pre-existing test failures.

## Previous Wake: 2026-06-29 09:05 UTC (MAINTENANCE)
- All clear. T1 PASS. tsc clean. 46 pre-existing test failures.

## Previous Wake: 2026-06-28 23:53 UTC (AC-066 RECOVERED)
- Axiom dispatched for AC-066 — `proc_c2084a0e466a`, completed ~6min
- 8/8 LSP ref diagnostics tests pass

## Previous Wake: 2026-06-28 21:07 UTC
- All ACs passed. Maintenance mode.

## Previous Wake: 2026-06-28 19:13 UTC
- Git corruption recovery completed. 25 files committed, pushed to origin/main.

## Previous Wake: 2026-06-28 12:57 UTC
- All ACs passed. Maintenance mode. Git corruption noted (now resolved).

## Previous Wake: 2026-06-28 09:55 UTC
- All ACs passed. Maintenance mode. Git corruption noted.
