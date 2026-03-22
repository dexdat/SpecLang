# speclang-header lines:11
id: "@speclang/scripts.rename-spec-files"
version: 0.1.0
layer: 2
tags: [scripts, rename, files]
parent: "@ref:speclang/scripts"
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Rename Spec Files Script
target: scripts/rename_spec_files.py
---

# Rename Spec Files Script

Script that renames spec files according to SpecLang naming conventions.

## Overview

```speclang
# @block:overview @kind:note
The rename-spec-files script enforces consistent naming across the spec
directory. It detects non-compliant filenames and renames them to follow
the .spec.md, .spec.yaml, .scl, and .spec.dir conventions.
```

## Purpose

```speclang
# @block:purpose @kind:note
Inconsistent naming causes confusion and breaks tooling. This script:
1. Detects files that don't follow naming conventions
2. Renames files to correct format
3. Updates internal references (@ref: links)
4. Creates redirects to prevent broken links
5. Reports all changes for review
```

## Naming Conventions

```speclang
# @block:conventions @kind:entity
NamingRules:
  spec_files:
    - pattern: "*.spec.md" - Markdown specs
    - pattern: "*.spec.yaml" - YAML specs
    - pattern: "*.spec.yml" - YAML (alias)
    - pattern: "*.scl" - Core SpecLang format
  
  spec_directories:
    - pattern: "*.spec.dir" - Spec directory bundles
  
  code_mappings:
    - pattern: "*.go.spec" - Maps to .go file
    - pattern: "*.ts.spec" - Maps to .ts file
    - pattern: "*.py.spec" - Maps to .py file
  
  test_specs:
    - pattern: "*.test.spec.md" - Test specifications
```

## Common Issues

```speclang
# @block:issues @kind:table
| Issue | Wrong | Correct |
|-------|-------|---------|
| Missing .spec | auth.spec | auth.spec.md |
| Old .dir | auth.dir | auth.spec.dir |
| Wrong extension | auth.md | auth.spec.md |
| Uppercase | Auth.spec.md | auth.spec.md |
| Spaces | my spec.spec.md | my-spec.spec.md |
```

## Implementation

```speclang
# @block:implementation @kind:function
def rename_spec_files(directory: str, dry_run: bool = False, 
                      update_refs: bool = True) -> dict:
    """
    Rename spec files to follow naming conventions.
    
    Args:
        directory: Root specs directory to scan
        dry_run: If True, only report changes without renaming
        update_refs: If True, update @ref: links in other files
    
    Returns:
        Dict with files_renamed, refs_updated, errors
    """
```

## Renaming Rules

```speclang
# @block:rules @kind:note
1. Convert spaces to hyphens: "my spec" → "my-spec"
2. Convert uppercase to lowercase: "Auth" → "auth"
3. Add .spec extension: "auth" → "auth.spec.md"
4. Rename .dir to .spec.dir: "auth.dir" → "auth.spec.dir"
5. Preserve case in @ref: links when updating
6. Create .redirect files for backward compatibility
```

## Usage

```speclang
# @block:usage @kind:note
# Check what would be renamed (dry run)
python3 scripts/rename_spec_files.py specs/ --dry-run

# Rename files and update references
python3 scripts/rename_spec_files.py specs/ --fix

# Only rename, don't update references
python3 scripts/rename_spec_files.py specs/ --fix --no-refs

# Verbose output
python3 scripts/rename_spec_files.py specs/ --fix -v
```

## Examples

```speclang
# @block:examples @kind:note
Before:
  specs/Auth.spec.md → specs/auth.spec.md
  specs/auth.dir/ → specs/auth.spec.dir/
  specs/my spec.spec → specs/my-spec.spec.md
  specs/User.spec.yaml → specs/user.spec.yaml

Also updates references:
  # In other specs:
  @ref:specs/Auth#login → @ref:specs/auth#login
```

## Safety Features

```speclang
# @block:safety @kind:note
- Dry run by default - must use --fix to actually rename
- Backup original files before renaming
- Update all @ref: links automatically
- Report all changes before execution
- Rollback capability if errors occur
- Skip files with uncommitted changes
```

## Related Specs

```speclang
# @block:refs @kind:note
- @ref:speclang/file-naming - File naming specification
- @ref:speclang/scripts.validate-refs - Reference validation
- @ref:speclang/symlinks - Dual-view pattern
