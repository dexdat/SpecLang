# speclang-header lines:11
id: "@speclang/scripts.validate-refs"
version: 0.1.0
layer: 2
tags: [scripts, validation, references]
parent: "@ref:speclang/scripts"
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Validate References Script
target: scripts/validate_refs.py
---

# Validate References Script

Script that validates all @ref references in SpecLang specifications resolve correctly.

## Overview

```speclang
# @block:overview @kind:note
The validate-refs script scans all spec files and verifies that every
@ref: reference points to an existing block, file, or resource. Broken
references indicate specs that won't work in the cascade.
```

## Purpose

```speclang
# @block:purpose @kind:note
Broken references cause cascade failures and confusion. This script:
1. Parses all spec files for @ref: patterns
2. Verifies each reference resolves to existing content
3. Reports missing blocks, files, and resources
4. Suggests corrections for common issues
5. Can auto-fix simple reference errors
```

## Reference Types

```speclang
# @block:ref-types @kind:entity
ReferenceTypes:
  block_ref:
    - pattern: "@ref:path/to/spec#block-name"
    - targets: Specific @block: in a spec file
    - example: "@ref:specs/auth#login"
  
  file_ref:
    - pattern: "@ref:path/to/spec"
    - targets: Entire spec file
    - example: "@ref:specs/auth"
  
  project_ref:
    - pattern: "@ref:project-name"
    - targets: project.scl or northstar
    - example: "@ref:northstar"
  
  external_ref:
    - pattern: "@ref:external/package"
    - targets: External spec or resource
    - example: "@ref:npm:express"
```

## Implementation

```speclang
# @block:implementation @kind:function
def validate_refs(spec_dir: str, fix: bool = False, 
                  verbose: bool = False) -> dict:
    """
    Validate all @ref references in specs.
    
    Args:
        spec_dir: Root specs directory
        fix: If True, attempt to auto-fix issues
        verbose: Show detailed output
    
    Returns:
        Dict with refs_checked, broken_refs, suggestions, errors
    """
```

## Common Issues

```speclang
# @block:issues @kind:table
| Issue | Example | Fix |
|-------|---------|-----|
| Missing block | #block:login → #block:auth | Update ref or create block |
| Wrong path | @ref:auth#login | @ref:specs/auth#login |
| Case mismatch | @ref:Auth#Login | @ref:auth#login |
| Deleted file | @ref:old-spec | Remove or update ref |
| Old format | @ref:specs/auth.login | @ref:specs/auth#login |
```

## Validation Rules

```speclang
# @block:rules @kind:note
1. File exists: Referenced spec file must exist
2. Block exists: Referenced @block: must be in file
3. Valid syntax: Reference must match @ref:pattern
4. No cycles: Warn about circular dependencies
5. Case sensitive: Paths are case-sensitive on most systems

References are resolved relative to specs/ directory.
```

## Usage

```speclang
# @block:usage @kind:note
# Validate all specs
python3 scripts/validate_refs.py specs/

# Validate with auto-fix
python3 scripts/validate_refs.py specs/ --fix

# Verbose output
python3 scripts/validate_refs.py specs/ --verbose

# Validate single spec
python3 scripts/validate_refs.py specs/auth.spec.md

# JSON output for automation
python3 scripts/validate_refs.py specs/ --json

# Check specific reference pattern
python3 scripts/validate_refs.py specs/ --pattern "@ref:northstar"
```

## Output Format

```speclang
# @block:output @kind:note
Summary:
  Total refs checked: 1234
  Valid references: 1220
  Broken references: 14
  
Details:
  - specs/auth.spec.md:5 @ref:specs/users#model
    → ERROR: Block 'model' not found in specs/users.spec.md
  
  - specs/api.spec.md:10 @ref:specs/old-file
    → ERROR: File not found

Suggestions:
  - Consider adding @block:model to specs/users.spec.md
  - Update reference or remove broken link
```

## Fix Strategies

```speclang
# @block:fixes @kind:note
Auto-fix capabilities:
1. Create missing blocks from templates
2. Fix case mismatches automatically
3. Update old .dir references to .spec.dir
4. Convert dot notation to hash notation
5. Remove clearly invalid references (with --confirm)

Manual fixes required:
- References to deleted files
- Circular dependency resolution
- Semantic errors (wrong block type)
```

## Integration

```speclang
# @block:integration @kind:note
The validate-refs script is integrated into:
- pre-commit hooks: Check refs before commit
- CI/CD pipeline: Fail build on broken refs
- cascade system: Validate before code generation
- speclang check: Part of speclang validate command
```

## Related Specs

```speclang
# @block:refs @kind:note
- @ref:speclang/headers - Header reference format
- @ref:speclang/cascade - Cascade reference resolution
- @ref:speclang/scripts.rename-spec-files - Rename with ref updates
- @ref:speclang/scripts.add-missing-fields - Header field validation
