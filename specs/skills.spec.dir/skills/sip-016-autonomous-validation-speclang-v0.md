---
name: sip-016-autonomous-validation-speclang-v0
title: "SIP 16: Autonomous Validation"
version: 0.1.0
description: Enhanced validation rules for agent_autonomous specs
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 16: Autonomous Validation

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP explains validation rules for specs labeled `agent_autonomous`.

### Quick Start

1. **Higher Standards:** Autonomous specs need more detail
2. **Step-by-Step:** All operations must have numbered steps
3. **Resolved References:** All `@ref:` must exist
4. **No Ambiguity:** Flag words like "maybe", "should" not allowed

### Key Concepts

- **Completeness:** Specs must be complete enough for code generation
- **Reference Resolution:** All references must point to existing blocks
- **Ambiguity Detection:** Vague language blocks validation
- **Metadata Validation:** Required fields must be present and valid

### When to Read This

- **Writing autonomous specs:** Ensure validation passes
- **Debugging validation failures:** Understand error messages
- **Tool development:** Implement validation tools

### Related SIPs

- SIP 2: Header Format
- SIP 4: Reference System
- SIP 17: Layer Definitions
- SIP 18: Maturity Levels

## Abstract

This SIP defines enhanced validation rules for specs labeled `agent_support: agent_autonomous`. These specs must meet higher standards to ensure they can be used by autonomous agents without human intervention. Failure of any autonomous validation rule blocks cascade execution.

## Motivation

Autonomous agents need:
- Complete, unambiguous specifications
- All references resolved
- Clear step-by-step instructions
- Valid metadata for decision-making

## Rationale

**Higher Standards:**
- No human to ask clarifying questions
- Must be executable as-is
- Ambiguity causes failures

**Validation Gates:**
- Catch problems early
- Prevent cascade failures
- Suggest fixes automatically

**Downgrade Option:**
- Not all specs need autonomy
- Can fall back to agent_assisted
- Human review available

## Specification

### Validation Criteria

```yaml
AutonomousValidationCriteria:
  
  step_by_step_descriptions:
    requirement: "All operations must have step-by-step descriptions"
    check: "Each @kind:operation block contains numbered steps"
    example_valid: |
      1. Validate input format
      2. Query database
      3. Transform result
    example_invalid: "Process the data and return result"
    
  resolved_references:
    requirement: "All @ref: references must resolve to existing blocks"
    check: "Every @ref: points to a block ID in _index.json"
    tolerance: "Zero unresolved references allowed"
    
  unambiguous_language:
    requirement: "No ambiguous natural language in critical sections"
    check: "Operations use precise terminology"
    detection: "Flag: maybe, probably, should, could, some, etc."
    
  required_metadata:
    fields:
      - id: "Must follow @domain/path format"
      - version: "Semantic version"
      - layer: "Integer 0-10"
      - project_level: "Valid enum value"
      - agent_support: "agent_autonomous"
      - tags: "Non-empty array"
      - short: "One-line description"
```

### Validation Process

```yaml
validate_autonomous(spec):
  steps:
    1: "Check agent_support equals agent_autonomous"
    2: "If not, skip autonomous validation"
    3: "Apply standard validation first"
    4: "If standard fails, return failure"
    5: "Apply autonomous checks:"
      a: "Check step-by-step descriptions"
      b: "Verify all references resolve"
      c: "Scan for ambiguous language"
      d: "Validate required metadata"
      e: "Check completeness for layer"
    6: "If any check fails:"
      - Generate error report
      - Suggest fixes
      - Suggest downgrade to agent_assisted
    7: "If all pass:"
      - Mark spec as autonomous_ready
      - Allow cascade to proceed
```

## Step-by-Step Validation

### What Counts

```yaml
StepByStepValidation:
  
  valid_patterns:
    - Numbered or bulleted list of actions
    - Clear sequence (1, 2, 3...)
    - Each step is actionable
    - No vague instructions
    
  detection_algorithm:
    1: "Find all @kind:operation blocks"
    2: "Parse content for numbered/bulleted lists"
    3: "If no lists, check for imperative sentences"
    4: "Score clarity (0-1)"
    5: "Require score > 0.8 for autonomous"
```

### Examples

**Valid:**
```yaml
# @block:auth/login @kind:operation
Login operation:
  1. Receive email and password
  2. Validate email format
  3. Hash password with bcrypt
  4. Query users table
  5. Compare hashed passwords
  6. Generate JWT token
  7. Return token or error
```

**Invalid:**
```yaml
# @block:auth/login @kind:operation
Login operation:
  Take the credentials and check them against the database.
  If they match, return a token.
```

## Reference Resolution

### Resolution Process

```yaml
ReferenceValidation:
  
  resolution_process:
    1: "Extract all @ref: patterns from content"
    2: "For each reference:"
      a: "Parse format: ""@ref:domain/path#block"      b: "Look up in _index.json"
      c: "If not found, check forward reference"
      d: "If still not found, fail"
      
  forward_references:
    - "depends_on may reference specs not yet written"
    - "Content references must exist"
    - "Exception: @ref:northstar always exists"
```

## Ambiguity Detection

### Flag Patterns

```yaml
AmbiguityDetection:
  
  ambiguous_patterns:
    modal_verbs: [should, could, might, may]
    uncertainty: [maybe, perhaps, possibly]
    vague_quantifiers: [some, few, many, several]
    imprecise_terms: [etc., "and so on", "and more"]
    subjective: [better, worse, fast, slow]
    
  tolerance:
    operation_blocks: "zero tolerance"
    entity_definitions: "low tolerance"
    note_blocks: "higher tolerance"
```

## Metadata Validation

### Field Requirements

```yaml
MetadataValidation:
  
  field_requirements:
    id:
      - Format: "@domain/path"
      - Domain must be recognized
      - Path must match file location
      
    version:
      - Semantic version (major.minor.patch)
      - Must increment on changes
      
    layer:
      - Integer 0-10
      - Must match content abstraction level
      
    project_level:
      - Must be valid enum value
      - Content must meet level criteria
      
    agent_support:
      - Must be "agent_autonomous" to trigger these rules
      
  cross_field_consistency:
    - "layer and project_level compatibility"
    - "agent_support and project_level compatibility"
    - "layer and content type compatibility"
```

## Tool Implementation

```yaml
ValidationTool:
  
  implementation:
    - Python script validate_autonomous.py
    - TypeScript version for guard plugin
    - CLI and API interfaces
    
  features:
    - Scan single spec or entire project
    - Generate detailed reports
    - Suggest fixes
    - Auto-downgrade recommendation
    
  integration:
    - Pre-commit hook
    - Guard plugin validation step
    - CI/CD pipeline
    - Editor extension
```

## Downgrade Protocol

```yaml
downgrade_to_assisted(spec):
  steps:
    1: "Detect repeated autonomous validation failures"
    2: "Suggest downgrade to agent_assisted"
    3: "If approved:"
      a: "Change agent_support to agent_assisted"
      b: "Add comment explaining reason"
      c: "Commit change"
    4: "Spec now follows standard validation only"
    5: "Human review required for future changes"
```

## Error Handling

```yaml
Integration:
  
  error_handling:
    - Standard validation errors block autonomous validation
    - Autonomous errors trigger spec lockdown
    - Error messages include fix suggestions
    
  cascade_impact:
    - Failing specs cannot trigger agent cascades
    - Can still be edited manually
    - Notifications sent to spec owner
```

## Examples

### Valid Autonomous Spec

```yaml
# speclang-header lines:8
id: "@speclang/auth/login"
version: 1.0.0
layer: 4
project_level: Beta
agent_support: agent_autonomous
tags: [auth, login, security]
short: User login operation
---
# @block:auth/login @kind:operation
Login operation:
  1. Receive email and password from request
  2. Validate email format with regex
  3. Hash password using bcrypt(cost=12)
  4. Query users table WHERE email = input.email
  5. Compare stored_hash with computed_hash
  6. If match: generate JWT(expiry=24h)
  7. Return {token: jwt} or {error: "Invalid credentials"}
```

### Validation Error Report

```
AUTONOMOUS VALIDATION FAILED: specs/auth.spec.md

Error 1: Ambiguous language in @kind:operation block
  Location: line 45
  Found: "should validate the input"
  Fix: Use imperative "MUST validate the input"
  
Error 2: Unresolved reference
  Location: line 52
  Found: @ref:speclang/auth#validate-token
  Fix: Block does not exist. Create it or fix reference.

Suggestion: Downgrade to agent_assisted if fixes not possible.
```

## References

- "@ref:speclang/autonomous-validation
- @ref:speclang/validation
- @ref:speclang/headers
- SIP 2: Header Format
- SIP 4: Reference System

## Copyright

This document is in the public domain.
