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
| `speclang start [-p <port>]` | Start the daemon (file watcher + MCP server) |
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

**Minimal cascade example** (the working CLI path):

```bash
./bin/speclang cascade specs/examples.spec.dir/hello-world.spec.md
```

## 3. MCP Server

`src/speclang-mcp.ts` — Model Context Protocol server exposing SpecLang to AI agents. Supports both stdio (`StdioServerTransport`) and SSE (`SSEServerTransport`) transports. Start with `speclang mcp start` or `speclang start` (daemon mode).

### Tools

| Tool | Description |
|---|---|
| `speclang_search` | Search specs |
| `speclang_query` | Query spec data |
| `speclang_execute` | Execute a spec operation |
| `speclang_get_status` | Get system status |
| `speclang_insert_command` | Insert a command into the daemon queue |
| `speclang_claim_event` | Claim a daemon event |
| `speclang_acquire_lock` | Acquire a coordination lock |
| `speclang_get_tree` | Get the spec tree |

All tools return JSON text content via the standard MCP `CallTool` protocol.
