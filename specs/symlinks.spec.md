# speclang-header lines:11
id: "@speclang/symlinks"
version: 0.1.0
layer: 0
tags: [symlinks, dual-view, source-of-truth, portable]
status: draft

project_level: Alpha
agent_support: agent_assisted
short: Symlinks
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

## Sub‑Specifications

This spec has been split into two component‑level sub‑specs:

### @symlinks/creation-subspec
- **File**: `symlinks.spec.dir/creation.spec.md`
- **ID**: `@speclang/symlinks/creation`
- **Contents**: Header mapping, symlink creation, rebuild, portability, cross‑platform support
- **Reference**: @ref:specs/symlinks.spec.dir/creation

### @symlinks/verification-subspec
- **File**: `symlinks.spec.dir/verification.spec.md`
- **ID**: `@speclang/symlinks/verification`
- **Contents**: Symlink verification, git handling, tools, layout example
- **Reference**: @ref:specs/symlinks.spec.dir/verification