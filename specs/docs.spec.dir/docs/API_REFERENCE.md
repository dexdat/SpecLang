# speclang-header lines:12
# id: @specs/docs
# version: 1.0.0
# layer: 5

# SpecLang API Reference

**Status:** Reality-Based  \
**Last Updated:** 2026-08-10  \
**Applies to:** speclang v1.0.0 (npm package `speclang`, CLI `speclang`)

This document is the user-facing reference for the three ways to use SpecLang programmatically: the npm library, the CLI, and the MCP server. The files `specs/api.spec.md` and `specs/mcp.spec.md` are internal specification files (YAML headers, block annotations) — this document is the polished entry point for developers.

## 1. Library (npm `speclang`)

The package exposes a programmatic surface through its root barrel (`main: dist/index.js`, `types: dist/index.d.ts`). 153 named exports grouped by domain module.

```ts
import { runCascade, parseSpec } from 'speclang';
import { validate, getEngine } from 'speclang';
import { SpecLangDB, createDatabase } from 'speclang';
```

### 1.1 Cascade (spec compilation / generation)

`src/cascade/` — run and coordinate cascades.

- `runCascade(options: CascadeOptions): Promise<CascadeResult>` — run a single cascade on a spec file (the library equivalent of `speclang cascade <spec>`)
- `parseSpec(content: string, options?)` — parse a spec document into metadata + blocks
- `CascadeCoordinator` — full coordinator class (dependency tracking, agent invocation, verification gates)
- `DependencyTracker`, `CascadeState`, `AgentInvocation`, `VerificationResult`, `createInitialState`, `AgentInvoker`, `getAgentForTrigger`, `VerificationGates`, `createVerificationResult`
- Types: `GateResult`, `VerificationGate`, `TreeNode`, `DependencyGraph`, `CoordinatorOptions`, `CoordinatorResult`, `CascadeOptions`, `CascadeResult`

### 1.2 Compiler (spec ↔ code sync)

`src/compiler/` — parse, resolve, transform, and generate code across targets.

- `parse`, `parsePhase`, `resolve`, `transform`, `codegen` — pipeline stages
- `detectDrift`, `syncCodeToSpec`, `syncSpecToCode` — dual-view synchronization
- `compileIncremental`, `invalidateCache` — incremental compilation
- Targets: `TargetMapping`, `CompilerTarget`, `TypeScriptTarget`, `GoTarget`, `RustTarget`, `PythonTarget`, `targets`, `getTarget`, `getAllTargets`
- Types: `SpecGraph`, `IR`, `IRBlock`, `IRField`, `IROperation`, `Artifact`, `DriftStatus`, `DriftReport`, `CompileCache`, `CompileOptions`, `CompilerPlugin`, `CompileError`, `ERROR_CODES`, `WARNING_CODES`

#### Compiler targets (`getTarget` / `getAllTargets`)

`getTarget(id)` is the lookup used by every phase: it is case-insensitive, returns the
`CompilerTarget` object for a known id and `undefined` (never throws) for an unknown one.
`getAllTargets()` returns the same objects as an array.

| id | target `id` | `fileExt` |
|---|---|---|
| `'typescript'` | `compiler/ts-target` | `.ts` |
| `'go'` | `compiler/go-target` | `.go` |
| `'rust'` | `compiler/rust-target` | `.rs` |
| `'python'` | `compiler/py-target` | `.py` |

```ts
import { codegen, getAllTargets, getTarget } from 'speclang';

getTarget('typescript'); // { id: 'compiler/ts-target', fileExt: '.ts', mappings, features }
getTarget('TYPESCRIPT'); // same object — the id lookup is case-insensitive
getTarget('cobol');      // undefined
getAllTargets().map((t) => t.id); // ['compiler/ts-target', 'compiler/go-target', ...]

// codegen() takes the target ID (a string), not the object from getTarget():
const artifacts = codegen(ir, 'typescript');
codegen(ir, 'cobol'); // throws Error: Unknown target: cobol
```

### 1.3 Validation

`src/validation/` — validate spec documents against built-in rules.

- `validate(spec: ParsedSpec, context?): Promise<ValidationReport>` — **async**; takes a `ParsedSpec` object, not a content string. Shape: `{ filepath, headerLines, metadata: { id, version, layer, ... }, content, headerRaw?, blocks?, references? }`. Read `report.passed` (not `.valid`).
- `validateAll(specs: ParsedSpec[]): Promise<ValidationReport[]>` — validate multiple specs in one batch (shared dependency context).
- `validateCommand(options)` — CLI-equivalent runner (glob patterns → reports).
- `ValidationEngine`, `getEngine`, `resetEngine` — engine access
- `ValidationRule`, `RuleRegistry`, `getRegistry`, `resetRegistry`, `BUILTIN_RULES` (includes `headerRule`, `idRule`, `refsRule`, `blocksRule`, `autonomousRule`)
- Output: `ValidationReport`, `ValidationReportBatch`, `format`, `formatBatch`, `formatJSON`, `formatSummary`

`parseSpec` (see §1.1) strips YAML scalar quoting, so a quoted header like
`id: "@speclang/examples/hello-world"` yields a bare `@speclang/examples/hello-world`
that passes `idRule`. Composing the two documented functions works end-to-end:

```ts
import { parseSpec, validate } from 'speclang';

const content = readFileSync('specs/hello-world.spec.md', 'utf8');
const parsed = parseSpec(content);          // { id, version, blocks }
const report = await validate({
  filepath: 'specs/hello-world.spec.md',
  headerLines: 12,
  metadata: { id: parsed.id, version: parsed.version, layer: 10 },
  content,
});
console.log(report.passed);                 // true for a valid spec
```

### 1.4 Database

`src/db/` — SQLite-backed storage.

- `SpecLangDB` — main database class
- `createDatabase(options?)` — factory
- `FullTextSearch`, `VectorSearch`, `GraphQueries`, `JSONQueries` — query surfaces

### 1.5 Config

`src/config/` — project configuration.

- `getDefaultConfig()` — default configuration object
- `ProjectConfig`, `ProjectMetadata`, `Language`, `WatcherConfig`, `IgnoreConfig`, `SplitConfig`, `SplitStrategy`, `EmbeddingConfig`, `DatabaseConfig`, `CascadeConfig`, `AgentsConfig`, `AgentConfig`
- Defaults: `DEFAULT_WATCHER_CONFIG`, `DEFAULT_SPLIT_CONFIG`, `DEFAULT_EMBEDDING_CONFIG`, `DEFAULT_DATABASE_CONFIG`, `DEFAULT_CASCADE_CONFIG`

### 1.6 Layers, Pipeline, Meta, Deployment, and more

- **Layers** (`src/layers/`): `LAYER_NAMES`, `LAYER_DESCRIPTIONS`, `LAYER_EXTENSIONS`, `LAYER_OWNERS`, `isValidLayer`, `getMinValidLayer`, `validateLayer`, `validateLayerDependency`, `validateLayerChain`, `getMaxLayerForMaturity`, `resolveLayer`, `resolveLayerFromPath`, `resolveLayerFromContent`
- **Pipeline** (`src/pipeline/`): `PipelineExecutor`, `createPipelineExecutor`, `loadPipelineConfig`, `getPipelineConfig`, `StageExecutor`, `orderStages`, `areDependenciesMet`, `HookExecutor`, `RecoveryExecutor`, `BuiltInHooks`, `createHookContext`, `RecoveryActions`
- **Meta** (`src/meta/`): `SpecGenerator`, `MetaBootstrap`, `SelfConsistencyValidator`, `executeMetaCommand`, `MetaCLIOptions`, `MetaCommand`
- **Deployment** (`src/deployment/`): `createModeSwitcher`, `recommendMode`, `ModeSwitcher`, `DeploymentModeSwitcher`, `createLightModeService`, `LightModeService`, `createEnterpriseModeService`, `EnterpriseModeService`, `LIGHT_MODE_START_COMMAND`, `ENTERPRISE_MODE_START_COMMAND`
- **Safety confidence** (`src/safety-confidence/`): `ConfidenceScorer`, `ConfidenceLevel`, `SignalScore`, `ConfidenceReport`, `PROJECT_LEVEL_THRESHOLDS`, `SIGNAL_SOURCE_WEIGHTS`
- **Test specs** (`src/test-specs/`): `parseTestSpecFile`, `TestSpecParser`, `TestGenerator`, `generateTestCode`, `TestRunner`, `runTestSpec`, `runAllTestSpecs`, `TestSpecReporter`
- **Errors** (`src/errors/handler.ts`): `ErrorHandler`, `POCError`, `POCErrorCode`, `RecoveryStrategy`, `ErrorRecoveryConfig`, `CircuitBreakerState`, `ErrorMetrics`
- **Events** (`src/events/typed-emitter.ts`): `TypedEventEmitter`, `FileWatcherEvents`, `ConvergenceEvents`, `AgentEvents`, `DaemonEvents`
- **Workflow** (`src/workflow/`): `initProject`, `validateProject`, `processConversation`, `parseCommand`, `executeParsedCommand`, `showStatus`, `getChanges`, `showSpecDiff`, `formatChanges`

> Deep imports (`dist/src/...`) remain available for non-canonical copies. The CLI entrypoints (`bin/speclang`, workflow CLIs) are intentionally not re-exported.

## 2. CLI (`speclang`)

`bin/speclang` — commander-based CLI. `speclang --help` lists all commands; the primary ones:

| Command | Purpose |
|---|---|
| `speclang start [-p <port>]` | Start the daemon (file watcher + dashboard HTTP API) — **not** the MCP server |
| `speclang cascade <spec>` | Run a single cascade on a spec file |
| `speclang agent [agent]` | Run an agent |
| `speclang status` | Show current system status |
| `speclang stop` | Stop the daemon |
| `speclang daemon start/stop/status` | Daemon lifecycle management |
| `speclang validate [files...]` | Validate spec files |
| `speclang check [files...]` | Check spec files |
| `speclang generate [files...]` | Generate code from specs |
| `speclang build [files...]` | Build |
| `speclang bootstrap` | Bootstrap the meta-circular compiler |
| `speclang mcp start/status/stop` | MCP server lifecycle |
| `speclang new <name>` | Create a new spec |
| `speclang init <name>` | Create spec scaffolding in the current project (name = spec name → `specs/<name>/<name>.spec.md`, `--tiers` for 4-tier meta/plan/ts/test) |
| `speclang expand <block-id>` | Expand a block |
| `speclang search <query>` | Search across all specs (`--kind <type>` filter by block kind, `--tag <tag>` filter by tag, `--limit <n>` max results — default 20, `--verbose`; short flags `-k`, `-t`, `-l`, `-v`) |
| `speclang maturity [spec]` | Show maturity level info, or validate `[spec]` against a level (`--level <level>` show one level, `--json` JSON output, `--verbose` show detailed criteria) |
| `speclang upgrade <spec>` | Upgrade a spec to a higher maturity level (`--to <level>` target, e.g. Beta or Production; `--json` JSON output; `--plan` show the plan without executing) |
| `speclang downgrade <spec>` | Downgrade a spec to a lower maturity level (`--to <level>` target; `--json` JSON output; `--plan` show the plan without executing) |
| `speclang history\|log [spec]` | Git-backed spec change history (`--all` include non-spec changes, `--block <id>` filter by block ID, `--author <name>`, `--since <date>`, `--until <date>`, `--compare v1..v2`, `--format text\|json\|timeline` — default `text`, `--follow` follow renames, `--stat` diff statistics, `--blame` line-level attribution; short flags `-a`, `-b`, `-f`) |

`speclang history` is a read-only report, so "there is nothing to report" is a
message, not a crash:

| Situation | stdout | exit |
|---|---|---|
| repository has no commits yet (fresh `git init`, unborn HEAD) | `No commits yet — this repository has no history to show.` + the `git add`/`git commit` next step | `0` |
| directory is not inside a git repository | `No history found — this directory is not inside a git repository.` + `git init` hint | `2` |
| `git` binary not on `PATH` | "No history found — the `git` command is not available on PATH." | `2` |

With `--format json` the empty state stays machine-readable (`[]`, or the zeroed
`--stat` object) and a failure reason goes to stderr.

**Minimal cascade example** (the working CLI path):

```bash
./bin/speclang cascade specs/examples.spec.dir/hello-world.spec.md
```

## 3. MCP Server

Model Context Protocol server exposing specs, locks, cascades, the command queue and dashboard statistics to AI agents.

**Source:** `src/mcp/server.ts` (server, transports, HTTP routes), `src/mcp/tools/index.ts` (tool registry + `getToolDefinitions`), `src/mcp/tools/*.ts` (per-domain handlers), `src/mcp/config.ts` (config loader, the live one), `src/mcp/auth.ts`, `src/mcp/sse.ts`. The `src/mcp/` entries are symlinks into `specs/mcp.spec.dir/src/` (`git ls-files -s src/mcp` shows mode `120000`), so both paths name the same files — edit the spec side.

### Starting the server

| Mode | Command | Wire |
|---|---|---|
| stdio (default) | `speclang mcp start [-d <dir>]` | JSON-RPC on stdin/stdout; all startup diagnostics go to **stderr** |
| HTTP + SSE | `speclang mcp start --remote [--port 3000] [-d <dir>]` | `GET /mcp` opens the SSE stream, `POST /mcp/message` carries JSON-RPC, `GET /events` is the event feed (enabled unless `MCP_SSE_ENABLED=false`), `GET /health` returns `{"status":"ok","mode":"http"}`, `GET /metrics` returns Prometheus/OpenMetrics exposition (`Content-Type: text/plain; version=0.0.4; charset=utf-8`, no auth; see `docs/observability-spec.md` §9.1 for metric families) |

`-d/--dir` (default `.`) only sets the base directory: the database becomes `<dir>/.speclang/speclang.db` and the specs root `<dir>/specs`.

The module also has its own entrypoint: `node dist/specs/mcp.spec.dir/src/server.js [start|search|get] [--http|--remote] [--port N]`.

`speclang start` is **not** an MCP server — it launches the daemon (spec file watcher plus the dashboard HTTP API on `--port`). Use `speclang mcp start` for MCP.

`speclang mcp start` writes the server's own pid to `.speclang/mcp.pid` (and `.speclang/mcp.port` in `--remote` mode), which `speclang mcp status` / `speclang mcp stop` read: `status` reports `Status: Running (PID …)` only while that pid exists, and `stop` sends it SIGTERM. Both files are removed on server exit; a pid file whose process is gone is reported as not running and dropped, never treated as a live server.

### Transport and configuration

**Transports actually implemented** (`src/mcp/server.ts`): exactly two.

- **stdio** — `startStdio()` (`server.ts:62`), `StdioServerTransport` (`server.ts:68`). Default; nothing may be printed to stdout except protocol frames.
- **HTTP + SSE** — `startHTTP(port)` (`server.ts:77`), express app with `GET /mcp` → `SSEServerTransport('/mcp/message', res)` (`server.ts:93-104`), `POST /mcp/message` → a hand-rolled JSON-RPC 2.0 dispatcher (`server.ts:107`, methods `initialize`, `tools/list`, `tools/call`, `resources/list`, `prompts/list`), `GET /events` → SSE event feed (`server.ts:205`), `GET /health` (`server.ts:216`), `GET /metrics` → Prometheus/OpenMetrics exposition (`server.ts:225`, `Content-Type: text/plain; version=0.0.4; charset=utf-8`, no auth; see `docs/observability-spec.md` §9.1 for metric families). `app.listen(httpPort)` binds all interfaces (`server.ts:233`).

`'socket'` appears in the config type (`types.ts`, `config.ts:83`) but **no socket transport exists** — do not plan around it. The transport is chosen by argv (`--http` / `--remote`), not by `MCP_SERVER_MODE`.

**Auth switch.** The CLI exposes `--auth none|basic|token` (default `none`) plus `--user/--pass/--token`; `none` disables auth entirely (`auth.enabled = options.auth !== 'none'`, `bin/speclang`). When enabled, middleware is mounted on the `/mcp` path only (`server.ts:88-90`), i.e. both `GET /mcp` and `POST /mcp/message`; `/events`, `/health` and `/metrics` stay open. Token auth expects `Authorization: Bearer <key>` and accepts any key from `MCP_API_KEYS` (comma-separated) or the singular `token` value (`auth.ts:67-89`). Basic auth compares the exact `Basic base64(user:pass)` header (`auth.ts:51-62`). The two remaining types — `config_file` (htpasswd-style JSON, SHA-256) and `tls_client_cert` (peer-cert CN) — have no CLI flag; they are reachable only by constructing the config object.

**Configuration keys (live set).** `loadConfig` (`src/mcp/config.ts:38`) applies `DEFAULT_CONFIG` (lines 10-33), then the object the entrypoint passes, then **environment variables last** — so an env var wins over the matching CLI flag.

| Variable | Default | Effect (source) |
|---|---|---|
| `MCP_PORT` | `3000` | HTTP listen port (`config.ts:42`) |
| `MCP_HOST` | `0.0.0.0` | stored as `config.host`; read only by `speclang_subscribe_events` when it builds the endpoint URL — it does **not** change the listener bind address (`config.ts:45`, `server.ts:219`) |
| `MCP_DATABASE` | `.speclang/speclang.db` | SQLite file path; the parent directory is created at startup (`config.ts:48`, `server.ts:50`) |
| `MCP_SPECS_DIR` | `specs` | specs root handed to the spec and index handlers (`config.ts:51`) |
| `MCP_AUTH_ENABLED` | unset (`false`) | only the literal string `true` enables auth (`config.ts:54`) |
| `MCP_AUTH_TYPE` | `token` | auth type when enabled; only read on the `MCP_AUTH_ENABLED=true` branch (`config.ts:56`) |
| `MCP_API_KEYS` | – | comma-separated bearer keys accepted by token auth (`config.ts:58`) |
| `MCP_SSE_ENABLED` | `true` | only the literal string `false` disables the `/events` feed (`config.ts:61`, `server.ts:202`) |
| `MCP_LOG_LEVEL` | `info` | parsed into `config.logging.level`; **not consumed** by the server (`config.ts:64`) |
| `MCP_LOG_FILE` | – | parsed into `config.logging.file`; **not consumed** (`config.ts:67`) |
| `MCP_MAX_CONNECTIONS` | `100` | parsed into `config.limits`; **not enforced** (`config.ts:70`) |
| `MCP_QUERY_TIMEOUT_MS` | `5000` | parsed into `config.limits`; **not enforced** (`config.ts:73`) |
| `MCP_MAX_RESULTS` | `1000` | parsed into `config.limits`; **not enforced** (`config.ts:76`) |
| `MCP_WAL_MODE` | `true` | parsed into `databaseWalMode`; the server always opens the DB with `wal: true` (`config.ts:79`, `server.ts:52`) |
| `MCP_SERVER_MODE` | `http` | parsed into `serverMode` (`stdio`/`http`/`socket`); the transport is selected by argv instead (`config.ts:82`) |

> **Unwired module — do not configure against it:** `src/mcp/config/loader.ts` (`ConfigLoader`, reads `.speclang/mcp.json|yaml`) is imported by no entrypoint and reads a *conflicting* key set (`MCP_DB_PATH`, `MCP_SERVER_MODE`, `MCP_SERVER_PORT`, `MCP_SERVER_HOST`, `MCP_AUTH_TOKEN`) with a different config shape. The live contract is `src/mcp/config.ts` above; `loader.ts` is future/unused surface.

### Tools

All 34 registered tools, exactly as declared by `getToolDefinitions` in `src/mcp/tools/index.ts`. No tool is registered anywhere else — `getToolDefinitions()` is the only source for `tools/list` (`server.ts:250`) and the registry switch (`server.ts:70`).

#### Search and spec CRUD

| Tool | Purpose | Required inputs |
|---|---|---|
| `speclang_search` | Full-text search across all specs (FTS5) | `query` (optional: `tags`, `layer`, `limit`) |
| `speclang_semantic_search` | Vector similarity search (requires the sqlite-vss extension) | `query_embedding` (optional: `limit`) |
| `speclang_get_spec` | Get a full spec by ID or file path | none (`id` or `file_path`; `include_content` defaults `false`) |
| `speclang_create_spec` | Create a new spec | `id`, `content` (optional: `agent_id`, `file_path`) |
| `speclang_update_spec` | Update an existing spec | `id`, `content` (optional: `message`, `agent_id`) |
| `speclang_list_specs` | List specs with optional filters | none (optional: `tags`, `layer`, `prefix`, `limit`=100) |

#### Locks

| Tool | Purpose | Required inputs |
|---|---|---|
| `speclang_lock` | Acquire a file/resource lock | `resource`, `agent_id` (optional: `ttl`=60s) |
| `speclang_unlock` | Release a lock | `agent_id` (optional: `lock_id`) |
| `speclang_check_lock` | Check whether a resource is currently locked | `resource` |
| `speclang_force_unlock` | Force-unlock a resource (admin escape hatch) | `resource` |

#### Cascade

| Tool | Purpose | Required inputs |
|---|---|---|
| `speclang_cascade_status` | Get the current cascade status | none |
| `speclang_cascade_trigger` | Trigger a cascade from a spec change | `spec_id`, `change_type` (`create`/`modify`/`delete`) |
| `speclang_cascade_abort` | Abort the active cascade | none |
| `speclang_cascade_converge` | Mark a cascade as converged | `cascade_id` |

#### Index

| Tool | Purpose | Required inputs |
|---|---|---|
| `speclang_index_refresh` | Rebuild the spec index | none (optional: `specsDir`) |
| `speclang_index_stats` | Get index statistics | none |
| `speclang_index_validate` | Validate index integrity | none |

#### Dependencies and impact

| Tool | Purpose | Required inputs |
|---|---|---|
| `speclang_get_dependencies` | Get a spec's dependencies (recursive CTE, depth ≤ 10 when `transitive`) | `id` (optional: `transitive`=false) |
| `speclang_get_dependents` | Get a spec's dependents (same traversal, reverse direction) | `id` (optional: `transitive`=false) |
| `speclang_impact_analysis` | Direct + transitive impact of changing a spec, plus affected files | `id` |

#### Agents, status and dashboard statistics

| Tool | Purpose | Required inputs |
|---|---|---|
| `speclang_get_status` | Overall status: spec/session/command/cascade counts + a `converged` flag | none |
| `speclang_query_events` | Query recent cascade events with filtering | none (optional: `limit`=20, `cascade_id`, `agent`, `file_pattern`, `since` ISO-8601) |
| `speclang_get_agent_statuses` | Per-session status rows (queue depth, last active, uptime) | none (optional: `agent_type`, `status`) |
| `speclang_get_project_stats` | Project stats: spec/generated/test counts, cascade depth, queue depth | none |
| `speclang_get_queue_status` | Pending-command queue contents | none (optional: `limit`=50) |
| `speclang_get_system_stats` | Host CPU, memory and disk usage | none |
| `speclang_subscribe_events` | Returns the `/events` SSE endpoint URL and event-type list (it does not stream) | none (optional: `types`: `file.changed`, `cascade.progress`, `agent.spawned`, `agent.completed`, `cascade.converged`) |

#### Command queue

| Tool | Purpose | Required inputs |
|---|---|---|
| `speclang_query_commands` | Query commands from the queue | none (optional: `status`=`pending`, `limit`=10, `cascade_id`, `session_id`) |
| `speclang_insert_command` | Insert a command into the queue | `cascade_id`, `action` (optional: `target_file`, `session_id`, `payload`, `priority`=0) |
| `speclang_update_command` | Update a command's status | `command_id`, `status` (`pending`/`running`/`completed`/`failed`; optional `error`) |
| `speclang_delete_command` | Delete a command from the queue | `command_id` |
| `speclang_get_next_command` | Get the next pending command (highest priority) | none |
| `speclang_clear_completed` | Clear completed/failed commands older than a cutoff | none (optional: `olderThan` Unix timestamp) |
| `speclang_batch_insert` | Insert several commands in one call | `commands` (array of `{cascade_id, action, target_file?, priority?}`) |

All tools return JSON text content via the standard MCP `CallTool` protocol: the payload is `JSON.stringify(result)` in `content[0].text`, and a thrown handler becomes `content[0].text = {"error": "<message>"}` with `isError: true` (`server.ts:195-204`).

**stdio vs HTTP caveat:** in stdio mode every tool above is handled by `MCPToolRegistry.registerTools`. In HTTP mode `tools/call` is served by a legacy prefix dispatcher (`MCPServer.callTool`, `server.ts:276`): search/specs/locks/cascade/index and the dashboard statistics tools execute for real, while `speclang_get_dependencies`, `speclang_get_dependents`, `speclang_impact_analysis`, `speclang_get_status` and all seven command-queue tools return a placeholder payload (`{"message":"Tool <name> not fully implemented"}`) or an unknown-dashboard-tool error instead of running. Until those two dispatchers are unified, prefer stdio for agent integration.

The internal specification for this subsystem is `specs/mcp.spec.md`.
