# Verdict: DF-SPECLANG-6

**Task:** speclang stop crashes the serving process with uncaught ENOENT on daemon.pid
**Evaluated:** 2026-11-16T15:49:17.092314
**Result:** ✗ FAIL

## Criteria

- ✓ **stop shuts down cleanly and tolerates a missing/stale pid file | proof: start --port 39124, curl dashboard 200, ./bin/speclang stop, assert the start process exits 0 and its output contains no ENOENT trace; plus a unit test for pid-file-absent | failure_condition: the start process exits non-zero or prints Error: ENOENT**
  - PASS: manual AC harness reproduced — start --port 39124 in /tmp/df6-manual, curl / => HTTP=200, `speclang stop` => "✅ Daemon stopped" STOP_EXIT=0, start.log ends with "🛑 Shutting down... [Daemon] Stopped" and START_EXIT=0, no ENOENT/Error: in output. Second stop / missing pid file / garbage pid file all exit 0 with "Daemon not running". Unit test: `npx vitest run tests/daemon/pid-file-enoent.test.ts --reporter=verbose` => 8 passed (8), incl. "stop with no pid file is a clean no-op (exit 0)" and "serving process shutdown > exits 0 with no ENOENT trace when `stop` wins the pid-file unlink race". · graded at iteration 36.4 (919,474 in / 3,535 out, 36.4 iterations and 67s into the run)

## Pipeline Stages

- ✗ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ~ tests: Command timed out after 120s (step budget)
- ✓ **tier2**
  - COMPLETE
  ✓ stop shuts down cleanly and tolerates a missing/stale pid file | proof: start --port 39124, curl dashboard 200, ./bin/speclang stop, assert the start process exits 0 and its output contains no ENOENT trace; plus a unit test for pid-file-absent | failure_condition: the start process exits non-zero or prints Error: ENOENT: PASS: manual AC harness reproduced — start --port 39124 in /tmp/df6-manual, curl / => HTTP=200, `speclang stop` => "✅ Daemon stopped" STOP_EXIT=0, start.log ends with "🛑 Shutting down... [Daemon] Stopped" and START_EXIT=0, no ENOENT/Error: in output. Second stop / missing pid file / garbage pid file all exit 0 with "Daemon not running". Unit test: `npx vitest run tests/daemon/pid-file-enoent.test.ts --reporter=verbose` => 8 passed (8), incl. "stop with no pid file is a clean no-op (exit 0)" and "serving process shutdown > exits 0 with no ENOENT trace when `stop` wins the pid-file unlink race". · graded at iteration 36.4 (919,474 in / 3,535 out, 36.4 iterations and 67s into the run)
Cap exceeded: Iteration cap (100) reached (100.2 used). Increase max_iterations or split criteria. Partial verdict — all 1 criteria graded and passed.

## Summary

Stage tier1: FAIL (DEGRADED - skipped checks)
  WARNING: coverage is unknown — tests did not run (skipped at runtime — tests: timed out after 120s (step budget)); run `gitreins guard` for the full gate
    ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ~ tests: Command timed out after 120s (step budget)

Stage tier2: PASS
  COMPLETE
  ✓ stop shuts down cleanly and tolerates a missing/stale pid file | proof: start --port 39124, curl dashboard 200, ./bin/speclang stop, assert the start process exits 0 and its output contains no ENOENT trace; plus a unit test for pid-file-absent | failure_condition: the start process exits non-zero or prints Error: ENOENT: PASS: manual AC harness reproduced — start --port 39124 in /tmp/df6-manual, curl / => HTTP=200, `speclang stop` => "✅ Daemon stopped" STOP_EXIT=0, start.log ends with "🛑 Shutting down... [Daemon] Stopped" and START_EXIT=0, no ENOENT/Error: in output. Second stop / missing pid file / garbage pid file all exit 0 with "Daemon not running". Unit test: `npx vitest run tests/daemon/pid-file-enoent.test.ts --reporter=verbose` => 8 passed (8), incl. "stop with no pid file is a clean no-op (exit 0)" and "serving process shutdown > exits 0 with no ENOENT trace when `stop` wins the pid-file unlink race". · graded at iteration 36.4 (919,474 in / 3,535 out, 36.4 iterations and 67s into the run)
Cap exceeded: Iteration cap (100) reached (100.2 used). Increase max_iterations or split criteria. Partial verdict — all 1 criteria graded and passed.

Overall: FAIL ✗ [DEGRADED — skipped: tier1(tests)=skipped at runtime — tests: timed out after 120s (step budget)]
