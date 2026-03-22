# speclang-header lines:11
id: "@speclang/scripts.add-missing-fields"
version: 0.1.0
layer: 2
tags: [scripts, fix, headers]
parent: "@ref:speclang/scripts"
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Add Missing Fields Script
target: scripts/add_missing_fields.py
---

# Add Missing Fields Script

Script that automatically adds missing required header fields to SpecLang specification files.

## Overview

```speclang
# @block:overview @kind:note
The add-missing-fields script analyzes SpecLang specification files and adds
missing required header fields based on the header specification. This ensures
all specs conform to the universal header format defined in headers.spec.md.
```

## Purpose

```speclang
# @block:purpose @kind:note
When specs are created or modified, sometimes required header fields are missing.
This script provides:
1. Automatic detection of missing fields
2. Intelligent default values for optional fields
3. Preservation of existing field values
4. Validation that added fields are valid
```

## Required Fields

```speclang
# @block:required-fields @kind:entity
RequiredFields:
  - id: Unique spec identifier (@speclang/...)
  - version: Semantic version (e.g., 0.1.0)
  - layer: Abstraction layer (0-10)
  
OptionalFields:
  - tags: List of tags for categorization
  - status: Current status (draft, active, deprecated)
  - short: Brief description
  - parent: Parent spec reference
  - depends_on: List of dependencies
  - agent_support: Level of agent support
  - project_level: Project maturity level
```

## Implementation

```speclang
# @block:implementation @kind:function
def add_missing_fields(spec_path: str, dry_run: bool = False) -> dict:
    """
    Add missing header fields to a spec file.
    
    Args:
        spec_path: Path to the spec file
        dry_run: If True, only report missing fields without modifying
    
    Returns:
        Dict with fields_added, fields_missing, and errors
    """
```

## Algorithm

```speclang
# @block:algorithm @kind:note
1. Parse the spec file header (YAML frontmatter)
2. Extract required fields from headers.spec.md
3. Compare with existing fields in the spec
4. For each missing required field:
   a. Generate appropriate default value
   b. Add field to header
5. Write updated spec (or report if dry_run)
6. Return summary of changes
```

## Default Values

```speclang
# @block:defaults @kind:table
| Field | Default Value | Notes |
|-------|---------------|-------|
| version | 0.1.0 | Initial semantic version |
| layer | 5 | Middle abstraction layer |
| status | draft | New specs start as draft |
| project_level | Alpha | Default maturity level |
| agent_support | agent_assisted | Default agent support |
| short | (extracted from first H1) | First heading as description |
```

## Usage

```speclang
# @block:usage @kind:note
# Add missing fields to a single spec
python3 scripts/add_missing_fields.py specs/my-spec.spec.md

# Dry run to see what would be added
python3 scripts/add_missing_fields.py specs/my-spec.spec.md --dry-run

# Add missing fields to all specs in a directory
python3 scripts/add_missing_fields.py specs/ --recursive

# Fix and report
python3 scripts/add_missing_fields.py specs/ --fix --report
```

## Examples

```speclang
# @block:examples @kind:note
Before:
  # speclang-header lines:5
  id: @speclang/example
  ---

After:
  # speclang-header lines:11
  id: "@speclang/example"
  version: 0.1.0
  layer: 5
  status: draft
  project_level: Alpha
  agent_support: agent_assisted
  short: Example spec
  ---
```

## Related Specs

```speclang
# @block:refs @kind:note
- @ref:speclang/headers - Header format specification
- @ref:speclang/scripts.validate-refs - Reference validation
- @ref:speclang/scripts.fix-headers - Header fixing utility
```
