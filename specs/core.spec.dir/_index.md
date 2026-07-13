# speclang-header lines:10
id: "@specs/core-dir/index"
version: 1.0.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [core, index, directory]
short: "Core Directory Index - Core architecture sub-specs"
status: active
---

# Core Directory Index

**Directory:** `specs/core.dir/`  
**Parent:** `core.spec.md` (main index spec)

## Contents

This directory contains sub-specs for the Core architecture of SpecLang.

### Files

1. **`entities.spec.md`** - Core entities: daemon, agent, northstar, pointer-graph, autonomous-readiness
   - Defines fundamental building blocks of SpecLang
   - Layer: 2, Part: 1/6

2. **`cascade.spec.md`** - Cascade system: reactive loop, triggers, propagation
   - How the reactive file-change cascade works
   - Layer: 2, Part: 2/6

3. **`file-types.spec.md`** - File type definitions: spec-file, test-spec, generated-file
   - Different types of files in SpecLang system
   - Layer: 2, Part: 3/6

4. **`agents.spec.md`** - Agent responsibilities: spec-agent, code-agent, test-agent, backsync-agent
   - What each agent type does and owns
   - Layer: 2, Part: 4/6

5. **`skills.spec.md`** - Skills pack: AI editor skills for SpecLang
   - Skills for Claude Code, Cursor, OpenCode, etc.
   - Layer: 2, Part: 5/6

6. **`concurrency.spec.md`** - Concurrency model: locks, sessions, parallel execution
   - How agents run concurrently without conflicts
   - Layer: 2, Part: 6/6

## Reading Order

For understanding Core architecture:

1. **Start with parent:** `../core.spec.md` (main index)
2. **Then read:** `entities.spec.md` (fundamental concepts)
3. **Then:** `cascade.spec.md` (reactive system)
4. **Then others** based on interest

## Dependencies

All files in this directory:
- Reference parent: @ref:specs/core
- May reference siblings via `siblings.prev` and `siblings.next`
- Reference other core specs as needed

## Purpose

The Core directory defines the fundamental architecture of SpecLang:
- **Entities**: What things exist (daemon, agent, etc.)
- **Cascade**: How things interact (reactive loop)
- **File types**: What kinds of files exist
- **Agents**: Who does what
- **Skills**: How AI agents work with SpecLang
- **Concurrency**: How everything runs together safely

## Notes

- All files are **sub-specs** of `core.spec.md`
- Each has `parent: "@ref:specs/core` in header
- Parts are numbered 1/6 through 6/6 for logical reading order
- Layer is 2 (implementation details of layer 0 core concepts)

For the complete Core architecture, read `../core.spec.md` first, then these sub-specs in order.