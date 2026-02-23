# Getting Started with SpecLang

**Start here if you're new to SpecLang.**

## Quick Start

1. **Read:** `specs/000-bootstrap.md` - Bootstrap primer (READ FIRST)
2. **Read:** `specs/project.scl` - North Star intent
3. **Check:** `specs/_index.md` - Directory index
4. **Explore:** Follow `@ref:` links in spec headers

## What is SpecLang?

SpecLang is a **reactive multi-agent system** where:
- **Specs are source code** - Humans write and review specs
- **Generated code is machine code** - Trust it, don't hand-edit it
- **Filesystem is the event bus** - File changes trigger agent reactions
- **Context never gets lost** - Universal headers track dependencies

## Core Principle

> "When was the last time you reviewed machine code?"

You review **specs**, not generated code. Generated code is like machine code - you trust the compiler (SpecLang).

## Naming Conventions (IMPORTANT)

### Directory Names

```
specs/
├── foo.spec.md              # Parent spec (intent)
├── foo.spec.dir/            # Sub-specs directory (MUST be *.spec.dir)
│   ├── _index.md
│   ├── bar.spec.md          # Intent spec (what we want)
│   └── bar.go.spec          # Generated code spec (symlinked to bar.go)
└── generated/
    └── go/
        └── bar.go           # Actual generated code (symlink target)
```

**Rules:**
- Sub-spec directories MUST be named `*.spec.dir` (not just `*.dir`)
- Index files are `_index.md` (not `.spec.md`)
- Spec IDs should match: `@speclang/foo.spec.dir/bar`

### File Names and Generation Flow

```
INTENT SPEC              GENERATED SPEC           ACTUAL FILE
(bar.spec.md)    →       (bar.go.spec)     →      (bar.go)
"what we want"           "code mapping"           "real code"
```

**Example for OpenAPI:**
```
openapi.spec.md     →    openapi.yaml.spec   →    openapi.yaml
(requirements)           (generated YAML)        (symlink)
```

**Example for Go:**
```
helloworld.spec.md  →    helloworld.go.spec →    helloworld.go
(intent)                 (code mapping)          (symlink)
```

### Spec ID Format

```yaml
# CORRECT
id: "@speclang/api.spec"           # Parent spec
id: "@speclang/api.spec.dir/openapi"  # Child spec in directory

# INCORRECT  
id: "@speclang/api"                # Missing .spec
id: "@speclang/api.spec.dir/openapi"    # Directory missing .spec
```

## Directory Structure

```
SpecLang/
├── specs/                    ← ALL SPECIFICATIONS (source of truth)
│   ├── 000-bootstrap.md     ← READ FIRST - Bootstrap primer
│   ├── _index.md            ← Directory index
│   ├── project.scl          ← North Star intent
│   ├── core.spec.md         ← Core architecture
│   ├── foo.spec.md          # Parent spec
│   └── foo.spec.dir/        # Sub-specs (MUST be *.spec.dir)
│       ├── _index.md
│       └── bar.spec.md
│
├── src/                     ← Generated TypeScript implementation
├── docs/                    ← Documentation and prompts
├── .opencode/              ← OpenCode configuration
└── scripts/                ← Tooling scripts
```

## For AI Agents

If you're an AI agent working with SpecLang:

1. **Always read** `specs/000-bootstrap.md` first
2. **Check** `specs/_index.md` for file listings
3. **Follow** `@ref:` links in headers for dependencies
4. **Use** SQLite database queries when available
5. **Remember**: One file, one commit, perfect history

### Agent Rules for Creating Specs

When creating new specs, follow these rules:

1. **Parent spec**: `specs/foo.spec.md` with id `@speclang/foo.spec`
2. **Sub-specs directory**: `specs/foo.spec.dir/` (not `foo.spec.dir/`)
3. **Child specs**: `specs/foo.spec.dir/bar.spec.md` with id `@speclang/foo.spec.dir/bar`
4. **Index file**: `specs/foo.spec.dir/_index.md` with id `@speclang/foo.spec.dir/index`

## For Developers

If you're developing SpecLang itself:

1. **Specs define the system** - Edit specs, not generated code
2. **Meta-circular** - Specs describe the system that reads specs
3. **Self-building** - SpecLang builds SpecLang from specs
4. **Incremental** - Only regenerate changed dependencies

## Key Files

### Must Read (Minimum Context)
- `specs/000-bootstrap.md` - Bootstrap primer
- `specs/project.scl` - North Star vision
- `specs/core.spec.md` - Core architecture
- `specs/spec-format.spec.md` - Spec format
- `specs/headers.spec.md` - Universal headers

### Implementation
- `src/` - TypeScript implementation (generated from specs)
- `docs/prompts/` - Phase-by-phase development prompts
- `scripts/` - Python tooling scripts

## How to Navigate

### As a New User/Agent:
```
specs/000-bootstrap.md → specs/project.scl → specs/core.spec.md
```

### To Understand a Specific Component:
1. Find the main spec (e.g., `daemon.spec.md`)
2. Read its `children:` field for sub-specs
3. Check the `*.spec.dir/` folder for detailed specs
4. Read `_index.md` in each directory

### To Find Files:
1. Check `specs/_index.md` for root directory
2. Check `_index.md` in each subdirectory
3. Use `grep` for specific terms
4. When available, query SQLite database

## Development Workflow

1. **Edit specs** in `specs/` directory
2. **Run indexer**: `python3 scripts/generate_index.py`
3. **Validate references**: `python3 scripts/generate_index.py --validate`
4. **Generate code**: (When compiler is ready)
5. **Test**: Run generated tests

## Remember

- **Specs are the source of truth** - Generated code is disposable
- **Context never lost** - Headers track dependencies
- **One file, one commit** - Perfect git history
- **Agents own files** - No stepping on each other's work
- **Directory names must be `*.spec.dir`** - Not just `*.dir`
- **Spec IDs must include `.spec`** - Match the file name

**Start with `specs/000-bootstrap.md` and follow the dependency graph.**