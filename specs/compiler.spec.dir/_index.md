# speclang-header lines:10
id: "@specs/compiler-dir/index"
version: 1.0.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [compiler, index, directory]
short: "Compiler Directory Index - Code generation sub-specs"
status: active
---

# Compiler Directory Index

**Directory:** `specs/compiler.dir/`  
**Parent:** `compiler.spec.md` (main index spec)

## Contents

This directory contains sub-specs for the Compiler - transforms SpecLang specs into target language code.

### Files

1. **`phases.spec.md`** - Compiler Phases
   - Parse, validate, resolve, transform, generate, verify phases
   - Layer: 2, Part: 1/3
   - Siblings: next → `targets.spec.md`

2. **`targets.spec.md`** - Compiler Targets
   - Language-specific code generation (Go, TypeScript, Python, Rust)
   - Layer: 2, Part: 2/3
   - Siblings: prev → `phases.spec.md`, next → `templates.spec.md`

3. **`templates.spec.md`** - Compiler Templates
   - Code templates, scaffolding, pattern libraries
   - Layer: 2, Part: 3/3
   - Siblings: prev → `targets.spec.md`

## Reading Order

For understanding the compiler:

1. **Start with parent:** `../compiler.spec.md` (main index)
2. **Then read:** `phases.spec.md` (compiler phases)
3. **Then read:** `targets.spec.md` (language targets)
4. **Then read:** `templates.spec.md` (code templates)

## Key Concepts

### From `phases.spec.md`:
- **Parse**: Read specs with universal headers
- **Validate**: Check references, completeness, constraints
- **Resolve**: Build dependency graph, topological sort
- **Transform**: Apply language-specific rules and patterns
- **Generate**: Write output files with proper structure
- **Verify**: Compile and test generated code

### From `targets.spec.md`:
- **Go target**: Generate Go code with proper packages and interfaces
- **TypeScript target**: Generate TypeScript with types and modules
- **Python target**: Generate Python with proper imports and classes
- **Rust target**: Generate Rust with traits and error handling
- **Multi-target**: Same spec → multiple languages simultaneously

### From `templates.spec.md`:
- **Code templates**: Reusable patterns for common structures
- **Scaffolding**: Generate project structure from specs
- **Pattern libraries**: Best practices for each language
- **Custom templates**: User-extensible template system

## Dependencies

All files:
- Reference parent: @ref:specs/compiler
- Reference siblings via `siblings.prev` and `siblings.next`
- Reference `spec-format.dir/` for spec format definitions
- Reference `headers.spec.md` for header parsing

## Purpose

The Compiler directory defines:
- **How specs become code** - Transformation pipeline
- **Multi-language support** - Same spec → Go/TS/Py/Rs
- **Bidirectional sync** - Code changes can update specs
- **Incremental compilation** - Only regenerate changed files
- **Validation and verification** - Ensure generated code works

## Integration

The compiler is invoked:
1. **After cascade convergence**: Pipeline runs compiler
2. **Manually**: `speclang generate` command
3. **Via MCP**: External tools can trigger compilation
4. **Incrementally**: Watcher detects spec change → compile affected files

## Notes

- **Layer 2**: Implementation details of layer 1 compiler concept
- **Multi-target**: Core feature of SpecLang
- **Bidirectional**: Unique to SpecLang (code → spec sync)
- **Incremental**: Performance optimization for large projects

For complete compiler understanding, read `../compiler.spec.md` first, then these sub-specs in order.