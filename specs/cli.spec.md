# speclang-header
id: "@speclang/cli"
version: 0.1.0
layer: 0
tags: [cli, commands, interface]
imports: ["@speclang/core", "@speclang/stdlib"]

---

# Speclang CLI

Command line interface for speclang.

## Installation

```speclang
# @block:cli/install @kind:note
npm install -g speclang
# or
cargo install speclang
# or
go install github.com/speclang/cli@latest
```

## Commands

### @cli/new

```speclang
# @block:cli/new @kind:operation
speclang new <name> [options]

Creates a new speclang project.

Arguments:
  name         Project name (required)

Options:
  --path       Target directory (default: ./<name>)
  --template   Starter template (default: minimal)
  --bare       No example specs

Steps:
  - validate name is valid identifier
  - create directory structure
  - write .speclangrc
  - write initial spec
  - init git if not in repo

Example:
  speclang new my-app
  speclang new api --template=http
```

### @cli/generate

```speclang
# @block:cli/generate @kind:operation
speclang generate [spec] [options]

Compile specs to code.

Arguments:
  spec         Specific spec to compile (optional)

Options:
  --target     Output language: ts, go, rust, py
  --watch      Rebuild on changes
  --parallel   Build concurrently (default: true)
  --dry-run    Show what would generate

Steps:
  - load all specs
  - resolve imports and refs
  - validate graph integrity
  - compile to target(s)
  - write generated files
  - update lockfile

Example:
  speclang generate
  speclang generate @auth/login --target=go
  speclang generate --watch
```

### @cli/check

```speclang
# @block:cli/check @kind:operation
speclang check [options]

Validate specs without generating.

Options:
  --strict     Fail on warnings (default: true)
  --fix        Auto-fix simple issues

Steps:
  - parse all specs
  - validate headers
  - validate refs exist
  - validate block syntax
  - report errors/warnings

Example:
  speclang check
  speclang check --fix
```

### @cli/sync

```speclang
# @block:cli/sync @kind:operation
speclang sync [options]

Sync generated code back to specs.

Options:
  --yes        Accept all changes
  --dry-run    Show what would change

Steps:
  - scan generated files for changes
  - detect @speclang-id markers
  - compare with source specs
  - propose spec updates
  - ask user to accept/reject

Example:
  speclang sync
  speclang sync --dry-run
```

### @cli/expand

```speclang
# @block:cli/expand @kind:operation
speclang expand <block> [options]

Expand a high-level block into detail.

Arguments:
  block        Block ID to expand

Options:
  --depth      How many layers (default: 1)
  --ai         Use AI to generate (default: true)

Steps:
  - load block
  - analyze context and refs
  - generate child blocks
  - link refs appropriately
  - write expanded spec

Example:
  speclang expand @auth/login
  speclang expand @user/entity --depth=2
```

### @cli/test

```speclang
# @block:cli/test @kind:operation
speclang test [filter] [options]

Run acceptance tests from specs.

Arguments:
  filter       Test name pattern

Options:
  --coverage   Report coverage
  --watch      Re-run on changes

Steps:
  - extract @kind:acceptance blocks
  - generate test runners
  - execute tests
  - report results

Example:
  speclang test
  speclang test auth
  speclang test --coverage
```

### @cli/diff

```speclang
# @block:cli/diff @kind:operation
speclang diff [options]

Show pending changes.

Options:
  --staged     Compare staged specs
  --target     Compare specific target

Steps:
  - load current generated
  - compile in memory
  - compare with disk
  - format diff output

Example:
  speclang diff
```

### @cli/format

```speclang
# @block:cli/format @kind:operation
speclang format [files] [options]

Format spec files.

Arguments:
  files        Files to format (default: all)

Options:
  --check      Only check, don't write
  --write      Write formatted output

Example:
  speclang format
  speclang format specs/auth.spec --check
```

### @cli/search

```speclang
# @block:cli/search @kind:operation
speclang search <query>

Search across all specs.

Arguments:
  query        Search term or @id pattern

Options:
  --kind       Filter by block kind
  --tag        Filter by tag

Example:
  speclang search login
  speclang search @auth
  speclang search --kind=entity
```

### @cli/graph

```speclang
# @block:cli/graph @kind:operation
speclang graph [options]

Visualize spec relationships.

Options:
  --format     mermaid, dot, json
  --output     Write to file

Example:
  speclang graph --format=mermaid
```

---

## Global Options

```speclang
# @block:cli/global-options @kind:table
| Flag | Description |
|------|-------------|
| --config | Path to .speclangrc |
| --verbose | Detailed output |
| --quiet | Minimal output |
| --json | JSON output |
| --no-color | Disable colors |
```

---

## Configuration

### @cli/config-file

```speclang
# @block:cli/config-file @kind:entity
.speclangrc:
  name: String
  version: SemVer
  specs_dir: String @default("specs")
  output_dir: String @default("generated")
  targets: String[] @default(["typescript"])
  plugins: PluginConfig[]
  ai: AIConfig?

PluginConfig:
  name: String
  options: Map?

AIConfig:
  provider: String @default("openai")
  model: String @default("gpt-4")
  enabled: Boolean @default(true)
```

---

## Exit Codes

```speclang
# @block:cli/exit-codes @kind:table
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error |
| 2 | Validation failed |
| 3 | No changes |
| 130 | Interrupted (Ctrl+C) |
```

---

## Output Formats

```speclang
# @block:cli/output @kind:note
Default: human-readable with colors

--json flag:
{
  "success": true,
  "artifacts": [...],
  "errors": [],
  "duration_ms": 234
}
```

---

## Interactive Mode

```speclang
# @block:cli/interactive @kind:operation
speclang

Starts interactive REPL.

Commands:
  :help        Show help
  :load <id>   Load spec block
  :edit <id>   Open in editor  
  :expand <id> Expand block
  :compile     Compile current
  :quit        Exit

Example:
  $ speclang
  > :load @auth/login
  > :expand
  > :compile
  > :quit
```

---

## Integration

### @cli/git-hooks

```speclang
# @block:cli/git-hooks @kind:note
speclang install-hooks

Installs:
  pre-commit: run speclang check
  pre-push: run speclang test
```

### @cli/editor

```speclang
# @block:cli/editor @kind:note
VS Code extension available:
  - syntax highlighting
  - @id autocomplete
  - ref navigation
  - inline AI expansion
```
