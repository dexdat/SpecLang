---
name: sip-042-project-layout-speclang-v0
title: "SIP 42: Project Layout"
version: 0.1.0
description: Standard directory structure for SpecLang projects
category: standard
---

# SIP 42: Project Layout

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines Project Layout—the standard directory structure for SpecLang projects.

### Quick Start

Standard structure:
```
my-project/
├── project.scl           # north star
├── specs/                # spec files
├── tests/                # test specs
├── generated/            # output code
└── .speclang/            # internal state
```

### When to Read This

- **Initializing**: Creating new projects
- **Organizing**: Understanding file locations
- **Configuration**: Project settings

### Related SIPs

- SIP 8: Configuration
- SIP 37: CLI
- SIP 40: Dynamic Splitting

## Abstract

This SIP defines Project Layout—a standard directory structure for SpecLang projects. Consistent layout enables tools to find files, agents to understand ownership, and users to navigate projects.

## Motivation

Projects need:
- Consistent structure
- Clear ownership boundaries
- Separation of concerns
- Tool-friendly layout

Standard layout provides all of these.

## Rationale

**Layout principles:**

1. **North star**: `project.scl` at root
2. **Specs**: `specs/` for all specifications
3. **Tests**: `tests/` for test specs
4. **Generated**: `generated/` for output (gitignored)
5. **Internal**: `.speclang/` for daemon state

## Specification

### Structure Overview

```yaml
ProjectStructure:
  my-project/:
    project.scl:        # north star (user edits)
    specs/:             # spec files
      auth.scl
      users.scl
      api.scl
    tests/:             # test specs
      auth.test.spec.scl
      users.test.spec.scl
    generated/:         # output code (gitignored)
      ts/:
        auth/
        users/
      go/:
        auth/
        users/
    .speclang/:
      daemon.pid
      locks/
      config.json
    .speclangrc:        # project config
    .gitignore
```

### North Star File

```yaml
NorthStarFile:
  file: project.scl
  purpose: Top-level intent, user's main file
  owner: User (or Orchestrator agent)
  content: High-level goals, features, decisions
  
  characteristics:
    - refs_to: everything links back here
    - edited_by: human + orchestrator
    - contains:
        - metadata
        - targets
        - config
```

### Specs Directory

```yaml
SpecsDirectory:
  path: specs/
  purpose: Feature specifications
  owner: SpecWriter agent
  
  naming:
    pattern: "{feature}.scl"
    examples:
      - auth.scl
      - user-profile.scl
      - api.scl
  
  contains:
    - entities
    - operations
    - policies
    - diagrams
```

### Tests Directory

```yaml
TestsDirectory:
  path: tests/
  purpose: Test specifications
  owner: TestWriter agent
  
  naming:
    pattern: "{feature}.test.spec.scl"
    examples:
      - auth.test.spec.scl
      - users.test.spec.scl
  
  contains:
    - test blocks (given/when/then)
    - mock definitions
    - test results
```

### Generated Directory

```yaml
GeneratedDirectory:
  path: generated/
  purpose: Output code
  owner: CodeGen agents
  gitignore: yes (can be regenerated)
  
  subdirs:
    ts/: TypeScript output
    go/: Go output
    py/: Python output
    rs/: Rust output
    
  note: "Always gitignored—regenerate from specs"
```

### Speclang Directory

```yaml
SpeclangDirectory:
  path: .speclang/
  purpose: Internal state
  gitignore: yes
  
  contains:
    daemon.pid: running daemon PID
    locks/: file locks
    config.json: cached config
    cache/: compilation cache
    worktrees/: isolated testing
```

### Configuration File

```yaml
ConfigFile:
  file: .speclangrc
  purpose: Project configuration
  
  sections:
    metadata:
      name: "my-app"
      version: "1.0.0"
      description: "Project description"
      
    targets:
      - go
      - typescript
      - python
      
    config:
      watcher:
        patterns:
          - "**/*.spec.{md,yaml,yml,scl}"
          - "**/project.scl"
        ignore:
          - Uses: ".gitignore"
          - Plus: [".speclang/", "*.log"]
        debounce: 100
        
      split:
        max_tokens: 10000
        max_lines: 800
        max_chars: 60000
        budget_overhead: 500
        strategy: smart
        
      embeddings:
        enabled: true
        model: "openai/text-embedding-3-small"
        dimensions: 1536
        
      database:
        mode: "WAL"
        synchronous: "NORMAL"
        
      cascade:
        quiet_period: 30
        max_depth: 50
        max_files: 1000
```

### Gitignore

```yaml
GitignoreFile:
  file: .gitignore
  content: |
    # Generated code (can be regenerated)
    generated/
    
    # Speclang internal state
    .speclang/
    
    # Standard ignores
    node_modules/
    .env
    *.log
```

### Naming Conventions

```yaml
NamingConventions:
  specs:
    pattern: lowercase, hyphens
    examples:
      - auth.scl
      - user-profile.scl
      
  tests:
    pattern: "{feature}.test.spec.scl"
    examples:
      - auth.test.spec.scl
      
  generated:
    ts: camelCase files
    go: snake_case files
    py: snake_case files
```

### Reference Paths

```yaml
ReferencePaths:
  description: "Reference paths are relative to project root"
  
  examples:
    - "@ref:specs/auth -> specs/auth.scl"
    - "@ref:tests/auth#login -> tests/auth.test.spec.scl block 'login'"
    - "@ref:northstar -> project.scl"
    - "@ref:generated/ts/auth -> generated/ts/auth/"
    
  rule: "Always use @ref, never hardcode paths"
```

### Initialization

```yaml
InitCommand:
  command: "speclang init <name>"
  
  steps:
    1: "create directory {name}/"
    2: "create specs/ directory"
    3: "create tests/ directory"
    4: "create generated/ directory"
    5: "create .speclang/ directory"
    6: "write project.scl with template"
    7: "write .speclangrc with defaults"
    8: "write .gitignore"
    9: "init git repo if not in one"
    10: "create initial spec file for north star"
    11: "run validation"
    12: "output success message"
```

## Examples

### Example 1: Full Project Structure

```yaml
my-app/:
  project.scl: |
    metadata:
      name: my-app
      version: 1.0.0
      
    targets:
      - typescript
      - go
      
    features:
      - authentication
      - user-management
      
  specs/:
    auth.scl: |
      id: @specs/auth
      entities: [User, Session, Token]
      
    users.scl: |
      id: @specs/users
      entities: [Profile, Preferences]
      
  tests/:
    auth.test.spec.scl: |
      id: @tests/auth
      tests: [login, logout, refresh]
      
  generated/:
    ts/:
      auth/: [user.ts, session.ts, token.ts]
    go/:
      auth/: [user.go, session.go, token.go]
      
  .speclang/:
    daemon.pid: "12345"
    config.json: "{...}"
    
  .speclangrc: |
    mode: light
    targets: [typescript, go]
    
  .gitignore: |
    generated/
    .speclang/
```

### Example 2: Init Command

```bash
$ speclang init my-project
Initializing SpecLang project...

Created:
  my-project/
  my-project/project.scl
  my-project/specs/
  my-project/tests/
  my-project/generated/
  my-project/.speclang/
  my-project/.speclangrc
  my-project/.gitignore

Git initialized.

Next steps:
  1. Edit project.scl to define your project
  2. Add specs to specs/
  3. Run 'opencode serve --build-mode'
```

## Implementation

```python
from dataclasses import dataclass
from typing import Optional
import os
import subprocess

@dataclass
class ProjectConfig:
    name: str
    version: str = "1.0.0"
    targets: list[str] = None
    mode: str = "light"

class ProjectInitializer:
    DIRECTORIES = [
        "specs",
        "tests",
        "generated",
        ".speclang",
        ".speclang/locks",
        ".speclang/cache",
    ]
    
    def __init__(self, name: str, config: Optional[ProjectConfig] = None):
        self.name = name
        self.config = config or ProjectConfig(name=name)
        
    def init(self) -> None:
        os.makedirs(self.name, exist_ok=True)
        
        for dir_path in self.DIRECTORIES:
            os.makedirs(os.path.join(self.name, dir_path), exist_ok=True)
            
        self._write_project_scl()
        self._write_speclangrc()
        self._write_gitignore()
        self._init_git()
        
    def _write_project_scl(self) -> None:
        content = f"""metadata:
  name: {self.config.name}
  version: {self.config.version}
  
targets:
  - typescript
  
features: []
"""
        with open(os.path.join(self.name, "project.scl"), "w") as f:
            f.write(content)
            
    def _write_speclangrc(self) -> None:
        content = f"""mode: {self.config.mode}
"""
        with open(os.path.join(self.name, ".speclangrc"), "w") as f:
            f.write(content)
            
    def _write_gitignore(self) -> None:
        content = """# Generated code
generated/

# Speclang internal
.speclang/

# Standard
node_modules/
.env
*.log
"""
        with open(os.path.join(self.name, ".gitignore"), "w") as f:
            f.write(content)
            
    def _init_git(self) -> None:
        if not os.path.exists(os.path.join(self.name, ".git")):
            subprocess.run(["git", "init"], cwd=self.name, capture_output=True)
```

## References

- @ref:speclang/project-layout
- @ref:speclang/project-layout#layout/northstar
- @ref:speclang/project-layout#layout/specs
- SIP 8: Configuration
- SIP 37: CLI

## Copyright

This document is in the public domain.
