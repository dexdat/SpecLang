# speclang-header lines:10
id: "@speclang/daemon/metrics"
parent: "@ref:specs/daemon"
version: 1.0.0
layer: 3
project_level: Alpha
agent_support: agent_assisted
tags: [daemon, observability, prometheus]
short: Atomic daemon metrics textfile
---
# Daemon Prometheus Textfile

The TypeScript daemon publishes `.speclang/daemon.prom` in its working project
directory on start, stop, watched-file events, command status transitions,
convergence, and pipeline completion. This is a node_exporter textfile collector
input, not a separate HTTP endpoint. Configure the collector's directory to the
project's `.speclang` directory.

Each snapshot contains HELP/TYPE metadata, a trailing newline and exactly one
sample of each series:

- `speclang_daemon_up`: gauge, 1 after start and 0 after graceful stop.
- `speclang_daemon_status`: gauge, idle=0, cascading=1, converged=2, paused=3,
  error=4. It reflects the persisted lifecycle status, including the pipeline
  consecutive-failure guard's error state.
- `speclang_daemon_last_event_timestamp_seconds`: gauge, Unix seconds with
  millisecond precision from the last watched-file event. Before the first file
  event, the snapshot publication time is used.
- `speclang_daemon_errors_total`: counter, cumulative pipeline execution failures
  (failed results and thrown exceptions). Success does not reset it. It starts at
  zero for each new Daemon instance; it is independent of the existing
  consecutive-failure guard. Metrics I/O failures are logged, not counted as
  pipeline failures.

Writes for a target are serialized. Each writes a unique, exclusively-created
non-`.prom` temporary file in the same directory, then renames it over the target.
Scrapers see complete old or new snapshots, never partially overwritten text.
Temporary files are removed on failure and subsequent writes may recover. Metrics
I/O errors warn without failing the daemon or changing a pipeline result.

There is no heartbeat or crash detector in this textfile: a SIGKILL or host crash
can leave the last `up=1` snapshot behind. Operators must use file mtime freshness
(e.g. node_exporter's textfile mtime metric) and process supervision when checking
unexpected exits; this series only reports observed lifecycle transitions.

Implementation: `src/daemon/daemon-prom.ts` (dual-view link to this spec directory's
`src/daemon-prom.ts`), hooked into `src/daemon/daemon.ts`. Regression coverage:
`tests/daemon/daemon-prom.test.ts` and `tests/daemon/daemon-prom-outcomes.test.ts`.
