# speclang-header lines:16
id: "@speclang/core"
version: 0.2.0
layer: 0
project_level: Alpha
agent_support: agent_autonomous
tags: [core, architecture, reactive, meta-circular, assembler]
children:
  - "@ref:specs/core.spec.dir/entities"
  - "@ref:specs/core.spec.dir/cascade"
  - "@ref:specs/core.spec.dir/file-types"
  - "@ref:specs/core.spec.dir/agents"
  - "@ref:specs/core.spec.dir/skills"
  - "@ref:specs/core.spec.dir/concurrency"
short: "Speclang Core - Reactive multi-agent source code assembler"
status: draft
---

# Speclang Core

A reactive multi-agent system where specs self-assemble into code.

**Speclang builds Speclang.** This project is meta-circular - the specs describe how to build the system that reads and generates the specs.

## Overview

```speclang
# @block:core/overview @kind:entity
Speclang:
  concept: "Specs are source code. Generated code is machine code."
  principle: "Review specs, not generated code"
  architecture: Reactive multi-agent file system organism

  key_components:
    - specs: Human-editable intent files with universal headers
    - daemon: File watcher (speclangd) triggers cascade
    - agents: AI sessions that own and write specific files
    - cascade: Reactive loop until convergence
    - assembler: Reads .spec.{lang}.md files and assembles .spec.{lang} code
    - pipeline: Build/test/deploy after convergence
    - database: SQLite with FTS and vector search for context

  meta_circular: "These specs describe the system that reads these specs"
```

## SpecLang is a Multi-Language Source Code Assembler

SpecLang is an **assembler**, not a compiler:

- **Assembler**: reads `.spec.{lang}.md` files → produces `.spec.{lang}` source code in any language
- **Compiler**: the target language's compiler (gcc, rustc, tsc, go build) compiles the `.spec.{lang}` files
- The assembler uses LLM models (from header `model:`/`model_pool:` fields) to generate code
- Codegen is a CORE SpecLang module, not a separate tool

### Self-Expanding Spec Tree

The spec tree grows from a seed:

1. **Seed spec** (e.g., `project.scl`) → user writes high-level intent
2. **Agent expansion** → SpecWriter agents expand the seed into detailed specs
3. **Full tree** → the complete spec hierarchy emerges
4. **Code assembly** → CodeGen agents assemble source code from code-pair specs
5. **Validation** → pipeline runs build + test to verify convergence

### Meta-Circular Bootstrap

SpecLang builds SpecLang — its framework is written in `.spec.{lang}.md` files, and it assembles its own framework code from those specs. The assembler reads the framework's own code-pair specs and produces the running implementation.

## Core Concepts

See @ref:specs/core.spec.dir/entities for daemon, agent, northstar, pointer-graph, and autonomous-readiness.

## The Reactive Loop

See @ref:specs/core.spec.dir/cascade for cascade and convergence.

## File Types

See @ref:specs/core.spec.dir/file-types for spec-file, test-spec, and generated-file.

## Agent Responsibilities

See @ref:specs/core.spec.dir/agents for spec-agent, code-agent, test-agent, and backsync-agent.

## Skills Pack

See @ref:specs/core.spec.dir/skills for skills pack.

## Concurrency Model

See @ref:specs/core.spec.dir/concurrency for concurrency model.

## Project Layout

Project layout is defined in @ref:specs/directory-structure and @ref:specs/project-layout.

## See Also

- "@ref:specs/daemon - File watcher daemon implementation
- @ref:specs/skills - Skill definitions and templates
- @ref:specs/test-specs - Test spec format
- @ref:specs/spec-format - Spec format definition
