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
### BL-002: Dual-view docs compliance 🔄 in_progress (Top-level docs: 15/15 symlinked ✅ | Remaining: archive/ + prompts/ directories)
### BL-003: stdlib tests ✅ (Verified 2026-06-20)

## Recent Wake: 2026-06-21 06:34
- **Guard status:** Tier 1 PASS (secrets ✓, build ✓, lint ✓, tests ✓)
- **Test results:** 2447 passed, 0 failed, 18 skipped (all 6 pre-existing failures resolved!)
- **BL-002 progress:** Converted 3 remaining top-level docs/ files (DOGFOODING.md, MULTI_TIER_CASCADE.md, layers.md) to symlinks → 15/15 docs/ top-level files now dual-view compliant
- **Commit:** 7269a9e pushed to master

## Acceptance Criteria Status

| Criterion | Status | Pass Rate | Notes |
|-----------|--------|-----------|-------|
| AC-001–AC-011 | ✅ Passed | All verified | Swarm, cascade, skills, infrastructure |
| AC-012 | ✅ Passed | 37/37 tests | Agent communication (pub_sub, request_response, broadcast) |
| AC-013 | ✅ Passed | 31/31 tests | Transition upgrade workflow |
| AC-014 | ✅ Passed | 552/558 valid (98.9%) | Spec header remediation complete. 6 backup files excluded. |
| AC-015 | ✅ Passed | 72/72 LSP tests | LSP server tests |
| BL-001 | ✅ Passed | 157/157 dashboard tests | Dashboard monitoring |
| BL-002 | 🔄 In Progress | 15/15 top-level docs | Dual-view docs: top-level complete; archive/, prompts/ remain |
| BL-003 | ✅ Passed | 384/384 stdlib tests | Standard library tests |

## GitReins Baseline
- ✅ Tier 1 Guards: PASS (secrets ✓, build ✓, lint ✓, tests ✓)
- 2447 tests passed, 0 failed, 18 skipped
- Build: PASS (tsc clean)
