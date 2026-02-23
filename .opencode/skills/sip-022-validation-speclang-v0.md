---
name: sip-022-validation-speclang-v0
title: "SIP 22: Validation System"
version: 0.1.0
description: Validation framework, rules, and tool integration for SpecLang
category: standard
---

# SIP 22: Validation System

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the validation system that checks specs on every write.

### Quick Start

Validation levels:
1. **Header validation**: YAML syntax, required fields
2. **Reference validation**: All `@ref:` resolve
3. **Semantic validation**: Cross-field consistency
4. **Autonomous validation**: Step-by-step completeness

### When to Read This

- **Building validation tools:** Implementing validation rules
- **Understanding errors:** Why validation failed
- **Adding new rules:** Extending validation system

### Related SIPs

- SIP 19: Agent Support Levels
- SIP 21: Semantic Definitions
- SIP 23: Safety Nets

## Abstract

This SIP defines SpecLang's validation system—a framework of rules that check specs on every write. The system supports multiple validation levels from basic syntax to full autonomous-readiness checks, ensuring spec quality and preventing mislabeled autonomous specs.

## Motivation

Without validation:
- Invalid specs break cascades
- Mislabeled specs cause agent failures
- Reference errors propagate

A robust validation system catches problems early.

## Rationale

**Layered Validation:**

1. **Basic**: Syntax and format (always run)
2. **Standard**: References and semantics (on cascade)
3. **Strict**: Autonomous readiness (when `agent_autonomous`)

This matches the agent_support levels.

## Specification

### Validation Levels

```yaml
ValidationLevels:
  basic:
    when: "Every write"
    checks:
      - Header YAML syntax
      - Required fields present
      - Block syntax correct
    on_failure: "Block write"
    
  standard:
    when: "Before cascade"
    checks:
      - All basic checks
      - Reference resolution
      - Layer consistency
      - Size limits
    on_failure: "Block cascade, warn human"
    
  strict:
    when: "For agent_autonomous specs"
    checks:
      - All standard checks
      - Step-by-step completeness
      - No ambiguous language
      - All dependencies declared
      - Metadata consistency
    on_failure: "Downgrade to agent_assisted"
```

### Header Validation

```yaml
HeaderValidation:
  required_fields:
    - id: "Must be @domain/path format"
    - version: "Must be semver (X.Y.Z)"
    
  optional_fields:
    - layer: "Integer 0-10, default based on content"
    - project_level: "Enum of valid levels"
    - agent_support: "Enum: human_only, agent_assisted, agent_autonomous"
    - tags: "Array of strings"
    - short: "Brief description"
    - depends_on: "Array of spec IDs"
    - produces: "Output file path"
    
  syntax_rules:
    - "Line 1: Comment or blank"
    - "Line 2: '# speclang-header lines:N'"
    - "Lines 3-N: YAML frontmatter"
    - "Line N+1: '---' separator"
    
  errors:
    MISSING_ID:
      code: V001
      message: "Header missing required 'id' field"
      severity: error
      
    INVALID_VERSION:
      code: V002
      message: "Version must be semver format (X.Y.Z)"
      severity: error
      
    INVALID_LAYER:
      code: V003
      message: "Layer must be integer 0-10"
      severity: warning
      
    INVALID_AGENT_SUPPORT:
      code: V004
      message: "agent_support must be human_only, agent_assisted, or agent_autonomous"
      severity: error
```

### Reference Validation

```yaml
ReferenceValidation:
  reference_patterns:
    block_ref: "@ref:specs/path#block-id"
    file_ref: "@ref:specs/path"
    project_ref: "@ref:project-name"
    
  validation_rules:
    - "Reference must match pattern"
    - "Target spec must exist in _index.json"
    - "Block reference must exist in target spec"
    
  errors:
    UNRESOLVED_REF:
      code: V101
      message: "Reference '{ref}' does not resolve"
      severity: warning
      
    INVALID_REF_FORMAT:
      code: V102
      message: "Reference '{ref}' has invalid format"
      severity: error
      
    SELF_REFERENCE:
      code: V103
      message: "Self-reference detected: '{ref}'"
      severity: warning
      
    CIRCULAR_DEPENDENCY:
      code: V104
      message: "Circular dependency detected in references"
      severity: error
```

### Semantic Validation

```yaml
SemanticValidation:
  cross_field_rules:
    - rule: "agent_autonomous requires project_level >= Beta"
      check: "if agent_support == 'agent_autonomous' and project_level in ['POC', 'MVP']"
      severity: warning
      
    - rule: "Layer 5+ requires target field for code specs"
      check: "if layer >= 5 and layer <= 9 and not has_field('target')"
      severity: warning
      
    - rule: "Enterprise requires compliance tags"
      check: "if project_level == 'Enterprise' and not has_tag('compliance')"
      severity: info
      
  size_rules:
    layer_size_limits:
      0: 100
      1_2: 500
      3_4: 300
      5: 200
      6_9: null  # Generated, no limit
      10: 500
      
  errors:
    SIZE_EXCEEDED:
      code: V201
      message: "Spec size {size} exceeds limit {limit} for layer {layer}"
      severity: warning
      
    METADATA_INCONSISTENCY:
      code: V202
      message: "{field1}={value1} inconsistent with {field2}={value2}"
      severity: warning
```

### Autonomous Validation

```yaml
AutonomousValidation:
  when_applied: "agent_support == 'agent_autonomous'"
  
  required_checks:
    step_by_step:
      description: "All operations have step-by-step descriptions"
      check: "Every @kind:operation block has numbered steps"
      threshold: 1.0  # 100% required
      
    reference_resolution:
      description: "All references resolve to existing blocks"
      check: "All @ref: resolve successfully"
      threshold: 1.0
      
    ambiguity_detection:
      description: "No ambiguous natural language in critical sections"
      check: "Scan for words like 'maybe', 'perhaps', 'might', 'TBD', 'TODO'"
      threshold: 0.0  # Zero tolerance
      
    dependency_declaration:
      description: "All dependencies explicitly declared"
      check: "All referenced specs in depends_on field"
      threshold: 1.0
      
  errors:
    INCOMPLETE_STEPS:
      code: V301
      message: "Operation '{block}' lacks step-by-step description"
      severity: error
      
    AMBIGUOUS_LANGUAGE:
      code: V302
      message: "Ambiguous language detected: '{phrase}'"
      severity: error
      
    MISSING_DEPENDENCY:
      code: V303
      message: "Referenced spec '{ref}' not in depends_on"
      severity: error
      
    AUTONOMOUS_NOT_READY:
      code: V304
      message: "Spec fails autonomous validation, should be agent_assisted"
      severity: error
      action: "Auto-downgrade to agent_assisted"
```

### Validation Pipeline

```yaml
ValidationPipeline:
  stages:
    1_parse:
      - Parse header
      - Parse blocks
      - Extract metadata
      
    2_basic:
      - Header syntax
      - Required fields
      - Block syntax
      
    3_references:
      - Load _index.json
      - Resolve all @ref:
      - Check circular deps
      
    4_semantic:
      - Cross-field validation
      - Size limits
      - Layer consistency
      
    5_autonomous:
      - Step-by-step completeness
      - Ambiguity detection
      - Dependency declaration
      
  output:
    format: JSON
    fields:
      - valid: boolean
      - errors: array of {code, message, severity, location}
      - warnings: array of {code, message, severity, location}
      - score: 0-1 completeness score
```

### Tool Integration

```yaml
ToolIntegration:
  cli:
    command: "speclang validate <spec-file>"
    flags:
      - "--level=basic|standard|strict"
      - "--format=json|text"
      - "--fix"  # Auto-fix where possible
      
  guard_plugin:
    trigger: "On file save"
    level: "basic"
    display: "Inline diagnostics in editor"
    
  ci_cd:
    trigger: "On push/PR"
    level: "standard"
    fail_on: "error"
    warn_on: "warning"
    
  pre_cascade:
    trigger: "Before cascade starts"
    level: "strict" if agent_autonomous else "standard"
    fail_action: "Block cascade, notify"
```

### Error Codes Reference

| Code | Category | Severity | Description |
|------|----------|----------|-------------|
| V001 | Header | Error | Missing required field |
| V002 | Header | Error | Invalid version format |
| V003 | Header | Warning | Invalid layer value |
| V004 | Header | Error | Invalid agent_support |
| V101 | Reference | Warning | Unresolved reference |
| V102 | Reference | Error | Invalid reference format |
| V103 | Reference | Warning | Self-reference |
| V104 | Reference | Error | Circular dependency |
| V201 | Semantic | Warning | Size limit exceeded |
| V202 | Semantic | Warning | Metadata inconsistency |
| V301 | Autonomous | Error | Incomplete steps |
| V302 | Autonomous | Error | Ambiguous language |
| V303 | Autonomous | Error | Missing dependency |
| V304 | Autonomous | Error | Not ready for autonomous |

## Examples

### Basic Validation Output

```json
{
  "valid": false,
  "errors": [
    {
      "code": "V001",
      "message": "Header missing required 'id' field",
      "severity": "error",
      "location": "header:3"
    }
  ],
  "warnings": [],
  "score": 0.8
}
```

### Autonomous Validation Output

```json
{
  "valid": false,
  "errors": [
    {
      "code": "V301",
      "message": "Operation 'login' lacks step-by-step description",
      "severity": "error",
      "location": "block:auth/login"
    },
    {
      "code": "V302",
      "message": "Ambiguous language detected: 'maybe'",
      "severity": "error",
      "location": "line:45"
    }
  ],
  "warnings": [
    {
      "code": "V202",
      "message": "POC inconsistent with agent_autonomous",
      "severity": "warning",
      "location": "header:5"
    }
  ],
  "score": 0.45,
  "recommendation": "Downgrade to agent_assisted"
}
```

## Implementation

```python
class Validator:
    def __init__(self, index_path: str):
        self.index = load_index(index_path)
        
    def validate(self, spec_path: str, level: str = "standard") -> ValidationResult:
        content = read_file(spec_path)
        header = parse_header(content)
        blocks = parse_blocks(content)
        
        errors = []
        warnings = []
        
        # Basic validation
        errors.extend(self.validate_header(header))
        errors.extend(self.validate_blocks(blocks))
        
        if level in ["standard", "strict"]:
            # Reference validation
            ref_results = self.validate_references(content)
            errors.extend(ref_results.errors)
            warnings.extend(ref_results.warnings)
            
            # Semantic validation
            sem_results = self.validate_semantics(header, blocks)
            errors.extend(sem_results.errors)
            warnings.extend(sem_results.warnings)
            
        if level == "strict":
            # Autonomous validation
            auto_results = self.validate_autonomous(content, blocks)
            errors.extend(auto_results.errors)
            warnings.extend(auto_results.warnings)
            
        score = self.calculate_score(errors, warnings)
        
        return ValidationResult(
            valid=len([e for e in errors if e.severity == "error"]) == 0,
            errors=errors,
            warnings=warnings,
            score=score
        )
```

## References

- @ref:speclang/validation
- @ref:speclang/agent-support-levels
- @ref:speclang/semantic-definitions
- SIP 19: Agent Support Levels
- SIP 23: Safety Nets

## Copyright

This document is in the public domain.
