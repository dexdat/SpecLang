---
id: "@speclang/parser/parsing"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [parser, parsing, headers, blocks, references]
parent: ""@ref:speclang/parser"part: 1/2
short: "Parsing spec files: headers, blocks, references"
---
# Parsing Spec Files

Parsing extracts structured information from Speclang spec files: headers, blocks, and references.

## Overview

```speclang
# @block:parsing/overview @kind:note
Parsing involves:
- Reading spec file content
- Extracting header metadata (YAML frontmatter)
- Extracting block definitions (@block:)
- Extracting reference markers (@ref:)
- Building structured representation for validation and code generation
```

## Header Parsing

```speclang
# @block:parsing/header @kind:entity
HeaderParsing:
  parse_header: "(content) -> Optional[Dict] - Parse YAML header after # speclang-header lines:N"
  parse_header_from_content: "(content, declared_lines) -> Dict - Extract header lines"
  extract_header_lines: "(content) -> str - Return header lines up to declared count"
  required_fields:
    - id: str
    - version: str
    - layer: int
    - project_level: str
    - agent_support: str
    - tags: List[str]
    - short: str
```

## Block Extraction

```speclang
# @block:parsing/blocks @kind:entity
BlockExtraction:
  extract_blocks: "(content) -> List[Block] - Extract all @block: definitions"
  Block:
    - id: str           # @block:id
    - kind: str         # @kind:type
    - content: str      # Content between block marker and next block/end
    - line: int         # Starting line number
    - source_file: str  # File path
```

## Reference Extraction

```speclang
# @block:parsing/references @kind:entity
ReferenceExtraction:
  extract_refs: "(content) -> List[Reference] - Extract all @ref: markers"
  Reference:
    - ref: str           # @ref:specs/auth#login
    - source_file: str
    - line: int
    - target_file: str   # Derived: specs/auth.spec.md
    - target_block: str  # Derived: login (optional)
```

## Parsing Pipeline

```speclang
# @block:parsing/pipeline @kind:process
ParsingPipeline:
  steps:
    1. Read file content
    2. Parse header metadata
    3. Validate header line count matches declared lines
    4. Extract blocks (scan for @block: markers)
    5. Extract references (scan for @ref: markers)
    6. Return ParsedSpec object containing metadata, blocks, refs
```

## Dependencies

- "@ref:speclang/headers – Header format specification
- @ref:speclang/spec-format – Spec file format
- @ref:speclang/parser/validation – Validation rules for parsed data