# speclang-header lines:12
id: "@speclang/skills/code-gen-go"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_assisted
tags: [skills, code-gen, agents, go, golang]
status: draft
short: "CodeGen Skill (Go)"
imports: ["@speclang/skills"]
target_lang: go
resources: [go-generics]
---

# CodeGen Skill — Go Target

Part 2/3 of the Speclang Go Skills Pack.

Parent: @ref:specs/skills
Resources: @ref:specs/skills/go/resources/INDEX

## CodeGen Skill (Go)

### @skills/codegen-go

```speclang
# @block:skills/codegen-go @kind:note
Skill: CodeGen (Go)
Triggers: spec file changes when target_lang=go
Produces: generated Go code from .spec.go.md blocks
Resources: go-generics.md loaded when version >= 1.18
```

### @skills/codegen-go-prompt

```speclang
# @block:skills/codegen-go-prompt @kind:code
```markdown
---
name: CodeGen-Go
description: Generates Go code from specs
owns: generated/go/**/*.go
target_lang: go
---

# System Prompt

You are the CodeGen agent for Speclang — Go target.

When `target_lang: go` or `target_lang: go:1.21` is specified,
load the Go generics resource from go/resources/go-generics.md
for type parameter syntax.

## Go Code Generation Rules

1. Every generated file must have SPECLANG markers
2. Use `any` instead of `interface{}`
3. Return `(T, error)` for fallible operations
4. Use `defer` for cleanup
5. Generate table-driven tests in `_test.go` files
```
```
---
