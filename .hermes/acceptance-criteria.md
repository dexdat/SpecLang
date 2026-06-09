# Acceptance Criteria for SpecLang

**Project:** SpecLang — specification-driven multi-agent system where specs self-assemble into code
**Type:** Existing codebase (TypeScript, npm, 440 specs, 398 source files, 1,478+ test assertions)
**Path:** ~/SpecLang
**Container:** opencode-speclang (:4105)
**Cron schedule:** every 4h

**The Goal (vision):** SpecLang is a **meta-circular compiler** — specs describe the system that reads and generates the specs. The phases below track the bootstrap: from fixing the current TypeScript build, through OpenCode runtime mode, to full self-hosting where SpecLang generates itself from its own specs.

**Phase 0 — Fix Build** → **Phase 1 — OpenCode Runtime** → **Phase 2 — Self-Hosting** → **Phase 3 — GitReins Import** → **Phase 4 — Standalone Daemon**

---

## Active Criteria

### PHASE 0: Build Foundation

Goal: Get the existing TypeScript/OpenCode src tree compiling and passing tests. Everything downstream depends on this.

### AC-001: TypeScript build compiles cleanly ✅
**Goal:** `npm run build` (tsc) exits 0 with no errors
**How to verify:** `cd ~/SpecLang && npm run build 2>&1 | tail -5`
**Status:** passed
**Verified:** 2026-06-09
**Evidence:** Build exits 0. Root cause was missing `npm install` — `@types/node` was already in devDependencies but not installed. No tsconfig changes needed.

### AC-002: npm test runs all 1478+ tests passing ✅
**Goal:** `npm test` runs vitest and all test suites pass
**How to verify:** `cd ~/SpecLang && npm test 2>&1 | tail -10`
**Status:** passed
**Verified:** 2026-06-09
**Evidence:** 73 test files, 1478 passed, 8 skipped, 0 failed. One run showed 5 ordering-dependent CLI test failures — not reproducible in isolation.

### AC-003: SpecLang CLI validate command works ✅
**Goal:** `./bin/speclang validate` exits 0 and reports spec validation status
**How to verify:** `cd ~/SpecLang && ./bin/speclang validate 2>&1`
**Status:** passed
**Verified:** 2026-06-09
**Evidence:** Validates 441 files. 125 pass, 316 fail structural checks (missing header fields). CLI works correctly — failures are spec quality, not CLI bugs.

### AC-004: SpecLang CLI status command reports system state ✅
**Goal:** `./bin/speclang status` shows spec count, project level, agent support tier
**How to verify:** `cd ~/SpecLang && ./bin/speclang status 2>&1`
**Status:** passed
**Verified:** 2026-06-09
**Evidence:** Shows 469 specs, project path, daemon status (not running).

---

### PHASE 1: OpenCode Runtime

Goal: SpecLang runs as an OpenCode plugin (as designed in `specs/opencode.spec.md`). The daemon watches spec files, the cascade loop routes events to agent sessions, and the pipeline runs on convergence. This phase uses OpenCode as the execution runtime — SpecLang agents (spec-writer, codegen, test-writer) process specs through OpenCode's skill/plugin system.

### AC-010: OpenCode speclang-guard plugin loads and enforces file ownership
**Goal:** OpenCode starts with the speclang guard plugin active. Agent writes are intercepted and checked against ownership rules from `specs/agent-protocol.spec.md`.
**How to verify:** Start container opencode-speclang on :4105, check plugin loaded via `docker logs`, verify guard intercept fires on unauthorized writes.
**Notes:** Uses the agent-protocol system: one_agent_per_file, read_any_write_owned, pattern-based ownership (`specs/**/*.spec.md` → spec_writer, `src/**/*.ts` → code_gen). Guard plugin intercepts write attempts at the OpenCode plugin layer.

### AC-011: Cascade coordinator triggers on spec file changes
**Goal:** Editing a .spec.md file in specs/ triggers the cascade coordinator agent (defined in `.opencode/agents/speclang-coordinator.md`) which invokes sub-agents (spec-writer, codegen, test-writer) in dependency order.
**How to verify:** Touch a spec file, observe cascade log showing agent dispatch sequence.
**Notes:** Cascade coordinator uses `@ref:` links in spec headers to determine dependency order. Each agent gets a targeted task with the parent spec's context.

### AC-012: Convergence detection fires pipeline after 30s quiet period
**Goal:** After the last agent finishes and no new file changes occur for 30 seconds, the pipeline (build.yaml) runs: install → typecheck → test → lint.
**How to verify:** Make a spec change → cascade runs → agents finish → 30s later pipeline fires. Observe pipeline log.
**Notes:** Pipeline defined in `build.yaml`. Uses OpenCode's convergence detection.

### AC-013: Cascade tracking via UUID headers works
**Goal:** Each cascade step stamps change_id, caused_by, and part_of in spec headers. The chain from root change through all agent actions is fully traceable.
**How to verify:** After a cascade, grep for `@cascade:` and `@change:` in spec headers. Follow parent-child chain from root to leaves.
**Notes:** Implemented via cascade UUID tracking spec (`specs/cascade.spec.md` §CascadeTracking). cascade_id format: `cascade-YYYYMMDD-NNN`.

### AC-014: MCP server exposes SpecLang tools to external agents
**Goal:** The MCP server (`specs/mcp.spec.md`) starts and exposes tools: create_spec_file, validate_specs, run_cascade, check_status
**How to verify:** Start MCP daemon, connect via MCP inspector, list available tools.
**Notes:** MCP server enables Hermes and other external agents to interact with SpecLang programmatically. See `specs/mcp.spec.md` for full spec.

### AC-015: Spec header validation — progress: 158/427 passing (62 errors fixed)
**Goal:** Reduce spec validation failures
**How to verify:** `cd ~/SpecLang && ./bin/speclang validate 2>&1 | grep "Validation Summary" -A5`
**Status:** in_progress
**Notes:** 62 errors fixed this run. Remaining failures (269 files, 341 errors) are YAML structural issues:
  - "Nested mappings not allowed in compact mappings" (widespread in spec.dir subdirs)
  - "Plain value cannot start with @ character" (needs quoting)
  - Various YAML parse failures in top-level specs

### AC-016: Dual-view symlink compliance ✅
**Goal:** Percentage of working locations symlinked from specs
**How to verify:** Run `./scripts/check_compliance.py --report | grep -E "Compliant|Total"`
**Status:** passed
**Verified:** 2026-06-09
**Evidence:** 588/608 compliant (96.7%) — far above the ~30% previously claimed. Previous data was stale.

---

### PHASE 2: Self-Hosting Compiler

Goal: SpecLang's compiler (`specs/compiler.spec.md`) reads SpecLang specs and generates the SpecLang source code. This is the **bootstrap moment** — SpecLang generates its own implementation from its own specs. The meta-circular loop closes.

### AC-020: Cascade runs on a spec ✅
**Goal:** `./bin/speclang cascade <spec>` completes successfully
**How to verify:** `cd ~/SpecLang && ./bin/speclang cascade specs/validator.spec.md 2>&1`
**Status:** passed
**Verified:** 2026-06-09
**Evidence:** Successfully ran cascade on specs/validator.spec.md. Output: "Converged: Yes". Generated 0 files (spec had no code blocks to generate from).

### AC-021: Compiler generates a SpecLang source file from its own spec
**Goal:** Take one of SpecLang's own specs (e.g., `specs/compiler.spec.dir/phases.spec.md`) and generate the corresponding `src/compiler/phases.ts`. The generated file must be functionally equivalent to the current hand-written version.
**How to verify:** Compare generated vs current source. Run build + tests on generated version.
**Notes:** THIS IS THE BOOTSTRAP MOMENT. The spec that describes the compiler generates the compiler itself. It won't replace the hand-written code initially — the first generated version proves the pipeline works.

### AC-022: Cascade produces multi-file changes from a single spec edit
**Goal:** Edit one high-level spec → cascade triggers spec_writer (expands), then codegen (generates 2+ output files), then test_writer (generates test spec), then pipeline (builds + tests). All outputs pass validation.
**How to verify:** Edit `project.scl` or a layer 1 spec, observe cascade produce 3+ related file changes, then pipeline green.
**Blockers:** AC-011 (cascade coordination), AC-020 (compiler working)

### AC-023: Compiler supports multi-language output (TypeScript + Go + Python)
**Goal:** The same spec generates code in 2+ target languages. Multi-target transformation from `specs/compiler.spec.md`.
**How to verify:** Create test spec with language-agnostic blocks, run compiler with `--target go` and `--target typescript`, compare outputs.
**Blockers:** AC-020

### AC-024: Compiler self-generates its own compiler module
**Goal:** The `src/codegen/` module is generated from `specs/codegen.spec.md` instead of being hand-written. The generated version passes all tests.
**How to verify:** Replace hand-written `src/codegen/` with compiler-generated version, run `npm run build && npm test`.
**Blockers:** AC-021 (partial bootstrap proven), AC-022 (multi-file cascade working)
**Notes:** THIS IS FULL BOOTSTRAP. SpecLang's code generation is now self-hosted. The compiler generates the code generator from the code generator's spec.

---

### PHASE 3: GitReins Import

Goal: GitReins (gitreins-poc, ~/gitreins-poc) is imported into SpecLang as a managed module — its task lifecycle, agentic evaluator, and guard system become SpecLang pipeline stages and cascade verification tools.

### AC-030: GitReins task lifecycle available as SpecLang cascade tracking
**Goal:** SpecLang cascade steps create GitReins tasks (task.create → task.start → task.complete). Each cascade change_id maps to a GitReins task. Spec `specs/cascade.spec.md` cascade_tracking section.
**How to verify:** Run cascade → list GitReins tasks → verify one task per cascade step. Task state matches cascade state.
**Import path:** GitReins specs (11 markdown files in `specs/`) become SpecLang specs. The Python source in `engine/`, `gitreins_mcp/`, `gitreins/` gets SpecLang `.spec.md` wrappers. Or GitReins runs as an MCP server that SpecLang agents call — either bridges the gap.

### AC-031: GitReins agentic evaluator runs as SpecLang pipeline verification stage
**Goal:** After cascade convergence, the GitReins agentic evaluator (7-tool LLM loop: read_file, run_command, search_pattern, read_diff, get_task, sandbox_write, sandbox_read) judges whether the cascade's output meets acceptance criteria. Structured verdict (per-criterion PASS/FAIL) feeds into pipeline recovery.
**How to verify:** Make a spec change → cascade completes → pipeline runs → evaluator reads the diff and tests → structured verdict produced.
**Notes:** Replace `build.yaml`'s current `on_converge` stages with GitReins pipeline stages for more sophisticated evaluation. The evaluator's 7 tools give the LLM a rich evidence-gathering loop beyond just `npm test`.

### AC-032: GitReins guard system enforces SpecLang quality gates at commit
**Goal:** GitReins Tier 1 guards (secrets scan, lint, tests) run before any SpecLang cascade commit. GitReins Tier 2 agentic evaluator validates the cascade output against spec requirements. Bypass via direct git commit is blocked by pre-commit hooks.
**How to verify:** Run cascade → attempt direct git commit → pre-commit hook blocks it. Run through GitReins commit tool → guards run first → commit accepted if clean.
**Import path:** GitReins git hooks (`gitreins/install` → `.git/hooks/pre-commit`) integrate with SpecLang's pipeline `on_fail` recovery (rollback last spec change).

### AC-033: GitReins specs imported as SpecLang specs
**Goal:** All 11 GitReins spec files (00-README through 11-Configuration.md) are converted to SpecLang `.spec.md` format with speclang-headers, `@block:` markers, and `@ref:` cross-references. The GitReins source code is annotated with `# SPECLANG-GENERATED` markers.
**How to verify:** `ls specs/gitreins/` shows 11 spec files. Each has valid header. `speclang validate` passes for all.
**Notes:** Conversion pattern: GitReins `## REQ-EVAL-001: ...` → SpecLang `### @block:eval/iterative-loop @kind:requirement`. GitReins `**Realized by:** engine/evaluator.py:197-308` → SpecLang `realized_by: src/evaluator.py` header field.

---

### PHASE 4: Standalone Daemon (Future)

Goal: SpecLang's daemon (`speclangd`) runs as a standalone process without OpenCode. This is the enterprise mode — Rust daemon with raw inotify, MCP server, and no OpenCode dependency.

### AC-040: speclangd daemon starts standalone and watches specs/
**Goal:** `speclangd --watch specs/ --pipeline build.yaml` starts, watches for specs changes, runs cascade, and detects convergence — all without OpenCode running.
**How to verify:** Start speclangd in background, touch a spec file, observe cascade log in daemon output.
**Notes:** This is the Rust daemon from `specs/daemon.spec.md` (enterprise mode). Not a priority until Phase 2 bootstrap is stable.

### AC-041: Standalone cascade handles concurrent agent sessions
**Goal:** Multiple simultaneous spec changes trigger concurrent agent sessions. File locks prevent conflicts. Ownership rules from agent-protocol are enforced without OpenCode's native plugin system.
**How to verify:** Change 3 specs simultaneously → observe 3 concurrent agent sessions → all complete without file conflicts.
**Notes:** From `specs/core.spec.dir/concurrency` and `specs/agent-protocol.spec.dir/sessions`.

### AC-042: Standalone MCP server provides full SpecLang tool surface
**Goal:** MCP server starts independently and exposes all SpecLang tools (spec validation, cascade trigger, status, compiler, pipeline) for external AI agents (Hermes, Claude, etc.)
**How to verify:** Start MCP server, connect with MCP client, list and invoke tools.

---

## Passed Criteria

*(none yet)*

---

## Backlog

### AC-050: Standard library types ready for spec writing (stdlib.spec.md)
**Goal:** All stdlib types (primitives, Result, Option, composites) are importable from `speclang/stdlib`
**Why deferred:** Blocked on build first.

### AC-051: Dashboard UI builds and renders (specs/dashboard.spec.md)
**Goal:** `npm run build:dashboard` produces a working Vite build showing cascade status graph
**Blockers:** AC-001

### AC-060: Python tooling scripts work in container
**Goal:** `python3 scripts/generate_index.py` runs without import errors in the OpenCode container
**Why deferred:** Python is a support language; TypeScript is primary

### AC-061: All 6 OpenCode agent definitions verified working
**Goal:** spec-writer, coordinator, codegen, verifier, simulator, test-writer — all resolve to working models in the container

### AC-070: Full regression — all TODO phases stay green after changes
**Goal:** After any development work, all 10 phases (P0-P9) remain at stated completion counts
**Why deferred:** Long-term quality gate
