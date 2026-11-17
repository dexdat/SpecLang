# Verdict: DF-SPECLANG-018

**Task:** Widen mcp.test.ts 5s vitest timeout under fleet load
**Evaluated:** 2026-11-17T06:03:05.056895
**Result:** ✗ FAIL

## Criteria

- ✗ **tests/mcp.test.ts per-test 5000ms timeout raised to >=15000ms (and any sibling 5s test timeouts in that file); npx vitest run tests/mcp.test.ts exits 0**
  - No timeout change exists. `grep -nE "5000|5_000|timeout|15000|15_000" tests/mcp.test.ts` returns exactly one hit — tests/mcp.test.ts:66 `expect(DEFAULT_MCP_CONFIG.limits?.queryTimeoutMs).toBe(5000);` — which is a config-value assertion, not a test timeout. There are no per-test timeout arguments anywhere in the 407-line file (`grep -nE "it\(|test\(" tests/mcp.test.ts | grep -E "[0-9]{4,}"` → no matches), so there is no 5000ms per-test timeout to raise and no sibling 5s timeouts either. `git log --oneline -- tests/mcp.test.ts` shows the last change was 0ed92385 (DF-SPECLANG-4-R4); the HEAD commit 1354cc85 touches only .coding-hermes/board/{events,tasks}.jsonl. The board record for DF-SPECLANG-018 is still `"status":"in_progress"` with acceptance criteria demanding an explicit generous testTimeout at tests/mcp.test.ts:184 — nothing was implemented. The run half does hold: `npx vitest run tests/mcp.test.ts` → EXIT_CODE=0, "Test Files 1 passed (1) / Tests 33 passed (33)", but it passes only because of the pre-existing global vitest.config.ts:27 `testTimeout: 30_000` (added under QA-SPECLANG-4), not because of any work in this task.

## Pipeline Stages

- ✓ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ✓ tests: Start at  01:02:07
- ✗ **tier2**
  - INCOMPLETE
  ✗ tests/mcp.test.ts per-test 5000ms timeout raised to >=15000ms (and any sibling 5s test timeouts in that file); npx vitest run tests/mcp.test.ts exits 0: No timeout change exists. `grep -nE "5000|5_000|timeout|15000|15_000" tests/mcp.test.ts` returns exactly one hit — tests/mcp.test.ts:66 `expect(DEFAULT_MCP_CONFIG.limits?.queryTimeoutMs).toBe(5000);` — which is a config-value assertion, not a test timeout. There are no per-test timeout arguments anywhere in the 407-line file (`grep -nE "it\(|test\(" tests/mcp.test.ts | grep -E "[0-9]{4,}"` → no matches), so there is no 5000ms per-test timeout to raise and no sibling 5s timeouts either. `git log --oneline -- tests/mcp.test.ts` shows the last change was 0ed92385 (DF-SPECLANG-4-R4); the HEAD commit 1354cc85 touches only .coding-hermes/board/{events,tasks}.jsonl. The board record for DF-SPECLANG-018 is still `"status":"in_progress"` with acceptance criteria demanding an explicit generous testTimeout at tests/mcp.test.ts:184 — nothing was implemented. The run half does hold: `npx vitest run tests/mcp.test.ts` → EXIT_CODE=0, "Test Files 1 passed (1) / Tests 33 passed (33)", but it passes only because of the pre-existing global vitest.config.ts:27 `testTimeout: 30_000` (added under QA-SPECLANG-4), not because of any work in this task.
  ✗ Coverage FAILED — not passing: tests/mcp.test.ts per-test 5000ms timeout raised to >=15000ms (and any sibling 5s test timeouts in that file); npx vitest run tests/mcp.test.ts exits 0
The required timeout widening was never made — tests/mcp.test.ts contains no per-test timeout at all (the only "5000" is a config assertion at line 66) and no commit for DF-SPECLANG-018 touched the file; the file passes (exit 0, 33/33) solely on the pre-existing global 30s testTimeout in vitest.config.ts:27. [uncovered failure paths: failure mode 0 (Task is marked complete with zero code change; the load-sensitive flake at tests/mcp.test.ts:184 is only masked by the global 30s testTimeout, so any future tightening of vitest.config.ts testTimeout re-exposes it): detected_by is empty — uncovered failure path]

## Summary

Stage tier1: PASS
    ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ✓ tests: Start at  01:02:07

Stage tier2: FAIL
  INCOMPLETE
  ✗ tests/mcp.test.ts per-test 5000ms timeout raised to >=15000ms (and any sibling 5s test timeouts in that file); npx vitest run tests/mcp.test.ts exits 0: No timeout change exists. `grep -nE "5000|5_000|timeout|15000|15_000" tests/mcp.test.ts` returns exactly one hit — tests/mcp.test.ts:66 `expect(DEFAULT_MCP_CONFIG.limits?.queryTimeoutMs).toBe(5000);` — which is a config-value assertion, not a test timeout. There are no per-test timeout arguments anywhere in the 407-line file (`grep -nE "it\(|test\(" tests/mcp.test.ts | grep -E "[0-9]{4,}"` → no matches), so there is no 5000ms per-test timeout to raise and no sibling 5s timeouts either. `git log --oneline -- tests/mcp.test.ts` shows the last change was 0ed92385 (DF-SPECLANG-4-R4); the HEAD commit 1354cc85 touches only .coding-hermes/board/{events,tasks}.jsonl. The board record for DF-SPECLANG-018 is still `"status":"in_progress"` with acceptance criteria demanding an explicit generous testTimeout at tests/mcp.test.ts:184 — nothing was implemented. The run half does hold: `npx vitest run tests/mcp.test.ts` → EXIT_CODE=0, "Test Files 1 passed (1) / Tests 33 passed (33)", but it passes only because of the pre-existing global vitest.config.ts:27 `testTimeout: 30_000` (added under QA-SPECLANG-4), not because of any work in this task.
  ✗ Coverage FAILED — not passing: tests/mcp.test.ts per-test 5000ms timeout raised to >=15000ms (and any sibling 5s test timeouts in that file); npx vitest run tests/mcp.test.ts exits 0
The required timeout widening was never made — tests/mcp.test.ts contains no per-test timeout at all (the only "5000" is a config assertion at line 66) and no commit for DF-SPECLANG-018 touched the file; the file passes (exit 0, 33/33) solely on the pre-existing global 30s testTimeout in vitest.config.ts:27. [uncovered failure paths: failure mode 0 (Task is marked complete with zero code change; the load-sensitive flake at tests/mcp.test.ts:184 is only masked by the global 30s testTimeout, so any future tightening of vitest.config.ts testTimeout re-exposes it): detected_by is empty — uncovered failure path]

Overall: FAIL ✗
