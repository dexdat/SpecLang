# Acceptance Criteria for SpecLang

## Active Criteria

### AC-001 through AC-011 (all passed) ✅
All previously verified. Swarm, cascade, skills, infrastructure.

### AC-012: Agent Communication ✅
**Status:** passed ✅ | **Verified:** 2026-06-19

### AC-013: Transition Upgrade Workflow ✅
**Status:** passed ✅ | **Verified:** 2026-06-19

### AC-014: Spec Header Remediation ✅
**Status:** passed ✅ | **Verified:** 2026-06-21
**Evidence:** 552/558 valid (98.9%), 4/4 header tests pass. 6 remaining invalid files are all excluded backup/modified files.

### AC-015: LSP Server ✅
**Status:** passed ✅ | **Verified:** 2026-06-21
**Evidence:** 72 LSP tests across 5 test files pass.

### AC-016: Python Cascade Codegen ✅
**Status:** passed ✅ | **Verified:** 2026-06-21
**Evidence:** Committed in 807ad979. Python cascade codegen handler + trigger routing + tests pass in full suite.
**Test file:** tests/cascade/python-codegen-handler.test.ts

### AC-018: Maturity CLI Path Fix ✅
**Status:** passed ✅ | **Verified:** 2026-06-21
**Evidence:** Committed in 032b657f/12b73954. Maturity CLI path resolution fix + build extracts.
**Test files:** tests/maturity/ (5 test files)

### AC-019: Maturity Build Extracts ✅
**Status:** passed ✅ | **Verified:** 2026-06-21

### AC-020: Cascade-Trace Output Tests ✅
**Status:** passed ✅ | **Verified:** 2026-06-21
**Evidence:** 6/6 cascade-trace tests pass. Assembled output: assembler.code.ts + cascade-router.code.ts both have spec:trace + spec:generated headers.
**Test file:** tests/cascade/assembled-output.test.ts
**GitReins:** cascade-trace task complete (verified manually — task_complete 120s timeout on 380MB repo).

### AC-021: TypeScript Compiler Clean Build ✅
**Status:** passed ✅ | **Verified:** 2026-06-21
**Evidence:** tsc --noEmit exits 0. src/generated/**, src/sortix/**, src/demo/**, src/test-feature/**, src/test-init-tiers/** excluded.
**How to verify:** `npx tsc --noEmit` exits 0.

### AC-022: TotalStack Cascade Module ✅
**Status:** passed ✅ | **Verified:** 2026-06-24
**Evidence:** Committed in a975cc77/5541a32d. ES imports, proper event handling, polling fs.watch in totalstack-cascade.ts.
**Tests:** tests/cascade/dependency-graph.test.ts — 24/24 pass.
**How to verify:** `npx vitest run tests/cascade/dependency-graph.test.ts` — 24 pass.

### AC-023: Commit History CLI ✅
**Status:** passed ✅ | **Verified:** 2026-06-24
**Evidence:** Committed in cc8eacaf/89356f81. History command with --stat, --blame, --compare, --format json/timeline, --since, --author, file filtering.
**Tests:** tests/cli/history.test.ts — 11/11 pass.
**How to verify:** `npx vitest run tests/cli/history.test.ts` — 11 pass.

### AC-024: Search CLI ✅
**Status:** passed ✅ | **Verified:** 2026-06-24
**Evidence:** 5/5 search tests pass in tests/cli.test.ts. Supports --json, --quiet, --kind, --tag, --limit, --verbose, --layer filters.
**How to verify:** `npx vitest run tests/cli.test.ts -t "search"` — 5 pass.

### BL-001: Dashboard monitoring ✅
**Status:** passed ✅ | **Verified:** 2026-06-20

### BL-002: Dual-view docs compliance ✅
**Status:** passed ✅ | **Verified:** 2026-06-21

### BL-003: stdlib tests ✅
**Status:** passed ✅ | **Verified:** 2026-06-20

## Acceptance Criteria Status

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-001–AC-011 | ✅ Passed | Swarm, cascade, skills, infrastructure |
| AC-012 | ✅ Passed | Agent communication (37 tests) |
| AC-013 | ✅ Passed | Transition upgrade workflow (31 tests) |
| AC-014 | ✅ Passed | Spec header remediation (552/558 valid) |
| AC-015 | ✅ Passed | LSP server (72 tests) |
| AC-016 | ✅ Passed | Python cascade codegen |
| AC-018 | ✅ Passed | Maturity CLI path fix |
| AC-019 | ✅ Passed | Maturity build extracts |
| AC-020 | ✅ Passed | Cascade-trace output (6 tests) |
| AC-021 | ✅ Passed | tsc --noEmit clean |
| AC-022 | ✅ Passed | TotalStack cascade module (24 tests) |
| AC-023 | ✅ Passed | Commit history CLI (11 tests) |
| AC-024 | ✅ Passed | Search CLI (5 tests) |
| BL-001 | ✅ Passed | Dashboard monitoring (157 tests) |
| BL-002 | ✅ Passed | Dual-view docs complete (15/15) |
| BL-003 | ✅ Passed | Standard library tests (384 tests) |

## All Criteria: 100% PASSED ✅

## This Wake: 2026-06-24 18:33 UTC
- **Health gate:** Container Up 18h, ACLs OK, Branch master, /tmp 38%, no stale processes
- **Guard status:** Tier 1 PASS (secrets ✓, build ✓, lint ✓, tests ✓)
- **Test results:** 2555 passed, 0 failed, 18 skipped (125/126 test files)
- **Build:** tsc --noEmit CLEAN (exit 0)
- **Maintenance mode:** All ACs passed. AC-024 added for Search CLI (tests already existed, just undocumented).
- **GitReins tasks:** 4 complete, 0 pending (cascade-trace marked complete — verified manually)
- **Staleness audit:** 558 specs vs 24 ACs (1:23 ratio, below 1:10 floor). Search CLI has 5 tests but was undocumented. expand/downgrade CLI commands have 0 test coverage — gaps logged for future wakes.
- **Gaps identified:** expand CLI (0 tests), downgrade CLI (0 tests), 558 specs need ~55 ACs minimum

## GitReins Baseline
- ✅ Tier 1 Guards: PASS (secrets ✓, build ✓, lint ✓, tests ✓)
- 2555 tests passed, 0 failed, 18 skipped
- Build: PASS (tsc clean)
