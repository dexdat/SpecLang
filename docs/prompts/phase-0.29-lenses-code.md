# Bootstrap Phase 0.29: Code Lens Specification

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.29 of the bootstrap process.

**Prerequisites**: 
- Phase 0.14 (Lens System) complete
- Phase 0.28 (Mermaid Diagram Lens) complete
- Lens system implementation exists

## Your Task
Create the Code lens specification file (`specs/lenses.spec.dir/code.spec.md`) to provide comprehensive documentation, detection rules, examples, and integration guidelines for the Code lens, which handles code blocks in any programming language.

## Read These Specs First
1. `specs/lenses.spec.md` - Lens system overview
2. `specs/lenses.spec.dir/formats.spec.md` - Built-in lens formats (includes @block:lens/code)
3. `specs/lenses.spec.dir/mermaid.spec.md` - Example lens spec
4. `specs/core.spec.md` - Block structure

## What to Build

### Files to Create
```
specs/lenses.spec.dir/code.spec.md
```

### Requirements

#### 1. Header
The spec must have a valid SpecLang header with:
- `id: "@speclang/lenses/code"`
- `version: 0.1.0`
- `layer: 2`
- `parent: "@speclang/lenses"`
- `tags: [lenses, code, snippets]`
- `imports: ["@speclang/lenses"]`
- `project_level: Alpha`
- `agent_support: agent_assisted`
- `short: Code Lens`

#### 2. Content Structure
The spec should include the following sections:

##### Overview
Explain the Code lens purpose: to embed code snippets in any programming language, providing reference implementations, examples, and reusable snippets.

##### Supported Languages
List common programming languages supported (any language is allowed, but highlight typical ones):
- TypeScript/JavaScript
- Python
- Go
- Rust
- Java
- SQL
- Shell scripts

##### Usage in SpecLang
Demonstrate how to use Code lens in a spec block:
- Using `@kind:code` marker
- Code fence with language identifier
- Optional metadata (e.g., `@test`, `@example`, `@implementation`)

##### Detection Rules
Define clear detection rules for the CodeLens:
- Content starts with ````lang` fence (where lang is any word)
- `@kind` marker is `code`
- Optional: detect based on language-specific patterns

##### Integration with Other Lenses
Show how code blocks can be combined with:
- Entity lens (defining data structures)
- Operation lens (implementing functions)
- Prose lens (explaining the code)
- Acceptance lens (test code)

##### Language-Specific Handling
Describe how the lens can preserve language syntax highlighting, and optionally extract signatures, imports, or dependencies.

##### Configuration
Document configuration options for code formatting, indentation, and language detection via `speclang-config.yaml`.

##### References
Include references to:
- `@ref:speclang/lenses/formats#code`
- `@ref:speclang/lenses`

#### 3. Examples
Provide at least 3 comprehensive examples:
1. A TypeScript interface and function implementation
2. A Python class with methods
3. A SQL schema definition

Each example should be a complete spec block with proper headers and context.

#### 4. Detection Rules in Speclang Format
Include a `@block:lens/detection/code` with `@kind:operation` that defines the `detectCodeLens` function in pseudocode.

#### 5. Integration Examples
Show a multi-lens block that combines code with prose explanation, entity definitions, and acceptance tests.

## Test Cases
1. The spec file passes SpecLang validation
2. All code examples are syntactically valid (can be optionally validated)
3. Detection rules are clear and implementable
4. References resolve correctly

## Validation
```bash
# Validate the spec file
speclang validate specs/lenses.spec.dir/code.spec.md

# Check references
speclang refs check specs/lenses.spec.dir/code.spec.md
```

## Output Format
After completing, output:
1. Spec file created
2. Sections added
3. Examples included
4. Validation results