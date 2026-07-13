# speclang-header lines:38
# id: @specs/docs
# version: 1.0.0
# layer: 5

# SpecLang Bootstrap Plan

**Goal**: Build SpecLang using SpecLang itself (meta-circular)

## Current State Assessment

### Specs vs NORTH_STAR Alignment

| NORTH_STAR Principle | Spec Coverage | Gap |
|---------------------|---------------|-----|
| Specs are source code | ✅ Well defined | - |
| Universal headers | ✅ `headers.spec.md` complete | Implementation needed |
| Agent ownership | ✅ `agent-protocol.spec.md` defined | No guard system yet |
| The Cascade | ✅ `cascade.spec.md` detailed | No daemon implementation |
| Context never lost | ⚠️ SQLite spec exists | No FTS/vector implementation |
| Git is memory | ⚠️ `git-history.spec.md` exists | No automation |
| Autonomous depth | ⚠️ Specs lack `agent_support: agent_autonomous` | Need depth review |

### Implementation Status

| Component | Spec Exists | Code Exists | Status |
|-----------|-------------|-------------|--------|
| speclangd (daemon) | ✅ `daemon.spec.md` | ❌ | **NOT STARTED** |
| MCP Server | ✅ `mcp.spec.md` | ⚠️ Partial | Needs completion |
| SQLite/DB | ✅ `sqlite.spec.md` | ⚠️ Schema only | Needs implementation |
| Validation System | ⚠️ Scattered | ⚠️ `validation.ts` | Needs consolidation |
| Code Generator | ⚠️ `compiler.spec.md` | ❌ | **NOT STARTED** |
| Agent Protocol | ✅ `agent-protocol.spec.md` | ❌ | **NOT STARTED** |
| Pipeline | ✅ `pipeline.spec.md` | ❌ | **NOT STARTED** |
| Guard System | ⚠️ Mentioned | ❌ | **NOT STARTED** |
| OpenCode Plugin | ✅ `opencode-plugin.spec.md` | ⚠️ Partial | Needs completion |

short: id: @specs/docs
layer: 5
---

## Build Order (Dependency Graph)

```
Phase 0: Foundation (BUILD FIRST)
├── sqlite.spec.md → src/db/speclang-db.ts
├── headers.spec.md → parser + validator
└── validation-tool.spec.md → validation CLI

Phase 1: Core Runtime
├── daemon.spec.md → speclangd (Rust)
├── agent-protocol.spec.md → session manager
└── cascade.spec.md → event router

Phase 2: MCP Interface
├── mcp.spec.md → MCP server (complete)
├── mcp.spec.dir/tools/*.spec.md → tool implementations
└── mcp.spec.dir/sse-stream.spec.md → real-time events

Phase 3: Code Generation
├── compiler.spec.md → codegen engine
├── stdlib.spec.md → type mappings
└── *.ts.spec, *.go.spec → target generators

Phase 4: Pipeline & Guard
├── pipeline.spec.md → build executor
├── recovery.spec.md → self-healing
└── agent-protocol.spec.md#guard → file ownership

Phase 5: Meta-Circular
├── speclang builds speclang specs
└── Full autonomous operation

Phase 6: UI Dashboard
├── ui.spec.md → dashboard components
└── state.spec.md → state management

Phase 7: Examples & Documentation
└── examples.spec.md → sample projects

Phase 8: Tooling Scripts
└── tooling.spec.md → Python scripts
```

---

## Phase Breakdown

### Phase 0: Foundation (25 stories)

**Core Infrastructure:**
| Story | Spec | Outputs |
|-------|------|---------|
| SQLite database layer | `sqlite.spec.md` | `src/db/` |
| Spec header parser | `headers.spec.md` | `src/parser/` |
| Spec indexer | `project-layout.spec.md` | `src/indexer/` |
| User workflow | `workflow.spec.md` | `src/workflow/` |
| Configuration | `config.spec.md` | `src/config/` |

**Project Structure:**
| Story | Spec | Outputs |
|-------|------|---------|
| Directory structure | `directory-structure.spec.md` | `src/directory/` |
| Deployment modes | `deployment.spec.md` | `src/deployment/` |
| Symlinks | `symlinks.spec.md` | `src/symlinks/` |
| Project layout | `project-layout.spec.md` | `src/cli/init.rs` |

**Core Systems:**
| Story | Spec | Outputs |
|-------|------|---------|
| Ralph loop | `ralph-loop.spec.md` | `src/ralph/` |
| Standard library | `stdlib.spec.md` | `src/stdlib/` |
| Skills pack | `skills.spec.md` | `.opencode/skills/` |
| Agent Tools API | `tools.spec.md` | `src/tools/` |
| Test specs | `test-specs.spec.md` | `src/test-specs/` |
| Lens system | `lenses.spec.md` | `src/lenses/` |
| Dynamic splitting | `dynamic-split.spec.md` | `src/split/` |

**Header & Cascade:**
| Story | Spec | Outputs |
|-------|------|---------|
| Header fields | `headers.spec.md` | `src/parser/fields.ts` |
| Header validation | `headers.spec.md` | `src/parser/validation/` |
| Cascade triggers | `cascade.spec.dir/triggers.spec.md` | `src/cascade/triggers.ts` |
| Cascade depth | `cascade.spec.dir/convergence.spec.md` | `src/cascade/convergence.ts` |

**UI Foundation:**
| Story | Spec | Outputs |
|-------|------|---------|
| UI interactions | `ui.spec.dir/interactions.spec.md` | `src/dashboard/interactions/` |
| UI testing | `ui.spec.dir/testing.spec.md` | `src/dashboard/testing/` |
| UI visual design | `ui.spec.dir/visual-design.spec.md` | `src/dashboard/styles/` |

**Validation:**
| Story | Spec | Outputs |
|-------|------|---------|
| Validation rules | `headers.spec.md` | `src/parser/validation-rules.ts` |
| Project maturity | `project-maturity.spec.md` | `src/maturity/` |

### Phase 1: Core Runtime (11 stories)

**Daemon:**
| Story | Spec | Outputs |
|-------|------|---------|
| Daemon architecture | `daemon.spec.md` | `src/daemon/` |
| Daemon events | `daemon.spec.dir/events.spec.md` | `src/daemon/events/` |
| Daemon convergence | `daemon.spec.dir/convergence.spec.md` | `src/daemon/convergence/` |
| Daemon routing | `daemon.spec.dir/routing.spec.md` | `src/daemon/routing/` |
| Daemon locks | `mcp.spec.dir/tools/locks.spec.md` | `src/daemon/locks/` |

**Agent System:**
| Story | Spec | Outputs |
|-------|------|---------|
| Agent sessions | `agent-protocol.spec.md` | `src/agents/` |
| Agent session lifecycle | `agent-protocol.spec.dir/sessions.spec.md` | `src/agents/sessions/` |
| Agent ownership | `agent-protocol.spec.dir/ownership.spec.md` | `src/agents/ownership/` |

**Integration:**
| Story | Spec | Outputs |
|-------|------|---------|
| OpenCode integration | `opencode.spec.md` | `src/opencode/` |
| Cascade protocol | `cascade-protocol.spec.md` | `src/cascade/` |
| Validation tool | `validation-tool.spec.md` | `src/validation/` |

### Phase 2: MCP Interface (12 stories)

| Story | Spec | Outputs |
|-------|------|---------|
| MCP server | `mcp.spec.md` | `src/mcp/` |
| MCP CLI | `mcp.spec.dir/cli.spec.md` | `src/cli/` |
| MCP daemon | `mcp-daemon.spec.md` | `src/daemon/enterprise/` |
| MCP UI tools | `mcp-ui-tools.spec.md` | `src/mcp/tools/` |
| MCP OpenAPI | `mcp/openapi-generation.spec.md` | `src/mcp/openapi/` |
| MCP SSE | `mcp.spec.dir/sse-stream.spec.md` | `src/mcp/sse.ts` |
| MCP auth | `mcp.spec.dir/authentication.spec.md` | `src/mcp/auth/` |
| MCP errors | `mcp.spec.dir/error-handling.spec.md` | `src/mcp/errors/` |
| MCP config | `mcp.spec.dir/configuration.spec.md` | `src/mcp/config/` |
| MCP commands | `mcp.spec.dir/tools/commands.spec.md` | `src/mcp/commands/` |
| MCP search | `mcp.spec.dir/tools/search.spec.md` | `src/mcp/search/` |
| MCP overview | `mcp.spec.dir/overview.spec.md` | `src/mcp/index.ts` |

### Phase 3: Code Generation (6 stories)

| Story | Spec | Outputs |
|-------|------|---------|
| Code generator | `compiler.spec.md` | `src/codegen/` |
| Templates | `compiler.spec.dir/templates.spec.md` | `src/templates/` |
| Target languages | `compiler.spec.dir/targets.spec.md` | `src/compiler/targets/` |
| Compiler phases | `compiler.spec.dir/phases.spec.md` | `src/compiler/phases/` |
| Go generator | `compiler.spec.dir/go.spec.md` | `src/compiler/go/` |
| Python generator | `compiler.spec.dir/python.spec.md` | `src/compiler/python/` |

### Phase 4: Pipeline & Guard (7 stories)

| Story | Spec | Outputs |
|-------|------|---------|
| Pipeline executor | `pipeline.spec.md` | `src/pipeline/` |
| Guard system | `agent-protocol.spec.md` | `src/guard/` |
| Recovery system | `recovery.spec.md` | `src/recovery/` |
| Git history | `git-history.spec.md` | `src/git/` |
| Pipeline hooks | `pipeline.spec.dir/hooks.spec.md` | `src/pipeline/hooks/` |
| Pipeline stages | `pipeline.spec.dir/build.spec.md` | `src/pipeline/stages/` |
| Recovery actions | `recovery.spec.dir/retry.spec.md` | `src/recovery/actions/` |

### Phase 5: Meta-Circular (5 stories)

| Story | Spec | Outputs |
|-------|------|---------|
| Self-specifying specs | `bootstrap.spec.md` | `specs/speclang.spec.md` |
| Autonomous test | `autonomous-validation.spec.md` | Test results |
| Transition workflows | `transition-workflows.spec.md` | `src/transition/` |
| Safety nets | `safety-nets.spec.md` | `src/safety/` |
| Meta-circular bootstrap | `bootstrap.spec.md` | `src/bootstrap/` |

### Phase 6: UI Dashboard (3 stories)

| Story | Spec | Outputs |
|-------|------|---------|
| Dashboard | `ui.spec.md` | `src/dashboard/` |
| Components | `ui.spec.dir/components/cascade-graph.spec.md` | `src/dashboard/components/` |
| State management | `state.spec.md` | `src/dashboard/state/` |

### Phase 7: Examples & Documentation (2 stories)

| Story | Spec | Outputs |
|-------|------|---------|
| Example projects | `examples.spec.md` | `examples/` |
| Hello-world | `examples.spec.dir/hello-world.spec.md` | `examples/hello-world/` |

### Phase 8: Tooling Scripts (1 story)

| Story | Spec | Outputs |
|-------|------|---------|
| Python tooling | `tooling.spec.md` | `*.py`, `scripts/` |

---

## Quick Reference: File Mapping

| Spec | Should Generate | Priority |
|------|-----------------|----------|
| `sqlite.spec.md` | `src/db/*.ts` | P0 |
| `headers.spec.md` | `src/parser/*.ts` | P0 |
| `daemon.spec.md` | `src/daemon/**/*.rs` | P1 |
| `agent-protocol.spec.md` | `src/agents/*.ts` | P1 |
| `mcp.spec.md` | `src/mcp/*.ts` | P2 |
| `compiler.spec.md` | `src/codegen/*.ts` | P3 |
| `pipeline.spec.md` | `src/pipeline/*.ts` | P4 |
| `recovery.spec.md` | `src/recovery/*.ts` | P4 |

---

## File Counts Summary

| Phase | Stories | Key Outputs |
|-------|---------|-------------|
| 0 Foundation | 25 | `src/db/`, `src/parser/`, `src/config/`, `src/tools/` |
| 1 Core Runtime | 11 | `src/daemon/`, `src/agents/`, `src/cascade/` |
| 2 MCP Interface | 12 | `src/mcp/`, `src/cli/` |
| 3 Code Generation | 6 | `src/codegen/`, `src/templates/`, `src/compiler/` |
| 4 Pipeline & Guard | 7 | `src/pipeline/`, `src/guard/`, `src/recovery/`, `src/git/` |
| 5 Meta-Circular | 5 | `src/safety/`, `src/transition/`, `src/bootstrap/` |
| 6 UI Dashboard | 3 | `src/dashboard/` |
| 7 Examples | 2 | `examples/` |
| 8 Tooling | 1 | `*.py`, `scripts/` |
| **Total** | **72** | |

---

## Success Metrics

After completing all phases:

1. **Self-Hosting**: `speclang build` on this repo generates working code
2. **Autonomous Depth**: All specs have `agent_support: agent_autonomous`
3. **Convergence**: Cascade completes in < 30 seconds
4. **Quality**: Generated code compiles and tests pass
5. **Portability**: `specs/` folder alone rebuilds entire project

---

## Next Step

Run **Phase 0.1** to start Foundation.

```bash
# Start the bootstrap
@llm "Read @specs/sqlite.spec.md and implement src/db/index.ts..."
```
