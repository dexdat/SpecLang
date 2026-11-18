# SpecLang observability spec

Status: proposed (audit 2026-11-03). Owner lane: `monitoring`.
Repo audit point: `dexdat/SpecLang` @ `88b6023d80858500538651ebfef5696ffc785533`.
This document specifies what SpecLang must emit, not what it emits today.

---

## 1. What SpecLang is, and what "healthy" means

SpecLang is a **spec compiler**: a spec tree (`specs/*.spec.md`) is the source of
truth, and the product's job is to turn specs into working code, tests and index
artifacts, then report on the health of that tree.

It has four runtime shapes, and each has a different health question:

| Shape | Entry point | Long-lived? | Health question |
|---|---|---|---|
| `speclangd` watcher daemon | `bin/speclangd` → `dist/src/daemon/daemon.js` (`src/daemon/daemon.ts:28`) | yes (background, pid + log in `.speclang/`) | is it watching, and did the last cascade + pipeline converge? |
| `speclang start` dashboard/MCP daemon | `bin/speclang:40` → `dist/src/daemon/index.js` | yes (HTTP) | is the dashboard up, is the watcher armed |
| MCP HTTP server | `src/cli/commands/server.ts:36` → `MCPServer.startHTTP` (`src/mcp/server.ts:77`) | yes (HTTP, `app.listen` at `src/mcp/server.ts:219`) | serving MCP + SSE clients on the port |
| CLI lanes (`validate`, `cascade`, `generate`, `guard`, `index`, `meta`, `autonomous`) | `src/cli/index.ts:34+` | **no** — process exits | did the run succeed, how long did it take, what did it produce |

**Healthy** means:

1. the daemon process is alive and its watcher is armed (state `idle`, not stuck in `cascading` / `crashed`);
2. cascades started are finishing — the convergence-to-pipeline loop drains, it does not pile up;
3. the compile/pipeline success ratio stays near 1.0 and a failure is always attributable to a named stage;
4. spec validation passes on the tree (`validate` exit 0, failures 0);
5. the generated-artifact surface does not shrink or churn unexpectedly;
6. the guard blocks nothing that the owning agent needed to write.

## 2. Current state — proven, with citations

**Verdict before this spec: NONE.** SpecLang has no scrape surface at all.

- No Prometheus/OpenMetrics client library anywhere in shipped source.
  `grep -rIn -E "prom-client|prometheus_client|prometheus-fastapi|promhttp|client_golang" src specs scripts bin index.ts`
  (excluding `node_modules`) returns **zero** hits — run 2026-11-03, probe script
  `/home/kara/.hermes/cache/scratch/obs-speclang-probe.sh` section 1.
  `package.json` dependencies list `express`, `commander`, `better-sqlite3`, `chokidar`,
  `glob`, `simple-git`, `yaml`, `@modelcontextprotocol/sdk`, `fs-extra` — no metrics client.
- No `/metrics` route. The only literal match in the tree is a *dashboard mock*,
  `specs/dashboard.spec.dir/src/testing/mock-mcp.ts:59` (`case 'dashboard/metrics'`),
  which is a UI test double, not an exporter.
- The 13 "counter-looking" grep hits are **compiler bookkeeping**, not instrumentation:
  `TokenCounter` in `specs/split.spec.dir/src/token-counter.ts:9` and
  `// Reset depth counter` in `specs/implementation.spec.dir/src/opencode-plugin/index.ts:58`.
  There is no `counter`/`gauge`/`histogram` metric object in the codebase.
- What *does* exist is a real HTTP surface: `MCPServer.startHTTP` builds an Express app
  (`src/mcp/server.ts:77`) and already serves an unauthenticated health route —
  `app.get('/health', … res.json({ status: 'ok', mode: 'http' }))` at
  **`src/mcp/server.ts:215-217`** — then listens at `src/mcp/server.ts:219`
  (same code at `specs/mcp.spec.dir/src/server.ts:215-219`). This is the natural host for
  `/metrics`; nothing else needs to be invented.

### The signals that exist today, and where they die

Each of these is a real observable state that is **computed and then discarded into
stdout, a JSON file, or a return value nobody reads**:

| State that exists in code | Where it lives | Where it is lost today |
|---|---|---|
| daemon status, cascade depth, files-changed count, active agent count, start/last-event timestamps | `State.getStatus()` — `src/daemon/state.ts:152-166` | written to `.speclang/daemon-state.json` (`src/daemon/state.ts:23`, write at `:71`) — never scraped; the file on this host has read `"status": "cascading"` since 2026-10-27 while `cascadeDepth` is 0 |
| convergence status: files changed, current depth, time remaining in the quiet period | `ConvergenceDetector.getStatus()` — `src/daemon/convergence.ts:88-104` | not exposed outside the daemon; checked on a 1 s timer (`:149`) and thrown to `console.log` |
| per-cascade duration + files changed | `ConvergenceDetector.getConvergenceResult()` — `src/daemon/convergence.ts:107-125` | one `console.log` line (`[Convergence] Cascade complete! …`) going to `.speclang/speclangd.log`, which does not exist on this host |
| pipeline result: `success`, `duration`, per-stage `StageResult[]`, `recoveryAttempts` | `PipelineExecutor.execute()` — `src/pipeline/executor.ts:37`, result built at `:184-193` (success) and `:227-237` (failure) | consumed at `src/daemon/daemon.ts:309-330`, which only `console.log`s `[Daemon] Pipeline succeeded!` / `console.error`s the failure |
| stage failures with timings | `emitEvent('stage_fail', …)` (`src/pipeline/executor.ts:130-131`) | emitted into an `EventEmitter` with no metrics listener |
| per-recovery-attempt failure records (`stage`, `attempt`, error name/message/stack) | `RecoveryExecutor.logError()` — `src/pipeline/recovery.ts:242-270`, dir `.speclang/errors` (`src/pipeline/executor.ts:30`) | one JSON file per failure, never read back. **680 files / 2.8 MB** on this host, oldest `error-2026-07-12T13-49-48-715Z.json` |
| per-agent invocation duration + success | `AgentInvoker.invoke()` returns `duration_ms` (`src/cascade/coordinator/invocation.ts:118`, `:128`) | return value only |
| per-cascade token totals + per-phase token breakdown | `CascadeCoordinator.collateMetrics()` — `src/cascade/coordinator/index.ts:475-506` | only surfaced when `--metrics` is passed *and* verbose (`src/cascade/index.ts:118-134`) — printed, never stored |
| generated file paths per cascade | `CascadeResult.filesGenerated` (`src/cascade/index.ts:26`) and `fs.writeFileSync` at `src/cascade/index.ts:404`, `:438` | return value |
| validation pass/fail counts by rule and level | `ValidationResult { rule, level: 'error' | 'warning', location }` — `src/validation/types.ts:28-41`; summary in `src/validation/reporter.ts:91-99` | printed to stdout of an exiting CLI |
| guard blocks/violations per agent role | `WriteInterceptor.stats` (`src/guard/interceptor.ts:47-59`, `:99-108`), exported by `getGuardStats()` (`src/guard/index.ts:116-118`) | in-memory only, lost when the process exits |
| lock contention / deadlocks | `src/daemon/locks.ts` (300 lines), `src/daemon/deadlock.ts` (195 lines) | `console.*` only |

**Blind spots that actually hurt at 3 a.m.**:

1. *Is the daemon alive and armed?* The only witness is a JSON file that can say
   `"status": "cascading"` forever (proven above); no timestamp an alert can compare to
   now, no metric.
2. *Is work happening?* Cascades-started vs cascades-converged exist as in-memory
   counters (`convergence.ts:39-45`), reset on every `reset()` (`:135-141`) — the ratio
   that shows a wedged convergence loop is never exported.
3. *How long does a compile take?* `PipelineResult.duration` is computed
   (`executor.ts:37`, `:183-190`) and thrown away.
4. *Why did it fail?* Failures become one JSON file per event with no aggregate; nobody
   can answer "which stage failed 40 times this week" without `grep`-ing 680 files.
5. *Did the compiler actually produce anything?* Generated files are counted nowhere.
6. *Is the tree still valid?* `validate` is a CLI that exits; there is no time series of
   "specs failing validation".

## 3. Metric catalogue

Naming: `<product>_<subsystem>_<thing>_<unit>`. Prefix `speclang_`.
Labels are capped to the enumerated sets below. **Never** a file path, spec id, agent
session id, prompt, task id or timestamp in a label — those are unbounded; put them in
logs (Loki) instead, joined by `spec_id` as a *log field*, not a metric label.

Subsystems: `daemon`, `pipeline`, `cascade`, `compile` (CLI generation/validation),
`guard`, `build` (process facts).

### Tier 1 — minimal viable emission (answers "is it up and doing work")

| Metric | Type | Unit | Labels | Question it answers |
|---|---|---|---|---|
| `speclang_build_info` | gauge (always 1) | — | `version`, `mode` (`daemon`/`mcp-http`/`dashboard`) | What is deployed and in which shape? |
| `speclang_daemon_up` | gauge (0/1) | — | `host` | Is the watcher daemon process alive? |
| `speclang_daemon_status` | gauge (enum-encoded 0..4: 0 idle, 1 cascading, 2 converged, 3 paused, 4 crashed) | — | `status` | What state is the daemon in right now (vs. what it claims in a stale file)? |
| `speclang_daemon_last_event_timestamp_seconds` | gauge | seconds (unix) | `host` | How long since the watcher last saw a file event? (`time() - …` = staleness) |
| `speclang_pipeline_runs_total` | counter | runs | `result` (`success`/`failure`) | How many compile pipelines ran, and what fraction failed? |
| `speclang_pipeline_duration_seconds` | histogram (buckets 1,5,15,30,60,120,300,600) | seconds | `result` | How long does one compile pipeline take? |

### Tier 2 — depth on the compile loop

| Metric | Type | Unit | Labels | Question it answers |
|---|---|---|---|---|
| `speclang_cascade_runs_total` | counter | cascades | `result` (`converged`/`error`) | Are cascades converging? |
| `speclang_cascade_duration_seconds` | histogram (buckets 1,5,15,30,60,120) | seconds | — | How long from first event to convergence? |
| `speclang_cascade_files_watched` | gauge | files | — | How wide is the current change set? |
| `speclang_cascade_depth` | gauge | levels | — | Is the cascade spiralling (depth climbing toward `maxDepth`)? |
| `speclang_pipeline_stage_duration_seconds` | histogram | seconds | `stage` (bounded enumeration from the pipeline config), `result` (`success`/`failure`/`skipped`) | Which stage is slow or failing? |
| `speclang_pipeline_recovery_attempts_total` | counter | attempts | `action` (`rollback`/`notify`/`retry`/`pause`) | How often is self-repair firing? |
| `speclang_pipeline_failures_total` | counter | failures | `stage`, `error_class` (`timeout`/`exit_nonzero`/`parse`/`config`/`unknown` — a closed set derived in code, never `error.message`) | Which failure category dominates? |
| `speclang_agent_invocations_total` | counter | invocations | `agent` (bounded role enum), `result` (`success`/`error`) | Are agents succeeding? |
| `speclang_agent_invocation_duration_seconds` | histogram | seconds | `agent` | Which agent is the long pole? |
| `speclang_agent_tokens_total` | counter | tokens | `agent`, `kind` (`input`/`output`/`reasoning`) | What is a compile costing in tokens? |

### Tier 3 — artifact surface, validation and the guard

| Metric | Type | Unit | Labels | Question it answers |
|---|---|---|---|---|
| `speclang_artifacts_generated_total` | counter | files | `kind` (`impl`/`test`/`index`) | Is the compiler still producing code? |
| `speclang_specs_total` | gauge | files | `kind` (`spec_md`/`scl`) | How big is the spec corpus? (drift baseline) |
| `speclang_specs_invalid` | gauge | files | `level` (`error`/`warning`) | Is the tree still valid? (replaces scraping CLI stdout) |
| `speclang_validation_runs_total` | counter | runs | `result` (`pass`/`fail`) | How often does validation fail? |
| `speclang_validation_duration_seconds` | histogram | seconds | — | Is validation getting slow as the corpus grows? |
| `speclang_validation_findings_total` | counter | findings | `rule` (bounded rule-id enum from `ValidationRule.id`), `level` | Which rule is firing most? |
| `speclang_drift_detections_total` | counter | detections | `kind` (`spec_behind_code`/`code_behind_spec`/`index_stale`) | Is spec↔code drift being caught? |
| `speclang_guard_checks_total` | counter | checks | `agent_role` (bounded), `result` (`allowed`/`blocked`) | Is a writing agent being blocked? |
| `speclang_guard_violations_total` | counter | violations | `agent_role` | Same, as an alertable count |
| `speclang_index_specs_total` | gauge | rows | `source` (`sqlite`/`index_json`) | Does the search index cover the corpus? (`specs` table has 604 rows on this host vs 452 files in `specs/` — a real drift signal) |
| `speclang_errors_dir_bytes` | gauge | bytes | `path_class` (`daemon` — never the literal path) | Is the unread error dump growing without bound? (2.8 MB / 680 files today) |

### Cardinality budget

Total worst case ≈ 4 (`speclang_*_info/up/status`) + 8 stage labels × 3 results +
6 agent roles × 3 + ~20 validation rules × 2 + 4 guard roles ≈ **under 120 series**.
That is the entire product. If a proposed metric would exceed this, it belongs in logs.

## 4. Exposure mechanism (per runtime shape)

Use `prom-client` (the Node official-cousin client, the standard for Node and the one
that matches the fleet convention for Node services). Do **not** hand-roll a text format.

1. **MCP HTTP server** (the only already-listening HTTP server): add a single route
   next to the existing health route in `src/mcp/server.ts` (and keep
   `specs/mcp.spec.dir/src/server.ts` in sync — that file is the spec-side twin at
   `:215`):

   ```ts
   import { Registry, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
   const registry = new Registry();
   collectDefaultMetrics({ register: registry, prefix: 'speclang_' });
   app.get('/metrics', async (_req, res) => {
     res.set('Content-Type', registry.contentType);
     res.end(await registry.metrics());
   });
   ```

   Register it **before** the auth middleware if auth is enabled for `/mcp` only — the
   existing middleware is scoped to `/mcp` (`src/mcp/server.ts:87-89`), so `/metrics` is
   unauthenticated by default; keep it that way but bind the listener to loopback (the
   `app.listen(httpPort, …)` call at `src/mcp/server.ts:219` takes no host today) **and**
   add a CIDR allow-list or a bearer token check if the port is ever exposed off-host.
   A metrics endpoint that leaks nothing but volumes is still an attack surface: it is a
   free reconnaissance oracle.

2. **`speclangd` watcher daemon** — it has **no HTTP listener today**. Do not add a
   second server just for metrics: with the daemon's state living in-process
   (`State`, `ConvergenceDetector`), the right answer is to (a) have the daemon record
   cascade/pipeline outcomes to the same **textfile collector** path described in (3), and
   (b) expose `speclang_daemon_up` / `…_status` / `…_last_event_timestamp_seconds` by
   writing a `daemon.prom` textfile on every state change (`State.save()`,
   `src/daemon/state.ts:66-76`). A scrape target on a second port is the *later*,
   optional upgrade — it must not block Tier 1.

3. **CLI lanes (`validate`, `cascade`, `generate`, `guard`, `index`, `meta`,
   `autonomous`) exit.** A scrape can never see them. The correct mechanism is a
   **completion record**: on exit, the CLI writes
   `/var/lib/node_exporter/textfile/speclang-cli-<lane>.prom` with
   `speclang_validation_runs_total{lane="ci"} N` style lines (counters accumulate by
   reading the previous value from the same file), or POSTs to the fleet pushgateway.
   Prefer the textfile if node_exporter textfile collector is already on `fleet-monitor`;
   prefer pushgateway if not.

4. **Dashboard daemon** (`specs/daemon.spec.dir/src/index.ts:76`, `:100`) already has
   `/health` and `/api/status`; add `/metrics` on the same app, reusing the same registry
   factory so the metric definitions have exactly one home.

Create the registry in one module (e.g. `src/observability/metrics.ts`) and import it from
each entry point — metric *definitions* must not be duplicated, or a `Counter` registered
twice throws.

## 5. Collection path

Fleet facts: Prometheus 3.15 / Loki / Grafana / Alloy / blackbox / cAdvisor / Tempo /
Pyroscope on host `fleet-monitor`; agents push via `remote_write`; scrape-only targets
need a job in `/root/fleet-monitoring/prometheus/prometheus.yml`.

- **SpecLang is a long-running service on the agent host, not on `fleet-monitor`.**
  Therefore: keep doing what the fleet already does — the local **Alloy/agent pushes**.
  The daemon and MCP server never push themselves; they *serve*, and the co-located
  exporter scrapes them.
- **Scrape job (on the host that runs SpecLang)**: a `speclang` scrape job in that host's
  agent config, target `127.0.0.1:<port>/metrics` for the MCP HTTP server, plus a
  `node_exporter` **textfile collector** directory `…/textfile/` for the daemon and CLI
  completion records. Both are then remote-written up to `fleet-monitor` — no new job is
  needed on `fleet-monitor` itself.
- **Alloy relabel labels on every series**:
  `host="<agent hostname>"`, `product="speclang"`, `service="speclang-mcp"` |
  `"speclangd"` | `"speclang-cli"`, `env="prod"`.
- **What the fleet agent already does**: node_exporter, cAdvisor and blackbox already
  give process/container liveness and a TCP probe of the MCP port. That is *not*
  application observability — it answers "is the port open", not "did the compile
  converge". This spec exists for the second question.
- **Logs**: keep `console.*` lines as they are (133 in `src/daemon/*.ts` alone) and let
  Alloy ship the daemon's stdout to Loki — the spec-id and error message that must never
  be a label belong there. Do **not** delete the `.speclang/errors` JSON dumps in this
  work; add the counter and a retention job later.

## 6. Verification — how a reviewer proves each metric is live

Run in order; every step has an expected observable, and "done" is listed at the end.

1. **Route exists (curl):**
   ```
   curl -s localhost:3000/metrics | grep -E '^speclang_(build_info|daemon_up|pipeline_runs_total)'
   ```
   Must print at least `speclang_build_info{version="1.0.0",mode="mcp-http"} 1`.
   `curl -s localhost:3000/metrics | wc -l` must exceed 20 (default process metrics).
2. **Counters move:** run a compile, then re-curl:
   ```
   node bin/speclang cascade <spec.md> ; curl -s localhost:3000/metrics | grep speclang_pipeline_runs_total
   ```
   the `result="success"` sample must increase by exactly 1.
3. **Prometheus is ingesting (PromQL, on `fleet-monitor`):**
   ```
   up{product="speclang"}                                       # == 1
   count({__name__=~"speclang_.+"})                             # >= 8 after Tier 1
   rate(speclang_pipeline_runs_total{result="failure"}[15m])    # near 0 in steady state
   histogram_quantile(0.95, sum by (le) (rate(speclang_pipeline_duration_seconds_bucket[1h])))  # p95 compile time
   time() - speclang_daemon_last_event_timestamp_seconds        # seconds since last file event
   ```
4. **CLI completion record landed:**
   ```
   node bin/speclang validate ; grep speclang_validation_runs_total /var/lib/node_exporter/textfile/speclang-cli-*.prom
   ```
   the line exists, and after a second run its value is the previous + 1.
5. **Alertable condition** (the one an operator actually wants):
   ```
   speclang_daemon_up == 0  OR  (time() - speclang_daemon_last_event_timestamp_seconds > 86400 and speclang_daemon_up == 1)
   ```
   for > 10 m pages. Plus `sum(rate(speclang_pipeline_runs_total{result="failure"}[1h])) / sum(rate(speclang_pipeline_runs_total[1h])) > 0.5`.

**Done looks like:** `/metrics` returns the Tier-1 families from a running daemon/MCP
server; Prometheus holds `speclang_pipeline_runs_total` with `product="speclang"` and a
non-flat `result="success"` series over a 15 m window that includes a real compile;
`speclang_daemon_last_event_timestamp_seconds` advances after touching a spec file; and a
deliberate pipeline failure raises `speclang_pipeline_failures_total{stage=…}` within one
scrape interval.

## 7. Deliberately NOT instrumented

- **No per-spec, per-file, per-cascade-id or per-session labels.** That is millions of
  series. Spec ids belong to Loki log fields and to the SQLite `specs`/`events` tables.
- **No raw `error.message` as a label.** Errors are bucketed into `error_class`; the
  message and stack stay in the JSON error dump and Loki.
- **No user/prompt content metrics.** SpecLang compiles specs; prompt text is not an
  observable.
- **No token cost in the metric namespace until the tokens are actually produced** —
  `collateMetrics()` is only populated on the agent path, so `agent_tokens_total` is
  Tier 2, gated on the agent path being live (today the template cascade path reports
  zeros by design, `src/cascade/index.ts:121-124`).
- **No metrics from the `poc-*` daemon files** (`src/daemon/poc-*.ts`) — proof-of-concept
  code, not the shipped path (`bin/speclangd` loads `dist/src/daemon/daemon.js`).

## 8. Open questions this audit could not settle (do not treat as facts)

- Whether the `.speclang/daemon-state.json` file is actually written by the *shipped*
  daemon or leaked by a test run: its `filesChanged` entries are all
  `tests/daemon/fixtures/…` paths and it has not advanced past 2026-10-27.
  `src/daemon/state.ts` writes relative to CWD; the daemon is started from wherever
  `bin/speclangd` is invoked. A worker must not assume the file is production truth.
- Whether `speclang start` (dashboard mode) actually serves in a given deployment — the
  code path is `dist/src/daemon/index.js`, whose source is `specs/daemon.spec.dir/src/index.ts`
  and is **not** in `tsconfig.json` `include` (only `specs/mcp.spec.dir/src/**` is),
  so the freshness of that build artifact is unverified.
- The MCP HTTP server's default port collides with the documented dashboard default
  (3000 in both `src/mcp/server.ts` config and `bin/speclang:31`); whichever listener
  wins decides which service `/metrics` belongs to. A worker must pick the port
  deliberately.

## 9. Implementation notes — what has landed since this audit

### 9.1 OBS-1: the scrape surface exists

`GET /metrics` is served by the MCP HTTP server (`specs/mcp.spec.dir/src/server.ts`,
`app.get('/metrics', …)` → `renderMetrics()`), Content-Type
`text/plain; version=0.0.4; charset=utf-8`. The registry and renderer live in
`specs/mcp.spec.dir/src/metrics.ts` (`MetricsRegistry`, `collectMetrics()`,
`renderMetrics()`); 16 tests in `tests/mcp/metrics.test.ts` pin the exposition
grammar. Start it with:

```
node bin/speclang mcp start --remote --port 3000
curl -s localhost:3000/metrics
```

A host that already owns 3000 wins the bind silently — the readiness probe below
must therefore be matched against a family this server alone exposes (see 9.4).

### 9.2 OBS-2: pipeline outcomes, across the process boundary

The pipeline executor, the recovery executor and the daemon that drives them run in a
different process from the MCP server that answers the scrape, so in-memory counters
can never show a delta there. The outcomes are persisted to a small JSON ledger and
merged at render time.

**Ledger** (`specs/pipeline.spec.dir/src/metrics-ledger.ts`):

- path: `$SPECLANG_METRICS_LEDGER`, else `<cwd>/.speclang/metrics-outcomes.json`
- atomic: temp file in the same directory + `rename`
- crash tolerant: missing / unparsable / wrongly shaped ⇒ empty ledger (counters are
  clamped to finite non-negative numbers, unknown keys dropped) — never an exception
- monotonic: read-modify-write with a non-negative delta per observation
- side-effect only: an unwritable path returns `false` from the recorder and leaves
  pipeline control flow untouched

Shape:

```json
{
  "version": 1,
  "families": {
    "speclang_pipeline_stage_results_total": { "stage=probe-pass,status=success": 2 },
    "speclang_pipeline_recovery_total":       { "outcome=succeeded": 2 },
    "speclang_pipeline_convergence_total":    { "outcome=converged": 1 }
  },
  "stageDurationMs": { "probe-pass": { "count": 2, "sum": 8, "last": 3 } }
}
```

Series keys are the label set encoded as sorted `k=v` pairs (separators escaped), so the
on-disk shape stays flat and diffable.

**Families** (declared unconditionally, so a fresh install still exposes HELP/TYPE):

| family | type | labels | source |
|---|---|---|---|
| `speclang_pipeline_stage_results_total` | counter | `stage`, `status` (`success`/`failure`/`skipped`) | every completed `StageResult` in `PipelineExecutor.execute()` |
| `speclang_pipeline_recovery_total` | counter | `outcome` (`succeeded`/`failed`) | each `RecoveryExecutor.execute()` action (incl. via `executeAll`) |
| `speclang_pipeline_convergence_total` | counter | `outcome` (`converged`/`not_converged`) | the `ConvergenceResult` the executor was invoked with |
| `speclang_pipeline_stage_duration_seconds` | gauge | `stage` | last duration of that stage (seconds) |

Label values are stage names and three fixed status vocabularies — bounded, per §7.

### 9.3 Instrumentation sites (side-effect only)

- `specs/pipeline.spec.dir/src/executor.ts` — after each `stageExecutor.execute()`
  result and each condition-skipped stage; plus the triggering convergence outcome.
- `specs/pipeline.spec.dir/src/recovery.ts` — every action outcome. `execute()` wraps
  the previous switch body (`executeAction`) solely so the recording has one seam;
  the action implementations are untouched.

### 9.4 Acceptance demonstration (as run)

```
# 0. build (the AC's precondition)
npm run build

# 1. scratch project
mkdir -p /tmp/obs2-probe && cd /tmp/obs2-probe
node bin/speclang init probe            # writes specs/probe/probe.spec.md
# build.yaml: on_converge = [probe-pass (echo), probe-fail (exit 3)];
#             recovery.max_attempts = 2, recovery.on_fail = [notify -> log]

# 2. scrape BEFORE (scraper process)
node bin/speclang mcp start --remote --port 3100 &     # 3000 taken on this host
curl -s localhost:3100/metrics | grep speclang_pipeline
#    -> the four HELP/TYPE headers only, zero series

# 3. run the producer (separate process, same cwd => same ledger)
node <probe-driver>.js    # constructs the real PipelineExecutor, executes build.yaml

# 4. scrape AFTER
curl -s localhost:3100/metrics | grep speclang_pipeline
#    speclang_pipeline_convergence_total{outcome="converged"} 1
#    speclang_pipeline_recovery_total{outcome="succeeded"} 2
#    speclang_pipeline_stage_duration_seconds{stage="probe-pass"} 0.003
#    speclang_pipeline_stage_results_total{stage="probe-pass",status="success"} 2
#    speclang_pipeline_stage_results_total{stage="probe-fail",status="failure"} 2
```

**Bare `node bin/speclang cascade` cannot be the demonstration.** On this tree
`cascade` is a command group: `speclang cascade` with no `<spec>` prints commander help
(and the `cascade` group in `src/cli/index.ts:176` has only `status` / `trigger` /
`abort` subcommands). Nothing in `bin/speclang`, `src/cli/*.ts` or
`src/cli/commands/*.ts` references the pipeline executor, so no CLI subcommand reaches
`PipelineExecutor`. The counters are therefore driven by the real producer — the same
`PipelineExecutor` the daemon calls on convergence — not by help text.

**Known defect observed while running this demonstration (not fixed here, out of
scope):** the daemon's dynamic import of the executor
(`specs/daemon.spec.dir/src/daemon.ts`, `executePipeline`) tries
`../../pipeline.spec.dir/src/executor.js` and `../../specs/pipeline.spec.dir/src/executor.js`,
but the pipeline compiles to `dist/src/pipeline/` (its `specs/` mirror is not in
`tsconfig.json` `include`), so a real `speclang start` cascade ends with
`Pipeline execution error … Cannot find module '<repo>/dist/specs/pipeline.spec.dir/src/executor.js'`
and the pipeline never runs. Tracking that is a separate row; it is the reason the
acceptance demonstration invokes the compiled executor directly.

