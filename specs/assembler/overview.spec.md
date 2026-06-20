# speclang-header lines:9
id: "@speclang/assembler/overview"
version: 1.0.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [assembler, overview, architecture, components]
status: active
short: "Assembler system overview — how the 6 core components connect"
---

# Assembler System Overview

The SpecLang assembler is a multi-language source code assembly system. It reads `.spec.{lang}.md` files and produces `.spec.{lang}` source code files. It is built from 6 core components.

## Data Flow

```
File change in specs/ (user edit or agent expansion)
       |
       v
+------------------+
| speclangd        |  chokidar watcher + notification graph
| (daemon)         |  emits FileChangeEvent with dependent_specs[]
+------------------+
       |
       v
+------------------+
| Cascade Router   |  event-to-agent dispatcher
|                  |  applies squash (100ms debounce)
|                  |  applies throttle (fairness queue with deferral)
|                  |  resolves model from header (3 layers)
|                  |  checks rate limits (spec + pool)
|                  |  spawns Pi sessions via createAgentSession()
+------------------+
       |
       v
+------------------+
| Pi Agent         |  guard system intercepts writes
| Sessions         |  models assemble .spec.{lang}.md → .spec.{lang}
| + Guard Ext.     |  ownership checked via onToolCall
+------------------+
       |
       v
+------------------+
| Assembler        |  reads .spec.{lang}.md files
| (core module)    |  extracts code from ## Implementation blocks
|                  |  writes .spec.{lang} output files
+------------------+
       |
       v
+------------------+
| Pipeline Runner  |  reads build.yaml
|                  |  executes stages: build, test, lint, commit
|                  |  runs target language compiler
|                  |  git hooks validate headers pre-commit
+------------------+
       |
       v
+------------------+
| MCP Server       |  exposes tools for Hermes/Claude/Codex
|                  |  tools: create_spec, validate, run_cascade, status
|                  |  real-time cascade event stream
+------------------+
```

## 6 Components

| # | Component | Spec File | Type | Purpose |
|---|-----------|-----------|------|---------|
| 1 | speclangd | `daemon.spec.ts.md` | Code-pair | File watcher, notification graph, convergence |
| 2 | Guard Extension | `guard.spec.ts.md` | Code-pair | Pi extension: ownership, tools, onToolCall |
| 3 | Cascade Router | `cascade-router.spec.ts.md` | Code-pair | Event dispatch, squash, throttle, model pools |
| 4 | Pipeline Runner | `pipeline.spec.ts.md` | Code-pair | Build.yaml execution, git hooks, assembler handoff |
| 5 | Assembler Engine | `assembler.spec.ts.md` | Code-pair | Reads .spec.{lang}.md → writes .spec.{lang} |
| 6 | MCP Server | `mcp-server.spec.ts.md` | Code-pair | External agent access via MCP stdio |

## Support Specs

| Spec | Type | Purpose |
|------|------|---------|
| `config.spec.md` | Informational | Configuration schema, build.yaml, .speclangrc |
| `model-pools.spec.md` | Informational | Provider configs, rate limits, capability grouping |
| `cli.spec.md` | Informational | CLI commands reference |
| `skill-specs.spec.md` | Informational | Agent role skill definitions |
| `file-watch-rules.spec.md` | Informational | Watch pattern matching rules |

## Directory Layout

```
specs/
  assembler/
    overview.spec.md          ← This file
    config.spec.md            ← Configuration
    model-pools.spec.md       ← Model pool system
    cli.spec.md               ← CLI commands
    skill-specs.spec.md       ← Agent role skills
    file-watch-rules.spec.md  ← Watch pattern rules
    daemon.spec.ts.md         ← Code-pair: speclangd
    guard.spec.ts.md          ← Code-pair: Pi guard extension
    cascade-router.spec.ts.md ← Code-pair: cascade router
    pipeline.spec.ts.md       ← Code-pair: pipeline runner
    assembler.spec.ts.md      ← Code-pair: core assembler engine
    mcp-server.spec.ts.md     ← Code-pair: MCP server

.speclang/                   ← Extracted code (hand-written during bootstrap)
  daemon.spec.ts
  guard.spec.ts
  cascade-router.spec.ts
  pipeline.spec.ts
  assembler.spec.ts
  mcp-server.spec.ts

.pi/
  extensions/
    speclang-guard.spec.ts   ← Pi extension entry point
  skills/                    ← Agent role skill definitions
    spec-writer.md
    codegen.md
    test-writer.md
    cascade-coordinator.md
    pipeline.md
```

## See Also

- @ref:specs/core - Core architecture
- @ref:specs/headers - Header format
- @ref:specs/spec-format - Spec format
- @ref:specs/cascade - Cascade system
- @ref:specs/daemon - Daemon design
- @ref:specs/agent-protocol - Agent protocol
- @ref:specs/pipeline - Pipeline design
