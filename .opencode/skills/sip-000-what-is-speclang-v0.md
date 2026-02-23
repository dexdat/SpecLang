---
name: sip-000-what-is-speclang-v0
title: "SIP 0: What is Speclang"
version: 0.1.0
description: Introduction to Speclang - the spec-driven reactive system
category: documentation
---

# SIP 0: What is Speclang

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP introduces Speclang, a spec-driven reactive multi-agent system where specifications self-assemble into code.

### Quick Start

1. **What is it?** Specs are source code, generated files are machine code
2. **How it works:** File changes trigger agents, agents write files, cascade continues
3. **Key concept:** You review specs (human-readable), not generated code

### Core Ideas

- **Specs are Source:** The spec IS the code
- **Reactive Cascade:** File changes trigger automatic expansion
- **Machine Code:** Generated files shouldn't be hand-reviewed
- **Universal Headers:** Every file has searchable metadata
- **Pointer Graph:** Everything links to everything via @refs

### When to Read This

- **First time users:** Start here to understand the philosophy
- **Skeptics:** See why we don't review generated code
- **Comparisons:** How Speclang differs from traditional approaches

### Related SIPs

- SIP 1: How to Write a SIP
- SIP 2: Header Format
- SIP 3: Block System
- SIP 7: Cascade System

## Abstract

Speclang is a spec-driven reactive multi-agent system where specifications self-assemble into code. It treats specs as the primary source of truth, with generated code treated as machine code that should not be hand-reviewed.

## Rationale

When engineers ask "who will review this AI code?", we respond: "When was the last time you reviewed machine code?" Just as we trust compilers to generate correct assembly from source code, we trust the Spelang system to generate correct code from specs.

## Core Concepts

### 1. Specs are Source

In Speclang, the spec file IS the code. Not documentation, not configuration - the actual artifact that gets compiled into running code.

**Traditional:**
```
Human writes code → AI assists → Human reviews code
```

**Speclang:**
```
Human writes specs → AI expands specs → Human reviews specs
Generated code is machine code (like .o files)
```

### 2. Reactive Cascade

File changes trigger agents, agents write files, files trigger more agents. This "cascade" continues until convergence.

```
User edits project.scl
    ↓
speclangd detects change
    ↓
North Star agent processes
    ↓
Spec Writer expands specs
    ↓
Code Gen writes code specs
    ↓
Build system generates code
    ↓
Tests run
    ↓
Quiet period detected → Done
```

### 3. Universal Headers

Every file has a header that tells you:
- What it is (ID)
- Where it lives (refs)
- What it depends on (depends_on)
- How big it is (line count)

**Example Header:**
```
# Line 1: Comment or blank
# Line 2: speclang-header lines:12
Lines 3-12: YAML metadata
---
Content starts here
```

### 4. Pointer Graph

Every file references others via `@ref:path#block`. This creates a dependency graph that:
- Prevents context loss
- Enables tracing
- Supports cascading

**Example Ref:**
```
@ref:specs/auth#login
@ref:specs/auth/entities#User
@ref:northstar#project
```

### 5. Dynamic Splitting

Specs auto-split when they get too big:
- User sets limits (tokens, lines, chars)
- System creates `.spec.dir/` folders
- Parent becomes index, children contain details
- Budget overhead allows for headers/refs

**Example:**
```
Before:
  auth.spec.yaml (12k tokens)

After:
  auth.spec.yaml (index, 500 tokens)
  auth.spec.spec.dir/
    ├── entities.spec.yaml
    ├── operations.spec.yaml
    └── policies.spec.yaml
```

## File Types

Speclang supports multiple spec formats:

- `.spec.md` - Markdown with YAML header
- `.spec.yaml` - YAML with comment header
- `.go.spec` - Go code spec
- `.ts.spec` - TypeScript code spec
- `.py.spec` - Python code spec
- `.rs.spec` - Rust code spec

Generated files:
- `generated/` - Actual code (gitignored)
- `reports/` - Test results (gitignored)
- `.speclang/` - Internal state (gitignored)

## Multi-Agent System

**North Star Agent:**
- Owns project.scl
- Understands user intent
- Coordinates other agents
- Exempt from ownership rules

**Spec Writer Agent:**
- Owns specs/**/*.spec.*
- Expands high-level specs
- Creates detailed specs
- Splits when over limit

**Code Gen Agent:**
- Owns *.go.spec, *.ts.spec, etc.
- Generates code from specs
- Writes code specs (not actual code)
- Links back to parent specs

**Test Writer Agent:**
- Owns *.test.spec.*
- Writes tests as specs
- Generates test code
- Covers all paths

## Configuration

All settings in project.scl:

```yaml
config:
  split:
    max_tokens: 10000
    budget_overhead: 500
    
  embeddings:
    model: openai/text-embedding-3-small
    dimensions: 1536
    
  watcher:
    patterns: ["**/*.spec.*"]
    ignore: {uses: ".gitignore"}
```

## SQLite Database

Embedded database for:
- Full-text search
- Vector search
- Dependency graph
- Agent tracking

**WAL Mode:** Survives crashes

## Recovery

When things fail:
1. Detect failure (test, build, agent error)
2. Assess impact
3. Rollback spec changes
4. Regenerate code
5. Notify North Star
6. Resume cascade

## Convergence

Cascade ends when:
- Quiet period (default: 30s)
- All agents idle
- /finalize command

Then:
- Pipeline runs
- Tests execute
- Build completes
- Code ready

## Benefits

1. **Human Reviews Intent, Not Code**
   - Specs are small, readable
   - Code is machine-generated
   - Focus on "what", not "how"

2. **Never Lose Context**
   - Every file has header
   - All refs are explicit
   - SQLite indexes everything

3. **Language Agnostic**
   - Same spec → Go, TS, Python, Rust
   - One source, multiple outputs
   - Consistent across stack

4. **Self-Documenting**
   - Specs are documentation
   - Natural language + structured
   - Always up to date

5. **Reactive**
   - Change one spec
   - System updates everything
   - Consistent state

## Comparison

| Aspect | Traditional | Speclang |
|--------|-------------|----------|
| Source of Truth | Code | Specs |
| Human Reviews | Code | Specs |
| AI Writes | Code | Specs |
| Documentation | Separate | Embedded |
| Tests | Code | Specs |
| Config | Files | Specs |

## Relationship to Other Systems

- **PEP (Python):** SIP is to Speclang as PEP is to Python
- **OpenAPI:** Speclang specs can generate OpenAPI
- **Terraform:** Speclang can generate TF configs
- **Makefile:** Build pipeline defined in specs

## Future

This is draft v0.1.0. The system will evolve through:
- More SIP documents
- User feedback
- Agent improvements
- Tool enhancements

## References

- SIP 1: Header Format
- SIP 2: Block System
- SIP 3: Reference System
- SIP 4: Splitting
- SIP 5: Agent Protocol

## Copyright

This document is in the public domain.