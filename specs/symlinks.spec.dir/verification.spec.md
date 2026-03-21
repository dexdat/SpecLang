# speclang-header lines:12
id: "@speclang/symlinks/verification"
version: 0.1.0
layer: 2
tags: [symlinks, verification, git, tools, layout]
imports: ["@speclang/symlinks"]
status: draft
project_level: Alpha
agent_support: agent_autonomous
short: Symlink Verification and Tooling
---
# Symlink Verification and Tooling

Part 2 of 2: Verification, git handling, tools, and layout examples.

Parent: @ref:specs/symlinks

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