# speclang-header lines:12
id: "@speclang/compiler"
version: 0.2.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [compiler, codegen, transformation, multi-language]
children:
  - "@ref:specs/compiler.spec.dir/phases  - "@ref:@ref:specs/compiler.spec.dir/targets  - "@ref:specs/compiler.spec.dir/templates
short: "Compiler - Transforms specs into target language code"
status: draft
---

# Compiler

Transforms SpecLang specs into target language code (Go, TypeScript, Python, Rust, etc.). Multi-target, bidirectional, with validation and error recovery.

## Overview

```speclang
# @block:compiler/overview @kind:entity
Compiler:
  inputs:
    - .spec.md files (design specs)
    - .spec.yaml files (structured specs)
    - .{ext}.spec files (direct code mapping)
  
  outputs:
    - Generated code in target languages
    - Build artifacts (binaries, packages)
    - Documentation from specs
    - Test suites from test specs
  
  phases:
    - parse: Read specs with universal headers
    - validate: Check references, completeness
    - resolve: Build dependency graph
    - transform: Apply language-specific rules
    - generate: Write output files
    - verify: Compile and test generated code
  
  bidirectional: Code changes can sync back to specs
  multi_target: Same spec → Go, TypeScript, Python, Rust
  incremental: Only regenerate changed dependencies
```

## How the Compiler Works

The SpecLang compiler follows a **meta-circular design**: the compiler is described in SpecLang specs, and those specs can be used to generate the compiler implementation itself.

### 1. Parsing Phase
The compiler reads spec files with universal headers. Each file declares its purpose, dependencies, and depth in the dependency tree.

**Key components:**
- **Header parser**: Extracts YAML metadata with `speclang-header lines:N`
- **Block extractor**: Finds `@block:id @kind:type` markers
- **Reference resolver**: Maps `@ref:` links to target specs/blocks

See @ref:specs/parser for detailed parsing implementation.

### 2. Validation Phase
Ensures specs are complete and consistent:

- **Header validation**: Required fields present and valid
- **Reference validation**: All `@ref:` targets exist
- **Layer consistency**: Child specs have appropriate abstraction levels
- **Autonomous readiness**: Specs with `agent_support: agent_autonomous` have step-by-step instructions

See @ref:specs/parser.spec.dir/validation for validation rules.

### 3. Resolution Phase
Builds dependency graph and determines compilation order:

- **Dependency graph**: Maps `depends_on`, `children`, `imports` relationships
- **Topological sort**: Orders specs for compilation
- **Transitive closure**: Finds all specs affected by a change

### 4. Transformation Phase
Converts spec blocks to target language constructs:

- **Entity blocks** → structs/classes/interfaces
- **Operation blocks** → functions/methods
- **Policy blocks** → validation rules/guards
- **Test blocks** → test suites

Each target language has specific transformation rules (see @ref:specs/compiler.spec.dir/targets).

### 5. Code Generation Phase
Writes generated code with markers:

- **Templates**: Language-specific templates for common patterns
- **Markers**: `@speclang-id` comments link generated code back to source specs
- **Formatting**: Generated code follows language style guides

See @ref:specs/compiler.spec.dir/templates for template system.

### 6. Verification Phase
Ensures generated code works:

- **Compilation**: Compile generated code (e.g., `tsc`, `go build`)
- **Testing**: Run generated tests
- **Integration**: Verify code integrates with existing codebase

## Bidirectional Sync

SpecLang supports **bidirectional synchronization**:

1. **Spec → Code**: When specs change, regenerate affected code
2. **Code → Spec**: When code is manually edited, propose spec updates

The sync system uses `@speclang-id` markers in generated code to track relationships between code and source specs.

## Multi-Target Support

The same spec can generate code for multiple languages simultaneously:

- **TypeScript**: For web applications and Node.js
- **Go**: For backend services and CLI tools
- **Python**: For data science and scripting
- **Rust**: For performance-critical systems

Each target preserves the same semantics while respecting language idioms.

## Incremental Compilation

For performance, the compiler only regenerates changed files:

1. **Change detection**: File watcher (`speclangd`) detects spec changes
2. **Impact analysis**: Compute transitive closure of affected specs
3. **Selective regeneration**: Only recompile changed specs and dependencies
4. **Caching**: Reuse intermediate representations where possible

## Meta-Circular Bootstrapping

The compiler is **self-hosting**:

1. **Initial compiler**: Simple compiler written manually (or using existing tools)
2. **Compiler specs**: SpecLang specs describe the complete compiler design
3. **Generated compiler**: Use initial compiler to generate improved compiler from specs
4. **Iterative improvement**: Repeat process to enhance compiler capabilities

This creates a **virtuous cycle**: better compiler → better specs → better compiler.

## Phases

See @ref:specs/compiler.spec.dir/phases for detailed compiler phases, validation, resolution, and transformation.

## Targets

See @ref:specs/compiler.spec.dir/targets for language-specific code generation (Go, TypeScript, Python, Rust).

## Templates

See @ref:specs/compiler.spec.dir/templates for code templates, scaffolding, and pattern libraries.

## Integration

The compiler is invoked:
1. **After cascade convergence**: Pipeline runs compiler on all changed specs
2. **Manually**: `speclang generate` command
3. **Via MCP**: External tools can trigger compilation
4. **Incrementally**: Watcher detects spec change → compile only affected files

## Example: Compiling a Simple Spec

```speclang
# @block:example/user @kind:entity
User:
  fields:
    id: string
    name: string
    email: string
```

This spec block generates:

**TypeScript:**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}
```

**Go:**
```go
type User struct {
  ID string `json:"id"`
  Name string `json:"name"`
  Email string `json:"email"`
}
```

**Python:**
```python
@dataclass
class User:
    id: str
    name: str
    email: str
```

The same semantic intent produces idiomatic code in each language.

