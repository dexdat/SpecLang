# speclang-header
id: "@speclang/symlinks"
version: 0.1.0
layer: 0
tags: [symlinks, dual-view, source-of-truth, portable]
imports: ["@speclang/core", "@speclang/headers"]
status: draft

---

# Symlinks

Dual view: specs/ is the source of truth, symlinks provide logical layout.

## Overview

```speclang
# @block:symlinks/overview @kind:note
specs/ is the single source of truth.

- All files live in specs/ tree
- Headers declare target location
- Symlinks connect to logical paths
- Build tools see normal layout
- Take specs/ and leave - rebuild everything

The specs folder is complete, portable, self-contained.
```

---

## Dual View

### @symlinks/dual-view

```speclang
# @block:symlinks/dual-view @kind:entity
DualView:
  physical:
    location: specs/ tree
    structure: hierarchical with .spec.dir/
    contents: all specs and generated code
    
  logical:
    location: src/, tests/, docs/, etc.
    structure: conventional project layout
    contents: symlinks to specs/
    
  mapping:
    header field: target or output_path
    example: target: src/auth/login.go
```

### @symlinks/diagram

```speclang
# @block:symlinks/diagram @kind:code
```
Physical (source of truth):
specs/
├── core/
│   └── auth/
│       ├── login.go.spec.yaml    # spec file
│       ├── login.go              # generated code
│       └── login_test.go         # generated test

Logical (symlinks):
src/
└── auth/
    └── login.go → ../../specs/core/auth/login.go

tests/
└── auth/
    └── login_test.go → ../../specs/core/auth/login_test.go
```
```

---

## Header Mapping

### @symlinks/header

```speclang
# @block:symlinks/header @kind:entity
HeaderMapping:
  required_field: target or output_path
  
  format:
    target: src/auth/login.go
    # or
    output_path: generated/go/auth/login.go
    
  for_specs:
    - target: where the generated code should appear
    
  for_code:
    - spec: @ref to source spec
    - generated_from: @ref to spec block
```

### @symlinks/header-example

```speclang
# @block:symlinks/header-example @kind:code
```yaml
# specs/core/auth/login.go.spec.yaml
--- speclang-header lines:12
id: @specs/auth/login
target: src/auth/login.go
language: go
---

# spec content...

# After generation, creates:
# 1. specs/core/auth/login.go (real file)
# 2. src/auth/login.go (symlink to above)
```
```

---

## Symlink Creation

### @symlinks/creation

```speclang
# @block:symlinks/creation @kind:operation
createSymlinks():

for each spec with target header:
  1. Generate code in specs/ location
  2. Read target path from header
  3. Ensure target directory exists
  4. Create symlink: target → specs/ location
  5. Log symlink creation

rules:
  - Overwrite existing symlinks
  - Don't overwrite real files (error)
  - Create parent directories
```

---

## Rebuild

### @symlinks/rebuild

```speclang
# @block:symlinks/rebuild @kind:operation
rebuild():

scenario: rm -rf src/ tests/ generated/

steps:
  1. Scan specs/ for all files
  2. Parse headers, find targets
  3. Regenerate code if needed
  4. Create all symlinks
  5. Verify symlinks valid
  6. Done

command: speclang rebuild

result: full project restored from specs/
```

---

## Portability

### @symlinks/portability

```speclang
# @block:symlinks/portability @kind:entity
Portability:
  
  what_you_need: just specs/ folder
  
  what_you_get:
    - All source code (via rebuild)
    - All tests (via rebuild)
    - All documentation (via rebuild)
    - Complete project structure
    
  workflow:
    1. Copy specs/ to new machine
    2. speclang rebuild
    3. Full project ready
    
  benefit: specs/ is complete, self-contained, portable
```

---

## Cross-Platform

### @symlinks/cross-platform

```speclang
# @block:symlinks/cross-platform @kind:entity
CrossPlatformSymlinks:
  
  unix:
    type: symbolic links
    command: ln -s source target
    
  windows:
    type: junction points or symlinks
    command: mklink /J target source
    requires: Developer mode or admin
    
  fallback:
    if symlinks unavailable:
      - Copy files instead
      - Track in .speclang/copies.json
      - Sync on rebuild
```

---

## Symlink Verification

### @symlinks/verification

```speclang
# @block:symlinks/verification @kind:operation
verifySymlinks():

for each symlink:
  1. Check target exists
  2. Check points to specs/
  3. Check not broken
  
on_broken:
  - Re-create symlink
  - Log warning
  
command: speclang verify-symlinks
```

---

## Git Handling

### @symlinks/git

```speclang
# @block:symlinks/git @kind:entity
GitSymlinks:
  
  tracked:
    - specs/ (all real files)
    - symlink files (the links themselves)
    
  gitignore:
    - Nothing special needed
    - Symlinks are small text files in git
    
  clone:
    - Symlinks preserved on clone
    - Works on all platforms (with git config)
    
  git_config:
    core.symlinks = true
```

---

## Tools

### @symlinks/tools

```speclang
# @block:symlinks/tools @kind:entity
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
    params: { clean?: boolean }
    returns: { generated: [], symlinked: [], errors: [] }
    
  speclang_get_physical_path:
    description: "Get real path from symlink"
    params: { logical_path }
    returns: { physical_path }
```

---

## Layout Example

### @symlinks/layout-example

```speclang
# @block:symlinks/layout-example @kind:code
```
project/
├── specs/                          # SOURCE OF TRUTH
│   ├── project.scl                 # north star
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
```
