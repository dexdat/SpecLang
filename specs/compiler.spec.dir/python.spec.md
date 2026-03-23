# speclang-header lines:16
id: "@speclang/compiler.spec.dir/python"
version: 0.1.0
layer: 5
tags: [compiler, targets, python]
imports: ["@speclang/core", "@speclang/stdlib", "@speclang/compiler.spec.dir/targets"]
project_level: Alpha
agent_support: agent_autonomous
parent: ""@ref:specs/compiler.spec.dir/targets"short: Python code generator implementation
references:
  - ""@ref:src/compiler/python/types.ts"  - ""@ref:src/compiler/python/templates.ts"  - ""@ref:src/compiler/python/builtins.ts"  - ""@ref:src/compiler/targets/python.ts"
---

# Python Code Generator

Implements code generation from SpecLang specs to idiomatic Python code.

## Overview

The Python generator transforms spec blocks into Python source files with:
- Proper type mappings from stdlib to Python types
- Idiomatic Python naming conventions (PascalCase, snake_case)
- Import management (stdlib vs third-party)
- Support for dataclasses and Pydantic models

## Type Mappings

### @compiler/python-types-primitive

| Stdlib | Python | Zero Value |
|--------|--------|------------|
| String | str | "" |
| Int | int | 0 |
| Float | float | 0.0 |
| Bool | bool | False |
| Bytes | bytes | b"" |

### @compiler/python-types-time

| Stdlib | Python | Import |
|--------|--------|--------|
| Date | date | datetime |
| DateTime | datetime | datetime |

### @compiler/python-types-identifier

| Stdlib | Python | Import |
|--------|--------|--------|
| UUID | UUID | uuid |

### @compiler/python-types-collections

| Stdlib | Python |
|--------|--------|
| Array\<T\> | list[T] |
| Map\<K,V\> | dict[K, V] |
| Set\<T\> | set[T] |

### @compiler/python-types-optional

| Stdlib | Python |
|--------|--------|
| Optional\<T\> | T \| None |

## Templates

### @compiler/python-template-dataclass

```python
@dataclass
class {{name}}:
{{fields}}
```

### @compiler/python-template-function

```python
def {{name}}({{params}}) -> {{returnType}}:
    """{{docstring}}"""
{{body}}
```

### @compiler/python-template-class

```python
class {{name}}:
    """{{docstring}}"""
{{body}}
```

### @compiler/python-template-enum

```python
class {{name}}(str, Enum):
{{values}}
```

## Implementation

### Files

- `src/compiler/python/types.ts` - Type mapping functions
- `src/compiler/python/templates.ts` - Python code templates
- `src/compiler/python/builtins.ts` - Python stdlib built-in types
- `src/compiler/targets/python.ts` - Main Python generator class

### Generator Interface

```typescript
interface IPythonGenerator {
  language: 'python';
  extension: '.py';
  
  generate(spec: CodeSpec): GeneratedFile[];
  mapType(stdlibType: string): string;
  formatImports(imports: string[]): string;
  fileHeader(spec: CodeSpec): string;
  fileFooter(spec: CodeSpec): string;
}
```

## Validation Rules

1. All generated Python code must be syntactically valid
2. Dataclass fields must have valid type annotations
3. Import statements must reference valid modules
4. Function and class names must be valid Python identifiers
