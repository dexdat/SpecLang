# Acceptance Criteria for SpecLang

## Active Criteria

### AC-006: Dual-view compliance — `.opencode/skills/` symlinked from specs
**Goal:** `.opencode/skills/` directory exists and contains symlinks to `specs/skills.spec.dir/skills/` so the SkillLoader tests pass
**How to verify:** 
  1. `ls -la .opencode/skills/` should show 5+ skill files
  2. The symlinks should point to `specs/skills.spec.dir/skills/`
  3. `npm test -- --run tests/skills.test.ts` should pass
**Status:** passed ✅
**Verified:** 2026-06-18 11:29 UTC
**Evidence:** Skills test: 9/9 passed (previously 7/9 with 2 failures). Full regression: 2152/2152 passed. 5 symlinks created: spec-writer, code-gen, test-writer, back-sync, orchestrator. `.opencode/agents/` and `.opencode/tools/` dirs also created.
**Commit:** speclang: AC-006 — .opencode/skills/ symlinked from specs [WI-SL-006]

### AC-007: OpenCode skills — `.opencode/` with full skill inventory ✅
**Goal:** `.opencode/` directory with agents/, tools/ subdirectories, symlinked from spec sources
**How to verify:** `ls .opencode/` should show agents/ tools/ subdirs; `ls .opencode/agents/` should show .md files
**Status:** passed
**Verified:** 2026-06-18 12:42 UTC
**Evidence:** 7 agent files symlinked (README, speclang-code-gen, speclang-coordinator, speclang-simulator, speclang-simulator-verify, speclang-spec-writer, speclang-verifier). 1 tools file symlinked (README). All resolve and container can read.
**Commit:** speclang: AC-007 — .opencode/agents/ and .opencode/tools/ symlinked from specs

### AC-008: Pi Agent SDK runtime test passes on host ✅
**Goal:** Pi Agent SDK can be loaded at runtime on the host
**How to verify:** `node -e "import('@earendil-works/pi-coding-agent').then(m => console.log('OK'))"` should print OK. Package is ESM-only (`"type": "module"`), CJS `require()` not supported.
**Status:** passed
**Verified:** 2026-06-18 13:05 UTC
**Evidence:** `node tests/pi-agent-check.mjs` loaded the SDK successfully. Exports: AgentSession, AgentSessionRuntime, and 50+ components. Version 0.79.1.
**Notes:** Package is ESM-only (exports only "import" field). Verification command updated from CJS require to ESM import.

## Passed Criteria

### AC-001 through AC-005 (Swarm Orchestrator core) ✅
**All verified in git history** — File Watcher, Agent Router, Ownership Guard, Session Manager, GitHandler all implemented and tested.

### AC-2.1 through AC-2.4 (Cascade System) ✅
**All verified in git history** — Dependency graph, cascade propagation, spanning tree.

### AC-3.1 through AC-3.3 (Agent Skills) ✅
**All verified in git history** — SpecWriter, CodeGen, TestWriter skill tests.

### AC-4.1 through AC-4.3 (Infrastructure) ✅
**All verified in git history** — SQLite context index, MCP inbox, header validator.

### AC-5.1 through AC-5.4 (Pipeline & Self-healing) ✅
**All verified in git history** — Build pipeline, recovery executor, E2E cascade orchestrator, dual-view 100% compliance.

## Backlog

### AC-009: File watcher daemon — full startup/shutdown lifecycle ✅
**Goal:** speclangd binary can start, detect file changes, and gracefully shut down
**How to verify:**
  1. `node -e "const {Daemon} = require('./dist/src/daemon/daemon'); ... d.start(); d.stop();"` should print STARTED then STOPPED
  2. `npx vitest run tests/daemon/daemon.test.ts` — 25/25 tests pass (incl. restart, healthCheck)
**Status:** passed ✅
**Verified:** 2026-06-18 13:42 UTC
**Evidence:** Daemon binary starts and stops cleanly (isRunning true/false cycles). All 25 daemon tests pass — SessionStore, Watcher, Router, ConvergenceDetector, Daemon integration (start/stop, restart, healthCheck, pause/resume, abort, converge detection). 2 previously-skipped tests (restart, healthCheck) now enabled and passing. Root cause of skip: stale compiled .js files in specs/daemon.spec.dir/src/ masked TypeScript methods; resolved by syncing compiled artifacts to match .ts source.
**Binary test:** Daemon starts (STARTED, running: true), returns status (converged), stops cleanly (STOPPED, running: false). All lifecycle commands operational.

### AC-010: CLI completeness — all subcommands work
**Goal:** `./bin/speclang --help` shows validate, cascade, build, history subcommands with correct behavior
**Why deferred:** CLI is documented in specs but CLI tool has limited subcommands implemented.

### AC-011: Spec-to-code pipeline — full end-to-end generation
**Goal:** Edit a spec, cascade triggers code generation, tests pass
**Why deferred:** E2E test exists (npm run e2e) but needs real Pi Agent sessions with API key.

