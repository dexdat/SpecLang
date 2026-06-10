---
id: "@speclang/implementation.parser"
version: 0.1.0
layer: 5
target: src/parser/speclang_parser.py
parent: ""@ref:speclang/implementation"imports: ["@speclang/headers", "@speclang/spec-format"]
tags: [parser, headers, validation, python]
short: Python header parser and validator for Speclang specs
project_level: Alpha
agent_support: agent_autonomous
status: draft
---

# Python Header Parser & Validator

Python module for parsing and validating Speclang spec headers.

## Overview

```speclang
# @block:parser/overview @kind:note
This module provides:
- Header parsing from spec files
- Block extraction
- Reference (@ref:) extraction
- Validation of required fields
- Reference integrity checking
```

## Parse Header

```speclang
# @block:parser/parse-header @kind:entity
ParseHeader:
  parse_header: "(file_path) -> Optional[Dict] - Parse header from file"
  parse_header_from_content: "(content) -> Optional[Dict] - Parse header from string"
  extract_header_lines: "(content, declared_lines) -> str - Extract header lines"
```

## Extract Blocks

```speclang
# @block:parser/blocks @kind:entity
Blocks:
  extract_blocks: "(content) -> List[Block] - Extract all @block: definitions"
  Block:
    - id: str
    - kind: str  
    - content: str
    - line: int
```

## Extract References

```speclang
# @block:parser/references @kind:entity
References:
  extract_refs: "(content) -> List[Reference] - Extract all @ref: markers"
  Reference:
    - ref: str           # @ref:specs/auth#login
    - source_file: str
    - line: int
    - target_file: str  # specs/auth.spec.md
    - target_block: str # login
```

## Validate

```speclang
# @block:parser/validate @kind:entity
Validate:
  validate_header: "(header) -> ValidationResult - Validate required fields"
  validate_refs: "(refs, index_path) -> List[str] - Check refs resolve"
  validate_layer: "(layer) -> bool - Check layer is non-negative integer"
  validate_version: "(version) -> bool - Check semver format"
  ValidationResult:
    - valid: bool
    - errors: List[str]
    - warnings: List[str]
```

## Usage

```speclang
# @block:parser/usage @kind:code
```python
from src.parser.speclang_parser import parse_spec, validate_spec

# Parse a spec file
result = parse_spec("specs/auth.spec.md")
print(result.metadata.id)  # @specs/auth
print(len(result.blocks))  # number of blocks
print(len(result.refs))    # number of references

# Validate
validation = validate_spec("specs/auth.spec.md")
if not validation.valid:
    print(validation.errors)
```
