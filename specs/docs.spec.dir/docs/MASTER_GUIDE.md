# speclang-header lines:21
# id: @specs/docs
# version: 1.0.0
# layer: 5

# SpecLang Bootstrap - Master Guide

## Quick Start

```bash
# 1. Read the vision
cat docs/NORTH_STAR.md

# 2. Start the bootstrap
cat PROMPT.md  # Point your AI here

# 3. Or run automated loop
./.ralph/ralph.sh 100
```

---

## Complete Phase Overview

| Phase | Name | Stories | Status |
|-------|------|---------|--------|
| 0 | Foundation | 25 | ⬜ |
| 1 | Core Runtime | 11 | ⬜ |
| 2 | MCP Interface | 12 | ⬜ |
| 3 | Code Generation | 6 | ⬜ |
| 4 | Pipeline & Guard | 7 | ⬜ |
| 5 | Meta-Circular | 5 | ⬜ |
| 6 | UI Dashboard | 3 | ⬜ |
| 7 | Examples & Documentation | 2 | ⬜ |
| 8 | Tooling Scripts | 1 | ⬜ |
| **Total** | | **72** | |

---

## Phase Details

### Phase 0: Foundation (25 stories)
| # | Story | Prompt | Outputs |
|---|-------|--------|---------|
| 0.1 | SQLite database layer | `phase-0.1-sqlite.md` | `src/db/` |
| 0.2 | Spec header parser | `phase-0.2-parser.md` | `src/parser/` |
| 0.3 | Spec indexer | `phase-0.3-indexer.md` | `src/indexer/` |
| 0.4 | User workflow | `phase-0.4-workflow.md` | `src/workflow/` |
| 0.5 | Configuration system | `phase-0.5-config.md` | `src/config/` |
| 0.6 | Directory structure | `phase-0.6-directory-structure.md` | `src/structure/` |
| 0.7 | Deployment | `phase-0.7-deployment.md` | `src/deploy/` |
| 0.8 | Symlinks | `phase-0.8-symlinks.md` | `src/symlinks/` |
| 0.9 | Ralph loop | `phase-0.9-ralph-loop.md` | `.ralph/` |
| 0.10 | Standard library | `phase-0.10-stdlib.md` | `src/stdlib/` |
| 0.11 | Skills | `phase-0.11-skills.md` | `src/skills/` |
| 0.12 | Tools | `phase-0.12-tools.md` | `src/tools/` |
| 0.13 | Test specs | `phase-0.13-test-specs.md` | `specs/test-*.spec.md` |
| 0.14 | Lens system | `phase-0.14-lenses.md` | `src/lenses/` |
| 0.15 | Dynamic spec splitting | `phase-0.15-dynamic-split.md` | `src/split/` |
| 0.16 | Project layout | `phase-0.16-project-layout.md` | `src/layout/` |
| 0.17 | Header field definitions | `phase-0.17-headers-fields.md` | `src/parser/fields.ts` |
| 0.18 | Header validation rules | `phase-0.18-headers-validation.md` | `src/parser/validation/` |
| 0.19 | Cascade triggers | `phase-0.19-cascade-triggers.md` | `src/cascade/triggers.ts` |
| 0.20 | Cascade depth | `phase-0.20-cascade-depth.md` | `src/cascade/convergence.ts` |
| 0.21 | UI interactions | `phase-0.21-ui-interactions.md` | `src/dashboard/interactions/` |
| 0.22 | UI testing | `phase-0.22-ui-testing.md` | `src/dashboard/testing/` |
| 0.23 | UI visual design | `phase-0.23-ui-visual.md` | `src/dashboard/styles/` |
| 0.24 | Validation rules | `phase-0.24-validation-rules.md` | `src/parser/validation-rules.ts` |
| 0.25 | Project maturity levels | `phase-0.25-project-maturity.md` | `src/maturity/` |

### Phase 1: Core Runtime (11 stories)
| # | Story | Prompt | Outputs |
|---|-------|--------|---------|
| 1.1 | speclangd daemon | `phase-1.1-daemon.md` | `src/daemon/` |
| 1.2 | Agent session manager | `phase-1.2-agents.md` | `src/agents/` |
| 1.3 | OpenCode integration | `phase-1.3-opencode.md` | `src/opencode/` |
| 1.4 | Cascade protocol | `phase-1.4-cascade-protocol.md` | `src/cascade/` |
| 1.5 | Validation tool | `phase-1.5-validation-tool.md` | `src/validation/` |
| 1.6 | Daemon events | `phase-1.6-daemon-events.md` | `src/daemon/events/` |
| 1.7 | Daemon convergence | `phase-1.7-daemon-convergence.md` | `src/daemon/convergence/` |
| 1.8 | Daemon routing | `phase-1.8-daemon-routing.md` | `src/daemon/routing/` |
| 1.9 | Daemon locks | `phase-1.9-daemon-locks.md` | `src/daemon/locks/` |
| 1.10 | Agent sessions | `phase-1.10-agent-sessions.md` | `src/agents/sessions/` |
| 1.11 | Agent ownership | `phase-1.11-agent-ownership.md` | `src/agents/ownership/` |

### Phase 2: MCP Interface (12 stories)
| # | Story | Prompt | Outputs |
|---|-------|--------|---------|
| 2.1 | MCP server | `phase-2.1-mcp-server.md` | `src/mcp/` |
| 2.2 | MCP CLI | `phase-2.2-mcp-cli.md` | `src/cli/` |
| 2.3 | MCP daemon | `phase-2.3-mcp-daemon.md` | `src/mcp/daemon/` |
| 2.4 | MCP UI tools | `phase-2.4-mcp-ui-tools.md` | `src/mcp/ui/` |
| 2.5 | MCP OpenAPI | `phase-2.5-mcp-openapi.md` | `src/mcp/openapi/` |
| 2.6 | MCP SSE streaming | `phase-2.6-mcp-sse.md` | `src/mcp/sse/` |
| 2.7 | MCP authentication | `phase-2.7-mcp-auth.md` | `src/mcp/auth/` |
| 2.8 | MCP error handling | `phase-2.8-mcp-error.md` | `src/mcp/errors/` |
| 2.9 | MCP configuration | `phase-2.9-mcp-config.md` | `src/mcp/config/` |
| 2.10 | MCP command queue | `phase-2.10-mcp-commands.md` | `src/mcp/commands/` |
| 2.11 | MCP search tools | `phase-2.11-mcp-search.md` | `src/mcp/search/` |
| 2.12 | MCP overview | `phase-2.12-mcp-overview.md` | `src/mcp/index.ts` |

### Phase 3: Code Generation (6 stories)
| # | Story | Prompt | Outputs |
|---|-------|--------|---------|
| 3.1 | Code generator | `phase-3.1-codegen.md` | `src/codegen/` |
| 3.2 | Templates | `phase-3.2-templates.md` | `src/templates/` |
| 3.3 | Target languages | `phase-3.3-targets.md` | `src/codegen/targets/` |
| 3.4 | Compiler phases | `phase-3.4-compiler-phases.md` | `src/compiler/phases/` |
| 3.5 | Go generator | `phase-3.5-go-generator.md` | `src/compiler/go/` |
| 3.6 | Python generator | `phase-3.6-python-generator.md` | `src/compiler/python/` |

### Phase 4: Pipeline & Guard (7 stories)
| # | Story | Prompt | Outputs |
|---|-------|--------|---------|
| 4.1 | Pipeline executor | `phase-4.1-pipeline.md` | `src/pipeline/` |
| 4.2 | Guard system | `phase-4.2-guard.md` | `src/guard/` |
| 4.3 | Recovery system | `phase-4.3-recovery.md` | `src/recovery/` |
| 4.4 | Git history | `phase-4.4-git-history.md` | `src/git/` |
| 4.5 | Pipeline hooks | `phase-4.5-hooks.md` | `src/pipeline/hooks/` |
| 4.6 | Pipeline stages | `phase-4.6-stages.md` | `src/pipeline/stages/` |
| 4.7 | Recovery actions | `phase-4.7-recovery-actions.md` | `src/recovery/actions/` |

### Phase 5: Meta-Circular (5 stories)
| # | Story | Prompt | Outputs |
|---|-------|--------|---------|
| 5.1 | Self-specifying specs | `phase-5.1-self-specifying.md` | `specs/speclang.spec.md` |
| 5.2 | Autonomous test | `phase-5.2-autonomous-test.md` | Test results |
| 5.3 | Transition workflows | `phase-5.3-transition-workflows.md` | `src/transitions/` |
| 5.4 | Safety nets | `phase-5.4-safety-nets.md` | `src/safety/` |
| 5.5 | Meta-circular bootstrap | `phase-5.5-meta-circular.md` | `src/bootstrap/` |

### Phase 6: UI Dashboard (3 stories)
| # | Story | Prompt | Outputs |
|---|-------|--------|---------|
| 6.1 | System monitoring dashboard | `phase-6.1-ui-dashboard.md` | `src/ui/` |
| 6.2 | UI component library | `phase-6.2-ui-components.md` | `src/ui/components/` |
| 6.3 | UI state management | `phase-6.3-ui-state.md` | `src/ui/state/` |

### Phase 7: Examples & Documentation (2 stories)
| # | Story | Prompt | Outputs |
|---|-------|--------|---------|
| 7.1 | Example projects | `phase-7.1-examples.md` | `examples/` |
| 7.2 | Hello-world example | `phase-7.2-hello-world.md` | `examples/hello-world/` |

### Phase 8: Tooling Scripts (1 story)
| # | Story | Prompt | Outputs |
|---|-------|--------|---------|
| 8.1 | Python tooling scripts | `phase-8.1-scripts-python.md` | `*.py`, `scripts/` |

---

## SIP Skills (65 total)

SpecLang Implementation Proposals (SIPs) define core behaviors for agents:

| SIP | Name | Description |
|-----|------|-------------|
| 000 | What is SpecLang | Introduction and philosophy |
| 001 | How to Write SIP | SIP format and conventions |
| 002 | Header Format | Spec header structure |
| 003 | Block System | Content block definitions |
| 004 | Reference System | `@ref:` syntax and resolution |
| 005 | Splitting and Sizing | How to size specs |
| 006 | Agent Protocol | Agent communication patterns |
| 007 | Cascade System | Reactive event propagation |
| 008 | Configuration | Project configuration |
| 009 | File Naming | Naming conventions |
| 010 | Daemon | File watcher daemon |
| 011 | MCP Tools | MCP server tools |
| 012 | Codegen | Code generation |
| 013 | Pipeline | Build pipeline |
| 014 | Guard | File ownership |
| 015 | Self-Specifying | Meta-circular specs |
| 016 | Autonomous Validation | Agent readiness checks |
| 017 | Layer Definitions | Abstraction layers (0-10) |
| 018 | Maturity Levels | Project maturity levels |
| 019 | Agent Support | Agent support modes |
| 020 | Agent Behavior | Behavior matrix |
| 021 | Semantic Definitions | Value semantics |
| 022 | Validation | Validation rules |
| 023 | Safety Nets | Error detection |
| 024 | Test Specs | Testing specifications |
| 025 | Skills | Skill system |
| 026 | Stdlib | Standard library |
| 027 | Recovery | Self-healing |
| 028 | Cascade Protocol | Cascade mechanics |
| 029 | Tools | Tool definitions |
| 030 | Git History | Git integration |
| 031 | Symlinks | Symlink management |
| 032 | Directory Structure | Project structure |
| 033 | Workflow | User workflows |
| 034 | Index Format | Index file structure |
| 035 | Lenses | View transformations |
| 036 | UI | Dashboard interface |
| 037 | CLI | Command-line interface |
| 038 | OpenCode | OpenCode integration |
| 039 | Deployment | Deployment modes |
| 040 | Dynamic Split | Spec splitting |
| 041 | Examples | Example projects |
| 042 | Project Layout | Project initialization |
| 043 | MCP Daemon | MCP daemon integration |
| 044 | Bootstrap | Bootstrap process |
| 045 | Ralph Loop | Automated execution |
| 046 | Validation Tool | Validation CLI |
| 047 | Transition Workflows | Maturity transitions |
| 048 | Dependency Graph | Spec dependencies |
| 049 | OpenCode Plugin | Plugin implementation |
| 050 | MCP Tools | MCP tool implementations |
| 051 | Daemon Events | Event handling |
| 052 | Daemon Locks | File locking |
| 053 | Pipeline Hooks | Build hooks |
| 054 | SQLite Schema | Database schema |
| 055 | Cascade Triggers | Event triggers |
| 056 | Agent Sessions | Session management |
| 057 | UI State | Dashboard state |
| 058 | Spec References | Reference resolution |
| 059 | Split Merge | Spec merging |
| 060 | UI Interactions | Dashboard interactions |
| 061 | UI Testing | Dashboard testing |
| 062 | Meta Circular | Self-hosting |
| 063 | Examples | Hello world |
| 064 | CLI Commands | CLI implementation |

---

## Key Files

### Root Level (Entry Points)
```
PROMPT.md           → Builder agent (point AI here first)
PROMPT-VERIFY.md    → Adversary agent (verification)
BOOTSTRAP.md        → Master orchestration
TODO.md             → Task tracking
```

### Documentation
```
docs/
├── NORTH_STAR.md       → Vision and principles
├── BOOTSTRAP_PLAN.md   → Detailed bootstrap plan
├── MASTER_GUIDE.md     → This file
└── prompts/            → Phase-by-phase prompts (67 files)
```

### Ralph Loop (Automated Execution)
```
.ralph/
├── prd.json        → Stories across phases (72 stories)
├── prompt.md       → Loop prompt
├── progress.md     → Progress tracking
├── ralph.sh        → Automated loop script
└── README.md       → Documentation
```

### SIP Skills (Agent Instructions)
```
.opencode/skills/
├── sip-000-what-is-speclang-v0.md
├── sip-001-how-to-write-sip-speclang-v0.md
├── ...
└── sip-064-*.md    (65 files total)
```

### Agent Definitions
```
.opencode/agents/
├── speclang-coordinator.md    → Orchestrator agent
├── speclang-spec-writer.md    → Spec writing agent
├── speclang-code-gen.md       → Code generation agent
├── speclang-verifier.md       → Verification agent
├── speclang-simulator.md      → Simulation agent
└── speclang-simulator-verify.md → Combined simulator/verify
```

### Specs (Source of Truth)
```
specs/
├── project.scl          → North star spec (layer 0)
├── core.spec.md         → Core architecture
├── cascade.spec.md      → Cascade mechanics
├── headers.spec.md      → Header format
├── bootstrap.spec.md    → Bootstrap process
├── sqlite.spec.md       → Database schema
├── daemon.spec.md       → File watcher
├── agent-protocol.spec.md → Agent communication
├── mcp.spec.md          → MCP server
├── compiler.spec.md     → Code generation
├── pipeline.spec.md     → Build pipeline
├── recovery.spec.md     → Self-healing
├── ui.spec.md           → Dashboard UI
└── ...                  → 275 total specs
```

---

## The Two-Agent System

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│   PROMPT.md                                                    │
│       │                                                        │
│       ▼                                                        │
│   ┌─────────────┐         ┌─────────────┐                     │
│   │   BUILDER   │ ──────► │  ADVERSARY  │                     │
│   │  Generates  │         │  Validates  │                     │
│   │   code      │ ◄────── │   work      │                     │
│   └─────────────┘  fixes  └─────────────┘                     │
│         │                        │                             │
│         │ approved               │                             │
│         ▼                        ▼                             │
│   ┌─────────────────────────────────────┐                     │
│   │         GIT COMMITS                  │                     │
│   │   (speclang: prefix required)       │                     │
│   └─────────────────────────────────────┘                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## NORTH_STAR Principle Coverage

| Principle | Spec Coverage | Prompts |
|-----------|---------------|---------|
| Specs are source code | ✅ `spec-format.spec.md`, `headers.spec.md` | All phases |
| Universal headers | ✅ `headers.spec.md` | Phase 0.2, 0.17, 0.18 |
| Agent ownership | ✅ `agent-protocol.spec.md` | Phase 1.2, 1.11, 4.2 |
| The Cascade | ✅ `cascade.spec.md` | Phase 1.4, 0.19, 0.20 |
| Context never lost | ✅ `sqlite.spec.md` | Phase 0.1 |
| Git is memory | ✅ `git-history.spec.md` | Phase 4.4 |
| Autonomous depth | ✅ `autonomous-validation.spec.md` | Phase 5.2 |
| OpenCode integration | ✅ `opencode-plugin.spec.md` | Phase 1.3 |
| Concurrency | ✅ `core.spec.dir/concurrency.spec.md` | Phase 1.2 |
| Self-specifying | ✅ `bootstrap.spec.md` | Phase 5.1, 5.5 |

---

## File Counts

| Category | Count |
|----------|-------|
| Phase prompts | 67 |
| SIP skills | 65 |
| Agent definitions | 6 |
| Spec files | 275 |
| Total bootstrap stories | 72 |
| Phases | 9 |

---

## Validation Commands

```bash
# Check progress
cat .ralph/prd.json | jq '[.phases[].stories[] | select(.passes == false)] | length'

# Run tests
bun test

# TypeScript check
bun run tsc --noEmit

# Validate specs
speclang validate

# Check commits
git log --oneline --grep="speclang:" | wc -l
```

---

## Success Criteria

Bootstrap is COMPLETE when:

1. ✅ All 72 stories have `passes: true`
2. ✅ All code in `src/` compiles
3. ✅ All tests pass
4. ✅ All commits have `speclang:` prefix
5. ✅ Self-hosting test passes (specs/ → generates working src/)
6. ✅ MCP server responds to requests
7. ✅ Cascade detects convergence
8. ✅ Pipeline runs successfully
9. ✅ UI dashboard displays real-time status

---

## Output When Complete

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║              🎉 SPECLANG BOOTSTRAP COMPLETE! 🎉                  ║
║                                                                  ║
║  Generated:                                                      ║
║    - src/db/          SQLite database layer                      ║
║    - src/parser/      Spec header parser                         ║
║    - src/indexer/     Spec index generator                       ║
║    - src/workflow/    User workflow system                       ║
║    - src/config/      Configuration management                   ║
║    - src/daemon/      File watcher daemon                        ║
║    - src/agents/      Agent session manager                      ║
║    - src/opencode/    OpenCode integration                       ║
║    - src/cascade/     Cascade protocol                           ║
║    - src/mcp/         MCP server                                 ║
║    - src/cli/         CLI interface                              ║
║    - src/codegen/     Code generator                             ║
║    - src/templates/   Code templates                             ║
║    - src/pipeline/    Build pipeline                             ║
║    - src/guard/       File ownership guard                       ║
║    - src/recovery/    Self-healing system                        ║
║    - src/git/         Git history integration                    ║
║    - src/validation/  Validation tool                            ║
║    - src/ui/          System dashboard                           ║
║    - src/maturity/    Project maturity system                    ║
║    - src/safety/      Safety nets                                ║
║    - src/bootstrap/   Meta-circular bootstrap                    ║
║                                                                  ║
║  All tests passing.                                              ║
║  All commits with speclang: prefix.                              ║
║  Self-hosting verified.                                          ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## To Start Now

```bash
# Point your AI to:
cat PROMPT.md

# Or run the automated loop:
./.ralph/ralph.sh 100
```
