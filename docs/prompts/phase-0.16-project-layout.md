# Bootstrap Phase 0.16: Project Layout

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.16 of the bootstrap process.

**Prerequisites**: Phase 0 (Foundation) complete.

## Your Task
Implement standard project layout and `speclang init` command to scaffold new projects.

## Read These Specs First
1. `specs/project-layout.spec.md` - Full layout specification

## Standard Directory Structure

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

## File Purposes

### project.scl (North Star)
- Top-level intent, user's main file
- Contains: High-level goals, features, decisions
- Everything links back here
- Edited by: human + orchestrator

### specs/
- Feature specifications
- Owned by: SpecWriter agent
- Naming: `{feature}.scl`
- Contains: entities, operations, policies, diagrams

### tests/
- Test specifications
- Owned by: TestWriter agent
- Naming: `{feature}.test.spec.scl`
- Contains: test blocks (given/when/then), mocks, results

### generated/
- Output code
- Owned by: CodeGen agents
- Gitignored (can be regenerated)
- Subdirs: `ts/`, `go/`, `py/`, `rs/`

### .speclang/
- Internal state
- Gitignored
- Contains: daemon.pid, locks/, config.json, cache/

### .speclangrc
- Project configuration
- Watcher, split, embedding, database settings

## Implementation

### 1. Init Command (`cli/init.rs`)
```rust
pub fn init(name: &str) -> Result<()> {
    // 1. create directory {name}/
    // 2. create specs/ directory
    // 3. create tests/ directory
    // 4. create generated/ directory
    // 5. create .speclang/ directory
    // 6. write project.scl with template
    // 7. write .speclangrc with defaults
    // 8. write .gitignore
    // 9. init git repo if not in one
    // 10. create initial spec file for north star
    // 11. run validation
    // 12. output success message
}
```

### 2. Template: project.scl
```yaml
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
      - "**/*.{go,ts,js,py,rs,java}.spec"
      - "**/project.scl"
      - "**/build.{scl,yaml}"
    ignore:
      - Uses: ".gitignore"
      - Plus: [".speclang/", "*.log", "reports/"]
    debounce: 100
    
  split:
    max_tokens: 10000
    max_lines: 800
    max_chars: 60000
    budget_overhead: 500
    strategy: "smart"
    
  embeddings:
    enabled: true
    model: "openai/text-embedding-3-small"
    dimensions: 1536
    batch_size: 100
    
  database:
    mode: "WAL"
    synchronous: "NORMAL"
    cache_size: 10000
    temp_store: "MEMORY"
    
  cascade:
    quiet_period: 30
    max_depth: 50
    max_files: 1000
```

### 3. Template: .gitignore
```gitignore
# Generated code (can be regenerated)
generated/

# Speclang internal state
.speclang/

# Standard ignores
node_modules/
.env
*.log
```

### 4. Template: .speclangrc
```yaml
version: 1
project_root: .
spec_dirs:
  - specs/
  - tests/
generated_dir: generated/
daemon:
  enabled: true
  quiet_period: 30s
```

## Naming Conventions

```speclang
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

## Reference Paths

Paths are relative to project root:
- `@ref:specs/auth` -> `specs/auth.scl`
- `@ref:tests/auth#login` -> `tests/auth.test.spec.scl` block "login"
- `@ref:northstar` -> `project.scl`
- `@ref:generated/ts/auth` -> `generated/ts/auth/`

Always use `@ref`, never hardcode paths.

## CLI Interface

```bash
# Initialize new project
speclang init my-project

# Initialize in current directory
speclang init .

# Validate project structure
speclang validate

# Show project info
speclang info
```

## Test Cases
1. `speclang init my-project` creates all directories
2. All template files are created with correct content
3. Git repo is initialized if not in one
4. Existing files are not overwritten
5. Validation passes on new project
6. Reference paths resolve correctly

## Output
1. `speclang init` command implementation
2. Project templates (project.scl, .gitignore, .speclangrc)
3. Project validation command
4. Directory structure constants
