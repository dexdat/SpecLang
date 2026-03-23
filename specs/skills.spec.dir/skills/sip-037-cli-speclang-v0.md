---
name: sip-037-cli-speclang-v0
title: "SIP 37: CLI System"
version: 0.1.0
description: Command line interface for SpecLang
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 37: CLI System

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the CLI System—command line interface for SpecLang.

### Quick Start

Common commands:
- `speclang init` - Initialize project
- `speclang validate` - Check all specs
- `speclang status` - Show current state
- `speclang build` - Generate code from specs

### When to Read This

- **Using CLI**: Command reference
- **Scripting**: Automation
- **Integration**: CI/CD pipelines

### Related SIPs

- SIP 8: Configuration
- SIP 9: Index Format
- SIP 33: Workflow

## Abstract

This SIP defines the CLI System—the command line interface for SpecLang. It provides commands for project initialization, validation, status, code generation, and more. The CLI is the primary interface for scripted and automated workflows.

## Motivation

Users need a command line interface for:
- Initializing SpecLang projects
- Validating spec files
- Checking system status
- Generating code
- Automation and CI/CD

This SIP defines the CLI architecture and commands.

## Rationale

**CLI-first design:**

1. **Scriptable**: Easy to automate
2. **Composable**: Chain with other tools
3. **CI-friendly**: Works in pipelines
4. **Discoverable**: Help and docs

## Specification

### Command Structure

```yaml
CommandStructure:
  pattern: "speclang <command> [options] [arguments]"
  
  global_options:
    --help: "Show help"
    --version: "Show version"
    --verbose: "Verbose output"
    --quiet: "Suppress output"
    --config: "Path to config file"
    --format: "Output format (text, json, yaml)"
```

### Commands

```yaml
Commands:
  project_management:
    init:
      description: "Initialize SpecLang in current directory"
      usage: "speclang init [options]"
      options:
        --mode: "light or enterprise"
        --template: "Project template"
      creates:
        - ".speclang/"
        - "specs/"
        - ".speclang/config.yaml"
        
    rebuild:
      description: "Rebuild project from specs/"
      usage: "speclang rebuild [options]"
      options:
        --clean: "Clean before rebuild"
        --force: "Force rebuild"
        
    status:
      description: "Show current system state"
      usage: "speclang status [options]"
      shows:
        - "Cascade status"
        - "Pending changes"
        - "Active sessions"
        
  file_operations:
    create:
      description: "Create new spec file"
      usage: "speclang create <path> [options]"
      options:
        --from-template: "Use template"
        --kind: "Block kind"
        
    validate:
      description: "Validate all specs"
      usage: "speclang validate [options]"
      options:
        --fix: "Auto-fix issues"
      checks:
        - "Header format"
        - "References"
        - "Completeness"
        
    index:
      description: "Regenerate index"
      usage: "speclang index [options]"
      creates:
        - "_index.json"
        - "SQLite entries"
        
  code_generation:
    build:
      description: "Generate code from specs"
      usage: "speclang build [options]"
      options:
        --target: "Target directory"
        --language: "Output language"
        --dry-run: "Preview without writing"
        
    watch:
      description: "Watch for changes and rebuild"
      usage: "speclang watch [options]"
      behavior: "Continuous rebuild on file changes"
      
  history:
    history:
      description: "Show file history"
      usage: "speclang history <file> [options]"
      options:
        --limit: "Number of entries"
        --format: "Output format"
        
    blame:
      description: "Show line authorship"
      usage: "speclang blame <file>"
      
    rollback:
      description: "Rollback changes"
      usage: "speclang rollback <file> <commit> [options]"
      options:
        --cascade: "Rollback cascade"
        --force: "Force rollback"
        
  utility:
    graph:
      description: "Show dependency graph"
      usage: "speclang graph [spec] [options]"
      options:
        --format: "Output format (text, mermaid, dot)"
        
    lint:
      description: "Lint spec files"
      usage: "speclang lint [options]"
      options:
        --fix: "Auto-fix issues"
        
    completion:
      description: "Generate shell completion"
      usage: "speclang completion <shell>"
      shells: [bash, zsh, fish]
```

### Output Formats

```yaml
OutputFormats:
  text:
    description: "Human-readable text"
    default: true
    
  json:
    description: "JSON output for scripting"
    example: |
      {
        "status": "ok",
        "files": 42,
        "errors": []
      }
      
  yaml:
    description: "YAML output"
    example: |
      status: ok
      files: 42
      errors: []
```

### Exit Codes

```yaml
ExitCodes:
  0: "Success"
  1: "General error"
  2: "Invalid arguments"
  3: "Config error"
  4: "Validation error"
  5: "Build error"
  6: "Network error"
```

### Configuration

```yaml
CLIConfiguration:
  config_file: ".speclang/config.yaml"
  
  settings:
    default_format: "text"
    default_mode: "light"
    verbose: false
    
  environment_variables:
    SPECLANG_CONFIG: "Path to config"
    SPECLANG_FORMAT: "Default output format"
    SPECLANG_MODE: "Deployment mode"
```

### Interactive Mode

```yaml
InteractiveMode:
  trigger: "speclang interactive"
  
  features:
    - "REPL-style commands"
    - "Tab completion"
    - "History"
    - "Multi-line input"
    
  commands:
    .help: "Show help"
    .exit: "Exit interactive mode"
    .status: "Show status"
    .build: "Run build"
```

## Examples

### Example 1: Project Initialization

```bash
$ speclang init --mode=enterprise
Initializing SpecLang project...

Created:
  .speclang/
  .speclang/config.yaml
  specs/
  specs/project.spec.md

Configuration:
  Mode: enterprise
  Daemon port: 8765

Next steps:
  1. Edit specs/project.spec.md to define your north star
  2. Run 'speclang build' to generate initial code
```

### Example 2: Validation

```bash
$ speclang validate
Validating specs/...

✓ specs/auth.spec.md
✓ specs/auth.spec.dir/login.spec.yaml
✓ specs/auth.spec.dir/register.spec.yaml
✗ specs/api.spec.md
  Error: Undefined reference @ref:specs/auth#nonexistent

Summary:
  Files: 42
  Valid: 41
  Errors: 1

Run 'speclang validate --fix' to auto-fix where possible.
```

### Example 3: Status

```bash
$ speclang status --format=json
{
  "cascade": {
    "state": "running",
    "depth": 3,
    "iteration": 7
  },
  "files": {
    "total": 42,
    "pending": 3
  },
  "agents": {
    "active": 2,
    "idle": 3
  },
  "last_convergence": "2024-01-15T14:32:00Z"
}
```

### Example 4: Build

```bash
$ speclang build --target=./src --language=typescript
Building from specs/...

Phase 1: Parsing specs
  ✓ Parsed 42 spec files

Phase 2: Resolving references
  ✓ Resolved 128 references

Phase 3: Generating code
  ✓ Generated src/auth/login.ts
  ✓ Generated src/auth/register.ts
  ✓ Generated src/api/handlers.ts
  ...

Summary:
  Input files: 42
  Output files: 38
  Lines generated: 2,847

Run 'speclang watch' to rebuild on changes.
```

## Implementation

```python
import argparse
import sys
from typing import Optional, List

class SpecLangCLI:
    def __init__(self):
        self.parser = self._create_parser()
        
    def _create_parser(self) -> argparse.ArgumentParser:
        parser = argparse.ArgumentParser(
            prog='speclang',
            description='SpecLang CLI'
        )
        parser.add_argument('--version', action='store_true')
        parser.add_argument('--verbose', '-v', action='store_true')
        parser.add_argument('--format', choices=['text', 'json', 'yaml'])
        parser.add_argument('--config', type=str)
        
        subparsers = parser.add_subparsers(dest='command')
        
        init_parser = subparsers.add_parser('init')
        init_parser.add_argument('--mode', choices=['light', 'enterprise'])
        init_parser.add_argument('--template', type=str)
        
        validate_parser = subparsers.add_parser('validate')
        validate_parser.add_argument('--fix', action='store_true')
        
        build_parser = subparsers.add_parser('build')
        build_parser.add_argument('--target', type=str)
        build_parser.add_argument('--language', type=str)
        build_parser.add_argument('--dry-run', action='store_true')
        
        return parser
        
    def run(self, args: Optional[List[str]] = None) -> int:
        parsed = self.parser.parse_args(args)
        
        if parsed.version:
            print('speclang 0.1.0')
            return 0
            
        if parsed.command == 'init':
            return self._cmd_init(parsed)
        elif parsed.command == 'validate':
            return self._cmd_validate(parsed)
        elif parsed.command == 'build':
            return self._cmd_build(parsed)
            
        self.parser.print_help()
        return 0
        
    def _cmd_init(self, args) -> int:
        print('Initializing SpecLang project...')
        return 0
        
    def _cmd_validate(self, args) -> int:
        print('Validating specs/...')
        return 0
        
    def _cmd_build(self, args) -> int:
        print('Building from specs/...')
        return 0

def main():
    cli = SpecLangCLI()
    sys.exit(cli.run())

if __name__ == '__main__':
    main()
```

## References

- "@ref:speclang/cli
- @ref:speclang/cli.spec.dir/commands
- @ref:speclang/cli.spec.dir/configuration
- SIP 8: Configuration
- SIP 9: Index Format
- SIP 33: Workflow

## Copyright

This document is in the public domain.
