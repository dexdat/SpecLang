# Verdict: OBS-3

**Task:** speclangd prometheus textfile for up/status/errors
**Evaluated:** 2026-11-20T06:33:57.459812
**Result:** ✓ PASS

## Criteria

- ✓ **The daemon writes a Prometheus textfile daemon.prom covering up, status and error outcomes, and npx vitest run tests/daemon/daemon-prom.test.ts tests/daemon/daemon-prom-outcomes.test.ts exits 0.**
  - src/daemon/daemon-prom.ts:21-42 renders speclang_daemon_up, speclang_daemon_status (idle/cascading/converged/paused/error codes), speclang_daemon_last_event_timestamp_seconds and speclang_daemon_errors_total; writeDaemonPromMetrics (src/daemon/daemon-prom.ts:48-72) atomically writes .speclang/daemon.prom. The daemon publishes on start (specs/daemon.spec.dir/src/daemon.ts:158), stop (:182), file events (:214), pipeline failure (:427-428) and pipeline exception (:436-437) via publishMetrics (:285-297). Test command run fresh: `npx vitest run tests/daemon/daemon-prom.test.ts tests/daemon/daemon-prom-outcomes.test.ts` exit_code=0, output 'Test Files 2 passed (2), Tests 13 passed (13)'. [resolution 0.00; tests/daemon/daemon-prom.test.ts, tests/daemon/daemon-prom-outcomes.test.ts]
- ✓ **The textfile writer is reachable from the shipped CLI entrypoint (bin/speclang start), not only from the spec-dir sources**
  - bin/speclang:265 requires ../dist/src/daemon/index.js; dist/src/daemon/daemon.js:25 requires ./daemon-prom and :247 calls writeDaemonPromMetrics with the same publishMetrics call sites as the source. The CLI lifecycle test (tests/daemon/daemon-prom.test.ts:96-148) spawned `node bin/speclang start --no-dashboard` and observed daemon.prom with up=1 on start, timestamp advancing on a watched cascade, and up=0 after SIGTERM — passed in the vitest run (exit_code=0).
- ✓ **A metrics-write failure must not turn a pipeline success into a failure (telemetry failure path)**
  - publishMetrics wraps the write in try/catch and warns (specs/daemon.spec.dir/src/daemon.ts:285-297); tests/daemon/daemon-prom-outcomes.test.ts:51-67 mocks writeDaemonPromMetrics to reject and asserts pipeline_success still fires, pipeline_failed does not, and console.warn receives '[Daemon] Failed to write .speclang/daemon.prom:' — passed in the vitest run (13 passed, exit_code=0).

## Pipeline Stages

- ✓ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: build ok — npm run build exited 0
  ✓ tests: Start at  01:30:20
- ✓ **tier2**
  - COMPLETE
  ✓ The daemon writes a Prometheus textfile daemon.prom covering up, status and error outcomes, and npx vitest run tests/daemon/daemon-prom.test.ts tests/daemon/daemon-prom-outcomes.test.ts exits 0.: src/daemon/daemon-prom.ts:21-42 renders speclang_daemon_up, speclang_daemon_status (idle/cascading/converged/paused/error codes), speclang_daemon_last_event_timestamp_seconds and speclang_daemon_errors_total; writeDaemonPromMetrics (src/daemon/daemon-prom.ts:48-72) atomically writes .speclang/daemon.prom. The daemon publishes on start (specs/daemon.spec.dir/src/daemon.ts:158), stop (:182), file events (:214), pipeline failure (:427-428) and pipeline exception (:436-437) via publishMetrics (:285-297). Test command run fresh: `npx vitest run tests/daemon/daemon-prom.test.ts tests/daemon/daemon-prom-outcomes.test.ts` exit_code=0, output 'Test Files 2 passed (2), Tests 13 passed (13)'. [resolution 0.00; tests/daemon/daemon-prom.test.ts, tests/daemon/daemon-prom-outcomes.test.ts]
  ✓ The textfile writer is reachable from the shipped CLI entrypoint (bin/speclang start), not only from the spec-dir sources: bin/speclang:265 requires ../dist/src/daemon/index.js; dist/src/daemon/daemon.js:25 requires ./daemon-prom and :247 calls writeDaemonPromMetrics with the same publishMetrics call sites as the source. The CLI lifecycle test (tests/daemon/daemon-prom.test.ts:96-148) spawned `node bin/speclang start --no-dashboard` and observed daemon.prom with up=1 on start, timestamp advancing on a watched cascade, and up=0 after SIGTERM — passed in the vitest run (exit_code=0).
  ✓ A metrics-write failure must not turn a pipeline success into a failure (telemetry failure path): publishMetrics wraps the write in try/catch and warns (specs/daemon.spec.dir/src/daemon.ts:285-297); tests/daemon/daemon-prom-outcomes.test.ts:51-67 mocks writeDaemonPromMetrics to reject and asserts pipeline_success still fires, pipeline_failed does not, and console.warn receives '[Daemon] Failed to write .speclang/daemon.prom:' — passed in the vitest run (13 passed, exit_code=0).
The daemon writes an atomic .speclang/daemon.prom with up/status/last-event/errors_total series, wired through the compiled CLI path, and the mandated vitest command exits 0 with 13/13 tests passing.

## Summary

Stage tier1: PASS
    ✓ secrets: ok (no output)
  ✓ build: build ok — npm run build exited 0
  ✓ tests: Start at  01:30:20

Stage tier2: PASS
  COMPLETE
  ✓ The daemon writes a Prometheus textfile daemon.prom covering up, status and error outcomes, and npx vitest run tests/daemon/daemon-prom.test.ts tests/daemon/daemon-prom-outcomes.test.ts exits 0.: src/daemon/daemon-prom.ts:21-42 renders speclang_daemon_up, speclang_daemon_status (idle/cascading/converged/paused/error codes), speclang_daemon_last_event_timestamp_seconds and speclang_daemon_errors_total; writeDaemonPromMetrics (src/daemon/daemon-prom.ts:48-72) atomically writes .speclang/daemon.prom. The daemon publishes on start (specs/daemon.spec.dir/src/daemon.ts:158), stop (:182), file events (:214), pipeline failure (:427-428) and pipeline exception (:436-437) via publishMetrics (:285-297). Test command run fresh: `npx vitest run tests/daemon/daemon-prom.test.ts tests/daemon/daemon-prom-outcomes.test.ts` exit_code=0, output 'Test Files 2 passed (2), Tests 13 passed (13)'. [resolution 0.00; tests/daemon/daemon-prom.test.ts, tests/daemon/daemon-prom-outcomes.test.ts]
  ✓ The textfile writer is reachable from the shipped CLI entrypoint (bin/speclang start), not only from the spec-dir sources: bin/speclang:265 requires ../dist/src/daemon/index.js; dist/src/daemon/daemon.js:25 requires ./daemon-prom and :247 calls writeDaemonPromMetrics with the same publishMetrics call sites as the source. The CLI lifecycle test (tests/daemon/daemon-prom.test.ts:96-148) spawned `node bin/speclang start --no-dashboard` and observed daemon.prom with up=1 on start, timestamp advancing on a watched cascade, and up=0 after SIGTERM — passed in the vitest run (exit_code=0).
  ✓ A metrics-write failure must not turn a pipeline success into a failure (telemetry failure path): publishMetrics wraps the write in try/catch and warns (specs/daemon.spec.dir/src/daemon.ts:285-297); tests/daemon/daemon-prom-outcomes.test.ts:51-67 mocks writeDaemonPromMetrics to reject and asserts pipeline_success still fires, pipeline_failed does not, and console.warn receives '[Daemon] Failed to write .speclang/daemon.prom:' — passed in the vitest run (13 passed, exit_code=0).
The daemon writes an atomic .speclang/daemon.prom with up/status/last-event/errors_total series, wired through the compiled CLI path, and the mandated vitest command exits 0 with 13/13 tests passing.

Overall: PASS ✓
