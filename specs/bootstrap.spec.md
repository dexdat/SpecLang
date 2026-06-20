# speclang-header lines:17
id: "@speclang/bootstrap"
version: 0.1.0
layer: 0
project_level: Alpha
agent_support: agent_autonomous
tags: [bootstrap, meta-circular, self-hosting]
short: Meta-circular bootstrap process for SpecLang
status: active
depends_on:
  - "@ref:speclang/core"
  - "@ref:speclang/cascade"
  - "@ref:speclang/headers"
children:
  - "@ref:specs/bootstrap/phases"
  - "@ref:specs/bootstrap/execution"
---
# Bootstrap Process

The meta-circular bootstrap: how SpecLang builds SpecLang.

## The Chicken-Egg Problem

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  SpecLang is self-specifying:                                   │
│                                                                 │
│  specs/ define how to build the system that reads specs/        │
│                                                                 │
│  Bootstrap order:                                               │
│  1. Human writes minimal specs (this file, NORTH_STAR)          │
│  2. AI acts as compiler, reading specs and generating code      │
│  3. Generated code becomes the SpecLang that reads specs        │
│  4. System can then spec itself autonomously                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sub-specs

This spec has been split into focused sub-specs for better organization:

### @ref:specs/bootstrap/phases
- Bootstrap phases and minimal required specs
- Phase definitions, dependencies, validation criteria

### @ref:specs/bootstrap/execution  
- Bootstrap execution sequence, validation, and recovery
- First-run steps, self-hosting test, agent roles, rollback procedures

*See individual parts in `bootstrap.spec.dir/`.*