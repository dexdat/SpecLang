---
name: sip-128-pipeline-format-speclang-v0
title: "SIP 128: Pipeline Format Stages"
version: 0.1.0
description: Format stage configuration, auto-formatting, and code style enforcement in pipelines
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 128: Pipeline Format Stages

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines Format Stages—the code formatting and style enforcement phases in SpecLang pipelines.

### Quick Start

```yaml
pipeline:
  format:
    - name: gofmt
      command: "gofmt -w ."
      language: go
      check: true
      
    - name: prettier
      command: "prettier --write ."
      language: typescript
      check: false
```

### When to Read This

- **Configuring formatters:** Setting up format stages
- **Code style:** Auto-formatting code
- **Enforcement:** Ensuring consistent style

### Related SIPs

- SIP 13: Pipeline System
- SIP 74: Pipeline Conditions
- SIP 127: Pipeline Lint

## Abstract

This SIP specifies format stage configuration, supported formatters, style options, and enforcement behavior for the SpecLang pipeline system.

## Motivation

Format stages are needed because:
- Code must follow consistent style
- Manual formatting is error-prone
- Prettier saves time on reviews
- CI should catch style violations

## Specification

### Format Stage Configuration

```yaml
FormatStage:
  name: string              # Stage identifier
  command: string          # Format command to execute
  language: string          # Programming language
  tool: string             # Formatter name
  config: string           # Config file path
  check: boolean           # Check mode (fail if formatting needed)
  write: boolean           # Write changes (default: check=false)
  diff: boolean           # Show diff output
  timeout: number         # Timeout in seconds (default: 120)
  retry: RetryConfig      # Retry configuration (optional)
  artifacts: Artifact[]   # Format outputs (optional)
  depends_on: string[]    # Stage dependencies (optional)
  condition: string       # Conditional execution (optional)
```

### Supported Languages and Formatters

```yaml
LanguageFormatters:
  go:
    tools:
      - name: gofmt
        check_flag: "-l"
        write_flag: "-w"
      - name: goimports
      - name: gofumpt
        
  typescript:
    tools:
      - name: prettier
        config: prettier.config.js
      - name: biome
      - name: dprint
        
  javascript:
    tools:
      - name: prettier
      - name: biome
      - name: standard
        
  python:
    tools:
      - name: black
        config: pyproject.toml
      - name: ruff format
      - name: isort
        
  rust:
    tools:
      - name: rustfmt
        config: rustfmt.toml
      - name: cargo fmt
        
  java:
    tools:
      - name: google-java-format
      - name: spotless
        
  c/cpp:
    tools:
      - name: clang-format
        config: .clang-format
```

### Format Modes

```yaml
FormatModes:
  check:
    description: "Check if formatting is needed"
    exit_code: 1 if changes needed
    output: list of unformatted files
    
  write:
    description: "Apply formatting changes"
    exit_code: 0
    modifies: source files
    
  diff:
    description: "Show diff of changes"
    exit_code: 1 if changes needed
    output: unified diff
```

### Format Configuration

```yaml
FormatConfig:
  # Prettier example
  prettier:
    print_width: 100
    tab_width: 2
    use_tabs: false
    semi: true
    single_quote: true
    trailing_comma: es5
    bracket_spacing: true
    arrow_parens: always
    
  # Black example
  black:
    line_length: 88
    target_version: py39
    skip_string_normalization: false
    extend_exclude: "migrations/*"
    
  # Go fmt example
  gofmt:
    tab: true
    spaces: true
    indent: 4
```

### Format Stage Examples

### Example 1: Go Formatting

```yaml
pipeline:
  format:
    - name: gofmt-check
      command: "gofmt -l ."
      language: go
      tool: gofmt
      check: true
      diff: true
      
    - name: goimports
      command: "goimports -l -w ."
      language: go
      tool: goimports
      write: true
```

### Example 2: TypeScript/JavaScript Formatting

```yaml
pipeline:
  format:
    - name: prettier-check
      command: "prettier --check ."
      language: typescript
      tool: prettier
      config: prettier.config.js
      check: true
      
    - name: prettier-write
      command: "prettier --write ."
      language: typescript
      tool: prettier
      write: true
```

### Example 3: Python Formatting

```yaml
pipeline:
  format:
    - name: black-format
      command: "black --check ."
      language: python
      tool: black
      config: pyproject.toml
      check: true
      
    - name: isort
      command: "isort --check-only --diff ."
      language: python
      tool: isort
      
    - name: apply-formatting
      command: "black . && isort ."
      language: python
      tool: black
      write: true
```

### Example 4: Multi-Language Format Matrix

```yaml
pipeline:
  format:
    - name: format-go
      command: "gofmt -l -w ."
      language: go
      tool: gofmt
      
    - name: format-typescript
      command: "prettier --write ."
      language: typescript
      tool: prettier
      
    - name: format-python
      command: "black ."
      language: python
      tool: black
      
    - name: format-rust
      command: "cargo fmt"
      language: rust
      tool: rustfmt
```

### Example 5: CI Format Enforcement

```yaml
pipeline:
  format:
    - name: check-format
      command: "prettier --check ."
      language: typescript
      tool: prettier
      check: true
      fail_on_diff: true
      
    - name: check-lint
      command: "eslint . --format=json"
      language: typescript
      tool: eslint
      
    - name: check-types
      command: "tsc --noEmit"
      language: typescript
      tool: tsc
      
    - name: apply-format
      command: "prettier --write ."
      language: typescript
      tool: prettier
      write: true
      only_on: "branch != 'main'"
```

### Format Execution Model

```typescript
interface FormatStage {
  name: string;
  command: string;
  language: string;
  tool: string;
  config?: string;
  check: boolean;
  write: boolean;
  diff: boolean;
  timeout: number;
  retry: RetryConfig;
  artifacts: Artifact[];
  depends_on: string[];
  condition?: string;
}

interface FormatResult {
  stage_name: string;
  tool: string;
  formatted: boolean;
  files_changed: string[];
  diff?: string;
  duration_ms: number;
}

class FormatExecutor {
  async executeStage(stage: FormatStage): Promise<FormatResult> {
    if (stage.check) {
      return this.checkFormat(stage);
    } else {
      return this.applyFormat(stage);
    }
  }
  
  async checkFormat(stage: FormatStage): Promise<FormatResult> {
    const output = await this.runFormatter(stage, { check: true });
    const needsFormatting = output.trim().length > 0;
    
    if (needsFormatting && stage.check) {
      throw new FormatError(
        `Files need formatting: ${output.split('\n').join(', ')}`
      );
    }
    
    return {
      stage_name: stage.name,
      tool: stage.tool,
      formatted: !needsFormatting,
      files_changed: output.trim().split('\n').filter(Boolean),
      duration_ms: 0
    };
  }
  
  async applyFormat(stage: FormatStage): Promise<FormatResult> {
    const output = await this.runFormatter(stage, { write: true });
    
    return {
      stage_name: stage.name,
      tool: stage.tool,
      formatted: true,
      files_changed: this.parseFileList(output),
      diff: stage.diff ? await this.getDiff(stage) : undefined,
      duration_ms: 0
    };
  }
  
  async runFormatter(
    stage: FormatStage,
    options: { check?: boolean; write?: boolean }
  ): Promise<string> {
    const args = this.buildArgs(stage, options);
    return this.exec(`${stage.command} ${args}`, {
      timeout: stage.timeout * 1000
    });
  }
  
  buildArgs(stage: FormatStage, options: { check?: boolean; write?: boolean }): string {
    const flags = [];
    
    if (stage.check || options.check) {
      flags.push(stage.tool === 'gofmt' ? '-l' : '--check');
    }
    
    if (stage.write || options.write) {
      flags.push(stage.tool === 'gofmt' ? '-w' : '--write');
    }
    
    if (stage.diff) {
      flags.push('--diff');
    }
    
    return flags.join(' ');
  }
}
```

### Format Configuration Files

```yaml
# .speclang/format.yaml
format:
  # Global settings
  check_on_ci: true
  apply_on_commit: true
  
  # Per-language settings
  languages:
    go:
      tool: gofmt
      command: "gofmt {{.flags}} ."
      flags: "-l -w"
      check: true
      
    typescript:
      tool: prettier
      command: "prettier {{.flags}} ."
      flags: "--write"
      config: prettier.config.js
      
    python:
      tool: black
      command: "black {{.flags}} ."
      flags: "."
      config: pyproject.toml
```

## References

- @ref:specs/pipeline.spec.dir/format
- SIP 13: Pipeline System
- SIP 74: Pipeline Conditions
- SIP 127: Pipeline Lint

## Copyright

This document is in the public domain.
