# speclang-header lines:12
id: "@speclang/scripts-fix-headers"
version: 0.1.0
layer: 2
tags: [scripts, headers, fix]
parent: "@ref:speclang/scripts"
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Fix Headers Script
target: scripts/fix_headers.py
---

# Fix Headers Script

Automatically fixes common header issues in SpecLang specification files. Ensures all specs conform to the universal header format.

## Overview

```speclang
# @block:overview @kind:note
The fix-headers script identifies and repairs common header problems in specs,
including missing required fields, incorrect formatting, invalid references,
and deprecated field names.
```

## Common Issues

```speclang
# @block:issues @kind:entity
CommonIssues:
  quoting:
    - id: @specs/example → id: "@specs/example"
    - tags: [tag"@one"] → tags: [tagone]
  
  block_ids:
    - @block:name → @block::name
    - @block:name @kind:type → @block:name @kind:type
  
  references:
    - "@ref:specs/foo → @ref:specs/foo.spec
    - "@ref:foo → @ref:specs/foo
  
  line_count:
    - Header says lines:10 but has 12 lines
    - Must count # comment lines + --- separator
```

## Issues Fixed

```speclang
# @block:fixes @kind:table
| Issue | Before | After | Auto-Fixable |
|-------|-------|-------|--------------|
| Quoted ID | id: @specs/foo | id: "@specs/foo" | Yes |
| Block ID | @block:name | @block::name | Yes |
| Tag format | [tag@one] | [tag-one] | Yes |
| Line count | lines:10 | lines:12 | Yes |
| Status | status:pending | status:draft | No |
| Layer | layer:99 | layer:5 | No |
```

## Implementation

```speclang
# @block:implementation @kind:function
def fix_headers(spec_path: str, dry_run: bool = False, auto_fix: bool = True) -> dict:
    """
    Fix common header issues in a spec file.
    
    Args:
        spec_path: Path to spec file
        dry_run: Only report issues, don't fix
        auto_fix: Apply automatic fixes
    
    Returns:
        Dict with issues_found, fixes_applied, errors
    """
```

## Algorithm

```speclang
# @block:algorithm @kind:note
1. Read spec file
2. Parse YAML frontmatter (header)
3. Identify issues:
   a. Check required fields present
   b. Validate field formats
   c. Verify @ref: references exist
   d. Count actual header lines
4. Apply auto-fixes where safe
5. Report issues requiring manual fixes
6. Write fixed file (or report if dry_run)
```

## Auto-Fix Rules

```speclang
# @block:auto-fixes @kind:note
Safe to fix automatically:
- Add missing optional fields with defaults
- Quote IDs containing @ character
- Fix line count mismatch
- Normalize tag formatting
- Fix @block: to @block:: convention

Manual intervention required:
- Invalid layer values
- Missing required fields
- Circular dependencies
- Invalid status values
```

## Usage

```speclang
# @block:usage @kind:note
# Fix headers in a single spec
python3 scripts/fix_headers.py specs/my-spec.spec.md

# Dry run (report only)
python3 scripts/fix_headers.py specs/my-spec.spec.md --dry-run

# Fix all specs in directory
python3 scripts/fix_headers.py specs/ --recursive

# Fix with backup
python3 scripts/fix_headers.py specs/ --backup

# Only report issues, don't fix
python3 scripts/fix_headers.py specs/ --report

# Fix specific issue types
python3 scripts/fix_headers.py specs/ --fix-quoting --fix-line-count
```

## Related Scripts

```speclang
# @block:related @kind:note
- scripts/add_missing_fields.py - Adds missing required fields
- scripts/validate_refs.py - Validates @ref: references
- scripts/check_compliance.py - Checks dual-view compliance
```

## Related Specs

```speclang
# @block:refs @kind:note
- @ref:speclang/headers - Header format specification
- @ref:speclang/scripts.add-missing-fields - Add missing fields script
- @ref:speclang/scripts.validate-refs - Reference validation
```
