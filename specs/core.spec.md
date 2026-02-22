# speclang-header lines:11
id: "@speclang/core"
version: 0.1.0
layer: 0
project_level: Alpha
agent_support: agent_autonomous
tags: [core, architecture, reactive]
status: draft
children: [@speclang/core/entities, @speclang/core/cascade, @speclang/core/file-types, @speclang/core/agents, @speclang/core/skills, @speclang/core/concurrency]
short: Speclang Core
---

# Speclang Core

A reactive multi-agent system where specs self-assemble into code.

**Speclang builds Speclang.** This project is meta-circular - the specs describe how to build the system that reads and generates the specs.

## The Big Idea

```
Human writes natural language → North Star file
     ↓
inotify daemon detects change
     ↓
Owning agent reacts, creates/updates files
     ↓
More inotify events, more agents react
     ↓
Cascade until quiet (convergence)
     ↓
Final output: clean Go/TS/Rust/Java/etc.
```

## Core Concepts

See @ref:speclang/core/entities for daemon, agent, northstar, pointer-graph, and autonomous-readiness.

## The Reactive Loop

See @ref:speclang/core/cascade for cascade and convergence.

## File Types

See @ref:speclang/core/file-types for spec-file, test-spec, and generated-file.

## Agent Responsibilities

See @ref:speclang/core/agents for spec-agent, code-agent, test-agent, and backsync-agent.

## Skills Pack

See @ref:speclang/core/skills for skills pack.

## Concurrency Model

See @ref:speclang/core/concurrency for concurrency model.

## Project Layout

Project layout is defined in @ref:speclang/directory-structure and @ref:speclang/project-layout.

## See Also

- @speclang/daemon-impl - Rust implementation
- @speclang/skills-pack - skill definitions
- @speclang/test-specs - test spec format
- @speclang/pointers - reference system