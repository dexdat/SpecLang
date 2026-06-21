# Acceptance Criteria for SpecLang

## Active Criteria

### AC-012: Agent Communication ✅
**Status:** passed ✅ | **Verified:** 2026-06-19

### AC-013: Transition Upgrade Workflow ✅
**Status:** passed ✅ | **Verified:** 2026-06-19

### AC-014: Spec Header Remediation ✅
**Status:** passed ✅ | **Verified:** 2026-06-21
**Evidence:** 552/558 valid (98.9%), 4/4 header tests pass. 6 remaining invalid files are all excluded backup/modified files (assemble-all.modified, assembler.spec.modified, self-host-harness.modified, lsp_backup, swarm_backup, swarm_old). All real spec files now have valid headers.
**Commits:** 2646b80 (522/558), 2026-06-21 header sweep (552/558 + test fix)

### AC-015: LSP Server ✅
**Status:** passed ✅ | **Verified:** 2026-06-21
**Evidence:** 72 LSP tests across 5 test files pass. Full regression: 2441/2465 passed (6 pre-existing failures in pipeline/tools tests, unrelated).

### AC-001 through AC-011 (all passed) ✅
All previously verified.

### BL-001: Dashboard monitoring ✅ (Verified 2026-06-20)
### BL-002: Dual-view docs compliance 🔄 backlog
### BL-003: stdlib tests ✅ (Verified 2026-06-20)

## Acceptance Criteria Status

| Criterion | Status | Pass Rate | Notes |
|-----------|--------|-----------|-------|
| AC-001–AC-011 | ✅ Passed | All verified | Swarm, cascade, skills, infrastructure |
| AC-012 | ✅ Passed | 37/37 tests | Agent communication (pub_sub, request_response, broadcast) |
| AC-013 | ✅ Passed | 31/31 tests | Transition upgrade workflow |
| AC-014 | ✅ Passed | 552/558 valid (98.9%) | Spec header remediation complete. 6 backup files excluded. |
| AC-015 | ✅ Passed | 72/72 LSP tests | LSP server tests |
| BL-001 | ✅ Passed | 157/157 dashboard tests | Dashboard monitoring |
| BL-003 | ✅ Passed | 384/384 stdlib tests | Standard library tests |
| BL-002 | 🔄 Backlog | — | Dual-view docs compliance |

## Pre-existing Test Failures (non-blocking, unrelated to header fixes)
- `tests/pipeline.test.ts`: 5 failures (stage dependency validation, dry-run mode, stage failure)
- `tests/tools.test.ts`: 1 failure (input schema validation)

## GitReins Baseline
- ✅ Tier 1 Guards: PASS (secrets ✓, build ✓, lint ✓, tests ✓)
- 2441 tests passed, 6 failed (pre-existing), 18 skipped
- Build: PASS (tsc clean)
