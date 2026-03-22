# speclang-header lines:12
id: "@speclang/validation-tool/api"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [validation, tool, python, typescript, autonomous]
short: API and interface definitions for validation tool
parent: @ref:speclang/validation-tool
part: 2/2
---
# Validation Tool API

API definitions, interfaces, and external contracts for the validation tool.

## Overview

```speclang
# @block:validation-tool/overview @kind:note
The validation tool implements the rules defined in @ref:speclang/autonomous-validation.
It scans spec files, checks for step-by-step descriptions, reference resolution,
ambiguity, and metadata completeness.

Two implementations:
1. **Python**: Command-line tool for CI/CD and pre-commit hooks
2. **TypeScript**: Integrated into guard plugin for real-time validation

The tool produces detailed reports and can suggest fixes or downgrades.
```

## Requirements

```speclang
# @block:validation-tool/requirements @kind:entity
Requirements:
  
  input:
    - Single spec file path
    - Directory path (recursive scan)
    - List of spec IDs from `_index.json`
    
  output:
    - Validation report (JSON, YAML, or human-readable)
    - Pass/fail status per spec
    - Detailed error messages
    - Suggested fixes
    - Confidence scores
    
  checks:
    - Step-by-step description coverage
    - Reference resolution
    - Ambiguity detection
    - Metadata completeness
    - Cross-field consistency
    - Layer appropriateness
    
  integration:
    - Command-line interface
    - Python API
    - TypeScript/Node API
    - Pre-commit hook
    - CI/CD pipeline integration
    - Guard plugin integration
```

## CLI Interface

```speclang
# @block:validation-tool/cli @kind:code
```bash
# Basic usage
speclang-validate --file specs/auth.spec.md

# Recursive directory scan
speclang-validate --dir specs/ --recursive

# Project-wide scan using index
speclang-validate --project

# Output formats
speclang-validate --file x.spec.md --format json
speclang-validate --file x.spec.md --format yaml
speclang-validate --file x.spec.md --format human

# Fix suggestions
speclang-validate --file x.spec.md --suggest-fixes

# Auto-downgrade recommendations
speclang-validate --file x.spec.md --suggest-downgrade

# Confidence scoring
speclang-validate --file x.spec.md --confidence
```
```

## Validation Logic

```speclang
# @block:validation-tool/validation-logic @kind:operation
validate_spec(file_path: str) -> ValidationResult:

steps:
  1. Parse header (use lines:N if present)
  2. Check `agent_support` field
  3. If not `agent_autonomous`, run basic validation only
  4. If `agent_autonomous`:
     a. Extract all `@kind:operation` blocks
     b. Check each for step-by-step descriptions (regex for numbered/bulleted lists)
     c. Extract all `@ref:` references
     d. Check each against `_index.json`
     e. Scan for ambiguous language (keyword list)
     f. Validate metadata fields against requirements
     g. Compute confidence score
  5. Generate report
  6. Return pass/fail
```

## Node API

```speclang
# @block:validation-tool/node-api @kind:code
```typescript
interface ValidationResult {
  specId: string;
  agentSupport: string;
  passed: boolean;
  confidence: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: Suggestion[];
}

interface ValidationTool {
  validateFile(path: string): Promise<ValidationResult>;
  validateDirectory(path: string): Promise<ValidationResult[]>;
  validateProject(): Promise<ValidationResult[]>;
  suggestFixes(result: ValidationResult): Suggestion[];
  suggestDowngrade(result: ValidationResult): boolean;
}
```
```

## References

```speclang
# @block:validation-tool/references @kind:refs
refs:
  - @ref:speclang/autonomous-validation
  - @ref:speclang/safety-nets
  - @ref:speclang/validation
  - @ref:speclang/headers
```