---
name: sip-074-pipeline-conditions-speclang-v0
title: "SIP 74: Pipeline Conditions"
version: 0.1.0
description: Conditional execution and condition evaluation in pipelines
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 74: Pipeline Conditions

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines Pipeline Conditions—the syntax and evaluation of conditional execution in build pipelines.

### Quick Start

Condition types:
1. **File patterns**: `*.go changed`
2. **Expressions**: `files.changed includes "auth"`
3. **Convergence**: `converged && changes > 0`
4. **Stage results**: `previous.success`

### When to Read This

- **Writing pipelines:** Conditional stage execution
- **Building triggers:** Condition evaluation
- **Debugging:** Why stage was skipped

### Related SIPs

- SIP 13: Pipeline System
- SIP 53: Pipeline Hooks
- SIP 28: Cascade Protocol

## Abstract

This SIP defines the condition system for pipeline stages. Conditions control when stages run, enabling efficient builds that only execute necessary work. Conditions can check file patterns, stage results, convergence state, and custom expressions.

## Motivation

Conditional execution is needed because:
- Not every change requires full rebuild
- Different file types need different tooling
- Failed dependencies should skip dependents
- Efficiency requires selective execution

## Rationale

**Declarative Conditions:**

1. **Readable**: Clear intent in YAML
2. **Composable**: Combine with AND/OR
3. **Efficient**: Evaluated before execution
4. **Debuggable**: Logged why stage ran/skipped

This follows patterns from GitHub Actions, CircleCI.

## Specification

### Condition Syntax

```yaml
ConditionSyntax:
  simple:
    - "*.go files changed"
    - "specs/** modified"
    - "frontend changed"
    
  expression:
    - "files.includes('auth') && !files.includes('test')"
    - "changes > 5"
    - "stage('build').success"
    
  built_in:
    - "always"     # always runs
    - "never"      # never runs
    - "on_change"  # default behavior
```

### Condition Types

```yaml
ConditionTypes:
  FilePattern:
    description: "Match changed files by glob pattern"
    syntax: "<glob> changed" | "<glob> modified"
    examples:
      - "*.go files changed"
      - "specs/**/*.scl modified"
      - "frontend/**"
      
  FileExpression:
    description: "Complex file matching logic"
    syntax: "files.<operation>(<args>)"
    operations:
      includes: "files.includes(path) -> Bool"
      matches: "files.matches(pattern) -> Bool"
      count: "files.count() -> Int"
      any: "files.any(patterns) -> Bool"
      all: "files.all(patterns) -> Bool"
      
  StageResult:
    description: "Check result of previous stage"
    syntax: "stage('<name>').<property>"
    properties:
      success: "stage succeeded"
      failed: "stage failed"
      skipped: "stage was skipped"
      output: "stage output (for reference)"
      
  Convergence:
    description: "Check convergence state"
    syntax: "converged" | "!converged"
    properties:
      converged: "all files quiet"
      depth: "cascade depth"
      iterations: "iteration count"
      
  Comparison:
    description: "Numeric comparisons"
    syntax: "<left> <op> <right>"
    operators: [">", "<", ">=", "<=", "==", "!="]
    examples:
      - "changes > 0"
      - "files.count() >= 10"
```

### Condition Context

```yaml
ConditionContext:
  description: "Data available during condition evaluation"
  
  fields:
    files:
      changed: String[]      # paths of changed files
      added: String[]        # newly added files
      deleted: String[]      # deleted files
      modified: String[]     # modified files
      
    convergence:
      active: Bool           # cascade is active
      depth: Int             # current cascade depth
      iterations: Int        # number of iterations
      quiet_seconds: Int     # seconds since last change
      
    stages:
      completed: String[]    # names of completed stages
      failed: String[]       # names of failed stages
      skipped: String[]      # names of skipped stages
      
    config:
      target: String         # build target (go, ts, etc)
      env: Map<String, String>  # environment variables
```

### Condition Evaluation

```yaml
ConditionEvaluator:
  evaluateTrigger:
    input:
      trigger: Trigger
      context: ConditionContext
    output:
      shouldRun: Bool
      reason: String
    
  evaluateStage:
    input:
      stage: Stage
      context: ConditionContext
    output:
      shouldRun: Bool
      reason: String
      
  evaluation_order:
    - Check stage dependencies
    - Evaluate condition expression
    - Log result with reason
```

### Stage Condition Behavior

```yaml
StageConditionBehavior:
  with_condition:
    description: "Stage with condition field"
    behavior:
      - If condition evaluates true: run stage
      - If condition evaluates false: skip stage
      - If dependency failed: skip stage
      
  without_condition:
    description: "Stage without condition field"
    behavior:
      - Default: runs if dependencies succeeded
      - Equivalent to "condition: always" with dependency check
      
  dependency_failure:
    description: "When dependency stage failed"
    behavior:
      - Stage is skipped regardless of condition
      - Logged as "skipped: dependency failed"
```

## Examples

### Example 1: File Pattern Conditions

```yaml
pipeline:
  on_converge:
    - name: go_mod
      run: "go mod tidy"
      condition: "*.go files changed"
      
    - name: npm_install
      run: "npm ci"
      condition: "frontend/** changed"
      
    - name: regenerate
      run: "speclang generate"
      condition: "specs/**/*.scl modified"
```

### Example 2: Complex Expressions

```yaml
pipeline:
  on_converge:
    - name: auth_tests
      run: "go test ./auth/..."
      condition: |
        files.includes('auth') || 
        files.includes('auth.dir')
        
    - name: integration_tests
      run: "go test -tags=integration ./..."
      condition: |
        stage('build').success && 
        files.count() < 50
```

### Example 3: Stage Result Conditions

```yaml
pipeline:
  on_converge:
    - name: build
      run: "go build ./..."
      
    - name: test
      run: "go test ./..."
      depends_on: [build]
      condition: "stage('build').success"
      
    - name: coverage
      run: "go test -cover ./..."
      depends_on: [test]
      condition: "stage('test').success && files.includes('src')"
```

### Example 4: Convergence Conditions

```yaml
pipeline:
  on_converge:
    - name: deploy_preview
      run: "speclang deploy --preview"
      condition: "converged && files.any(['frontend', 'api'])"
      
    - name: notify
      run: "speclang notify 'Build complete'"
      condition: |
        converged && 
        !files.includes('.speclang/') &&
        stage('test').success
```

## Implementation

```typescript
export interface Condition {
  type: 'pattern' | 'expression' | 'builtin';
  value: string;
}

export interface ConditionContext {
  files: {
    changed: string[];
    added: string[];
    deleted: string[];
    modified: string[];
  };
  convergence: {
    active: boolean;
    depth: number;
    iterations: number;
    quietSeconds: number;
  };
  stages: {
    completed: string[];
    failed: string[];
    skipped: string[];
  };
  config: {
    target: string;
    env: Record<string, string>;
  };
}

export class ConditionEvaluator {
  evaluate(condition: Condition, context: ConditionContext): EvalResult {
    switch (condition.type) {
      case 'pattern':
        return this.evaluatePattern(condition.value, context);
      case 'expression':
        return this.evaluateExpression(condition.value, context);
      case 'builtin':
        return this.evaluateBuiltin(condition.value, context);
    }
  }
  
  private evaluatePattern(pattern: string, ctx: ConditionContext): EvalResult {
    const files = this.extractFiles(pattern, ctx);
    const globPattern = this.extractGlob(pattern);
    const matches = files.some(f => minimatch(f, globPattern));
    return {
      shouldRun: matches,
      reason: matches 
        ? `matched files: ${files.filter(f => minimatch(f, globPattern))}`
        : `no files matched ${globPattern}`
    };
  }
  
  private evaluateExpression(expr: string, ctx: ConditionContext): EvalResult {
    const result = this.parseAndEval(expr, ctx);
    return {
      shouldRun: result,
      reason: `expression "${expr}" evaluated to ${result}`
    };
  }
  
  private evaluateBuiltin(builtin: string, ctx: ConditionContext): EvalResult {
    switch (builtin) {
      case 'always':
        return { shouldRun: true, reason: 'always runs' };
      case 'never':
        return { shouldRun: false, reason: 'never runs' };
      case 'on_change':
        return { 
          shouldRun: ctx.files.changed.length > 0, 
          reason: `${ctx.files.changed.length} files changed`
        };
      default:
        return { shouldRun: false, reason: `unknown builtin: ${builtin}` };
    }
  }
}

interface EvalResult {
  shouldRun: boolean;
  reason: string;
}
```

## References

- "@ref:speclang/pipeline/build
- @ref:speclang/executor/scheduling
- SIP 13: Pipeline System
- SIP 53: Pipeline Hooks

## Copyright

This document is in the public domain.
