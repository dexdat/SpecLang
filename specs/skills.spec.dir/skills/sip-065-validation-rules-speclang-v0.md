---
name: sip-065-validation-rules-speclang-v0
title: "SIP 65: Validation Rules"
version: 0.1.0
description: Core validation rules checked on every spec write
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 65: Validation Rules

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the validation rules that are checked on every spec write.

### Quick Start

1. **Header:** Format, required fields
2. **ID:** @domain/path format
3. **Refs:** Target exists, no cycles
4. **Blocks:** Unique IDs, valid kinds
5. **Autonomous:** Extra checks for agent_autonomous

### Key Concepts

| Rule | Level | Description |
|------|-------|-------------|
| header-format | error | Valid YAML header |
| id-format | error | @domain/path format |
| ref-exists | error | Reference target exists |
| no-circular | error | No circular dependencies |
| block-unique | error | Unique block IDs |

### When to Read This

- **Writing validators:** Implementing checks
- **Error messages:** Understanding failures
- **Autonomous specs:** Extra validation

### Related SIPs

- SIP 22: Validation
- SIP 16: Autonomous Validation
- SIP 46: Validation Tool

## Abstract

This SIP specifies the validation rules that ensure spec integrity, including header validation, ID format, reference checking, and block validation.

## Motivation

Validation ensures:
- Specs are well-formed
- References are valid
- No circular dependencies
- Autonomous specs are complete

## Rationale

**Validation Pipeline:**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Header    │ →  │   Content   │ →  │ Autonomous  │
│  Validation │    │ Validation  │    │ Validation  │
└─────────────┘    └─────────────┘    └─────────────┘
       ↓                  ↓                  ↓
   Errors            Errors            Errors
```

**Benefits:**
- Early error detection
- Clear error messages
- Suggested fixes
- Cascade blocking

## Specification

### Header Validation

**@validation/header:**

```speclang
# @block:validation/header @kind:entity
HeaderValidation:
  line_1:
    - Must be comment or blank
    - Must match file type
    
  line_2:
    - Must contain "speclang-header"
    - Must declare line count
    - Format: "<comment> speclang-header lines:N"
    
  required_fields:
    - id: "@domain/path"
    - version: semver
    
  optional_fields:
    - parent: @ref
    - children: [@ref]
    - depends_on: [@ref]
    - refs: [@ref]
    - tags: [String]
    - short: String
    - target: String
    - status: enum
```

### ID Validation

**@validation/id:**

```speclang
# @block:validation/id @kind:entity
IdValidation:
  format: "@domain/path"
  
  rules:
    - Must start with @
    - Domain must be lowercase
    - Path uses forward slashes
    - No special chars except - and _
    
  examples:
    valid:
      - @specs/auth
      - @specs/auth/login
      - @generated/go/auth
      - @tests/auth/login
      
    invalid:
      - specs/auth          # missing @
      - @Specs/Auth        # uppercase
      - @specs/auth\login  # backslash
```

### Reference Validation

**@validation/refs:**

```speclang
# @block:validation/refs @kind:entity
RefValidation:
  format: "@ref:path#block-id"
  
  checks:
    - Target file must exist
    - Target block must exist (if specified)
    - No circular refs
    
  circular_detection:
    - Build dependency graph
    - Detect cycles
    - Error on circular dependency
```

### Block Validation

**@validation/blocks:**

```speclang
# @block:validation/blocks @kind:entity
BlockValidation:
  id:
    - Must be unique in file
    - Format: @block:domain/name
    
  kind:
    - Must be valid block kind
    - Valid: entity, operation, test, note, code, table, diagram
    
  content:
    - Must match block kind
    - Code blocks must be valid syntax
```

### Autonomous Validation

**@validation/autonomous:**

```speclang
# @block:validation/autonomous @kind:note
For specs with `agent_support: agent_autonomous`, additional validation
rules apply. See @ref:speclang/autonomous-validation for complete details.

Key additional checks:
- Step-by-step descriptions for all operations
- All references resolve to existing blocks
- No ambiguous natural language in critical sections
- Required metadata fields present and valid
- Completeness for given layer and project_level

Autonomous validation runs after standard validation passes.
Failure blocks cascade and may trigger downgrade to `agent_assisted`.
```

### Error Handling

**@validation/errors:**

```speclang
# @block:validation/errors @kind:entity
ValidationError:
  level: error | warning
  location: file:line:column
  message: String
  suggestion: String?
  
  on_error:
    - Log to .speclang/validation.log
    - Block cascade
    - Notify agent
    - Suggest fix
    
  on_warning:
    - Log only
    - Allow cascade
```

## Rule Engine

### @rule-engine/architecture

```speclang
# @block:rule-engine/architecture @kind:entity
RuleEngine:
  phases:
    - parse: Extract spec structure
    - validate: Run all rules
    - report: Generate errors/warnings
    
  rule_registry:
    - header-format: HeaderValidation
    - id-format: IdValidation
    - ref-exists: RefValidation
    - block-unique: BlockValidation
    - autonomous: AutonomousValidation
```

### @rule-engine/execution

```speclang
# @block:rule-engine/execution @kind:operation
validate(spec: Spec) -> ValidationResult

Steps:
  1. Parse header, validate format
  2. Extract blocks, validate IDs
  3. Extract refs, check targets
  4. Build dependency graph, detect cycles
  5. If agent_autonomous, run extra checks
  6. Collect all errors and warnings
  7. Return ValidationResult

ValidationResult:
  valid: Boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
```

### @rule-engine/custom

```speclang
# @block:rule-engine/custom @kind:entity
CustomRule:
  name: String
  description: String
  level: error | warning
  check: (spec: Spec) -> RuleResult
  
  registration:
    - Add to .speclang/rules/
    - Auto-loaded by engine
    - Runs with standard rules
```

## Error Codes

| Code | Rule | Message |
|------|------|---------|
| E001 | header-format | Invalid header format |
| E002 | header-format | Missing required field |
| E003 | id-format | Invalid ID format |
| E004 | ref-exists | Reference target not found |
| E005 | ref-exists | Circular reference detected |
| E006 | block-unique | Duplicate block ID |
| E007 | block-kind | Invalid block kind |
| W001 | autonomous | Missing step description |
| W002 | autonomous | Ambiguous language |

## Implementation

### Rule Engine Core

```typescript
interface Rule {
  name: string;
  level: 'error' | 'warning';
  check(spec: Spec): RuleResult[];
}

interface RuleResult {
  rule: string;
  level: 'error' | 'warning';
  location: Location;
  message: string;
  suggestion?: string;
}

class ValidationEngine {
  private rules: Rule[] = [];
  
  register(rule: Rule): void {
    this.rules.push(rule);
  }
  
  async validate(spec: Spec): Promise<ValidationResult> {
    const results: RuleResult[] = [];
    
    for (const rule of this.rules) {
      const ruleResults = rule.check(spec);
      results.push(...ruleResults);
    }
    
    return {
      valid: !results.some(r => r.level === 'error'),
      errors: results.filter(r => r.level === 'error'),
      warnings: results.filter(r => r.level === 'warning'),
    };
  }
}
```

### Header Rule

```typescript
const headerFormatRule: Rule = {
  name: 'header-format',
  level: 'error',
  check(spec: Spec): RuleResult[] {
    const results: RuleResult[] = [];
    
    if (!spec.header.id) {
      results.push({
        rule: 'header-format',
        level: 'error',
        location: { file: spec.path, line: 1 },
        message: 'Missing required field: id',
        suggestion: 'Add id: @domain/path to header',
      });
    }
    
    if (!spec.header.version) {
      results.push({
        rule: 'header-format',
        level: 'error',
        location: { file: spec.path, line: 1 },
        message: 'Missing required field: version',
        suggestion: 'Add version: 0.1.0 to header',
      });
    }
    
    return results;
  },
};
```

### ID Rule

```typescript
const idFormatRule: Rule = {
  name: 'id-format',
  level: 'error',
  check(spec: Spec): RuleResult[] {
    const id = spec.header.id;
    const validPattern = /^@[a-z][a-z0-9-]*\/[a-z][a-z0-9\-_/]*$/;
    
    if (!validPattern.test(id)) {
      return [{
        rule: 'id-format',
        level: 'error',
        location: { file: spec.path, line: 1 },
        message: `Invalid ID format: ${id}`,
        suggestion: 'ID must be @domain/path with lowercase letters',
      }];
    }
    
    return [];
  },
};
```

### Reference Rule

```typescript
const refExistsRule: Rule = {
  name: 'ref-exists',
  level: 'error',
  check(spec: Spec, graph: SpecGraph): RuleResult[] {
    const results: RuleResult[] = [];
    
    for (const ref of spec.refs) {
      const target = graph.find(ref.target);
      
      if (!target) {
        results.push({
          rule: 'ref-exists',
          level: 'error',
          location: { file: spec.path, line: ref.line },
          message: `Reference target not found: ${ref.target}`,
          suggestion: `Check that ${ref.target} exists`,
        });
      }
    }
    
    return results;
  },
};
```

## References

- @ref:specs/validation.spec.dir/rules
- @ref:specs/validation.spec.dir/engine
- SIP 22: Validation
- SIP 16: Autonomous Validation
- SIP 46: Validation Tool

## Copyright

This document is in the public domain.
