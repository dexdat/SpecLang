---
id: "@speclang/directory-structure"
version: 0.1.0
layer: 0
tags: [directory, structure, hierarchy, dir]
imports: ["@speclang/core", "@speclang/project-layout"]
children: ["@speclang/directory-structure/pattern", "@speclang/directory-structure/creation"]
status: draft

project_level: Alpha
agent_support: agent_autonomous
short: Directory Structure
---

# Directory Structure

Hierarchical spec organization using `.spec.dir/` folders for sub-specs.

## Overview

```speclang
# @block:dir/overview @kind:note
Specs use a tree hierarchy:
Nesting can be any depth needed for proper organization.

- `auth.spec.md` = single spec file (leaf spec)
- `auth.spec.dir/` = folder containing **sub-specs**
- Sub-specs reference parent via `@ref`

**Sub-specs are a feature, not a problem.**

Having `.spec.dir/` folders is encouraged because:
- Keeps context focused and manageable
- Enables modular, focused specs
- Makes it easier to understand and maintain specs
- Avoids context bloat by breaking large topics into smaller pieces

There is NO issue with having sub-specs. Use them freely.
```

---

## Sub-specs

This spec has been split into focused sub-specs for better organization:

### @ref:specs/directory-structure/pattern
- Directory patterns and naming conventions
- Example structures and expansion depth
- Unlimited nesting capabilities

### @ref:specs/directory-structure/creation
- Parent-child reference patterns
- SQLite tree queries and flattening strategies
- Creating new specs and directory vs file comparison
- Git ignore rules and code location principles
- Non-spec directory handling

Each sub-spec provides detailed, focused content while maintaining reference links back to this parent spec.
