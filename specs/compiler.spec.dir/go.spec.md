---
id: "@speclang/compiler.spec.dir/go"
version: 0.1.0
layer: 5
tags: [compiler, targets, go]
imports: ["@speclang/core", "@speclang/stdlib", "@speclang/compiler.spec.dir/targets"]
project_level: Alpha
agent_support: agent_autonomous
parent: ""@ref:specs/compiler.spec.dir/targets"short: Go code generator implementation
references:
  - ""@ref:src/compiler/go/types.ts"  - ""@ref:src/compiler/go/templates.ts"  - ""@ref:src/compiler/go/builtins.ts"  - ""@ref:src/compiler/targets/go.ts"
---

# Go Code Generator

Implements code generation from SpecLang specs to idiomatic Go code.

## Overview

The Go generator transforms spec blocks into Go source files with:
- Proper type mappings from stdlib to Go types
- Idiomatic Go naming conventions (PascalCase, camelCase)
- Import management (stdlib vs third-party)
- Struct tags for JSON serialization

## Type Mappings

### @compiler/go-types-primitive

| Stdlib | Go | Zero Value |
|--------|-----|------------|
| String | string | "" |
| Int | int | 0 |
| Int32 | int32 | 0 |
| Int64 | int64 | 0 |
| Float | float64 | 0.0 |
| Bool | bool | false |
| Bytes | []byte | nil |

### @compiler/go-types-time

| Stdlib | Go | Import |
|--------|-----|--------|
| Date | time.Time | time |
| DateTime | time.Time | time |
| Timestamp | time.Time | time |

### @compiler/go-types-identifier

| Stdlib | Go | Import |
|--------|-----|--------|
| UUID | uuid.UUID | github.com/google/uuid |

### @compiler/go-types-collections

| Stdlib | Go |
|--------|-----|
| Array\<T\> | []T |
| Map\<K,V\> | map[K]V |

### @compiler/go-types-optional

| Stdlib | Go |
|--------|-----|
| Optional\<T\> | *T |

## Templates

### @compiler/go-template-struct

```go
type {{name}} struct {
{{fields}}
}
```

### @compiler/go-template-interface

```go
type {{name}} interface {
{{methods}}
}
```

### @compiler/go-template-function

```go
func {{receiver}}{{name}}({{params}}) ({{returns}}) {
{{body}}
}
```

### @compiler/go-template-enum

```go
type {{name}} int

const (
    {{firstValue}} {{name}} = iota
    {{otherValues}}
)
```

## Implementation

### Files

- `src/compiler/go/types.ts` - Type mapping functions
- `src/compiler/go/templates.ts` - Go code templates
- `src/compiler/go/builtins.ts` - Go stdlib built-in types
- `src/compiler/targets/go.ts` - Main Go generator class

### Generator Interface

```typescript
interface IGoGenerator {
  language: 'go';
  extension: '.go';
  
  generate(spec: CodeSpec): GeneratedFile[];
  mapType(stdlibType: string): string;
  formatImports(imports: string[]): string;
  fileHeader(spec: CodeSpec): string;
  fileFooter(spec: CodeSpec): string;
}
```

## Validation Rules

1. All generated Go code must compile with `go build`
2. Struct fields must have valid JSON tags
3. Import paths must be valid Go import paths
4. Package names must be valid Go identifiers
