# speclang-header lines:12
id: "@speclang/autonomous-validation"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [validation, autonomous, agent, rules]
children: ["@speclang/autonomous-validation/rules", "@speclang/autonomous-validation/scoring"]
short: Validation rules for specs labeled agent_autonomous
depends_on:
  - "@speclang/headers"
  - "@speclang/validation"
---
# Autonomous Validation

Enhanced validation for specs with `agent_support: agent_autonomous`.

## Purpose

Specs labeled with `agent_support: agent_autonomous` require additional validation to ensure they contain enough detail for AI agents to operate without human guidance. This module defines the rules and scoring system.

## Validation Criteria

### @block::criteria @kind:entity

AutonomousValidationCriteria:
  required_fields:
    - id: Unique spec identifier with @spec/ prefix
    - version: Semantic version string
    - layer: Non-negative integer
    - agent_support: Must be "agent_autonomous"
    - short: Brief description under 100 chars
    - depends_on: Array of @ref: dependencies

  content_requirements:
    - All @block: sections must have @kind: marker
    - Functions must have parameter descriptions
    - Interfaces must have all field types
    - Prose blocks must have actionable content

  reference_requirements:
    - All @ref: links must resolve to existing specs
    - Circular dependencies not allowed
    - Missing references trigger validation failure

### @block::validation-process @kind:function

```typescript
interface AutonomousValidator {
  // Check if spec requires autonomous validation
  requiresAutonomousValidation(spec: Spec): boolean

  // Run all validation rules
  validate(spec: Spec): ValidationResult

  // Calculate completeness score
  calculateScore(spec: Spec): number

  // Get list of failures
  getFailures(spec: Spec): ValidationFailure[]
}
```

### @block::minimum-requirements @kind:prose

**For a spec to be valid for autonomous agents:**

1. **Header Completeness**
   - All required header fields present
   - Valid YAML syntax
   - Proper quoting of @ characters

2. **Dependency Coverage**
   - All dependencies documented
   - No orphan specs (specs no one depends on)
   - All @ref: links resolve

3. **Content Depth**
   - Functions have step-by-step descriptions
   - Interfaces have all field definitions
   - No placeholder content (under 10 lines)

4. **Recovery Mechanisms**
   - Error handling documented
   - Fallback strategies described
   - Retry logic specified

### @block::scoring @kind:prose

Each spec receives a score 0-100:

- **Header**: 20 points (all required fields)
- **Dependencies**: 20 points (complete graph)
- **Content**: 40 points (depth and detail)
- **Recovery**: 20 points (error handling)

Minimum threshold for autonomous operation: **70/100**

### @block::children @kind:prose

**Children specs:**

- "@ref:speclang/autonomous-validation/rules – Core validation rules and criteria
- @ref:speclang/autonomous-validation/scoring – Scoring algorithms and thresholds