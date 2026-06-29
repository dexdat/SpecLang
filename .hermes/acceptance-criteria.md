# Acceptance Criteria for SpecLang

## Active Criteria

### AC-001 through AC-024 (all passed) ✅
All previously verified. Swarm, cascade, skills, infrastructure, agent communication, spec headers, LSP, Python codegen, maturity CLI, cascade-trace, tsc clean, TotalStack cascade, history CLI, search CLI.

### AC-025: Expand/Downgrade CLI Tests ✅
**Status:** passed ✅ | **Verified:** 2026-06-25 | **Delegated:** WI-025 to Axiom (proc_acfbbe9dfc41)

**Description:** The `expand` and `downgrade` CLI commands had implementations but zero dedicated test coverage. Two bugs were fixed:
1. **Downgrade path bug (FIXED):** `speclang downgrade specs/core.spec.md --to MVP` no longer double-prefixes the path.
2. **Expand block matching bug (FIXED):** Block matching now handles spec-prefixed names (e.g., `core/overview`) and searches inside code fences.

**How to verify:**
1. `npx vitest run tests/cli/expand.test.ts` — 8/8 pass ✅
2. `npx vitest run tests/cli/downgrade.test.ts` — 9/9 pass ✅
3. `./bin/speclang downgrade specs/core.spec.md --to MVP --plan` — shows plan ✅
4. `./bin/speclang expand "core.spec.md#overview"` — finds 18 blocks ✅

**Evidence:** Tests committed by Axiom in 7c5c1fa. 17/17 tests pass across both test files.

### BL-001 through BL-003 (all passed) ✅

## Acceptance Criteria Status

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-001–AC-024 | ✅ Passed | All verified |
| AC-025 | ✅ Passed | Expand/downgrade CLI tests (17 tests) + 2 bug fixes |
| BL-001 | ✅ Passed | Dashboard monitoring (157 tests) |
| BL-002 | ✅ Passed | Dual-view docs complete (15/15) |
| BL-003 | ✅ Passed | Standard library tests (384 tests) |

## Current Wake: 2026-06-28 ~12:57 UTC (Maintenance Mode — Wake #6 since corruption)

- **Health gate:** Container Up 4d, /tmp 61% (18G/30G), ACLs READ_OK, port 3000+8080 listening
- **Build (tsc --noEmit):** CLEAN (EXIT=0) ✅
- **Tests:** 46 failed, 1657 passed, 8 skipped — UNCHANGED (pre-existing failures)
  - `transition/upgrade.test.ts` — 31/31: `registerUpgradeWorkflows is not a function` (test-implementation mismatch)
  - `cascade/assembled-output.test.ts` — 2: ENOENT on `.speclang/cascade-router.spec.ts`
  - `cascade/dependency-graph.test.ts` — 1: `@speclang/header` ID resolution
  - `cascade_new/dependency-graph.test.ts` — 1: same ID issue
  - 10 empty test files (0 tests)
- **GitReins T1:** PASS (pre-commit hook EXIT=0 — secrets, static_analysis, go_build, go_lint, go_tests all green)
- **Staleness:** 440 spec files, 76 test files — zero files modified in last 3 days. No new features or specs.
- **🔴 GIT CORRUPTION (CRITICAL — UNCHANGED since 2026-06-25):** 40 fsck errors, detached HEAD at d9a505b, ALL files show as untracked. Git cannot track changes, commits, or pushes. **Remote clone needed for recovery.** Recovery command:
  ```bash
  cd /tmp && git clone git@github.com:totalwindupflightsystems/SpecLang.git speclang-recovery
  cp -r /home/kara/SpecLang/.hermes /tmp/speclang-recovery/
  cp -r /home/kara/SpecLang/.gitreins /tmp/speclang-recovery/
  # Verify, then: rm -rf /home/kara/SpecLang && mv /tmp/speclang-recovery /home/kara/SpecLang
  ```

## Previous Wake: 2026-06-28 09:55 UTC
- All ACs passed. Maintenance mode. Git corruption noted.

## Previous Wake: 2026-06-27 18:43 UTC
- All ACs passed. Maintenance mode. Git corruption noted.

## Previous Wake: 2026-06-27 17:22 UTC
- All ACs passed. Maintenance mode. Git corruption noted.

## Previous Wake: 2026-06-27 10:06 UTC
- All ACs passed. Maintenance mode. Git corruption noted.

## Previous Wake: 2026-06-26 04:51 UTC
- All ACs passed. Maintenance mode. Git corruption noted.
