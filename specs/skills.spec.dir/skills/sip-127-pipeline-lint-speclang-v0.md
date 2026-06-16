---
name: sip-127-pipeline-lint-speclang-v0
title: "SIP 127: Pipeline Lint Stages"
version: 0.1.0
description: Lint stage configuration, linter types, and lint result handling in pipelines
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 127: Pipeline Lint Stages

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines Lint Stages—the static analysis and code quality checking phases in SpecLang pipelines.

### Quick Start

```yaml
pipeline:
  lint:
    - name: go-lint
      command: "golangci-lint run"
      language: go
      fail_on_warning: false
      
    - name: ts-lint
      command: "eslint . --format=json"
      language: typescript
      fail_on_warning: false
```

### When to Read This

- **Configuring linters:** Setting up lint stages
- **Code quality:** Static analysis tools
- **Standards:** Enforcing code conventions

### Related SIPs

- SIP 13: Pipeline System
- SIP 74: Pipeline Conditions
- SIP 128: Pipeline Format

## Abstract

This SIP specifies lint stage configuration, supported linters, rule sets, and result handling for the SpecLang pipeline system.

## Motivation

Lint stages are needed because:
- Code quality must be maintained
- Style conventions need enforcement
- Potential bugs should be caught early
- Security issues need scanning

## Specification

### Lint Stage Configuration

```yaml
LintStage:
  name: string              # Stage identifier
  command: string           # Lint command to execute
  language: string          # Programming language
  tool: string             # Linter name (go, eslint, ruff, etc.)
  config: string           # Config file path
  rules: RuleSet           # Inline rule configuration
  fail_on_warning: boolean # Treat warnings as errors
  fail_on_error: boolean   # Treat errors as failures (default: true)
  timeout: number          # Timeout in seconds (default: 120)
  retry: RetryConfig       # Retry configuration (optional)
  artifacts: Artifact[]    # Lint outputs (optional)
  depends_on: string[]     # Stage dependencies (optional)
  condition: string        # Conditional execution (optional)
```

### Supported Languages and Tools

```yaml
LanguageTools:
  go:
    tools:
      - name: golangci-lint
        config: .golangci.yml
      - name: go vet
        config: N/A
      - name: staticcheck
      - name: revive
      
  typescript:
    tools:
      - name: eslint
        config: .eslintrc.{js,json,yaml}
      - name: tsc
        config: tsconfig.json
      - name: biome
        
  javascript:
    tools:
      - name: eslint
      - name: prettier --check
      - name: biome
        
  python:
    tools:
      - name: ruff
        config: pyproject.toml
      - name: pylint
      - name: mypy
      - name: black --check
        
  rust:
    tools:
      - name: clippy
      - name: rustfmt --check
      - name: cargo audit
```

### Rule Configuration

```yaml
RuleSet:
  severity:
    error: fail
    warning: warn
    info: log
    
  rules:
    disable:
      - "no-unused-vars"
      - "import/order"
      
    enable:
      - "no-var"
      - "prefer-const"
      
    configure:
      max_line_length: 100
      indent_size: 2
```

### Lint Result Format

```yaml
LintOutput:
  format: "json" | "sarif" | "checkstyle" | "junit" | "text"
  output: string           # Output file path
  upload: boolean          # Upload to service
  
  # Severity mapping
  severity_map:
    error: error
    warning: warning
    note: info
    hint: suggestion
```

### Lint Stage Examples

### Example 1: Go Linting

```yaml
pipeline:
  lint:
    - name: go-vet
      command: "go vet ./..."
      language: go
      tool: go-vet
      
    - name: golangci-lint
      command: "golangci-lint run --out-format=json"
      language: go
      tool: golangci-lint
      config: .golangci.yml
      fail_on_warning: true
      timeout: 180
      artifacts:
        - path: lint-results.json
          type: file
```

### Example 2: TypeScript Linting

```yaml
pipeline:
  lint:
    - name: eslint
      command: "eslint . --format=json --ext .ts,.tsx"
      language: typescript
      tool: eslint
      config: .eslintrc.json
      fail_on_warning: false
      rules:
        severity:
          error: fail
          warning: warn
      artifacts:
        - path: eslint-results.json
          type: file
          
    - name: tsc
      command: "tsc --noEmit"
      language: typescript
      tool: tsc
      fail_on_warning: true
```

### Example 3: Multi-Language Lint Matrix

```yaml
pipeline:
  lint:
    - name: lint-go
      command: "golangci-lint run ./..."
      language: go
      tool: golangci-lint
      
    - name: lint-frontend
      command: "eslint . --format=json"
      language: typescript
      tool: eslint
      
    - name: lint-backend
      command: "ruff check . --format=json"
      language: python
      tool: ruff
      
    - name: lint-rust
      command: "cargo clippy -- -D warnings"
      language: rust
      tool: clippy
```

### Example 4: Security Linting

```yaml
pipeline:
  lint:
    - name: secrets-scan
      command: "trufflehog filesystem . --json"
      tool: trufflehog
      fail_on_warning: false
      severity: security
      
    - name: dependency-audit
      command: "npm audit --json > audit.json"
      language: javascript
      tool: npm-audit
      artifacts:
        - path: audit.json
          type: file
          
    - name: cargo-audit
      command: "cargo audit --json"
      language: rust
      tool: cargo-audit
```

### Example 5: Custom Lint Rules

```yaml
pipeline:
  lint:
    - name: custom-rules
      command: "custom-linter check ."
      tool: custom-linter
      rules:
        severity:
          error: fail
          warning: warn
          info: log
          
        rules:
          max_function_length: 50
          max_file_length: 500
          require_documentation: true
          banned_imports:
            - "legacy_module"
            - "deprecated_util"
```

### Lint Execution Model

```typescript
interface LintStage {
  name: string;
  command: string;
  language: string;
  tool: string;
  config?: string;
  rules?: RuleSet;
  fail_on_warning: boolean;
  fail_on_error: boolean;
  timeout: number;
  retry: RetryConfig;
  artifacts: Artifact[];
  depends_on: string[];
  condition?: string;
}

interface RuleSet {
  severity: {
    error: 'fail' | 'warn' | 'log';
    warning: 'fail' | 'warn' | 'log';
    info: 'fail' | 'warn' | 'log';
  };
  rules: Record<string, unknown>;
}

interface LintResult {
  stage_name: string;
  tool: string;
  issues: LintIssue[];
  summary: {
    error: number;
    warning: number;
    info: number;
  };
  duration_ms: number;
}

interface LintIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line: number;
  column?: number;
  rule?: string;
}

class LintExecutor {
  async executeStage(stage: LintStage): Promise<LintResult> {
    const output = await this.runLinter(stage);
    const result = this.parseOutput(output, stage.tool);
    
    await this.checkThresholds(result, stage);
    await this.uploadArtifacts(stage, result);
    
    return result;
  }
  
  async runLinter(stage: LintStage): Promise<string> {
    return this.exec(stage.command, {
      timeout: stage.timeout * 1000,
      env: { LANG: stage.language }
    });
  }
  
  parseOutput(output: string, tool: string): LintResult {
    switch (tool) {
      case 'eslint':
        return this.parseESLint(output);
      case 'golangci-lint':
        return this.parseGoLangCI(output);
      case 'ruff':
        return this.parseRuff(output);
      default:
        return this.parseGeneric(output);
    }
  }
  
  checkThresholds(result: LintResult, stage: LintStage): void {
    if (stage.fail_on_error && result.summary.error > 0) {
      throw new LintError(`${result.summary.error} errors found`);
    }
    
    if (stage.fail_on_warning && result.summary.warning > 0) {
      throw new LintError(`${result.summary.warnings} warnings found`);
    }
  }
}
```

### Lint Configuration Files

```yaml
# .speclang/lint.yaml
lint:
  # Global settings
  fail_on_warning: false
  fail_on_error: true
  parallel: true
  
  # Per-language settings
  languages:
    go:
      tool: golangci-lint
      command: "golangci-lint run --out-format=json"
      config: .golangci.yml
      
    typescript:
      tool: eslint
      command: "eslint . --format=json --ext .ts,.tsx"
      config: .eslintrc.json
      
    python:
      tool: ruff
      command: "ruff check . --format=json"
      config: pyproject.toml
```

## References

- "@ref:specs/pipeline.spec.dir/lint
- SIP 13: Pipeline System
- SIP 74: Pipeline Conditions
- SIP 128: Pipeline Format

## Copyright

This document is in the public domain.
