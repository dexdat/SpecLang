# speclang-header lines:9
id: "@speclang/lenses/code"
parent: ""@ref:specs/lenses"short: "Code block extraction and formatting lens"
project_level: Alpha
agent_support: agent_autonomous
tags: [lenses, code, syntax-highlighting]
version: 0.1.0
layer: 4
---

# Code Lens

Extracts and formats code blocks from specs.

## Code Extraction

### @lenses/code/extraction

Extracts code blocks from spec markdown.

**Features:**
- Syntax highlighting
- Language detection
- Line numbers
- Copy-to-clipboard
- Collapsible sections

## Language Support

### @lenses/code/languages

Supported programming languages.

**Languages:**
- TypeScript/JavaScript
- Go
- Python
- Rust
- SQL
- YAML
- Bash

## Code Validation

### @lenses/code/validation

Validates extracted code blocks.

**Checks:**
- Syntax errors
- Type errors (for typed languages)
- Import/require resolution
