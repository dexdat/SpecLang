# SpecLang Ralph Loop - Quick Start

## What is This?

This is a **Ralph Loop** for building SpecLang. The LLM acts as the "spec compiler", reading specification files and generating working code. It's meta-circular: you're building a spec compiler by using an LLM as a spec compiler.

## Two Ways to Run

### Option 1: Manual Loop (Recommended for OpenCode)

Run this prompt repeatedly until all stories are complete:

```bash
# Start the loop
cat .ralph/prompt.md
```

Then paste that content to your LLM. After each iteration:
1. Check `.ralph/prd.json` for remaining stories
2. Check `.ralph/progress.md` for progress
3. Repeat until `SPECLANG-BOOTSTRAP-COMPLETE`

### Option 2: Automated Loop (For Claude Code CLI)

```bash
# Run with Claude Code
./.ralph/ralph.sh --tool claude 50

# Or with Amp
./.ralph/ralph.sh --tool amp 50
```

## Current State

```bash
# Check remaining stories
cat .ralph/prd.json | jq '[.phases[].stories[] | select(.passes == false)] | length'

# Check current story
cat .ralph/prd.json | jq -r '[.phases[].stories[] | select(.passes == false)] | sort_by(.priority) | .[0] | "\(.id): \(.title)"'

# View progress
cat .ralph/progress.md
```

## The Phases

| Phase | Name | Stories | Status |
|-------|------|---------|--------|
| 0 | Foundation | 25 | Pending |
| 1 | Core Runtime | 11 | Pending |
| 2 | MCP Interface | 12 | Pending |
| 3 | Code Generation | 6 | Pending |
| 4 | Pipeline & Guard | 7 | Pending |
| 5 | Meta-Circular | 5 | Pending |
| 6 | UI Dashboard | 3 | Pending |
| 7 | Examples & Docs | 2 | Pending |
| 8 | Tooling Scripts | 1 | Pending |
| **Total** | | **72** | |

## Phase Breakdown

### Phase 0: Foundation (25 stories)
Core infrastructure: SQLite, parser, indexer, workflow, config, deployment, symlinks, ralph loop, stdlib, skills, tools, test specs, lenses, dynamic split, project layout, header fields/validation, cascade triggers/depth, UI interactions/testing/visual, validation rules, project maturity.

### Phase 1: Core Runtime (11 stories)
Daemon and agent session management: speclangd architecture, agent sessions, OpenCode integration, cascade protocol, validation tool, daemon events/convergence/routing/locks, agent ownership.

### Phase 2: MCP Interface (12 stories)
MCP server for universal editor access: MCP server, CLI, daemon, UI tools, OpenAPI, SSE, auth, errors, config, commands, search, overview.

### Phase 3: Code Generation (6 stories)
Spec-to-code compiler: codegen framework, templates, target languages, compiler phases, Go generator, Python generator.

### Phase 4: Pipeline & Guard (7 stories)
Build pipeline, file ownership, and recovery: pipeline executor, guard system, recovery, git history, hooks, stages, recovery actions.

### Phase 5: Meta-Circular (5 stories)
Self-specifying specs, autonomous validation, transition workflows, safety nets, meta-circular bootstrap.

### Phase 6: UI Dashboard (3 stories)
System monitoring dashboard: dashboard, components, state management.

### Phase 7: Examples & Documentation (2 stories)
Comprehensive examples: example projects, hello-world.

### Phase 8: Tooling Scripts (1 story)
Python tooling scripts: generate_index.py, validate_specs.py, etc.

## Files

```
.ralph/
├── prd.json        # Product requirements (72 stories)
├── prompt.md       # The prompt for each iteration
├── progress.md     # Progress log (append-only)
├── ralph.sh        # Automated loop script
├── logs/           # Iteration logs
└── backups/        # State backups
```

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. Read .ralph/prd.json → find next incomplete story      │
│  2. Read the spec file for that story                       │
│  3. Generate code that implements the spec                  │
│  4. Run tests to validate                                   │
│  5. Commit changes                                          │
│  6. Update prd.json to mark story complete                  │
│  7. Append progress to progress.md                          │
│  8. Repeat until all stories pass                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Success Criteria

When complete, you will have:

1. `src/db/` - SQLite database layer
2. `src/parser/` - Spec header parser
3. `src/indexer/` - Spec index generator
4. `src/config/` - Configuration system
5. `src/workflow/` - User workflow system
6. `src/structure/` - Directory structure system
7. `src/deploy/` - Deployment modes
8. `src/symlinks/` - Symlinks and dual-view
9. `src/stdlib/` - Standard library
10. `src/skills/` - Skills pack
11. `src/tools/` - Agent Tools API
12. `src/lenses/` - Lens system
13. `src/split/` - Dynamic spec splitting
14. `src/layout/` - Project layout
15. `src/maturity/` - Project maturity system
16. `src/daemon/` - File watcher daemon
17. `src/agents/` - Agent session manager
18. `src/opencode/` - OpenCode integration
19. `src/cascade/` - Cascade coordination
20. `src/validation/` - Validation tool
21. `src/mcp/` - MCP server
22. `src/cli/` - CLI interface
23. `src/codegen/` - Code generator
24. `src/templates/` - Code templates
25. `src/compiler/` - Compiler phases
26. `src/pipeline/` - Build pipeline
27. `src/guard/` - File ownership guard
28. `src/recovery/` - Self-healing system
29. `src/git/` - Git history integration
30. `src/transitions/` - Transition workflows
31. `src/safety/` - Safety nets
32. `src/bootstrap/` - Meta-circular bootstrap
33. `src/ui/` - System dashboard

All generated from 275 specs in `specs/`.

## Troubleshooting

### "No stories remaining" but not complete?
Check that all stories have `passes: true`:
```bash
cat .ralph/prd.json | jq '.phases[].stories[] | select(.passes == true)'
```

### Tests failing?
Check the specific test output and update the code or spec as needed.

### Stuck on same story?
1. Check `.ralph/progress.md` for what's been tried
2. Consider breaking the story into smaller pieces
3. Update the spec for more clarity

## Start Now

```bash
# Option 1: Read the prompt and paste to your LLM
cat .ralph/prompt.md

# Option 2: Run automated
./.ralph/ralph.sh 50
```
