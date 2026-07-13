# speclang-header lines:10
id: "@speclang/index"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [typescript, generated, auto-generated]
short: "Auto-generated spec for index.ts"
status: generated
---
parent: "@ref:specs/core

# Index Module

Auto-generated spec for the main index.ts entry point.

## Overview

```speclang
# @block:index/overview @kind:entity
IndexModule:
  purpose: Main entry point for SpecLang
  
  exports:
    - SpecLang CLI
    - Core functions
    - Type definitions
  
  file: src/index.ts
```

## Exports

```speclang
# @block:index/exports @kind:interface
interface IndexExports:
  cli:
    - main(): void - CLI entry point
    - commands: All available CLI commands
  
  core:
    - parseSpec(): SpecParser
    - validateSpec(): SpecValidator
    - generateCode(): CodeGenerator
  
  types:
    - SpecMetadata
    - SpecBlock
    - ValidationResult
```

## Usage

```speclang
# @block:index/usage @kind:note
import { parseSpec, validateSpec, generateCode } from './index';

// Parse a spec file
const spec = parseSpec('specs/auth.spec.md');

// Validate it
const result = validateSpec(spec);
if (result.valid) {
  // Generate code
  const code = generateCode(spec, { target: 'typescript' });
}
```
