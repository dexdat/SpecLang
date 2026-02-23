# SpecLang Bootstrap - Master Orchestration

This is the master control file for running the SpecLang bootstrap. It orchestrates the builder and adversary agents in a loop until convergence.

## The Two-Agent System

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    SPECIFIED BOOTSTRAP                          │
│                                                                 │
│   ┌─────────────┐         ┌─────────────┐                      │
│   │   BUILDER   │ ──────► │  ADVERSARY  │                      │
│   │  (PROMPT.md)│         │(PROMPT-     │                      │
│   │             │ ◄────── │VERIFY.md)   │                      │
│   └─────────────┘  fixes  └─────────────┘                      │
│         │                        │                              │
│         │ approved               │                              │
│         ▼                        ▼                              │
│   ┌─────────────────────────────────────┐                      │
│   │         GIT COMMITS                  │                      │
│   │   (speclang: prefix required)       │                      │
│   └─────────────────────────────────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## How to Run

### Option 1: Single Agent (Builder Self-Verifies)

```
1. Read PROMPT.md
2. Follow startup sequence
3. Generate code from specs
4. Self-verify using PROMPT-VERIFY.md checklist
5. Commit if passed, fix if failed
6. Repeat until all stories complete
```

### Option 2: Two Agents (Builder + Adversary)

```
1. Session A: Read PROMPT.md, generate code, output "READY FOR REVIEW"
2. Session B: Read PROMPT-VERIFY.md, validate, output "APPROVED" or "REJECTED: <issues>"
3. Session A: If rejected, fix issues, output "READY FOR REVIEW" again
4. Repeat step 2-3 until approved
5. Session A: Commit with speclang: prefix
6. Move to next story
```

### Option 3: Ralph Loop (Automated)

```bash
# Run the automated loop
./.ralph/ralph.sh 50
```

---

## Bootstrap Phases

Execute in this order:

### Phase 0: Foundation (START HERE)
| Story | Spec | Outputs | Status |
|-------|------|---------|--------|
| P0-001 | specs/sqlite.spec.md | src/db/*.ts | ⬜ |
| P0-002 | specs/headers.spec.md | src/parser/*.ts | ⬜ |
| P0-003 | specs/project-layout.spec.md | src/indexer/*.ts | ⬜ |
| P0-004 | specs/workflow.spec.md | src/workflow/*.ts | ⬜ |
| P0-005 | specs/config.spec.md | src/config/*.ts | ⬜ |
| P0-006 | specs/directory-structure.spec.md | src/structure/*.ts | ⬜ |
| P0-007 | specs/deployment.spec.md | src/deploy/*.ts | ⬜ |
| P0-008 | specs/symlinks.spec.md | src/symlinks/*.ts | ⬜ |
| P0-009 | specs/ralph-loop.spec.md | .ralph/*.sh | ⬜ |
| P0-010 | specs/stdlib.spec.md | src/stdlib/*.ts | ⬜ |
| P0-011 | specs/skills.spec.md | src/skills/*.ts | ⬜ |
| P0-012 | specs/tools.spec.md | src/tools/*.ts | ⬜ |
| P0-013 | specs/test-specs.spec.md | specs/test-*.spec.md | ⬜ |
| P0-014 | specs/lenses.spec.md | src/lenses/*.ts | ⬜ |
| P0-015 | specs/dynamic-split.spec.md | src/split/*.ts | ⬜ |
| P0-016 | specs/project-layout.spec.md | src/layout/*.ts | ⬜ |

### Phase 1: Core Runtime
| Story | Spec | Outputs | Status |
|-------|------|---------|--------|
| P1-001 | specs/daemon.spec.md | src/daemon/** | ⬜ |
| P1-002 | specs/agent-protocol.spec.md | src/agents/** | ⬜ |
| P1-003 | specs/opencode.spec.md | src/opencode/** | ⬜ |
| P1-004 | specs/cascade-protocol.spec.md | src/cascade/** | ⬜ |
| P1-005 | specs/validation-tool.spec.md | src/validation/** | ⬜ |
| P1-006 | specs/daemon.spec.dir/events.spec.md | src/daemon/events/** | ⬜ |
| P1-007 | specs/daemon.spec.dir/convergence.spec.md | src/daemon/convergence/** | ⬜ |
| P1-008 | specs/daemon.spec.dir/routing.spec.md | src/daemon/routing/** | ⬜ |
| P1-009 | specs/mcp.spec.dir/tools/locks.spec.md | src/daemon/locks/** | ⬜ |

### Phase 2: MCP Interface
| Story | Spec | Outputs | Status |
|-------|------|---------|--------|
| P2-001 | specs/mcp.spec.md | src/mcp/** | ⬜ |
| P2-002 | specs/mcp.spec.dir/cli.spec.md | src/cli/** | ⬜ |
| P2-003 | specs/mcp-daemon.spec.md | src/mcp/daemon/** | ⬜ |
| P2-004 | specs/mcp-ui-tools.spec.md | src/mcp/ui/** | ⬜ |
| P2-005 | specs/mcp/openapi-generation.spec.md | src/mcp/openapi/** | ⬜ |
| P2-006 | specs/mcp.spec.dir/sse-stream.spec.md | src/mcp/sse/** | ⬜ |

### Phase 3: Code Generation
| Story | Spec | Outputs | Status |
|-------|------|---------|--------|
| P3-001 | specs/compiler.spec.md | src/codegen/** | ⬜ |
| P3-002 | specs/compiler.spec.dir/templates.spec.md | src/templates/** | ⬜ |
| P3-003 | specs/compiler.spec.dir/targets.spec.md | src/codegen/targets/** | ⬜ |

### Phase 4: Pipeline
| Story | Spec | Outputs | Status |
|-------|------|---------|--------|
| P4-001 | specs/pipeline.spec.md | src/pipeline/** | ⬜ |
| P4-002 | specs/agent-protocol.spec.md | src/guard/** | ⬜ |
| P4-003 | specs/recovery.spec.md | src/recovery/** | ⬜ |
| P4-004 | specs/git-history.spec.md | src/git/** | ⬜ |
| P4-005 | specs/pipeline.spec.dir/hooks.spec.md | src/pipeline/hooks/** | ⬜ |
| P4-006 | specs/pipeline.spec.dir/build.spec.md | src/pipeline/stages/** | ⬜ |

### Phase 5: Meta-Circular
| Story | Spec | Outputs | Status |
|-------|------|---------|--------|
| P5-001 | specs/bootstrap.spec.md | specs/speclang.spec.md | ⬜ |
| P5-002 | specs/autonomous-validation.spec.md | Test results | ⬜ |
| P5-003 | specs/transition-workflows.spec.md | src/transitions/** | ⬜ |
| P5-004 | specs/safety-nets.spec.md | src/safety/** | ⬜ |

### Phase 6: UI Dashboard
| Story | Spec | Outputs | Status |
|-------|------|---------|--------|
| P6-001 | specs/ui.spec.md | src/ui/** | ⬜ |
| P6-002 | specs/ui.spec.dir/components/cascade-graph.spec.md | src/ui/components/** | ⬜ |

### Phase 7: Examples & Documentation
| Story | Spec | Outputs | Status |
|-------|------|---------|--------|
| P7-001 | specs/examples.spec.md | examples/** | ⬜ |

---

## File Manifest

```
PROMPT.md              → Builder agent instructions
PROMPT-VERIFY.md       → Adversary agent instructions
.ralph/
├── prd.json           → Story tracking
├── progress.md        → Progress log
├── ralph.sh           → Automated loop
└── start.md           → Quick start
docs/
├── NORTH_STAR.md      → Vision and principles
├── BOOTSTRAP_PLAN.md  → Detailed plan
└── MASTER_GUIDE.md    → How to use prompts
specs/
├── project.scl        → North star spec
├── core.spec.md       → Core architecture
├── cascade.spec.md    → Cascade mechanics
├── headers.spec.md    → Header format
└── ...                → Other specs
```

---

## Success Criteria

The bootstrap is complete when:

```bash
# All stories passed
cat .ralph/prd.json | jq '[.phases[].stories[] | select(.passes == false)] | length'
# Output: 0

# TypeScript compiles
bun run tsc --noEmit
# Output: No errors

# Tests pass
bun test
# Output: All tests passed

# Commits are clean
git log --oneline --grep="speclang:" | wc -l
# Output: > 0 (increasing)
```

---

## Quick Start Commands

```bash
# Check current state
cat .ralph/prd.json | jq '.phases[].stories[] | select(.passes == false) | {id, title, spec}'

# Start building
# (Copy PROMPT.md content to your LLM)

# Verify work
# (Copy PROMPT-VERIFY.md content to your LLM)

# Commit if approved
git add <file>
git commit -m "speclang: code-gen generated <description>

Source: specs/path/to/spec.md"
```

---

## Output When Complete

When all 47 stories pass, output:

```
SPECLANG-BOOTSTRAP-COMPLETE

Generated:
- src/db/          (SQLite database layer)
- src/parser/      (Spec header parser)
- src/indexer/     (Spec index generator)
- src/workflow/    (User workflow system)
- src/config/      (Configuration management)
- src/structure/   (Directory structure)
- src/deploy/      (Deployment modes)
- src/symlinks/    (Symlinks and dual-view)
- src/stdlib/      (Standard library)
- src/skills/      (Skills pack)
- src/tools/       (Agent Tools API)
- src/lenses/      (Lens system)
- src/split/       (Dynamic spec splitting)
- src/layout/      (Project layout)
- src/daemon/      (File watcher daemon)
- src/agents/      (Agent session manager)
- src/opencode/    (OpenCode integration)
- src/cascade/     (Cascade protocol)
- src/validation/  (Validation tool)
- src/mcp/         (MCP server)
- src/cli/         (CLI interface)
- src/codegen/     (Code generator)
- src/templates/   (Code templates)
- src/pipeline/    (Build pipeline)
- src/guard/       (File ownership guard)
- src/recovery/    (Self-healing system)
- src/git/         (Git history integration)
- src/transitions/ (Transition workflows)
- src/safety/      (Safety nets)
- src/ui/          (System dashboard)

All tests passing.
All commits with speclang: prefix.
Ready for self-hosting.
```
