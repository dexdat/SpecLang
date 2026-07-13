# speclang-header lines:10
id: "@speclang/bootstrap"
version: 1.0.0
layer: 0
project_level: Alpha
agent_support: agent_autonomous
tags: [bootstrap, primer, entry-point, directory-guide]
short: "Bootstrap Primer - Read this first to understand SpecLang"
status: active
---

# SpecLang Bootstrap Primer

**READ THIS FIRST** - This file explains the core concepts, directory structure, and minimum reading path to understand SpecLang.

## What is SpecLang?

SpecLang is a **reactive multi-agent system** where:
- **Specs are source code** - Humans write and review specs
- **Generated code is machine code** - Trust it, don't hand-edit it
- **Filesystem is the event bus** - File changes trigger agent reactions
- **Context never gets lost** - Universal headers track dependencies
- **Spanning tree architecture** - Specs form a dependency tree that self-expands
- **Swarm of concurrent agents** - Multiple agents work simultaneously on different files

## Spanning Tree Architecture

SpecLang uses a **spanning tree** structure, not fixed layers:

1. **Root**: `project.scl` (or `project.yaml`) - North Star intent
2. **Branches**: Spec files that expand the vision (`{name}.spec.md`, `{name}.spec.yaml`)
3. **Leaves**: Final code-mapping specs (`{name}.{ext}.spec`) that generate code
4. **Any depth**: Tree can be as deep as needed for the system
5. **Self-expanding**: Agents create new spec nodes as needed

### No Fixed Layer Limits
- **Old concept**: Fixed 0-10 abstraction layers
- **New concept**: Relative depth in dependency tree
- **Flexible**: Tree expands based on system complexity
- **Natural**: Follows the natural structure of the system being built

### Example Tree Structure
```
project.scl (root)
├── auth.spec.md (branch)
│   ├── auth/entities.spec.yaml (sub-branch)
│   ├── auth/operations.spec.yaml (sub-branch)
│   └── auth/handler.go.spec (leaf → generates code)
├── user-profile.spec.md (branch)
│   └── user-profile/api.ts.spec (leaf → generates code)
└── docker-compose.yaml.spec (leaf → generates Docker config)
```

## Core Principle

> "When was the last time you reviewed machine code?"

You review **specs**, not generated code. Generated code is like machine code - you trust the compiler (SpecLang).

## Minimum Reading Path

To understand SpecLang, read these **5 files** in order:

1. **This file** (`000-bootstrap.md`) - You're reading it now
2. **`project.scl`** (or `project.yaml`) - North Star intent and high-level vision
3. **`core.spec.md`** - Core architecture and reactive loop
4. **`spec-format.spec.md`** - How spec files are structured
5. **`headers.spec.md`** - Universal header format

## Directory Structure

```
specs/
├── 000-bootstrap.md          ← YOU ARE HERE (read first!)
├── project.scl               ← North Star intent
├── _index.md                 ← Directory index (this folder)
│
├── core.spec.md              ← Core architecture (index)
├── core.dir/                 ← Core sub-specs
│   ├── entities.spec.md      ← Daemon, agent, northstar concepts
│   ├── cascade.spec.md       ← Reactive loop
│   └── ...
│
├── spec-format.spec.md       ← Spec format (index)
├── spec-format.dir/          ← Format sub-specs
│   ├── structure.spec.md     ← File structure
│   └── blocks.spec.md        ← Block types
│
├── headers.spec.md           ← Universal headers
├── daemon.spec.md            ← File watcher daemon
├── parser.spec.md            ← Header parser
├── compiler.spec.md          ← Code generator
├── cascade.spec.md           ← Reactive loop
├── agent-protocol.spec.md    ← Agent ownership rules
├── pipeline.spec.md          ← Build pipeline
├── sqlite.spec.md            ← Database for context
├── mcp.spec.md              ← MCP server interface
└── ... (other components)
```

## File Creation & Cascade Flow

### How Files Are Created
1. **User or primary AI agent** creates files in `/specs/` directory:
   - `{name}.spec.md` - Markdown specs for design
   - `{name}.spec.dir/{sub}.spec.md` - Sub-specs at any depth
   - `{name}.spec.yaml` - YAML specs for detailed structure
2. **Any depth allowed**: `{name}.spec.dir/{sub}.spec.dir/{sub2}.spec.md` is valid
3. **Final spec before code** is always YAML (`{name}.{ext}.spec`) for precise schema

### How Cascade Works
1. **File watcher** (`speclangd` Rust daemon or OpenCode plugin) detects file change
2. **Reads headers** to understand dependencies (`depends_on`, `children`, `imports`)
3. **Updates queue** with:
   - Trigger file (what changed)
   - Affected files (what needs updating based on dependencies)
   - Owning agent for each file
4. **Agent assignment** based on file pattern:
   - `*.spec.md` → spec-writer agent
   - `*.spec.yaml` → spec-writer agent  
   - `*.{ext}.spec` → code-gen agent
   - `*.test.spec.md` → test-writer agent
5. **Concurrent execution**: Multiple agents can run from queue simultaneously
6. **Throttling**: Queue manages concurrency to protect service/host limits

### Agent Constraints
- **Read any file**: Agents can read any spec to understand context
- **Write only owned file**: Each agent can edit only its assigned file
- **OpenCode plugin enforces**: Attempts to edit other files are rejected
- **Create new files**: Agents can create new files via tool/command with filename and headers
- **Single file focus**: Each agent session works on exactly one file

### YAML Schema for Final Specs
The last spec before code generation (`{name}.{ext}.spec`) follows a YAML schema:
- **Defines contracts** (APIs, databases, external services)
- **Provides boilerplate** for model to fill in
- **Reduces errors** with structured validation
- **Links to dependencies** via `@ref:` markers

## Key Files Explained

### 1. Universal Headers (`headers.spec.md`)
Every SpecLang file starts with:
```yaml
# speclang-header lines:12
id: @specs/example
version: 1.0.0
layer: 0
project_level: Alpha
agent_support: agent_autonomous
tags: [example, docs]
short: Brief description
depends_on:
  - "@ref:specs/other#block
---
```

**Purpose**: Zero context loss. AI reads header to understand file purpose.

**Note on `layer` field**: Represents relative depth in dependency tree (0 for root, increasing for deeper nodes). No fixed limit - tree expands as needed.

### 2. Directory Conventions
- **`.spec.md`** or **`.spec.yaml`** - Leaf spec files
- **`.spec.dir/`** - Directory containing sub-specs
- **`.scl`** - Speclang format (like `project.scl`)
- **`_{name}.md`** - Index/meta files (like `_index.md`)

### 3. Agent Rules
- **One agent per file** - Each file has single owning agent (pattern-based)
- **Read any, write owned** - Agents can read any file, write only owned files
- **OpenCode plugin enforcement** - Attempts to edit other files are rejected
- **File creation via tool** - Agents create new files with `create_spec_file` tool
- **Single-file focus** - Each agent session works on exactly one file at a time

### 4. Cascade System
1. **Trigger**: File change detected by `speclangd` (Rust) or OpenCode plugin
2. **Dependency resolution**: Read headers to find `depends_on`, `children`, `imports`
3. **Queue update**: Add trigger file and all affected files to queue
4. **Agent assignment**: Assign owning agent to each file based on pattern
5. **Concurrent execution**: Multiple agents run from queue (with throttling)
6. **File creation**: Agents create new files via tool calls
7. **Cascade continues**: New files trigger new cycles
8. **Convergence**: Quiet period (30s) → pipeline runs
9. **Pipeline**: Build, test, deploy generated code

## How to Navigate

### For New Agents/Users:
1. **Start here** (`000-bootstrap.md`)
2. **Check `_index.md`** in each directory for file list
3. **Follow `depends_on`** references in headers
4. **Use SQLite database** for queries (when available)

### File Naming Patterns:
- `000-` prefix = Read first (bootstrap/primers)
- `_` prefix = Index/meta files
- `.spec.md` = Markdown spec with YAML header (design phase)
- `.spec.yaml` = Pure YAML spec (detailed structure)
- `.scl` = Speclang format (like `project.scl`)
- `.{ext}.spec` = Direct code mapping (YAML, final before code)
- `.dir/` = Directory of sub-specs (any depth allowed)

## Next Steps After Reading This

1. **Read `project.scl`** - Understand the North Star vision
2. **Read `core.spec.md`** - Understand core architecture
3. **Check directory `_index.md` files** - See what's available
4. **Follow dependency chains** - Use `@ref:` in headers

## Remember

- **Specs are the source of truth** - Generated code is disposable
- **Context never lost** - Headers track dependencies
- **One file, one commit** - Perfect git history
- **Agents own files** - No stepping on each other's work

This bootstrap primer gives you the minimum context to understand SpecLang. From here, follow the dependency graph in headers to explore deeper.

**Start with `project.scl` → `core.spec.md` → follow `@ref:` links.**