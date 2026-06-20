# speclang-header lines:13
id: "@speclang/project-layout/conventions"
version: 0.1.0
layer: 2
tags: [layout, conventions, naming, refs]
imports: ["@speclang/project-layout"]
parent: "@ref:specs/project-layout"
part: 2/2
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Project Conventions
---
## Conventions

### @layout/naming

```speclang
# @block:layout/naming @kind:entity
NamingConventions:
  specs: lowercase, hyphens
    - auth.scl
    - user-profile.scl
  
  tests: {feature}.test.spec.scl
    - auth.test.spec.scl
  
  generated: matches target conventions
    - ts: camelCase files
    - go: snake_case files
    - py: snake_case files
```

### @layout/refs

```speclang
# @block:layout/refs @kind:note
Reference paths are relative to project root:

- "@ref:specs/auth -> specs/auth.scl"
- @ref:tests/auth#login -> tests/auth.test.spec.scl block "login"
- @ref:northstar -> project.scl
- @ref:generated/ts/auth -> generated/ts/auth/

Always use @ref, never hardcode paths.
```
