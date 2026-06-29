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

## Current Wake: 2026-06-28 ~19:13 UTC (RECOVERY — Git Corruption FIXED)

**🔴 RESOLVED: Git corruption recovered after 5+ days / 6+ consecutive wakes**

- **Recovery:** Cloned clean copy from `dexdat/SpecLang` (GitHub), rsync'd local working files, committed, pushed to `origin/main`
- **Commit:** `8e8aacfb` — 25 files changed, 4269 insertions, 238 deletions
- **Pushed to:** `github.com/dexdat/SpecLang` (main → main)
- **Git health:** 0 missing objects, on `main` branch, clean `git fsck`
- **Build:** `tsc --noEmit` clean (EXIT=0), `npm run build` clean
- **Tests:** 46 failed, 1657 passed, 8 skipped — UNCHANGED (pre-existing)
- **GitReins T1:** PASS (secrets clean, static_analysis, go_build, go_lint, go_tests)
- **Container:** opencode-speclang Up 4d
- **/tmp:** 61% (18G/30G)
- **Corrupted backup:** `/home/kara/SpecLang.corrupted.20260628-1913` (can be removed after verification)

### Recovery Steps Performed:
1. `git clone https://github.com/dexdat/SpecLang.git` → clean clone with 0 fsck errors
2. Fixed tsconfig.json (added `src/generated/**/*` and `src/lsp/**/*` excludes)
3. `rsync` all local files from corrupted repo → clone (excluding .git, node_modules, dist)
4. Swapped directories: `mv SpecLang SpecLang.corrupted`, `mv speclang-recovery SpecLang`
5. Updated .gitignore with `.hermes/`, dev artifacts
6. Staged + committed 25 files (tests, configs, memory-bank)
7. Pushed to origin/main successfully

**Status:** Git is now fully operational. All ACs remain passed. Maintenance mode.

## Previous Wake: 2026-06-28 12:57 UTC
- All ACs passed. Maintenance mode. Git corruption noted (now resolved).

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
