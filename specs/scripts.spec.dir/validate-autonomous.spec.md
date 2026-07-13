# speclang-header lines:13
id: "@speclang/scripts-validate-autonomous"
version: 0.1.0
layer: 2
tags: [scripts, validation, autonomous]
parent: ""@ref:speclang/scriptsstatus: draft
project_level: Alpha
agent_support: agent_assisted
short: Validate Autonomous Specs Script
target: scripts/validate_autonomous.py
depends_on:
  - "@specs/autonomous"
---

# Validate Autonomous Specs Script

Script that validates specs marked with `agent_support: agent_autonomous` have sufficient detail for autonomous agent operation.

## Overview

```speclang
# @block:overview @kind:note
The validate-autonomous script checks that specs with agent_support: agent_autonomous
contain all required elements for autonomous agents to operate without human assistance.
This ensures specs are self-contained and have sufficient context.
```

## Purpose

```speclang
# @block:purpose @kind:note
Autonomous agents rely on specs alone to understand their task. This script validates:
1. Required header fields are present
2. Dependencies are explicitly referenced
3. Step-by-step instructions exist
4. Edge cases are documented
5. Validation rules are specified
6. Recovery mechanisms are defined
```

## Validation Criteria

```speclang
# @block:criteria @kind:table
| Criterion | Required | Description |
|-----------|----------|-------------|
| agent_support | Yes | Must be agent_autonomous |
| depends_on | Yes | At least one dependency referenced |
| short | Yes | Brief description of purpose |
| step_by_step | Yes | Detailed implementation steps |
| validation_rules | Yes | How to validate the implementation |
| error_handling | Conditional | For complex specs, error handling |
| recovery_mechanisms | Conditional | For critical specs, recovery steps |
```

## Implementation

```speclang
# @block:implementation @kind:function
def validate_autonomous_spec(spec_path: str) -> ValidationResult:
    """
    Validate that an autonomous spec has sufficient detail.
    
    Args:
        spec_path: Path to the spec file
    
    Returns:
        ValidationResult with pass/fail and details
    """
    
def check_agent_support(header: dict) -> bool:
    """Check if agent_support is set to agent_autonomous."""
    
def check_dependencies(header: dict, content: str) -> bool:
    """Verify explicit @ref: dependencies exist."""
    
def check_step_by_step(content: str) -> bool:
    """Verify step-by-step instructions exist."""
```

## Validation Rules

```speclang
# @block:validation-rules @kind:note
1. **Header Validation**
   - Must have agent_support: agent_autonomous
   - Must have non-empty id field
   - Must have version field
   
2. **Dependency Validation**
   - All @ref: references must resolve to existing specs
   - Circular dependencies should be flagged
   
3. **Content Validation**
   - Must contain step-by-step sections
   - Must contain validation rules
   - For complex specs: must contain edge cases
   
4. **Completeness Validation**
   - Implementation should be fully specified
   - No "TODO" or "TBD" placeholders
```

## Output Format

```speclang
# @block:output @kind:note
Example output:
  specs/auth.spec.md: FAIL
    - Missing step_by_step section
    - Missing validation_rules section
    - Missing recovery_mechanisms
    
  specs/parser.spec.md: PASS
    - All autonomous criteria met
    
Summary:
  Total autonomous specs: 45
  Passed: 38
  Failed: 7
```

## Usage

```speclang
# @block:usage @kind:note
# Validate a single spec
python3 scripts/validate_autonomous.py specs/auth.spec.md

# Validate all specs with agent_autonomous
python3 scripts/validate_autonomous.py specs/

# Detailed output with suggestions
python3 scripts/validate_autonomous.py specs/ --verbose

# Generate fix suggestions
python3 scripts/validate_autonomous.py specs/ --suggest
```

## Related Specs

```speclang
# @block:refs @kind:note
- @ref:speclang/autonomous - Autonomous agent specification
- @ref:speclang/headers - Header format with agent_support field
- @ref:speclang/scripts.validate-specs - General spec validation
```
