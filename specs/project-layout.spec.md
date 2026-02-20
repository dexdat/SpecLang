# speclang-header
id: "@speclang/project-layout"
version: 0.1.0
layer: 0
tags: [layout, structure, files]
status: draft

---

# Project Layout

Standard directory structure for a speclang project.

## Structure

```speclang
# @block:layout/structure @kind:code
```
my-project/
├── project.scl           # north star (user edits)
├── specs/                # spec files
│   ├── auth.scl
│   ├── users.scl
│   └── api.scl
├── tests/                # test specs
│   ├── auth.test.spec.scl
│   └── users.test.spec.scl
├── generated/            # output code (gitignored)
│   ├── ts/
│   │   ├── auth/
│   │   └── users/
│   └── go/
│       ├── auth/
│       └── users/
├── .speclang/
│   ├── daemon.pid
│   ├── locks/
│   └── config.json
├── .speclangrc           # project config
└── .gitignore
```
```

## Files

### @layout/northstar

```speclang
# @block:layout/northstar @kind:entity
project.scl:
  purpose: Top-level intent. User's main file.
  owner: User (or Orchestrator agent)
  content: High-level goals, features, decisions
  
  refs_to: everything links back here
  edited_by: human + orchestrator
```

### @layout/specs

```speclang
# @block:layout/specs @kind:entity
specs/:
  purpose: Feature specifications
  owner: SpecWriter agent
  naming: {feature}.scl
  
  contains:
    - entities
    - operations  
    - policies
    - diagrams
```

### @layout/tests

```speclang
# @block:layout/tests @kind:entity
tests/:
  purpose: Test specifications
  owner: TestWriter agent
  naming: {feature}.test.spec.scl
  
  contains:
    - test blocks (given/when/then)
    - mock definitions
    - test results
```

### @layout/generated

```speclang
# @block:layout/generated @kind:entity
generated/:
  purpose: Output code
  owner: CodeGen agents
  gitignore: yes (can be regenerated)
  
  subdirs:
    - ts/ for TypeScript
    - go/ for Go
    - py/ for Python
    - rs/ for Rust
```

### @layout/speclang-dir

```speclang
# @block:layout/speclang-dir @kind:entity
.speclang/:
  purpose: Internal state
  gitignore: yes
  
  contains:
    - daemon.pid: running daemon
    - locks/: file locks
    - config.json: cached config
    - cache/: compilation cache
```

### @layout/config

```speclang
# @block:layout/config @kind:entity
project.scl:
  purpose: North Star + Project Configuration
  owner: User
  
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
      # File watching rules
      watcher:
        patterns:
          - "**/*.spec.{md,yaml,yml,scl}"
          - "**/*.{go,ts,js,py,rs,java}.spec"
          - "**/project.scl"
          - "**/build.{scl,yaml}"
        ignore:
          - Uses: ".gitignore"
          - Plus: [".speclang/", "*.log", "reports/"]
        debounce: 100
        
      # Dynamic split settings
      split:
        max_tokens: 10000
        max_lines: 800
        max_chars: 60000
        budget_overhead: 500  # extra tokens for headers/refs
        strategy: "smart"    # smart | by-section | by-token
        
      # Embedding model settings
      embeddings:
        enabled: true
        model: "openai/text-embedding-3-small"
        dimensions: 1536
        batch_size: 100
        
      # SQLite settings
      database:
        mode: "WAL"
        synchronous: "NORMAL"
        cache_size: 10000
        temp_store: "MEMORY"
        
      # Cascade settings
      cascade:
        quiet_period: 30
        max_depth: 50
        max_files: 1000
        
      # Agent settings
      agents:
        spec-writer:
          max_tokens: 8000
        code-gen:
          max_lines: 500
```

### @layout/gitignore

```speclang
# @block:layout/gitignore @kind:code
```.gitignore
# Generated code (can be regenerated)
generated/

# Speclang internal state
.speclang/

# Standard ignores
node_modules/
.env
*.log
```
```

## Initialization

### @layout/init

```speclang
# @block:layout/init @kind:operation
speclang init <name>:

steps:
  1. create directory {name}/
  2. create specs/ directory
  3. create tests/ directory
  4. create generated/ directory
  5. create .speclang/ directory
  6. write project.scl with template
  7. write .speclangrc with defaults
  8. write .gitignore
  9. init git repo if not in one

refs: [@ref:speclang/cli#new]
```

## Conventions

### @layout/naming

```speclang
# @block:layout/naming @kind:entity
NamingConventions:
  specs: lowercase, hyphens
    - auth.scl
    - user-profile.scl
  
  tests: {feature}.test.spec.scl
    - auth.test.spec.scl
  
  generated: matches target conventions
    - ts: camelCase files
    - go: snake_case files
    - py: snake_case files
```

### @layout/refs

```speclang
# @block:layout/refs @kind:note
Reference paths are relative to project root:

- @ref:specs/auth -> specs/auth.scl
- @ref:tests/auth#login -> tests/auth.test.spec.scl block "login"
- @ref:northstar -> project.scl
- @ref:generated/ts/auth -> generated/ts/auth/

Always use @ref, never hardcode paths.
```
