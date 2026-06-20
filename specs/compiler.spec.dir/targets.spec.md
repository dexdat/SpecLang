# speclang-header lines:12
id: "@speclang/compiler.spec.dir/targets"
version: 0.1.0
layer: 2
tags: [compiler, targets, languages]
project_level: Alpha
agent_support: agent_assisted
parent: "@ref:speclang/compiler"
part: 2/3
short: Compiler target languages

---
# Compiler Targets

Supported output languages and their mappings.

## Targets

### @compiler/target-typescript

```speclang
# @block:compiler/ts-target @kind:entity
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

### @compiler/target-go

```speclang
# @block:compiler/go-target @kind:entity
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

### @compiler/target-rust

```speclang
# @block:compiler/rust-target @kind:entity
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

### @compiler/target-python

```speclang
# @block:compiler/py-target @kind:entity
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