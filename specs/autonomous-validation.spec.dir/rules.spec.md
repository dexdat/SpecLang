# speclang-header lines:11
id: "@speclang/autonomous-validation/rules"
version: 0.1.0
layer: 2
parent: "@ref:specs/autonomous-validation"
part: 1/2
project_level: Alpha
agent_support: agent_autonomous
tags: [validation, autonomous, agent, rules]
short: Autonomous validation rules and criteria
---
# Autonomous Validation Rules

Enhanced validation for specs with `agent_support: agent_autonomous`.

## Overview

```speclang
# @block:autonomous-validation/overview @kind:note
Specs labeled `agent_support: agent_autonomous` must meet higher standards
to ensure they can be used by autonomous agents without human intervention.

This spec defines validation rules that are applied IN ADDITION to
standard validation (@ref:speclang/validation) when `agent_support: agent_autonomous`.

Failure of any autonomous validation rule:
- Blocks cascade (spec cannot trigger agent actions)
- Generates detailed error report
- Suggests fixes or downgrade to `agent_assisted`
```

## Validation Criteria

```speclang
# @block:autonomous-validation/criteria @kind:entity
AutonomousValidationCriteria:
  
  step_by_step_descriptions:
    requirement: "All operations must have step-by-step descriptions"
    check: "Each `@kind:operation` block contains numbered steps or clear algorithm"
    example_valid: "1. Validate input format\n2. Query database\n3. Transform result"
    example_invalid: "Process the data and return result"
    
  resolved_references:
    requirement: "All `@ref:` references must resolve to existing blocks"
check: "Every `@ref:` in content points to a block ID in `_index.json`"
    tolerance: "Zero unresolved references allowed"
    
  unambiguous_language:
    requirement: "No ambiguous natural language in critical sections"
    check: "Operations, conditions, and decisions use precise terminology"
    detection: "Flag words: 'maybe', 'probably', 'should', 'could', 'some', 'etc.'"
    
  required_metadata:
    requirement: "All required metadata fields present and valid"
    fields:
      - id: "Must follow @domain/path format"
      - version: "Semantic version"
      - layer: "Integer (depth in tree), appropriate for content"
      - project_level: "Value meets criteria defined in "@ref:speclang/project-maturity-levels"      - agent_support: "agent_autonomous"
      - tags: "Non-empty array"
      - short: "One-line description"
    optional_but_recommended:
      - depends_on
      - owned_by
      - target
      
  completeness:
    requirement: "Spec must be complete enough for code generation"
    check: "For layer >= 4, there must be corresponding code spec or implementation spec"
    validation: "Ensure downstream generation possible"
```

## Validation Process

```speclang
# @block:autonomous-validation/process @kind:operation
validate_autonomous(spec: Spec) -> ValidationResult:

steps:
  1. Check `agent_support` field equals "agent_autonomous"
  2. If not, skip autonomous validation (apply standard validation only)
  3. Apply standard validation (@ref:speclang/validation)
  4. If standard validation fails, return failure
  5. Apply autonomous validation criteria:
     a. Check step-by-step descriptions for all operations
     b. Verify all references resolve
     c. Scan for ambiguous language
     d. Validate required metadata fields
     e. Check completeness for layer
  6. If any autonomous check fails:
     - Generate detailed error report
     - Suggest fixes
     - Optionally suggest downgrade to `agent_assisted`
  7. If all checks pass:
     - Mark spec as "autonomous_ready"
     - Allow cascade to proceed
```

## Step-by-Step Description Validation

```speclang
# @block:autonomous-validation/step-validation @kind:entity
StepByStepValidation:
  
  what_is_step_by_step:
    - Numbered or bulleted list of actions
    - Clear sequence (1, 2, 3...)
    - Each step is actionable
    - No vague instructions
    
  detection_algorithm:
    1. Find all `@kind:operation` blocks
    2. Parse content for numbered/bulleted lists
    3. If no lists, check for imperative sentences with clear actions
    4. Score clarity (0-1)
    5. Require score > 0.8 for autonomous
    
  examples:
    valid: |
      # @block:auth/login @kind:operation
      Login operation:
        1. Receive email and password
        2. Validate email format
        3. Hash password with bcrypt
        4. Query users table
        5. Compare hashed passwords
        6. Generate JWT token
        7. Return token or error
        
    invalid: |
      # @block:auth/login @kind:operation
      Login operation:
        Take the credentials and check them against the database.
        If they match, return a token.
```

## Reference Resolution Validation

```speclang
# @block:autonomous-validation/ref-validation @kind:entity
ReferenceValidation:
  
  requirement: "All `@ref:` must point to existing blocks"
  
  resolution_process:
    1. Extract all `@ref:` patterns from spec content
    2. For each reference:
       a. Parse reference format: `@ref:domain/path#block` or `@ref:domain/path`
       b. Look up in `_index.json`
       c. If not found, check if it's a forward reference (allowed in `depends_on`)
       d. If still not found, validation fails
    
  forward_references:
    - `depends_on` may reference specs not yet written
    - Content references must exist
    - Exception: `@ref:northstar` always exists
    
  tools:
    - `validate_refs.py` script
    - Integrated into guard plugin
    - Real-time validation in editors
```

## Ambiguity Detection

```speclang
# @block:autonomous-validation/ambiguity @kind:entity
AmbiguityDetection:
  
  ambiguous_patterns:
    - Modal verbs: "should", "could", "might", "may"
    - Uncertainty words: "maybe", "perhaps", "possibly"
    - Vague quantifiers: "some", "few", "many", "several"
    - Imprecise terms: "etc.", "and so on", "and more"
    - Subjective language: "better", "worse", "fast", "slow"
    
  detection_method:
    - Natural language processing (simple regex initially)
    - Focus on operation blocks and condition descriptions
    - Allow ambiguity in commentary and examples
    
  tolerance:
    - Zero tolerance in `@kind:operation` blocks
    - Low tolerance in `@kind:entity` definitions
    - Higher tolerance in `@kind:note` blocks
```

## Metadata Validation

```speclang
# @block:autonomous-validation/metadata @kind:entity
MetadataValidation:
  
  field_requirements:
    id:
      - Format: "@domain/path"
      - Domain must be recognized (speclang, specs, generated, etc.)
      - Path must match file location
      
    version:
      - Semantic version (major.minor.patch)
      - Must increment on changes
      
    layer:
      - Integer (depth in tree)
      - Must match content abstraction level
      - Cross-check with layer definitions (@ref:speclang/layer-definitions)
      
    project_level:
      - Must be valid enum value
      - Spec content must meet level criteria (@ref:speclang/project-maturity-levels)
      
    agent_support:
      - Must be "agent_autonomous" to trigger these rules
      - If other value, autonomous validation skipped
      
    tags:
      - Non-empty array
      - At least one tag
      
    short:
      - Non-empty string
      - < 200 characters
      
  cross_field_consistency:
      - `layer` and `project_level` compatibility (e.g., layer 0 with Production may be warning)
      - `agent_support` and `project_level` compatibility (e.g., POC with agent_autonomous = warning)
      - `layer` and content type compatibility (e.g., layer 5 should be `.{ext}.spec`)
```

## Tool Implementation

```speclang
# @block:autonomous-validation/tool @kind:entity
ValidationTool:
  
  implementation:
    - Python script `validate_autonomous.py`
    - TypeScript version for guard plugin
    - Command-line and API interfaces
    
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

## Integration with Existing Validation

```speclang
# @block:autonomous-validation/integration @kind:entity
Integration:
  
  with_standard_validation:
    - Autonomous validation runs AFTER standard validation passes
    - Standard validation is always required
    - Autonomous validation is conditional on `agent_support: agent_autonomous`
    
  error_handling:
    - Standard validation errors block autonomous validation
    - Autonomous validation errors trigger spec lockdown
    - Error messages include fix suggestions
    
  cascade_impact:
    - Specs failing autonomous validation cannot trigger agent cascades
    - They can still be edited manually
    - Notifications sent to spec owner
```

## Downgrade Protocol

```speclang
# @block:autonomous-validation/downgrade @kind:operation
downgrade_to_assisted(spec: Spec) -> Spec:

steps:
  1. Detect repeated autonomous validation failures
  2. Suggest downgrade to `agent_assisted`
  3. If approved (by human or automated):
     a. Change `agent_support` to `agent_assisted`
     b. Add comment explaining reason
     c. Commit change
  4. Spec now follows standard validation only
  5. Human review required for future changes
```

## References

```speclang
# @block:autonomous-validation/references @kind:refs
refs:
  - "@ref:speclang/validation"
  - "@ref:speclang/headers"
  - "@ref:speclang/layer-definitions"
  - "@ref:speclang/project-maturity-levels"
  - "@ref:speclang/agent-support-levels"
```