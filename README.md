# SpecLang

A reactive multi-agent system where specs self-assemble into code.

## The Idea

```
Human writes natural language → North Star file
     ↓
File change detected (native or inotify)
     ↓
Agents react, create/update files
     ↓
Cascade until quiet (convergence)
     ↓
Pipeline runs: build, test, deploy
     ↓
Per-file git commits
     ↓
Final output: clean Go/TS/Rust/Python/etc.
```

**Specs are what humans review. Generated code is like machine code - trusted, not hand-edited.**

## Core Concepts

| Concept | What |
|---------|------|
| **North Star** | Top-level intent file (`project.scl`) |
| **Specs** | Structured descriptions with universal headers |
| **Agents** | AI sessions that own files and react to changes |
| **Cascade** | Files trigger files in reactive loop |
| **MCP** | Universal TypeScript server for agent communication |
| **SQLite** | FTS, vector search, commands table, error logs |
| **Symlinks** | specs/ is source of truth, logical paths are symlinks |
| **Git** | Per-file commits, perfect traceability |

## Specs (28 files, ~10,600 lines)

| Category | Specs |
|----------|-------|
| **Core** | project.scl, speclang.spec.md, daemon.spec.md, agent-protocol.spec.md |
| **AI** | skills.spec.md, opencode.spec.md, mcp.spec.md, mcp-daemon.spec.md.md |
| **Formats** | spec-format.spec.md, file-naming.spec.md, headers.spec.md, lenses.spec.md |
| **Data** | sqlite.spec.md, dynamic-split.spec.md, directory-structure.spec.md |
| **Build** | pipeline.spec.md, compiler.spec.md, cli.spec.md, project-layout.spec.md |
| **Ops** | cascade.spec.md, recovery.spec.md, tools.spec.md, git-history.spec.md |
| **Deploy** | deployment.spec.md, workflow.spec.md, symlinks.spec.md |
| **Content** | test-specs.spec.md, stdlib.spec.md |

## Key Features

### Universal Headers
Every file has a header with line count, id, refs:
```yaml
--- speclang-header lines:12
id: @specs/auth
target: src/auth/login.go
depends_on: [@ref:northstar#auth]
---
```

### Dynamic Splitting
No fixed 1-10 levels. User sets max tokens/lines/chars. Specs auto-split when over limits.

### SQLite + Vector
- Full-text search on all specs
- Vector embeddings for semantic search
- Commands table for inter-agent communication
- Error logs accessible via MCP

### Symlinks
- specs/ is the single source of truth
- src/, tests/ are symlinks to specs/
- Take specs/ and leave - rebuild everything

### Per-File Git Commits
```bash
git commit --only specs/auth.scl -m "speclang: added auth entities"
git commit --only src/auth/login.go -m "speclang: generated handler"
```

### MCP Server
TypeScript MCP server (~250 lines), three modes:
- Editor-initiated (stdio)
- Remote (HTTP/SSE)
- Server (daemon)

## Deployment Modes

| Mode | Use Case | Components |
|------|----------|------------|
| Light | <500 files, solo | OpenCode + plugin |
| Enterprise | 500+ files, teams | OpenCode + plugin + daemon |

## How It Works

1. **Install**: `speclang init --mode=light`
2. **Start**: OpenCode in build mode
3. **Write**: Talk to AI, edit project.scl
4. **Watch**: Cascade builds, specs expand, code generates
5. **Converge**: Pipeline runs when quiet (30s)
6. **Review**: Check specs, not generated code
7. **Ship**: Clean git history, ready to deploy

## Philosophy

> "When was the last time you reviewed machine code?"

- Specs are source code - version, review, edit specs
- Generated code is disposable - rebuild from specs anytime
- AI understands intent - natural language + structured blocks
- specs/ is portable - take it and rebuild everything
- Git is memory bank - per-file commits, perfect history
- Context never lost - SQLite indexes everything

## Current Status

Self-specifying. The specs define the language itself.

All 28 specs complete. Ready for implementation.
