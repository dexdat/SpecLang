# Verdict: GAP-004

**Task:** ralph-loop has no exit path: add signal + parent-liveness + idle exit so orphaned loops stop polling
**Evaluated:** 2026-11-17T16:37:13.001750
**Result:** ✓ PASS

## Criteria

- ✓ **src/ralph-loop.ts handles SIGTERM/SIGINT and exits when its launcher is gone or after a bounded idle period; a test proves the loop stops; npx vitest run green; npx tsc --noEmit clean**
  - PASS: src/ralph-loop.ts (symlink -> specs/implementation.spec.dir/src/ralph-loop.ts) installs SIGTERM/SIGINT/SIGHUP handlers in installSignalHandlers() (RALPH_LOOP_STOP_SIGNALS = ['SIGTERM','SIGINT','SIGHUP']), removes them in endRun(); launcher loss via isLauncherGone() checked in exitDueOnIdlePoll() and after each processTask(); bounded idle via maxIdlePolls (default 360 = 30min at 5s poll). CLI main() awaits controller.start() and sets exitCode 0.
Tests: `npx vitest run tests/ralph-loop/lifecycle.test.ts` -> "Tests 10 passed (10)", incl. "the CLI entry exits 0 on a real SIGTERM instead of being SIGKILLed" (real spawned tsx child, SIGTERM, exitCode 0, stderr contains "Ralph Loop stopped (reason=signal:SIGTERM)").
Full suite: `npx vitest run` -> "Test Files 117 passed | 4 skipped (121)", "Tests 1972 passed | 58 skipped (2030)", 0 failures. (First full run had 2 transient failures in tests/db.test.ts "SqliteError: disk I/O error" on shared .speclang/test.db; that file passes 35/35 in isolation and the full suite is green on re-run -> parallelism artifact, not this change.)
`npx tsc --noEmit` -> TSC_EXIT=0. · graded at iteration 78.9 (364,574 in / 2,221 out, 78.9 iterations and 406s into the run)

## Pipeline Stages

- ✓ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ✓ tests: Start at  11:28:28
- ✓ **tier2**
  - COMPLETE
  ✓ src/ralph-loop.ts handles SIGTERM/SIGINT and exits when its launcher is gone or after a bounded idle period; a test proves the loop stops; npx vitest run green; npx tsc --noEmit clean: PASS: src/ralph-loop.ts (symlink -> specs/implementation.spec.dir/src/ralph-loop.ts) installs SIGTERM/SIGINT/SIGHUP handlers in installSignalHandlers() (RALPH_LOOP_STOP_SIGNALS = ['SIGTERM','SIGINT','SIGHUP']), removes them in endRun(); launcher loss via isLauncherGone() checked in exitDueOnIdlePoll() and after each processTask(); bounded idle via maxIdlePolls (default 360 = 30min at 5s poll). CLI main() awaits controller.start() and sets exitCode 0.
Tests: `npx vitest run tests/ralph-loop/lifecycle.test.ts` -> "Tests 10 passed (10)", incl. "the CLI entry exits 0 on a real SIGTERM instead of being SIGKILLed" (real spawned tsx child, SIGTERM, exitCode 0, stderr contains "Ralph Loop stopped (reason=signal:SIGTERM)").
Full suite: `npx vitest run` -> "Test Files 117 passed | 4 skipped (121)", "Tests 1972 passed | 58 skipped (2030)", 0 failures. (First full run had 2 transient failures in tests/db.test.ts "SqliteError: disk I/O error" on shared .speclang/test.db; that file passes 35/35 in isolation and the full suite is green on re-run -> parallelism artifact, not this change.)
`npx tsc --noEmit` -> TSC_EXIT=0. · graded at iteration 78.9 (364,574 in / 2,221 out, 78.9 iterations and 406s into the run)
Cap exceeded: Iteration cap (100) reached (100.1 used). Increase max_iterations or split criteria. Partial verdict — all 1 criteria graded and passed.

## Summary

Stage tier1: PASS
    ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ✓ tests: Start at  11:28:28

Stage tier2: PASS
  COMPLETE
  ✓ src/ralph-loop.ts handles SIGTERM/SIGINT and exits when its launcher is gone or after a bounded idle period; a test proves the loop stops; npx vitest run green; npx tsc --noEmit clean: PASS: src/ralph-loop.ts (symlink -> specs/implementation.spec.dir/src/ralph-loop.ts) installs SIGTERM/SIGINT/SIGHUP handlers in installSignalHandlers() (RALPH_LOOP_STOP_SIGNALS = ['SIGTERM','SIGINT','SIGHUP']), removes them in endRun(); launcher loss via isLauncherGone() checked in exitDueOnIdlePoll() and after each processTask(); bounded idle via maxIdlePolls (default 360 = 30min at 5s poll). CLI main() awaits controller.start() and sets exitCode 0.
Tests: `npx vitest run tests/ralph-loop/lifecycle.test.ts` -> "Tests 10 passed (10)", incl. "the CLI entry exits 0 on a real SIGTERM instead of being SIGKILLed" (real spawned tsx child, SIGTERM, exitCode 0, stderr contains "Ralph Loop stopped (reason=signal:SIGTERM)").
Full suite: `npx vitest run` -> "Test Files 117 passed | 4 skipped (121)", "Tests 1972 passed | 58 skipped (2030)", 0 failures. (First full run had 2 transient failures in tests/db.test.ts "SqliteError: disk I/O error" on shared .speclang/test.db; that file passes 35/35 in isolation and the full suite is green on re-run -> parallelism artifact, not this change.)
`npx tsc --noEmit` -> TSC_EXIT=0. · graded at iteration 78.9 (364,574 in / 2,221 out, 78.9 iterations and 406s into the run)
Cap exceeded: Iteration cap (100) reached (100.1 used). Increase max_iterations or split criteria. Partial verdict — all 1 criteria graded and passed.

Overall: PASS ✓
