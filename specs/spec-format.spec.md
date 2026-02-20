# speclang-header
id: "@speclang/spec-format"
version: 0.1.0
layer: 0
project_level: Alpha
agent_support: agent_autonomous
tags: [format, syntax, self-describing]
status: draft

---

# Spec Format

The format you're reading. Self-describing. Rigid header, flexible body.

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
    
  spec_directory:
    pattern: "*.dir/"
    purpose: Folder containing sub-specs when parent grows too large
    example: auth.dir/, auth.dir/entities.spec.yaml
    relationship: Child specs reference parent via `parent:` header
    
  index_spec:
    pattern: Parent file when split
    purpose: Overview + children references, minimal content
    header_fields:
      - children: List of @ref to child specs
      - short: "(N parts)" indicator
    content: "See {name}.dir/ for details"
    
  child_spec:
    pattern: Files inside *.dir/
    purpose: Part of split spec
    header_fields:
      - parent: @ref to parent spec
      - part: "N/M" position indicator
      - siblings.prev: @ref to previous part (optional)
      - siblings.next: @ref to next part (optional)
```

### @format/dir-convention

```speclang
# @block:format/dir-convention @kind:entity
DirectoryConvention:
  when_to_use:
    - spec exceeds 800 lines
    - spec exceeds 10k tokens
    - natural logical split exists
    
  naming:
    parent: auth.spec.md
    directory: auth.dir/
    children: auth.dir/entities.spec.yaml
    nested: auth.dir/login.dir/handler.spec.md
    
  structure:
    before_split:
      - specs/auth.spec.md (12k tokens)
      
    after_split:
      - specs/auth.spec.md (index, ~500 tokens)
      - specs/auth.dir/
        ├── 01-overview.spec.yaml
        ├── 02-entities.spec.yaml
        ├── 03-operations.spec.yaml
        └── 04-tests.spec.yaml
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

## Block

### @format/block

```speclang
# @block:format/block @kind:entity
Block:
  syntax: "# @block:{id} @kind:{kind} @{attr}:{value}*"
  
  parts:
    - id: unique block identifier
    - kind: what type of content
    - attrs: optional key:value pairs
    - content: until next block or EOF
  
  id_format: domain/path/name
    - no spaces, use hyphens
    - hierarchical with /
    - unique within project
```

### @format/block-example

```speclang
# @block:format/block-example @kind:code
```speclang
# @block:auth/login @kind:operation @status:draft
login(email: String, password: String) -> Result<Token, Error>

steps:
  - find user by email
  - verify password
  - generate token

refs: [@ref:northstar#auth, @ref:stdlib/Result]
```
```

## Kinds

### @format/kinds

```speclang
# @block:format/kinds @kind:table
| Kind | Use | Content |
|------|-----|---------|
| entity | data structure | fields, types |
| operation | function/action | signature, steps |
| policy | rules | conditions, effects |
| test | test spec | given/when/then |
| mock | test double | behavior |
| diagram | visual | mermaid, etc |
| code | implementation | any language |
| note | explanation | prose |
| question | unresolved | question text |
| decision | ADR | context, decision |
```

## Content Types

### @format/prose

```speclang
# @block:format/prose @kind:note
Plain text. Paragraphs separated by blank lines.

No special syntax. Just write.

Use markdown for formatting:
- **bold** for emphasis
- `code` for inline code
- [links](url) for references
```

### @format/code-fence

```speclang
# @block:format/code-fence @kind:note
Code blocks use triple backticks with language:

```language
code here
```

Language can be:
- programming: typescript, go, rust, python
- spec: speclang, ebnf
- diagram: mermaid, plantuml
- math: latex
- data: yaml, json, toml
```

### @format/table

```speclang
# @block:format/table @kind:note
Standard markdown tables:

| Column1 | Column2 |
|---------|---------|
| value1  | value2  |
| value3  | value4  |
```

### @format/list

```speclang
# @block:format/list @kind:note
Bullet lists:
- item one
- item two
  - nested item

Numbered:
1. first
2. second
3. third
```

## References

### @format/ref

```speclang
# @block:format/ref @kind:entity
Reference:
  syntax: @ref:path/to/block
  inline: see @ref:format/ref for details
  explicit: refs: [@ref:format/block, @ref:format/kinds]
  
  forms:
    @ref:spec           -> entire spec
    @ref:spec#block     -> specific block
    @ref:file.ext#loc   -> generated code location
```

### @format/ref-usage

```speclang
# @block:format/ref-usage @kind:code
```speclang
# @block:auth/login @kind:operation
refs: [@ref:northstar#auth, @ref:stdlib/Result, @ref:specs/users#User]

login uses User from @ref:specs/users#User.
Returns Result from @ref:stdlib/Result.
Part of auth feature from @ref:northstar#auth.
```
```

## Generated Code Markers

### @format/markers

```speclang
# @block:format/markers @kind:entity
GeneratedCodeMarker:
  purpose: link code back to spec
  
  format:
    // SPECLANG-ID: @ref:specs/auth#login
    // SPECLANG-NORTHSTAR: @ref:northstar#auth
    // SPECLANG-VERSION: 1.2.0
    // SPECLANG-GENERATED: DO NOT EDIT
  
  placement: at top of generated file or before each function
```

### @format/marker-example

```speclang
# @block:format/marker-example @kind:code
```typescript
// SPECLANG-ID: @ref:specs/auth#login
// SPECLANG-NORTHSTAR: @ref:northstar#auth
// SPECLANG-VERSION: 1.0.0
// SPECLANG-GENERATED: DO NOT EDIT

export async function login(email: string, password: string): Promise<Result<Token, AuthError>> {
  // implementation
}
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
| 4 | Code | Generated implementation |
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
