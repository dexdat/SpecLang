# speclang-header lines:11
id: "@speclang/scripts.generate-validation-system"
version: 0.1.0
layer: 2
tags: [scripts, generation, validation]
parent: ""@ref:speclang/scripts"status: draft
project_level: Alpha
agent_support: agent_assisted
short: Generate Validation System Script
target: scripts/generate_validation_system.py
---

# Generate Validation System Script

Script that generates validation code from spec-defined validation rules.

## Overview

```speclang
# @block:overview @kind:note
The generate-validation-system script reads validation rules defined in
specs and generates validator implementations in various languages.
It transforms declarative validation specifications into executable code.
```

## Purpose

```speclang
# @block:purpose @kind:note
Validation is often duplicated across codebase. This script:
1. Reads validation rules from specs
2. Generates validators in target languages
3. Supports common validation types (required, format, range, custom)
4. Generates both runtime validators and compile-time types
5. Keeps validation in sync with specs
```

## Validation Types

```speclang
# @block:validation-types @kind:entity
ValidationTypes:
  basic:
    - required: Field must be present
    - type: Field must be specific type
    - enum: Value must be in allowed list
  
  string:
    - min_length: Minimum string length
    - max_length: Maximum string length
    - pattern: Regex pattern match
    - format: Predefined format (email, url, uuid)
  
  numeric:
    - minimum: Minimum numeric value
    - maximum: Maximum numeric value
    - multiple_of: Must be multiple of value
  
  complex:
    - custom: Custom validator function
    - dependent: Depends on another field
    - conditional: Validate based on condition
```

## Implementation

```speclang
# @block:implementation @kind:function
def generate_validation_system(spec_paths: list[str], 
                                language: str, output_dir: str) -> dict:
    """
    Generate validation system from spec definitions.
    
    Args:
        spec_paths: List of spec files with validation rules
        language: Target language for validators
        output_dir: Directory to write validators
    
    Returns:
        Dict with validators_generated, rules_processed, errors
    """
```

## Spec Format

```speclang
# @block:spec-format @kind:note
Validation rules are defined in specs using @kind:entity:

### @block::user-validation @kind:entity
UserValidation:
  fields:
    - name: email
      validate:
        - required: true
        - format: email
    - name: password
      validate:
        - required: true
        - min_length: 8
        - pattern: "^(?=.*[a-z])(?=.*[A-Z])"
    - name: age
      validate:
        - minimum: 13
        - maximum: 120
```

## Output Formats

```speclang
# @block:output @kind:entity
OutputFormats:
  runtime:
    - validator_classes: OOP validator classes
    - validation_functions: Functional validators
    - decorator_validators: Language-specific decorators
  
  schema:
    - json_schema: JSON Schema output
    - openapi: OpenAPI schema
    - types: Compile-time type checking
  
  testing:
    - test_cases: Generated test cases
    - fixtures: Test data fixtures
```

## Usage

```speclang
# @block:usage @kind:note
# Generate TypeScript validators
python3 scripts/generate_validation_system.py specs/validation/ --lang ts -o src/validators/

# Generate Go validators with struct tags
python3 scripts/generate_validation_system.py specs/api.spec.md --lang go -o internal/validate/

# Generate JSON Schema
python3 scripts/generate_validation_system.py specs/ --json-schema -o schemas/

# Generate all in project
python3 scripts/generate_validation_system.py specs/ --lang python -o generated/
```

## Examples

```speclang
# @block:examples @kind:note
Input (spec):
  ### @block::user @kind:entity
  User:
    email:
      validate:
        - required: true
        - format: email
    password:
      validate:
        - required: true
        - min_length: 8

Output (TypeScript):
  export const userValidator = {
    email: [required(), isEmail()],
    password: [required(), minLength(8)]
  };

Output (Go):
  type UserValidator struct{}
  func (v *UserValidator) ValidateEmail(email string) error {
    if email == "" { return ErrRequired }
    if !isEmail(email) { return ErrInvalidEmail }
    return nil
  }
```

## Custom Validators

```speclang
# @block:custom @kind:note
Custom validators can be defined in specs:
- name: Custom validator name
- function: Validator implementation
- message: Error message template

Custom validators are generated as separate functions
that can be called from auto-generated validators.
```

## Related Specs

```speclang
# @block:refs @kind:note
- @ref:speclang/validation - Validation specification
- @ref:speclang/scripts.generate-from-spec - Generic code generation
- @ref:speclang/headers - Header validation
- @ref:speclang/scripts.validate-refs - Reference validation
