# speclang-header lines:12
id: "@speclang/symlinks/creation"
version: 0.1.0
layer: 2
tags: [symlinks, creation, rebuild, portability, cross-platform]
imports: ["@speclang/symlinks"]
status: draft
project_level: Alpha
agent_support: agent_autonomous
short: Symlink Creation and Management
---
# Symlink Creation and Management

Part 1 of 2: Creation, rebuild, portability, and cross-platform support.

Parent: @ref:specs/symlinks

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