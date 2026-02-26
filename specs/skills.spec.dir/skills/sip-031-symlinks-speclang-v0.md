---
name: sip-031-symlinks-speclang-v0
title: "SIP 31: Symlinks"
version: 0.1.0
description: Dual-view architecture with specs/ as source of truth
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 31: Symlinks

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the Symlink system—dual-view architecture where specs/ is the source of truth.

### Quick Start

Dual view concept:
1. **Physical**: specs/ contains all real files
2. **Logical**: src/, tests/ contain symlinks to specs/
3. **Portable**: Copy specs/, rebuild everything
4. **Cross-platform**: Symlinks or junction points

### When to Read This

- **Understanding layout**: Why files appear in multiple places
- **Portability**: Moving specs between machines
- **Rebuilding**: Restoring from specs/ only

### Related SIPs

- SIP 32: Directory Structure
- SIP 8: Configuration
- SIP 12: Code Generation

## Abstract

This SIP defines the Symlink system—a dual-view architecture where specs/ is the single source of truth. All files live in the specs/ tree, with symlinks providing conventional project layout (src/, tests/, docs/). This enables portability—take specs/ and rebuild everything.

## Motivation

Traditional projects have scattered sources:
- Code in src/
- Tests in tests/
- Docs in docs/
- Specs in specs/

Problems:
- Which is source of truth?
- How to port everything?
- How to sync changes?

SpecLang solution:
- specs/ is complete, portable, self-contained
- Symlinks provide familiar layout
- Rebuild restores everything

## Rationale

**specs/ as Source of Truth:**

1. **Portable**: Copy one folder
2. **Complete**: Everything included
3. **Rebuildable**: Regenerate any time
4. **Consistent**: Single truth source

## Specification

### Dual View Architecture

```yaml
DualView:
  physical:
    location: "specs/ tree"
    structure: "hierarchical with .spec.spec.dir/"
    contents: "all specs and generated code"
    
  logical:
    location: "src/, tests/, docs/, etc."
    structure: "conventional project layout"
    contents: "symlinks to specs/"
    
  mapping:
    header_field: "target or output_path"
    example: "target: src/auth/login.go"
```

### Directory Layout

```yaml
Layout:
  physical_source_of_truth:
    specs/:
      - project.scl
      - core/:
          - auth/:
              - auth.spec.yaml
              - login.go.spec.yaml
              - login.go         # real generated
              - login_test.go    # real generated
      - expanded/:
          - ...
          
  logical_symlinks:
    src/:
      - auth/:
          - login.go: "→ ../../specs/core/auth/login.go"
          
    tests/:
      - auth/:
          - login_test.go: "→ ../../specs/core/auth/login_test.go"
          
    .speclang/:
      - speclang.db
```

### Header Mapping

```yaml
HeaderMapping:
  required_field: "target or output_path"
  
  format:
    - "target: src/auth/login.go"
    - "output_path: generated/go/auth/login.go"
    
  for_specs:
    target: "where the generated code should appear"
    
  for_code:
    spec: "@ref to source spec"
    generated_from: "@ref to spec block"
```

### Symlink Creation

```yaml
createSymlinks():
  for_each_spec_with_target_header:
    1_generate: "Generate code in specs/ location"
    2_read_target: "Read target path from header"
    3_ensure_dir: "Ensure target directory exists"
    4_create_link: "Create symlink: target → specs/ location"
    5_log: "Log symlink creation"
    
  rules:
    - "Overwrite existing symlinks"
    - "Don't overwrite real files (error)"
    - "Create parent directories"
```

### Rebuild Process

```yaml
rebuild():
  scenario: "rm -rf src/ tests/ generated/"
  
  steps:
    1_scan: "Scan specs/ for all files"
    2_parse: "Parse headers, find targets"
    3_regenerate: "Regenerate code if needed"
    4_create_links: "Create all symlinks"
    5_verify: "Verify symlinks valid"
    6_done: "Full project restored"
    
  command: "speclang rebuild"
  result: "full project restored from specs/"
```

### Portability

```yaml
Portability:
  what_you_need: "just specs/ folder"
  
  what_you_get:
    - "All source code (via rebuild)"
    - "All tests (via rebuild)"
    - "All documentation (via rebuild)"
    - "Complete project structure"
    
  workflow:
    1: "Copy specs/ to new machine"
    2: "speclang rebuild"
    3: "Full project ready"
    
  benefit: "specs/ is complete, self-contained, portable"
```

### Cross-Platform Support

```yaml
CrossPlatformSymlinks:
  unix:
    type: "symbolic links"
    command: "ln -s source target"
    
  windows:
    type: "junction points or symlinks"
    command: "mklink /J target source"
    requires: "Developer mode or admin"
    
  fallback:
    if_symlinks_unavailable:
      - "Copy files instead"
      - "Track in .speclang/copies.json"
      - "Sync on rebuild"
```

### Symlink Verification

```yaml
verifySymlinks():
  for_each_symlink:
    1: "Check target exists"
    2: "Check points to specs/"
    3: "Check not broken"
    
  on_broken:
    - "Re-create symlink"
    - "Log warning"
    
  command: "speclang verify-symlinks"
```

### Git Handling

```yaml
GitSymlinks:
  tracked:
    - "specs/ (all real files)"
    - "symlink files (the links themselves)"
    
  gitignore:
    - "Nothing special needed"
    - "Symlinks are small text files in git"
    
  clone:
    - "Symlinks preserved on clone"
    - "Works on all platforms (with git config)"
    
  git_config:
    core_symlinks: true
```

### Symlink Tools

```yaml
SymlinkTools:
  speclang_create_symlinks:
    description: "Create all symlinks from specs"
    params: {}
    returns: { created: [], skipped: [], errors: [] }
    
  speclang_verify_symlinks:
    description: "Check all symlinks valid"
    params: {}
    returns: { valid: [], broken: [], missing: [] }
    
  speclang_rebuild:
    description: "Rebuild entire project from specs"
    params: { clean?: Boolean }
    returns: { generated: [], symlinked: [], errors: [] }
    
  speclang_get_physical_path:
    description: "Get real path from symlink"
    params: { logical_path: String }
    returns: { physical_path: String }
```

## Examples

### Example 1: Header with Target

```yaml
# specs/core/auth/login.go.spec.yaml
speclang-header:
  id: "@specs/auth/login"
  target: "src/auth/login.go"
  language: "go"
  
# After generation:
# 1. specs/core/auth/login.go (real file)
# 2. src/auth/login.go (symlink to above)
```

### Example 2: Full Layout

```
project/
├── specs/                          # SOURCE OF TRUTH
│   ├── project.scl
│   ├── core/
│   │   ├── auth/
│   │   │   ├── auth.spec.yaml
│   │   │   ├── login.go.spec.yaml
│   │   │   ├── login.go            # real generated
│   │   │   └── login_test.go       # real generated
│   │   └── users/
│   │       └── ...
│   └── expanded/
│       └── ...
│
├── src/                            # SYMLINKS
│   └── auth/
│       └── login.go → ../../specs/core/auth/login.go
│
├── tests/                          # SYMLINKS
│   └── auth/
│       └── login_test.go → ../../specs/core/auth/login_test.go
│
├── .speclang/
│   └── speclang.db
│
└── build.yaml
```

### Example 3: Rebuild Workflow

```yaml
scenario: "Fresh machine, only specs/ copied"

step_1_verify:
  command: "ls specs/"
  result: "project.scl, core/, expanded/"
  
step_2_rebuild:
  command: "speclang rebuild"
  actions:
    - "Scanning specs/..."
    - "Found 42 spec files"
    - "Generating code..."
    - "Creating symlinks..."
    - "Verifying..."
    
step_3_result:
  created:
    - "src/auth/login.go"
    - "src/auth/handler.go"
    - "tests/auth/login_test.go"
  symlinked: 15
  errors: []
```

## Implementation

```python
import os
import shutil
from pathlib import Path

class SymlinkManager:
    def __init__(self, project_root: str):
        self.root = Path(project_root)
        self.specs_dir = self.root / "specs"
        
    def create_symlink(self, source: str, target: str) -> bool:
        source_path = self.root / source
        target_path = self.root / target
        
        target_path.parent.mkdir(parents=True, exist_ok=True)
        
        if target_path.exists() or target_path.is_symlink():
            if target_path.is_symlink():
                target_path.unlink()
            else:
                raise ValueError(f"Target {target} is a real file")
                
        if os.name == 'nt':
            os.symlink(str(source_path), str(target_path), target_is_directory=False)
        else:
            os.symlink(str(source_path), str(target_path))
        return True
        
    def rebuild(self, clean: bool = False) -> dict:
        if clean:
            for d in ["src", "tests", "generated"]:
                if (self.root / d).exists():
                    shutil.rmtree(self.root / d)
                    
        created = []
        for spec in self.specs_dir.rglob("*.spec.*"):
            header = self._parse_header(spec)
            if "target" in header:
                source = str(spec.relative_to(self.root))
                target = header["target"]
                self.create_symlink(source, target)
                created.append(target)
                
        return {"created": created}
```

## References

- @ref:speclang/symlinks
- @ref:speclang/directory-structure
- SIP 32: Directory Structure

## Copyright

This document is in the public domain.
