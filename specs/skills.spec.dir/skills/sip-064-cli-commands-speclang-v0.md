---
name: sip-064-cli-commands-speclang-v0
title: "SIP 64: CLI Commands Detailed"
version: 0.1.0
description: Complete command reference and usage examples for Speclang CLI
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 64: CLI Commands Detailed

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP provides a complete reference for all Speclang CLI commands with usage examples.

### Quick Start

```bash
# Install
npm install -g speclang

# Create project
speclang new my-project

# Generate code
speclang generate

# Validate specs
speclang check
```

### Key Commands

| Command | Description |
|---------|-------------|
| new | Create new project |
| generate | Compile specs to code |
| check | Validate specs |
| sync | Sync code back to specs |
| expand | Expand blocks |
| test | Run acceptance tests |
| search | Search specs |
| graph | Visualize relationships |

### When to Read This

- **CLI Usage:** Command reference
- **Scripts:** Automation examples
- **CI/CD:** Pipeline integration

### Related SIPs

- SIP 37: CLI
- SIP 12: Codegen
- SIP 24: Test Specs

## Abstract

This SIP provides detailed documentation for all Speclang CLI commands, including arguments, options, and usage examples.

## Motivation

Users need:
- Complete command reference
- Usage examples
- Exit code documentation
- Output format details

## Rationale

**CLI Architecture:**

```
speclang <command> [arguments] [options]
         ↓
    Command Handler
         ↓
    Spec Engine
         ↓
    Output
```

**Benefits:**
- Consistent interface
- Scriptable
- CI/CD friendly
- Discoverable

## Specification

### Installation

**@cli/install:**

```bash
npm install -g speclang
# or
cargo install speclang
# or
go install github.com/speclang/cli@latest
```

### Commands

#### @cli/new

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

#### @cli/generate

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
  --dry-run    Show what will be generated

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

#### @cli/check

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

#### @cli/sync

```speclang
# @block:cli/sync @kind:operation
speclang sync [options]

Sync generated code back to specs.

Options:
  --yes        Accept all changes
  --dry-run    Show what will change

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

#### @cli/expand

```speclang
# @block:cli/expand @kind:operation
speclang expand <block> [options]

Expand a high-level block into detail.

Arguments:
  block        Block ID to expand

Options:
  --depth      Number of layers (default: 1)
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

#### @cli/test

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

#### @cli/diff

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

#### @cli/format

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

#### @cli/search

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

#### @cli/graph

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

### Global Options

**@cli/global-options:**

| Flag | Description |
|------|-------------|
| --config | Path to .speclangrc |
| --verbose | Detailed output |
| --quiet | Minimal output |
| --json | JSON output |
| --no-color | Disable colors |

### Configuration

**@cli/config-file:**

```speclang
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

### Interactive Mode

**@cli/interactive:**

```speclang
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

### Exit Codes

**@cli/exit-codes:**

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error |
| 2 | Validation failed |
| 3 | No changes |
| 130 | Interrupted (Ctrl+C) |

### Output Formats

**@cli/output:**

```
Default: human-readable with colors

--json flag:
{
  "success": true,
  "artifacts": [...],
  "errors": [],
  "duration_ms": 234
}
```

## Implementation

### CLI Entry Point

```typescript
#!/usr/bin/env node
import { program } from 'commander';
import { version } from '../package.json';

program
  .name('speclang')
  .version(version)
  .option('--config <path>', 'Path to .speclangrc')
  .option('--verbose', 'Detailed output')
  .option('--quiet', 'Minimal output')
  .option('--json', 'JSON output')
  .option('--no-color', 'Disable colors');

program
  .command('new <name>')
  .description('Create a new speclang project')
  .option('--path <dir>', 'Target directory')
  .option('--template <name>', 'Starter template')
  .option('--bare', 'No example specs')
  .action(async (name, options) => {
    await createProject(name, options);
  });

program
  .command('generate [spec]')
  .description('Compile specs to code')
  .option('--target <lang>', 'Output language')
  .option('--watch', 'Rebuild on changes')
  .option('--parallel', 'Build concurrently')
  .option('--dry-run', 'Show what will be generated')
  .action(async (spec, options) => {
    await generateCode(spec, options);
  });

program.parse();
```

### Command Implementation

```typescript
// commands/generate.ts
import { loadSpecs, validateGraph, compileTargets } from '@speclang/core';

export async function generateCode(spec?: string, options: GenerateOptions = {}) {
  const config = await loadConfig(options.config);
  const specs = await loadSpecs(config.specsDir, spec);
  
  const errors = await validateGraph(specs);
  if (errors.length > 0) {
    console.error('Validation failed:');
    errors.forEach(e => console.error(`  ${e.message}`));
    process.exit(2);
  }
  
  const targets = options.target ? [options.target] : config.targets;
  
  for (const target of targets) {
    const artifacts = await compileTargets(specs, target);
    
    if (options.dryRun) {
      artifacts.forEach(a => console.log(`Would generate: ${a.path}`));
    } else {
      await writeArtifacts(artifacts, config.outputDir);
      console.log(`Generated ${artifacts.length} files for ${target}`);
    }
  }
}
```

### Watch Mode

```typescript
// commands/watch.ts
import chokidar from 'chokidar';

export async function watchMode(options: WatchOptions) {
  const config = await loadConfig(options.config);
  
  const watcher = chokidar.watch(config.specsDir, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
  });
  
  watcher.on('change', async (path) => {
    console.log(`Changed: ${path}`);
    await generateCode(undefined, options);
  });
  
  console.log('Watching for changes...');
}
```

### JSON Output

```typescript
// output/json.ts
interface Output {
  success: boolean;
  artifacts?: Artifact[];
  errors?: Error[];
  duration_ms: number;
}

export function formatJson(result: Result): string {
  const output: Output = {
    success: result.success,
    duration_ms: result.duration,
  };
  
  if (result.artifacts) {
    output.artifacts = result.artifacts;
  }
  
  if (result.errors) {
    output.errors = result.errors;
  }
  
  return JSON.stringify(output, null, 2);
}
```

### Interactive REPL

```typescript
// repl.ts
import repl from 'repl';
import { loadBlock, expandBlock, compileBlock } from '@speclang/core';

export function startRepl() {
  const r = repl.start({
    prompt: '> ',
    eval: async (cmd, context, filename, callback) => {
      const trimmed = cmd.trim();
      
      if (trimmed.startsWith(':')) {
        const [command, ...args] = trimmed.slice(1).split(' ');
        
        switch (command) {
          case 'help':
            callback(null, showHelp());
            break;
          case 'load':
            const block = await loadBlock(args[0]);
            context.current = block;
            callback(null, block);
            break;
          case 'expand':
            const expanded = await expandBlock(context.current);
            callback(null, expanded);
            break;
          case 'compile':
            const compiled = await compileBlock(context.current);
            callback(null, compiled);
            break;
          case 'quit':
            process.exit(0);
          default:
            callback(new Error(`Unknown command: ${command}`));
        }
      } else {
        callback(new Error('Commands start with :'));
      }
    },
  });
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Speclang CI

on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g speclang
      - run: speclang check --strict
      - run: speclang generate --target typescript
      - run: npm run build
      - run: speclang test --coverage
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

speclang check --strict
if [ $? -ne 0 ]; then
  echo "Spec validation failed"
  exit 1
fi
```

## References

- "@ref:specs/cli.spec.dir/commands
- @ref:specs/cli.spec.dir/configuration
- @ref:specs/cli.spec.dir/global-options
- SIP 37: CLI
- SIP 12: Codegen

## Copyright

This document is in the public domain.
