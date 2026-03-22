# speclang-header lines:13
id: "@speclang/parser"
version: 0.2.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [parser, typescript, validation, headers]
children:
  - "@ref:specs/parser.spec.dir/parsing"
  - "@ref:specs/parser.spec.dir/validation"
short: "Parser - Header parsing and spec validation"
status: draft
---

# Parser Module

TypeScript parser module for parsing and validating Speclang spec files. Responsible for reading universal headers, extracting blocks and references, and validating spec structure.

## Overview

```speclang
# @block:parser/overview @kind:entity
Parser:
  language: TypeScript
  responsibilities:
    - Parse universal headers with speclang-header lines:N
    - Extract blocks (@block:id @kind:type)
    - Extract references (@ref:...)
    - Validate header fields (id, version, layer, etc.)
    - Validate reference resolution
  
  inputs:
    - .spec.md files (Markdown with YAML frontmatter)
    - .spec.yaml files (pure YAML)
    - .scl files (speclang format)
  
  outputs:
    - ParsedSpec object with metadata
    - Validation errors/warnings
    - Reference graph
```

## Sub‑Specs

- @ref:specs/parser.spec.dir/parsing – Parsing spec files: headers, blocks, references
- @ref:specs/parser.spec.dir/validation – Validation rules for parsed spec data

## Universal Headers

Every SpecLang file begins with a universal header:

```yaml
# speclang-header lines:12
id: "@specs/example"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [example, docs]
short: Brief description
depends_on:
  - @ref:specs/other#block
---
```

The parser must:
1. Read first line to get header line count
2. Parse YAML frontmatter
3. Validate required fields
4. Extract dependencies for graph building

## Integration

The parser is used by:
- **Indexer**: Builds SQLite database of all specs
- **Codegen**: Reads .{ext}.spec files to generate code
- **Validation tool**: Checks spec completeness for autonomous operation
- **MCP server**: Provides spec querying capabilities

