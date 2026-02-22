# speclang-header lines:12
id: "@speclang/parser/validation"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [parser, validation, headers, references, layers]
parent: "@ref:speclang/parser"
part: 2/2
short: "Validation rules for parsed spec data"
---
# Validation Rules

Validation ensures parsed spec data meets Speclang requirements and consistency rules.

## Overview

```speclang
# @block:validation/overview @kind:note
Validation checks:
- Header metadata completeness and correctness
- Reference integrity (all @ref: resolve)
- Layer consistency (0-10, child >= parent)
- Version format (semver)
- Tag format (list of strings)
- Project maturity level compatibility
- Agent support level appropriateness
```

## Header Validation

```speclang
# @block:validation/header @kind:entity
HeaderValidation:
  validate_header: "(metadata) -> ValidationResult - Validate required fields"
  required_fields:
    - id: must match pattern @domain/path
    - version: semver format (x.y.z)
    - layer: integer 0-10
    - project_level: one of POC, MVP, Alpha, Beta, Production, Startup, SMB, MSB, Enterprise
    - agent_support: one of human_only, agent_assisted, agent_autonomous
    - tags: list of strings, each lowercase hyphenated
    - short: non-empty string < 100 chars
  optional_fields:
    - parent: must be valid @ref:
    - part: string "X/Y"
    - children: list of valid @ref:
    - depends_on: list of valid @ref:
    - imports: list of valid @ref:
```

## Reference Validation

```speclang
# @block:validation/references @kind:entity
ReferenceValidation:
  validate_refs: "(refs, index_path) -> List[str] - Check each ref resolves in index"
  resolve_ref: "(ref) -> Optional[ResolvedRef] - Look up ref in _index.json"
  ResolvedRef:
    - ref: str
    - exists: bool
    - file_path: str
    - block_id: str (optional)
    - error: str (optional)
```

## Layer Validation

```speclang
# @block:validation/layer @kind:entity
LayerValidation:
  validate_layer: "(layer) -> bool - Check 0-10 integer"
  consistency_rules:
    - Child specs (referenced via parent) must have layer >= parent layer
    - Specs with depends_on should have similar layers (±2)
    - Code specs (layer 5) must reference implementation specs (layer 4)
    - Generated code (layer 6) must reference code specs (layer 5)
```

## Version Validation

```speclang
# @block:validation/version @kind:entity
VersionValidation:
  validate_version: "(version) -> bool - Check semver format"
  semver_pattern: "^\\d+\\.\\d+\\.\\d+(-[0-9A-Za-z-]+(\\.[0-9A-Za-z-]+)*)?(\\+[0-9A-Za-z-]+(\\.[0-9A-Za-z-]+)*)?$"
```

## Validation Result

```speclang
# @block:validation/result @kind:entity
ValidationResult:
  - valid: bool
  - errors: List[str]
  - warnings: List[str]
  - metadata: Dict (parsed header)
  - blocks: List[Block]
  - refs: List[Reference]
```

## Validation Pipeline

```speclang
# @block:validation/pipeline @kind:process
ValidationPipeline:
  steps:
    1. Parse spec file (see @ref:speclang/parser/parsing)
    2. Validate header fields
    3. Validate references against index
    4. Validate layer consistency with parent/dependencies
    5. Validate version format
    6. Return ValidationResult
```

## Dependencies

- @ref:speclang/parser/parsing – Parsing pipeline
- @ref:speclang/layer-definitions – Layer definitions and rules
- @ref:speclang/headers – Header field specifications
- @ref:speclang/spec-format – Spec format rules