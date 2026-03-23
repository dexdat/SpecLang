# speclang-header lines:9
id: "@speclang/rust"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [typescript, generated, auto-generated]
short: "Auto-generated spec for rust.ts"
status: generated
---

# Rust Generator

TypeScript generator for Rust code output. Implements the ITargetGenerator interface to produce Rust source code from specs.

## Overview

```speclang
# @block:rust/generator/overview @kind:entity
RustGenerator:
  purpose: Generate Rust code from SpecLang specs
  implements: ITargetGenerator
  output_language: Rust
  features:
    - Module structure generation
    - Function and method generation
    - Type definitions (struct, enum)
    - Error handling with Result<T, E>
    - Async/await support
    - Testing module generation
  
  configuration:
    - crate_name: Name of Rust crate
    - edition: Rust edition (2021)
    - dependencies: Cargo.toml dependencies
```

## Interface

```speclang
# @block:rust/generator/interface @kind:code
export interface ITargetGenerator {
  generate(spec: ParsedSpec, options: GeneratorOptions): GeneratedFile[];
}

export class RustGenerator implements ITargetGenerator {
  generate(spec: ParsedSpec, options: GeneratorOptions): GeneratedFile[] {
    // Generate Rust code
  }
}
```

## Code Generation

```speclang
# @block:rust/generator/code @kind:operation
Rust code generation process:

1. Parse spec blocks for entities, operations
2. Map SpecLang types to Rust types
3. Generate struct definitions with fields
4. Generate impl blocks with methods
5. Generate error types using thiserror or anyhow
6. Generate tests using #[test] attributes
7. Output to appropriate file structure
```

## Example Output

```speclang
# @block:rust/generator/example @kind:code
// Generated Rust code from auth.spec.md
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub hashed_password: String,
}

impl User {
    pub fn new(email: String, password: String) -> Result<Self, AuthError> {
        // implementation
    }
}
```

## Integration

```speclang
# @block:rust/generator/integration @kind:note
The Rust generator is part of the code generation pipeline:

- Cascade detects spec changes
- CodeGen agent selects appropriate generator
- RustGenerator produces .rs files
- Files are written to generated/rust/
- Cargo.toml is updated with dependencies
- Tests are generated and run via cargo test
```

