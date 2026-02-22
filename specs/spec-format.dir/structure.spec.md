# speclang-header lines:14
id: "@speclang/spec-format/structure"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [format, syntax, self-describing]
status: draft
parent: @ref:specs/spec-format
part: 1/2
siblings:
  next: @ref:specs/spec-format.dir/blocks

short: Spec Format - Structure
---

# Spec Format: Structure

## File Structure

### @format/structure

```speclang
# @block:format/structure @kind:entity
SpecFile:
  parts:
    - header: required, YAML frontmatter
    - divider: "---" alone on line
    - blocks: content blocks
  
  extension: .scl (speclang)
  encoding: UTF-8
```

### @format/file-types

```speclang
# @block:format/file-types @kind:entity
SpecFileTypes:

  leaf_spec:
    pattern: "*.spec.md", "*.spec.yaml", "*.scl"
    purpose: Single spec file with content
    example: auth.spec.md, login.scl

  sub_spec_directory:
    pattern: "*.spec.dir/"
    purpose: Folder containing sub-specs for modular organization
    example: auth.spec.dir/, auth.spec.dir/entities.spec.yaml
    relationship: Sub-specs reference parent via `parent:` header

    **Benefits:**
    - Keeps context focused
    - Makes specs easier to understand
    - No downside to having sub-specs

  index_spec:
    pattern: Parent file when split
    purpose: Overview + children references, minimal content
    header_fields:
      - children: List of @ref to sub-specs
      - short: "(N parts)" indicator
    content: "See {name}.spec.dir/ for details"

  sub_spec:
    pattern: Files inside *.spec.dir/
    purpose: Contained spec within a directory
    header_fields:
      - parent: @ref to parent spec
      - part: "N/M" position indicator (optional)
      - siblings.prev: @ref to previous part (optional)
      - siblings.next: @ref to next part (optional)
```

### @format/dir-convention

```speclang
# @block:format/dir-convention @kind:entity
DirectoryConvention:
  when_to_use:
    - spec exceeds size limits
    - natural logical split exists
    - anytime you want modular specs

    **There is NO problem with having sub-specs.**

  naming:
    parent: auth.spec.md
    directory: auth.spec.dir/
    children: auth.spec.dir/entities.spec.yaml
    nested: auth.spec.dir/login.spec.dir/handler.spec.md

  structure:
    single_spec:
      - specs/auth.spec.md (works for small specs)

    with_sub_specs:
      - specs/auth.spec.md (index, overview)
      - specs/auth.spec.dir/
        ├── overview.spec.yaml
        ├── entities.spec.yaml
        ├── operations.spec.yaml
        └── tests.spec.yaml

  benefits:
    - Each sub-spec has focused context
    - Easier to read and maintain
    - Avoids context bloat in large specs
```

## Header

### @format/header

```speclang
# @block:format/header @kind:entity
Header:
  required:
    - id: unique identifier (@path/to/spec)
    - version: semver string
  
  optional:
    - layer: 0-10 abstraction depth
    - project_level: POC | MVP | Alpha | Beta | Production | Startup | SMB | MSB | Enterprise
    - agent_support: human_only | agent_assisted | agent_autonomous
    - tags: list of searchable tags
    - imports: other specs this depends on
    - status: draft | stable | deprecated
    - owner: who maintains this
    - refs: related specs/blocks
  
  syntax: YAML, must be parseable
```

### @format/header-split-fields

```speclang
# @block:format/header-split-fields @kind:entity
HeaderSplitFields:
  for_parent_specs:
    children:
      type: array of @ref
      purpose: List child specs in .dir/
      example: [@ref:specs/auth.dir/entities, @ref:specs/auth.dir/operations]
      
  for_child_specs:
    parent:
      type: @ref
      purpose: Reference to parent spec
      example: @ref:specs/auth
      
    part:
      type: string "N/M"
      purpose: Position in split sequence
      example: "1/4"
      
    siblings:
      prev: @ref (optional)
      next: @ref (optional)
```

### @format/header-example

```speclang
# @block:format/header-example @kind:code
```yaml
# speclang-header
id: @myapp/auth
version: 1.2.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [auth, security, user]
imports:
  - @speclang/stdlib
  - @myapp/users
status: stable
owner: @team-security
refs: [@ref:northstar#auth]

---
```
```

### @format/header-split-example

```speclang
# @block:format/header-split-example @kind:code
Parent index spec (auth.spec.md):
```yaml
# speclang-header
id: @myapp/auth
version: 1.2.0
children:
  - @ref:specs/auth.dir/entities
  - @ref:specs/auth.dir/operations
  - @ref:specs/auth.dir/policies
short: "Authentication (3 parts)"
---

This spec has been split. See auth.dir/ for details.
```

Child spec (auth.dir/entities.spec.yaml):
```yaml
# speclang-header
id: @myapp/auth.dir/entities
parent: @ref:specs/auth
part: 1/3
siblings:
  next: @ref:specs/auth.dir/operations
short: "Auth entities"
---

# Entities

## User
...
```
```

## Minimal Spec

### @format/minimal

```speclang
# @block:format/minimal @kind:code
```speclang
# speclang-header
id: @example/minimal
version: 1.0.0

---

# @block:example/hello @kind:note
Hello, speclang.
```
```

## Layer System

### @format/layers

```speclang
# @block:format/layers @kind:table
| Layer | Name | Content |
|-------|------|---------|
| 0 | Intent | One-line goal |
| 1 | Feature | Feature breakdown |
| 2 | Component | Entities, operations |
| 3 | Detail | Pseudocode, diagrams |
| 4 | Implementation | Language mapping |
| 5 | Code Spec | Direct code mapping |
| 6 | Generated Code | Output code |
| 7 | Test Spec | Natural language test descriptions |
| 8 | Test Code Spec | Test code mapping |
| 9 | Generated Test Code | Generated test code |
| 10 | Deployment/Ops | Infrastructure configuration |
```

## Validation

### @format/validation

```speclang
# @block:format/validation @kind:entity
Validation:
  errors:
    - missing header
    - invalid header YAML
    - missing required field
    - duplicate block ID
    - unresolved reference
    
  warnings:
    - missing layer
    - no refs to northstar
    - deprecated status used
    - empty spec
```

## Self-Reference

### @format/meta

```speclang
# @block:format/meta @kind:note
This spec describes itself.

- The header you see follows @ref:format/header
- The blocks follow @ref:format/block
- The references use @ref:format/ref

Speclang is written in speclang. Meta-circular.
```