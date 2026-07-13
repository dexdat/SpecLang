# speclang-header lines:10
id: "@speclang/parser/index"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [parser, spec, validation]
short: "Parser module implementation"
target: src/parser/index.ts
---

# Parser Module

This module provides spec file parsing, validation, and header extraction functionality for SpecLang.

### @block::parser/main @kind:code

The parser module is the core engine for:
- Parsing spec file headers
- Validating spec metadata
- Extracting blocks and references
- Providing recovery suggestions for invalid specs

## Exported Modules

- **types** - Core type definitions
- **field-types** - Field value types and definitions
- **fields** - Field metadata and patterns
- **field-validator** - Field-level validation
- **header** - Header parsing functions
- **validator** - Main validation functions
- **validation-messages** - Error/warning/info messages
- **validation-recovery** - Auto-fix suggestions
- **header-validator** - Header-level validation
