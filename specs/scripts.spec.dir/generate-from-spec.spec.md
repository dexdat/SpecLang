# speclang-header lines:11
id: "@speclang/scripts-generate-from-spec"
version: 0.1.0
layer: 2
tags: [scripts, generation]
parent: "@ref:speclang/scriptsstatus: draft
project_level: Alpha
agent_support: agent_assisted
short: Generate From Spec Script
target: scripts/generate_from_spec.py
---

# Generate From Spec Script

Generic script for generating code from SpecLang specifications.

## Overview

```speclang
# @block:overview @kind:note
The generate-from-spec script is a generic code generator that reads
SpecLang specifications and produces target language code. It supports
multiple output languages and can be extended with custom templates.
```

## Purpose

```speclang
# @block:purpose @kind:note
Each target language typically needs a specialized generator. This script:
1. Reads any SpecLang spec format (.scl, .spec.md, .spec.yaml)
2. Extracts @kind:entity, @kind:function, @kind:class blocks
3. Applies language-specific templates
4. Generates compilable code in the target language
5. Supports custom template plugins
```

## Supported Block Types

```speclang
# @block:block-types @kind:entity
SupportedBlocks:
  entity:
    - generates: Interface, Type, Struct
    - fields: Define data structure
  
  function:
    - generates: Function, Method
    - params: Function parameters
    - return: Return type
  
  class:
    - generates: Class definition
    - methods: Class methods
    - properties: Class properties
  
  interface:
    - generates: Interface definition
    - methods: Required methods
  
  enum:
    - generates: Enum type
    - values: Enum values
```

## Implementation

```speclang
# @block:implementation @kind:function
def generate_from_spec(spec_path: str, language: str,
                       output_dir: str, template: str = None) -> dict:
    """
    Generate code from a SpecLang specification.
    
    Args:
        spec_path: Path to spec file
        language: Target language (go, ts, python, rust)
        output_dir: Directory to write generated code
        template: Optional custom template name
    
    Returns:
        Dict with files_generated, lines_generated, errors
    """
```

## Language Support

```speclang
# @block:languages @kind:table
| Language | Extension | Block Mapping |
|----------|-----------|---------------|
| TypeScript | .ts | @kind:class → class |
| Go | .go | @kind:entity → struct |
| Python | .py | @kind:class → class |
| Rust | .rs | @kind:entity → struct |
| Java | .java | @kind:class → class |
| C# | .cs | @kind:class → class |
```

## Template System

```speclang
# @block:templates @kind:note
Templates use the target language's native syntax:
- {{block_name}} - Block identifier
- {{field_name}} - Field names
- {{field_type}} - Field types
- {{accessors}} - Public/private modifiers

Templates can be:
- Built-in: Standard generation patterns
- Custom: User-defined in ~/.speclang/templates/
- Inline: Defined in spec with @template:block
```

## Usage

```speclang
# @block:usage @kind:note
# Generate TypeScript from spec
python3 scripts/generate_from_spec.py specs/auth.spec.md --lang ts -o src/

# Generate Go with custom template
python3 scripts/generate_from_spec.py specs/db.spec.md --lang go --template rest -o internal/

# Generate all specs in directory
python3 scripts/generate_from_spec.py specs/ --lang python -o generated/

# Dry run to see what would be generated
python3 scripts/generate_from_spec.py specs/auth.spec.md --lang ts --dry-run
```

## Examples

```speclang
# @block:examples @kind:note
Input (spec):
  ### @block::user @kind:entity
  User:
    id: INTEGER
    name: TEXT
    email: TEXT

Output (TypeScript):
  export interface User {
    id: number;
    name: string;
    email: string;
  }

Output (Go):
  type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
  }
```

## Options

```speclang
# @block:options @kind:entity
Options:
  output:
    - --output, -o: Output directory
    - --filename: Custom output filename
    - --overwrite: Overwrite existing files
  
  generation:
    - --dry-run: Show what would be generated
    - --force: Force generation even if spec is draft
    - --watch: Regenerate on file changes
  
  formatting:
    - --format: Auto-format output (go fmt, prettier)
    - --lint: Run linter after generation
```

## Related Specs

```speclang
# @block:refs @kind:note
- @ref:speclang/compiler - Code generation pipeline
- @ref:speclang/typescript - TypeScript generator
- @ref:speclang/go - Go generator
- @ref:speclang/python - Python generator
- @ref:speclang/lenses - Content format lenses
