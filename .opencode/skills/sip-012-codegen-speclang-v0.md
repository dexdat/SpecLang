---
name: sip-012-codegen-speclang-v0
title: "SIP 12: Code Generation Framework"
version: 0.1.0
description: Transforms specs into code with bidirectional sync
category: standard
---

# SIP 12: Code Generation Framework

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the SpecLang compiler that transforms specs into executable code.

### Quick Start

1. **Parse:** Read spec files, build graph
2. **Validate:** Check structure, refs, types
3. **Resolve:** Expand imports, bind refs
4. **Transform:** Lower to target-agnostic IR
5. **Codegen:** Generate target code with markers

### Example

```yaml
# specs/auth.spec.yaml
entities:
  User:
    id: UUID
    email: String
    password_hash: String
```

↓ Generates ↓

```go
// generated/go/auth/entities.go
// @speclang-id: @specs/auth#User
// @speclang-generated: DO NOT EDIT

type User struct {
    ID           uuid.UUID `json:"id"`
    Email        string    `json:"email"`
    PasswordHash string    `json:"password_hash"`
}
```

### Key Concepts

- **Multi-Target:** TypeScript, Go, Rust, Python, OpenAPI
- **Bidirectional:** Sync code changes back to specs
- **Incremental:** Only recompile what changed
- **Marked:** Generated code links back to source specs

### When to Read This

- **Generating code:** How specs become programs
- **Adding targets:** How to support new languages
- **Bidirectional sync:** How manual edits sync to specs

### Related SIPs

- SIP 3: Block System
- SIP 4: Reference System

## Abstract

This SIP defines the SpecLang compiler and code generation framework. The compiler transforms specification blocks into executable code for multiple target languages, with bidirectional sync to preserve manual edits.

## Motivation

Specs should be the source of truth:
- Write specs, get code
- Specs change, code updates
- Code changes can sync back to specs

The compiler bridges the spec-code gap.

## Rationale

**Compilation Pipeline:**

```
┌─────────┐    ┌─────────┐    ┌──────────┐    ┌───────────┐
│  Specs  │ →  │  Parse  │ →  │ Validate │ →  │  Resolve  │
└─────────┘    └─────────┘    └──────────┘    └─────────┬─┘
                                                    │
      ┌─────────────────────────────────────────────┘
      ▼
┌───────────┐    ┌──────────┐    ┌─────────────────────────┐
│ Transform │ →  │ Codegen  │ →  │      Artifacts          │
└───────────┘    └──────────┘    │  .ts  .go  .rs  .py     │
                                 │  openapi.yaml  schema.json│
                                 └─────────────────────────┘
      ▲
      │ sync back
      │
┌─────┴─────┐
│   Sync    │ ← Manual edits to generated code
└───────────┘
```

**Benefits:**
- Specs remain source of truth
- Fast iteration via incremental compilation
- Manual edits can be preserved
- Multiple output targets

## Specification

### Phases

#### 1. Parse

```speclang
parse(sources: File[]) -> SpecGraph

Steps:
  1. Read each file
  2. Extract header
  3. Parse blocks
  4. Extract refs
  5. Build graph

Output:
  - nodes: all blocks with IDs
  - edges: refs between blocks
  - headers: file metadata
  - errors: parse failures
```

#### 2. Validate

```speclang
validate(graph: SpecGraph) -> ValidationResult

Checks:
  - header format valid
  - block IDs unique
  - refs point to existing blocks
  - kind-specific syntax valid
  - no circular deps (or marked as intentional)

Output:
  - valid: bool
  - errors: list with locations
  - warnings: list with suggestions
```

#### 3. Resolve

```speclang
resolve(graph: SpecGraph) -> ResolvedGraph

Steps:
  1. Expand imports
  2. Inline stdlib refs
  3. Calculate dependency order
  4. Type all expressions
  5. Bind all refs

Output:
  - ordered blocks
  - resolved types
  - dependency map
```

#### 4. Transform

```speclang
transform(graph: ResolvedGraph, target: Target) -> IR

Steps:
  1. Lower to target-agnostic IR
  2. Apply target-specific transforms
  3. Optimize
  4. Prepare for codegen

IR:
  - entities -> structs/classes
  - operations -> functions/methods
  - policies -> middleware/guards
  - diagrams -> comments or skip
```

#### 5. Codegen

```speclang
codegen(ir: IR, target: Target) -> Artifact[]

Targets:
  - typescript: .ts files
  - go: .go files
  - rust: .rs files
  - python: .py files
  - openapi: .yaml spec
  - jsonschema: .json schemas

Each artifact:
  - path: output location
  - content: generated code
  - markers: @speclang-id refs back to source
```

### Type Mapping

#### TypeScript Target

```yaml
TypeScriptTarget:
  file_ext: ".ts"
  
  mappings:
    entity: interface or class
    operation: function
    policy: type guard or middleware
    enum: union type or enum
  
  features:
    - type inference
    - optional chaining
    - template literals
    - decorators for metadata
```

#### Go Target

```yaml
GoTarget:
  file_ext: ".go"
  
  mappings:
    entity: struct
    operation: func
    policy: func that returns error
    enum: iota const or string
  
  features:
    - explicit error handling
    - interface for polymorphism
    - struct tags for json/db
```

#### Rust Target

```yaml
RustTarget:
  file_ext: ".rs"
  
  mappings:
    entity: struct
    operation: fn
    policy: impl or Result
    enum: enum
    Option<T>: Option<T>
    Result<T,E>: Result<T,E>
  
  features:
    - ownership annotations
    - lifetime inference
    - derive macros
    - error types with thiserror
```

#### Python Target

```yaml
PythonTarget:
  file_ext: ".py"
  
  mappings:
    entity: @dataclass or Pydantic
    operation: def
    policy: decorator or raise
    enum: Enum class
  
  features:
    - type hints
    - pydantic for validation
    - async/await
```

### Template System

Templates use Handlebars syntax:

```handlebars
// typescript/entity.hbs
export interface {{name}} {
  {{#each fields}}
  {{name}}: {{tsType type}};
  {{/each}}
}

// @speclang-id: {{blockId}}
// @speclang-generated: DO NOT EDIT
```

### Markers

Generated code always includes markers:

```
// @speclang-id: @auth/login-handler
// @speclang-version: 1.2.0
// @speclang-layer: 2
// @speclang-generated: DO NOT EDIT BY HAND
```

These enable:
- Sync back to spec
- Version tracking
- Layer awareness

## Bidirectional Sync

### Detect Drift

```speclang
detectDrift(spec: SpecGraph, files: File[]) -> DriftReport

Steps:
  1. Parse generated file markers
  2. Compare with current spec
  3. Detect manual edits
  4. Detect spec changes

Output:
  - spec_ahead: spec changed, code stale
  - code_ahead: code changed, spec stale
  - in_sync: no drift
```

### Sync Code to Spec

```speclang
syncCodeToSpec(code: Code, spec: Block) -> BlockUpdate

When code was edited:
  1. Parse code with markers
  2. Extract logic/structure
  3. Propose spec block update
  4. Ask user to accept/reject
  5. Update spec if accepted
```

### Sync Spec to Code

```speclang
syncSpecToCode(spec: Block, code: Code) -> CodeUpdate

When spec was edited:
  1. Parse spec changes
  2. Find affected generated files
  3. Regenerate those files
  4. Diff and show changes
  5. Write if approved
```

## Incremental Compilation

```speclang
compileIncremental(graph: SpecGraph, changed: BlockId[]) -> Artifact[]

Steps:
  1. Find transitive deps of changed blocks
  2. Only recompile affected scope
  3. Reuse cached IR where possible
  4. Write only changed artifacts

Benefits:
  - low-latency watch mode
  - efficient CI
```

### Compile Cache

```yaml
CompileCache:
  location: .speclang/cache
  entries:
    - blockId -> IR hash
    - IR hash -> artifact hash
  
  invalidation:
    - spec content changed
    - import version changed
    - compiler version changed
```

## Plugins

```yaml
CompilerPlugin:
  name: String
  version: SemVer
  
  hooks:
    - beforeParse(source) -> source
    - afterParse(graph) -> graph
    - beforeValidate(graph) -> graph
    - afterValidate(result) -> result
    - beforeTransform(ir) -> ir
    - beforeCodegen(ir, target) -> ir
    - afterCodegen(artifacts) -> artifacts
```

Built-in plugins:
- mermaid-validator: validates diagram syntax
- ref-resolver: resolves @id references
- stdlib-inliner: inlines stdlib blocks
- layer-enforcer: warns on missing layers

## Error Handling

```yaml
CompileError:
  code: String          # E001, E002, etc
  message: String
  location: Location
  block: BlockId?
  suggestions: String[]

Location:
  file: String
  line: Int
  column: Int
  endLine: Int?
  endColumn: Int?
```

### Error Codes

| Code | Meaning |
|------|---------|
| E001 | Invalid header |
| E002 | Missing header |
| E003 | Duplicate block ID |
| E004 | Unresolved ref |
| E005 | Invalid block syntax |
| E006 | Circular dependency |
| E007 | Type mismatch |
| E008 | Unknown kind |
| W001 | Missing layer |
| W002 | Unused import |

## Lockfile

```yaml
Lockfile:
  version: SemVer
  compiler_version: SemVer
  entries: LockEntry[]
  generated_at: DateTime

LockEntry:
  spec_id: String
  spec_version: SemVer
  spec_hash: String
  artifacts: ArtifactEntry[]

ArtifactEntry:
  path: String
  hash: String
  target: String

Purpose:
  - detect drift
  - enable reproducible builds
  - track what version generated what
```

## References

- @ref:specs/compiler - Compiler spec (parent)
- @ref:specs/compiler.spec.dir/phases - Compiler phases
- @ref:specs/compiler.spec.dir/targets - Target languages
- @ref:specs/compiler.spec.dir/templates - Templates and markers
- SIP 3: Block System
- SIP 4: Reference System

## Copyright

This document is in the public domain.
