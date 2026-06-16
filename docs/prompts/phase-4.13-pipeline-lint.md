# Bootstrap Phase 4.13: Pipeline Lint Stages

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 4.13 of the bootstrap process.

**Prerequisites**: 
- Phase 4.1-4.12 (Pipeline system) complete
- Build stages implemented

## Your Task
Implement the lint stage system for the pipeline. Lint stages analyze code for errors, style violations, and potential issues.

## Read These Specs First
1. `specs/pipeline.spec.md` - Pipeline overview
2. `specs/stages.spec.md` - Stage definitions
3. `specs/lint.spec.md` - Linting specifications

## What to Build

### Files to Create
```
src/pipeline/stages/
├── lint/
│   ├── index.ts           # Lint stage exports
│   ├── types.ts           # Lint stage types
│   ├── runner.ts         # Lint runner
│   ├── formatters.ts     # Output formatters
│   ├── fixers.ts         # Auto-fix runners
│   └── rules.ts          # Rule definitions

tests/pipeline/
└── lint.test.ts
```

### Requirements

#### 1. Lint Stage Types

```typescript
// src/pipeline/stages/lint/types.ts

export interface LintStageConfig {
  name: string;
  tool: LintTool;
  patterns: string[];
  options?: LintOptions;
  rules?: RuleConfig[];
  depends_on?: string[];
}

export type LintTool = 
  | 'eslint'
  | 'typescript'
  | 'ruff'
  | 'golangci-lint'
  | 'shellcheck'
  | 'hadolint'
  | 'yamllint'
  | 'markdownlint'
  | 'commitlint'
  | 'prettier';

export interface LintOptions {
  fix?: boolean;
  fixDryRun?: boolean;
  cache?: boolean;
  cacheLocation?: string;
  maxWarnings?: number;
  maxErrors?: number;
  failOnWarning?: boolean;
  failOnError?: boolean;
  format?: 'stylish' | 'json' | 'compact' | 'unix';
  quiet?: boolean;
}

export interface RuleConfig {
  id: string;
  severity?: 'error' | 'warning' | 'info' | 'off';
  options?: Record<string, unknown>;
}

export interface LintResult {
  stage: string;
  tool: LintTool;
  status: 'success' | 'failed' | 'warning' | 'skipped';
  filesChecked: number;
  errors: LintError[];
  warnings: LintWarning;
  fixes: LintFix[];
  duration: number;
  output?: string;
  error?: string;
}

export interface LintError {
  file: string;
  line: number;
  column: number;
  message: string;
  rule?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface LintWarning {
  total: number;
  byRule: Record<string, number>;
}

export interface LintFix {
  file: string;
  fixed: number;
  suggested: number;
}
```

#### 2. Lint Runner

```typescript
// src/pipeline/stages/lint/runner.ts

import { LintStageConfig, LintResult, LintError, LintWarning, LintFix } from './types';
import { exec } from '../../utils/exec';
import { readFileSync, existsSync } from 'fs';

export class LintRunner {
  async execute(config: LintStageConfig): Promise<LintResult> {
    const start = Date.now();
    
    const result: LintResult = {
      stage: config.name,
      tool: config.tool,
      status: 'success',
      filesChecked: 0,
      errors: [],
      warnings: { total: 0, byRule: {} },
      fixes: [],
      duration: 0,
    };
    
    try {
      const output = await this.runLint(config);
      
      result.output = output;
      this.parseOutput(output, config, result);
      result.filesChecked = config.patterns.length;
      
      if (result.errors.length > 0) {
        result.status = 'failed';
      } else if (result.warnings.total > 0) {
        result.status = 'warning';
      }
      
      if (config.options?.fix && result.fixes.length > 0) {
        await this.applyFixes(result.fixes);
      }
      
      result.duration = Date.now() - start;
      return result;
    } catch (error) {
      return {
        ...result,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - start,
      };
    }
  }
  
  private async runLint(config: LintStageConfig): Promise<string> {
    const args = this.buildArgs(config);
    return exec(args.join(' '));
  }
  
  private buildArgs(config: LintStageConfig): string[] {
    const tool = config.tool;
    const opts = config.options || {};
    
    switch (tool) {
      case 'eslint':
        return this.buildEslintArgs(config, opts);
      case 'typescript':
        return this.buildTscArgs(config, opts);
      case 'ruff':
        return this.buildRuffArgs(config, opts);
      case 'prettier':
        return this.buildPrettierArgs(config, opts);
      default:
        return this.buildGenericArgs(config, opts);
    }
  }
  
  private buildEslintArgs(config: LintStageConfig, opts: LintOptions): string[] {
    const args = ['eslint'];
    
    if (opts.fix) args.push('--fix');
    if (opts.fixDryRun) args.push('--fix-dry-run');
    if (opts.cache) args.push('--cache');
    if (opts.cacheLocation) args.push('--cache-location', opts.cacheLocation);
    if (opts.maxWarnings) args.push('--max-warnings', String(opts.maxWarnings));
    if (opts.format) args.push('--format', opts.format);
    if (opts.quiet) args.push('--quiet');
    
    args.push(...config.patterns);
    
    return args;
  }
  
  private buildTscArgs(config: LintStageConfig, opts: LintOptions): string[] {
    const args = ['tsc', '--noEmit'];
    
    if (opts.cache) args.push('--incremental');
    if (opts.format === 'json') args.push('--outputJSON');
    
    return args;
  }
  
  private buildRuffArgs(config: LintStageConfig, opts: LintOptions): string[] {
    const args = ['ruff', 'check'];
    
    if (opts.fix) args.push('--fix');
    if (opts.fixDryRun) args.push('--fix-only');
    if (opts.format) {
      if (opts.format === 'json') args.push('--output-format', 'json');
      else if (opts.format === 'unix') args.push('--output-format', 'text');
    }
    
    args.push(...config.patterns);
    
    return args;
  }
  
  private buildPrettierArgs(config: LintStageConfig, opts: LintOptions): string[] {
    const args = ['prettier', '--check'];
    
    if (opts.fix) args.push('--write');
    args.push(...config.patterns);
    
    return args;
  }
  
  private buildGenericArgs(config: LintStageConfig, opts: LintOptions): string[] {
    const args = [config.tool];
    
    if (opts.fix) args.push('--fix');
    if (opts.format) args.push('--format', opts.format);
    
    args.push(...config.patterns);
    
    return args;
  }
  
  private parseOutput(output: string, config: LintStageConfig, result: LintResult): void {
    const tool = config.tool;
    
    switch (tool) {
      case 'eslint':
        this.parseEslintOutput(output, result);
        break;
      case 'typescript':
        this.parseTscOutput(output, result);
        break;
      case 'ruff':
        this.parseRuffOutput(output, result);
        break;
      default:
        this.parseGenericOutput(output, result);
    }
  }
  
  private parseEslintOutput(output: string, result: LintResult): void {
    try {
      const data = JSON.parse(output);
      
      for (const file of data) {
        for (const msg of file.messages) {
          result.errors.push({
            file: file.filePath,
            line: msg.line,
            column: msg.column,
            message: msg.message,
            rule: msg.ruleId,
            severity: msg.severity === 2 ? 'error' : 'warning',
          });
          
          if (msg.severity === 1) {
            result.warnings.total++;
            const rule = msg.ruleId || 'unknown';
            result.warnings.byRule[rule] = (result.warnings.byRule[rule] || 0) + 1;
          }
        }
      }
    } catch {
      const lines = output.split('\n');
      for (const line of lines) {
        const match = line.match(/(.+):(\d+):(\d+):\s*(.+?)\s*(.+)/);
        if (match) {
          const severity = line.includes('warning') ? 'warning' : 'error';
          result.errors.push({
            file: match[1],
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            message: match[5],
            severity,
          });
          
          if (severity === 'warning') {
            result.warnings.total++;
          }
        }
      }
    }
  }
  
  private parseTscOutput(output: string, result: LintResult): void {
    const lines = output.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(.+)\((\d+),(\d+)\):\s*(.+)$/);
      if (match) {
        result.errors.push({
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          message: match[4],
          severity: 'error',
        });
      }
    }
  }
  
  private parseRuffOutput(output: string, result: LintResult): void {
    try {
      const data = JSON.parse(output);
      
      for (const diagnostic of data) {
        result.errors.push({
          file: diagnostic.filename,
          line: diagnostic.location.row,
          column: diagnostic.location.column,
          message: diagnostic.message,
          rule: diagnostic.code,
          severity: diagnostic.code.startsWith('E') ? 'error' : 'warning',
        });
        
        if (diagnostic.code.startsWith('W')) {
          result.warnings.total++;
          result.warnings.byRule[diagnostic.code] = 
            (result.warnings.byRule[diagnostic.code] || 0) + 1;
        }
      }
    } catch {
      this.parseGenericOutput(output, result);
    }
  }
  
  private parseGenericOutput(output: string, result: LintResult): void {
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('error') || line.includes('warning')) {
        const severity = line.includes('error') ? 'error' : 'warning';
        result.errors.push({
          file: 'unknown',
          line: 0,
          column: 0,
          message: line,
          severity,
        });
        
        if (severity === 'warning') {
          result.warnings.total++;
        }
      }
    }
  }
  
  private async applyFixes(fixes: LintFix[]): Promise<void> {
    for (const fix of fixes) {
      if (fix.fixed > 0) {
        console.log(`Applied ${fix.fixed} fixes to ${fix.file}`);
      }
    }
  }
}
```

#### 3. Formatters

```typescript
// src/pipeline/stages/lint/formatters.ts

import { LintResult, LintError } from './types';

export interface LintFormatter {
  format(result: LintResult): string;
}

export class StylishFormatter implements LintFormatter {
  format(result: LintResult): string {
    let output = '';
    
    if (result.errors.length === 0 && result.warnings.total === 0) {
      return 'No lint errors found';
    }
    
    const errors = result.errors.filter(e => e.severity === 'error');
    const warnings = result.errors.filter(e => e.severity === 'warning');
    
    if (errors.length > 0) {
      output += '\nErrors:\n';
      for (const error of errors) {
        output += this.formatError(error);
      }
    }
    
    if (warnings.length > 0) {
      output += '\nWarnings:\n';
      for (const warning of warnings) {
        output += this.formatError(warning);
      }
    }
    
    output += `\n\n${errors.length} errors, ${warnings.length} warnings`;
    
    return output;
  }
  
  private formatError(error: LintError): string {
    return `  ${error.file}:${error.line}:${error.column}: ${error.message}\n`;
  }
}

export class JsonFormatter implements LintFormatter {
  format(result: LintResult): string {
    return JSON.stringify(result, null, 2);
  }
}

export class UnixFormatter implements LintFormatter {
  format(result: LintResult): string {
    return result.errors
      .map(e => `${e.file}:${e.line}:${e.column}: ${e.severity}: ${e.message}`)
      .join('\n');
  }
}

export const formatters = {
  stylish: new StylishFormatter(),
  json: new JsonFormatter(),
  unix: new UnixFormatter(),
  
  get(name: string): LintFormatter {
    return formatters[name as keyof typeof formatters] || formatters.stylish;
  },
};
```

#### 4. Lint Configuration

```yaml
# lint.yaml (extends pipeline config)

stages:
  - name: eslint
    tool: eslint
    patterns:
      - src/**/*.ts
      - tests/**/*.ts
    options:
      fix: true
      cache: true
      format: stylish
      maxWarnings: 10

  - name: typescript-check
    tool: typescript
    patterns:
      - src/**/*.ts
    options:
      cache: true

  - name: ruff
    tool: ruff
    patterns:
      - src/**/*.py
    options:
      fix: true
      format: json

  - name: prettier
    tool: prettier
    patterns:
      - "*.md"
      - "*.json"
      - "*.yaml"
    options:
      fix: false
```

#### 5. CLI Commands

```bash
# Run all linters
speclang pipeline lint

# Run specific linter
speclang pipeline lint --tool eslint

# Fix issues automatically
speclang pipeline lint --fix

# Check with dry run
speclang pipeline lint --fix-dry-run

# Use specific format
speclang pipeline lint --format json

# Run with cache
speclang pipeline lint --cache
```

## Test Cases
1. ESLint runs correctly
2. TypeScript check works
3. Ruff lints Python
4. Output is properly formatted
5. Auto-fix applies changes
6. Cache improves performance
7. Errors and warnings are counted
8. Rule filtering works

## Validation
```bash
bun test tests/pipeline/lint.test.ts
speclang pipeline lint --dry-run
```

## Output Format
After completing, output:
1. Lint stage types defined
2. Lint runner implemented
3. Formatters working
4. Fixers implemented
5. Test results
