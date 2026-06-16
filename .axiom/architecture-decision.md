# SpecLang Architecture — Foundation Decision

## The Language Question: TypeScript Is the Right Call for Bootstrap

**Decision: All TypeScript through Phase 2 (self-hosting). Go is Phase 4.**

Why TypeScript wins for bootstrap:

| Factor | TypeScript | Go | Rust |
|--------|-----------|-----|------|
| Existing codebase | 398 TS source files — ASSETS | 0 lines | 0 lines |
| Pi Agent SDK | `@earendil-works/pi-coding-agent` | No SDK | No SDK |
| chokidar/fs.watch | Mature, cross-platform | fsnotify (Linux only) | notify (Linux only) |
| Build toolchain | Already works (npm) | Need to add | Need to add |
| Language boundary | None — everything in one type system | Need IPC Go↔TS | Need IPC Rust↔TS |
| Bootstrap speed | Ship in days | Ship in weeks | Ship in weeks |

The 398 existing TypeScript files in `src/` are **not legacy code** — they represent substantial compiler work (parser, spec graph, validator, resolver, transformer, codegen). That's the hardest part of SpecLang, and it's already written. Rewriting it in Go or Rust before bootstrapping is premature — the compiler itself is the thing we need to get to Phase 2 (self-hosting).

**The daemon stays TypeScript for now.** chokidar is production-grade (used by Vite, Webpack, etc.). Our spec directory is 440 files — chokidar handles that trivially. The Rust daemon with raw inotify is Phase 4 when we ship single-binary enterprise deployments.

## The Six Components (What We Build)

### 1. speclangd — File Watcher Daemon
**Language:** TypeScript (chokidar)  
**Runs as:** Long-running Node.js process  
**What it does:**
- Watch `specs/` for file creates/modifies/deletes
- Parse `speclang-header` from changed files
- Emit `FileChangeEvent { path, kind, header }` to the cascade router
- Detect convergence: 30 seconds of no file changes → emit `ConvergenceEvent`
- Manage file locks to prevent concurrent edits to the same file

**Boundary:** speclangd does NOT know about agents, cascade, or pipeline. It is a pure file watcher + event emitter. The cascade router subscribes to its events.

### 2. Cascade Router — Event → Agent Dispatcher  
**Language:** TypeScript (Pi SDK)  
**Runs as:** Pi agent session (the cascade coordinator)  
**What it does:**
- Subscribes to speclangd events
- Reads spec headers to find `owned-by`, `depends_on`, `children`
- Builds dependency graph from `@ref:` links
- Spawns Pi agent sessions for each affected agent role
- Generates cascade UUIDs (`cascade-YYYYMMDD-NNN`)
- Stamps `change_id`, `caused_by`, `part_of` on all outputs
- Detects when all agents finish → signals convergence

**Key:** This is the brain. It uses Pi SDK to create agent sessions. Each session gets the spec's full context + the owning agent's skills loaded.

### 3. Pi Extensions — Guard System & Custom Tools
**Language:** TypeScript (Pi extension API)  
**Location:** `.pi/extensions/speclang-guard.ts`  
**What it does:**
- **`pi.registerTool("create_spec_file", ...)`** — Creates new .spec.md files with valid headers
- **`pi.registerTool("validate_specs", ...)`** — Runs spec validation (header completeness, @ref resolution)
- **`pi.registerTool("run_cascade", ...)`** — Triggers cascade for a specific spec change
- **`onToolCall` interceptor** — Before any agent writes a file, checks if the agent owns that file (by pattern). Blocks unauthorized writes.
- **`onSessionEvent` listener** — Tracks agent session lifecycle for convergence detection

### 4. Compiler — Spec → Code Generator
**Language:** TypeScript (existing `src/` code)  
**Runs as:** Library imported by cascade coordinator, or CLI called by pipeline  
**What it does:**
- Parse: Read .spec.md files, extract headers + blocks
- Validate: Check header completeness, @ref resolution
- Resolve: Build dependency graph, topological sort
- Transform: Apply language-specific rules (target: TypeScript, Go, Python, Rust)
- Generate: Write output files to `src/`
- Verify: `npm run build && npm test` on generated code

**Critical insight:** The compiler ALREADY EXISTS in `src/`. We don't rebuild it — we wire it. The cascade coordinator imports the compiler library and calls it on the affected spec files after cascade converges.

### 5. Pipeline — Build/Test/Commit Runner
**Language:** TypeScript (reads `build.yaml`)  
**Runs as:** Module triggered by convergence event  
**What it does:**
- Read `build.yaml` stages
- Execute in order: install → typecheck → test → lint
- On success: git add, git commit with cascade UUID
- On failure: rollback last spec change, retry up to 3 times
- Notify user

### 6. MCP Server — External Agent Access
**Language:** TypeScript (Express or Pi RPC)  
**Runs as:** Standalone server or Pi RPC mode  
**What it does:**
- Exposes tools: create_spec_file, validate_specs, run_cascade, get_status
- Hermes connects via MCP stdio to interact with SpecLang
- Cascade events streamed to connected clients

## What Pi Agent Gives Us (We Don't Build)

- Agent loop: LLM call → tool execution → result → next iteration
- Tool calling: read, edit, bash, glob
- Session management: createAgentSession(), session lifecycle
- Model routing: multi-provider support
- Extension hot-reload: /reload
- Session persistence: SQLite-backed

## Build Order

```
Step 1: npm install deps (pi-coding-agent, chokidar, better-sqlite3, express)
Step 2: speclangd — chokidar watcher + event emitter
Step 3: Pi extension — guard system + custom tools
Step 4: Cascade router — event → agent dispatcher
Step 5: Wire existing compiler into cascade pipeline
Step 6: Pipeline runner — build.yaml executor
Step 7: MCP server — external agent access
Step 8: Bootstrap moment — compiler generates one SpecLang file from its own spec
```

## What's NOT Changing

- Spec format (spec-format.spec.md, headers.spec.md) — unchanged
- Compiler pipeline (parse → validate → resolve → transform → generate → verify) — unchanged
- Universal headers (id, version, layer, agent_support, @ref:) — unchanged
- Spanning tree architecture (project.scl → .spec.md → .spec.dir/) — unchanged
- Agent roles (northstar, spec-writer, codegen, test-writer, back-sync, pipeline) — unchanged
- Cascade concept (file change → agent reaction → convergence) — unchanged
- Pipeline stages (build, test, deploy) — unchanged

## What Changes

- Runtime: OpenCode binary → Pi SDK package
- Daemon implementation: OpenCode plugin → chokidar TypeScript
- Agent dispatch: OpenCode Task tool → Pi createAgentSession()
- Guard system: OpenCode plugin → Pi extension onToolCall
- File watching: OpenCode native → chokidar npm package
- Deployment: Docker container → `npx speclangd`
