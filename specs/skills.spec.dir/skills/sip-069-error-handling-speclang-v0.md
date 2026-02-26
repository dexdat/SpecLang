---
name: sip-069-error-handling-speclang-v0
title: "SIP 69: Error Handling"
version: 0.1.0
description: Error codes, recovery strategies, and error reporting for SpecLang
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 69: Error Handling

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the error handling system for SpecLang.

### Quick Start

1. **Codes:** Structured error identifiers
2. **Recovery:** Automatic retry and fallback
3. **Reporting:** User-friendly messages

### Error Categories

| Category | Prefix | Examples |
|----------|--------|----------|
| Parse | E1xx | Invalid syntax, bad header |
| Validate | E2xx | Bad refs, missing fields |
| Codegen | E3xx | Type errors, generation failed |
| Runtime | E4xx | Database, network, timeout |
| Agent | E5xx | Session, lock, cascade |

### When to Read This

- **Error messages:** Understanding failures
- **Recovery:** Automatic error handling
- **Extensions:** Custom error types

### Related SIPs

- SIP 22: Validation
- SIP 65: Validation Rules
- SIP 46: Validation Tool

## Abstract

This SIP specifies the error handling system for SpecLang, including error codes, recovery strategies, and error reporting.

## Motivation

Good error handling means:
- Clear error messages
- Actionable suggestions
- Automatic recovery when possible
- Proper logging for debugging

## Rationale

**Error Flow:**

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  Error   │ →  │ Recovery │ →  │ Report   │
│  Detect  │    │ Attempt  │    │ To User  │
└──────────┘    └──────────┘    └──────────┘
      │              │               │
      ▼              ▼               ▼
   Log Error    Retry/Fallback   Message+Fix
```

**Benefits:**
- Consistent error format
- Automatic recovery
- Helpful suggestions
- Debugging support

## Specification

### Error Structure

**@error/structure:**

```speclang
# @block:error/structure @kind:entity
SpecLangError:
  code: String              # E201
  category: ErrorCategory   # VALIDATE
  message: String           # Human-readable
  location: Location?       # File:line:column
  suggestion: String?       # How to fix
  cause: Error?             # Wrapped error
  retryable: Boolean        # Can auto-retry
  severity: Severity        # error, warning, info

Location:
  file: String
  line: Int?
  column: Int?
  endLine: Int?
  endColumn: Int?
  
Severity:
  - error: Blocks operation
  - warning: Continue with caution
  - info: Informational only
```

### Error Categories

**@error/categories:**

```speclang
# @block:error/categories @kind:entity
ErrorCategory:
  PARSE:
    range: E100-E199
    description: Syntax and parsing errors
    
  VALIDATE:
    range: E200-E299
    description: Validation failures
    
  CODEGEN:
    range: E300-E399
    description: Code generation errors
    
  RUNTIME:
    range: E400-E499
    description: Runtime and system errors
    
  AGENT:
    range: E500-E599
    description: Agent and session errors
```

### Error Codes

**@error/codes-parse:**

```speclang
# @block:error/codes-parse @kind:table
Parse Errors (E1xx):

| Code | Message | Suggestion |
|------|---------|------------|
| E100 | Invalid syntax | Check YAML/markdown format |
| E101 | Missing header | Add # speclang-header lines:N |
| E102 | Invalid header format | Check YAML syntax in header |
| E103 | Unknown block kind | Use: entity, operation, etc |
| E104 | Unclosed code block | Add closing ``` |
| E105 | Invalid indentation | Use consistent spaces |
```

**@error/codes-validate:**

```speclang
# @block:error/codes-validate @kind:table
Validation Errors (E2xx):

| Code | Message | Suggestion |
|------|---------|------------|
| E200 | Missing required field | Add missing field to header |
| E201 | Invalid ID format | Use @domain/path format |
| E202 | Duplicate block ID | Make block IDs unique |
| E203 | Reference not found | Check @ref target exists |
| E204 | Circular reference | Remove circular dependency |
| E205 | Invalid version | Use semver (1.0.0) |
| E206 | Invalid layer | Use 0-10 range |
```

**@error/codes-codegen:**

```speclang
# @block:error/codes-codegen @kind:table
Codegen Errors (E3xx):

| Code | Message | Suggestion |
|------|---------|------------|
| E300 | Unknown type | Check type name spelling |
| E301 | Type mismatch | Verify type compatibility |
| E302 | Missing template | Add template for block kind |
| E303 | Generation failed | Check spec for issues |
| E304 | Write failed | Check file permissions |
| E305 | Invalid target | Use: ts, go, python, rust |
```

**@error/codes-runtime:**

```speclang
# @block:error/codes-runtime @kind:table
Runtime Errors (E4xx):

| Code | Message | Suggestion |
|------|---------|------------|
| E400 | Database error | Check SQLite database |
| E401 | Connection failed | Check network/server |
| E402 | Timeout | Increase timeout or retry |
| E403 | Permission denied | Check file permissions |
| E404 | Not found | Verify resource exists |
| E405 | Conflict | Resource already exists |
```

**@error/codes-agent:**

```speclang
# @block:error/codes-agent @kind:table
Agent Errors (E5xx):

| Code | Message | Suggestion |
|------|---------|------------|
| E500 | Session not found | Create new session |
| E501 | Lock conflict | Wait or retry |
| E502 | Lock timeout | Release other locks |
| E503 | Cascade blocked | Fix blocking errors |
| E504 | Agent unavailable | Restart agent |
| E505 | Invalid operation | Check operation state |
```

## Recovery Strategies

### @recovery/strategies

```speclang
# @block:recovery/strategies @kind:entity
RecoveryStrategy:
  retry:
    conditions:
      - Timeout
      - Connection failed
      - Lock conflict
    config:
      max_attempts: 3
      backoff: exponential
      base_delay: 100ms
      
  fallback:
    conditions:
      - Template not found
      - Generator failed
    config:
      use_default: true
      
  ignore:
    conditions:
      - Warning level
      - Non-critical info
    config:
      log: true
      continue: true
      
  abort:
    conditions:
      - Parse error
      - Validation error
      - Permission denied
    config:
      log: true
      exit_code: 1
```

### @recovery/retry

```speclang
# @block:recovery/retry @kind:operation
RetryConfig:
  max_attempts: Int @default(3)
  backoff: linear | exponential | fixed
  base_delay: Duration @default(100ms)
  max_delay: Duration @default(30s)
  jitter: Boolean @default(true)
  
RetryFlow:
  1. Attempt operation
  2. If error and retryable:
     a. Calculate delay
     b. Wait
     c. Retry
  3. If max attempts reached:
     a. Return final error
```

### @recovery/fallback

```speclang
# @block:recovery/fallback @kind:operation
FallbackConfig:
  use_default: Boolean @default(true)
  cache_result: Boolean @default(true)
  
FallbackFlow:
  1. Try primary method
  2. If error:
     a. Log error
     b. Use fallback method
     c. Return fallback result
```

## Error Reporting

### @reporting/format

```speclang
# @block:reporting/format @kind:entity
ErrorReport:
  summary: String           # One-line summary
  details: String?          # Full explanation
  location: Location?       # Where it happened
  suggestion: String?       # How to fix
  documentation: URL?       # Link to docs
  stack: String?            # Stack trace (debug mode)
```

### @reporting/output

```speclang
# @block:reporting/output @kind:operation
OutputFormat:
  human:
    format: colored terminal output
    includes: summary, location, suggestion
    
  json:
    format: JSON object
    includes: all fields
    
  markdown:
    format: Markdown report
    includes: summary, details, suggestion
    
Example (human):
  Error E203: Reference not found
    at specs/auth.spec:45
  
  The reference @ref:specs/users#login points to a block
  that doesn't exist.
  
  Suggestion: Check that the block @users/login exists
  in specs/users.spec
```

### @reporting/aggregation

```speclang
# @block:reporting/aggregation @kind:operation
ErrorAggregation:
  group_by:
    - code: Group same error type
    - file: Group by source file
    
  dedupe:
    - Same error, same location: show once
    - Same error, different location: show count
    
  summarize:
    - Show first N errors in detail
    - Summarize remaining by count
```

## Implementation

### Error Class

```typescript
enum ErrorCategory {
  PARSE = 'PARSE',
  VALIDATE = 'VALIDATE',
  CODEGEN = 'CODEGEN',
  RUNTIME = 'RUNTIME',
  AGENT = 'AGENT',
}

enum Severity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

interface Location {
  file: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}

class SpecLangError extends Error {
  constructor(
    public readonly code: string,
    public readonly category: ErrorCategory,
    message: string,
    public readonly location?: Location,
    public readonly suggestion?: string,
    public readonly cause?: Error,
    public readonly retryable: boolean = false,
    public readonly severity: Severity = Severity.ERROR
  ) {
    super(message);
    this.name = `SpecLangError[${code}]`;
  }
  
  toReport(): ErrorReport {
    return {
      summary: `${this.code}: ${this.message}`,
      details: this.message,
      location: this.location,
      suggestion: this.suggestion,
      stack: this.stack,
    };
  }
  
  static fromCode(code: string, location?: Location, cause?: Error): SpecLangError {
    const definition = ERROR_DEFINITIONS[code];
    
    if (!definition) {
      return new SpecLangError(
        code,
        ErrorCategory.RUNTIME,
        `Unknown error code: ${code}`,
        location,
        undefined,
        cause
      );
    }
    
    return new SpecLangError(
      code,
      definition.category,
      definition.message,
      location,
      definition.suggestion,
      cause,
      definition.retryable,
      definition.severity
    );
  }
}
```

### Error Definitions

```typescript
interface ErrorDefinition {
  code: string;
  category: ErrorCategory;
  message: string;
  suggestion?: string;
  retryable: boolean;
  severity: Severity;
}

const ERROR_DEFINITIONS: Record<string, ErrorDefinition> = {
  E100: {
    code: 'E100',
    category: ErrorCategory.PARSE,
    message: 'Invalid syntax',
    suggestion: 'Check YAML/markdown format',
    retryable: false,
    severity: Severity.ERROR,
  },
  E101: {
    code: 'E101',
    category: ErrorCategory.PARSE,
    message: 'Missing header',
    suggestion: 'Add # speclang-header lines:N',
    retryable: false,
    severity: Severity.ERROR,
  },
  E203: {
    code: 'E203',
    category: ErrorCategory.VALIDATE,
    message: 'Reference not found',
    suggestion: 'Check that @ref target exists',
    retryable: false,
    severity: Severity.ERROR,
  },
  E402: {
    code: 'E402',
    category: ErrorCategory.RUNTIME,
    message: 'Timeout',
    suggestion: 'Increase timeout or retry',
    retryable: true,
    severity: Severity.ERROR,
  },
  E501: {
    code: 'E501',
    category: ErrorCategory.AGENT,
    message: 'Lock conflict',
    suggestion: 'Wait or retry',
    retryable: true,
    severity: Severity.ERROR,
  },
};
```

### Retry Handler

```typescript
interface RetryConfig {
  maxAttempts: number;
  backoff: 'linear' | 'exponential' | 'fixed';
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
}

async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {
    maxAttempts: 3,
    backoff: 'exponential',
    baseDelay: 100,
    maxDelay: 30000,
    jitter: true,
  }
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if retryable
      if (error instanceof SpecLangError && !error.retryable) {
        throw error;
      }
      
      // Calculate delay
      let delay = config.baseDelay;
      
      if (config.backoff === 'exponential') {
        delay = Math.min(
          config.baseDelay * Math.pow(2, attempt - 1),
          config.maxDelay
        );
      } else if (config.backoff === 'linear') {
        delay = Math.min(
          config.baseDelay * attempt,
          config.maxDelay
        );
      }
      
      // Add jitter
      if (config.jitter) {
        delay = delay * (0.5 + Math.random());
      }
      
      // Wait before retry
      if (attempt < config.maxAttempts) {
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Error Reporter

```typescript
class ErrorReporter {
  constructor(private readonly format: 'human' | 'json' | 'markdown' = 'human') {}
  
  report(error: SpecLangError | SpecLangError[]): string {
    const errors = Array.isArray(error) ? error : [error];
    
    switch (this.format) {
      case 'json':
        return this.formatJson(errors);
      case 'markdown':
        return this.formatMarkdown(errors);
      default:
        return this.formatHuman(errors);
    }
  }
  
  private formatHuman(errors: SpecLangError[]): string {
    const lines: string[] = [];
    
    for (const error of errors) {
      // Header
      const severity = error.severity === Severity.ERROR
        ? '\x1b[31mError\x1b[0m'
        : '\x1b[33mWarning\x1b[0m';
      lines.push(`${severity} ${error.code}: ${error.message}`);
      
      // Location
      if (error.location) {
        const loc = `${error.location.file}:${error.location.line || 1}`;
        lines.push(`  \x1b[90mat ${loc}\x1b[0m`);
      }
      
      lines.push('');
      
      // Details
      if (error.cause) {
        lines.push(`  Caused by: ${error.cause.message}`);
        lines.push('');
      }
      
      // Suggestion
      if (error.suggestion) {
        lines.push(`  \x1b[36mSuggestion:\x1b[0m ${error.suggestion}`);
        lines.push('');
      }
    }
    
    return lines.join('\n');
  }
  
  private formatJson(errors: SpecLangError[]): string {
    return JSON.stringify(
      errors.map(e => ({
        code: e.code,
        category: e.category,
        message: e.message,
        location: e.location,
        suggestion: e.suggestion,
        retryable: e.retryable,
        severity: e.severity,
        cause: e.cause?.message,
      })),
      null,
      2
    );
  }
  
  private formatMarkdown(errors: SpecLangError[]): string {
    const lines: string[] = ['# SpecLang Errors\n'];
    
    for (const error of errors) {
      lines.push(`## ${error.code}: ${error.message}\n`);
      
      if (error.location) {
        lines.push(`**Location:** \`${error.location.file}:${error.location.line || 1}\`\n`);
      }
      
      if (error.suggestion) {
        lines.push(`**Suggestion:** ${error.suggestion}\n`);
      }
      
      lines.push('');
    }
    
    return lines.join('\n');
  }
}
```

### Recovery Handler

```typescript
class RecoveryHandler {
  async handle(error: SpecLangError): Promise<void> {
    const strategy = this.getStrategy(error);
    
    switch (strategy.type) {
      case 'retry':
        await this.handleRetry(error, strategy.config);
        break;
      case 'fallback':
        await this.handleFallback(error, strategy.config);
        break;
      case 'ignore':
        this.handleIgnore(error);
        break;
      case 'abort':
        this.handleAbort(error);
        break;
    }
  }
  
  private getStrategy(error: SpecLangError): RecoveryStrategy {
    // Check for retryable errors
    if (error.retryable) {
      return {
        type: 'retry',
        config: { maxAttempts: 3, backoff: 'exponential', baseDelay: 100, maxDelay: 30000, jitter: true },
      };
    }
    
    // Warnings can be ignored
    if (error.severity === Severity.WARNING) {
      return { type: 'ignore', config: { log: true, continue: true } };
    }
    
    // Everything else aborts
    return { type: 'abort', config: { log: true, exitCode: 1 } };
  }
  
  private async handleRetry(error: SpecLangError, config: RetryConfig): Promise<void> {
    // Retry logic handled by withRetry wrapper
    throw new Error('Retry should be handled by withRetry wrapper');
  }
  
  private handleIgnore(error: SpecLangError): void {
    console.warn(`[WARN] ${error.code}: ${error.message}`);
  }
  
  private handleAbort(error: SpecLangError): void {
    const reporter = new ErrorReporter('human');
    console.error(reporter.report(error));
    process.exit(1);
  }
}
```

## MCP Error Handling

### @mcp/errors

```speclang
# @block:mcp/errors @kind:entity
MCPErrorHandling:
  database_errors:
    SQLITE_BUSY:
      retry: true
      backoff: exponential
      max_retries: 3
      
    SQLITE_CONSTRAINT:
      log: true
      notify: false
      return: user-friendly message
      
    SQLITE_CORRUPT:
      action: exit
      notify: admin
      
  tool_errors:
    invalid_params:
      return: { error: string, code: "INVALID_PARAMS" }
      
    not_found:
      return: { error: string, code: "NOT_FOUND" }
      
    unauthorized:
      return: { error: string, code: "UNAUTHORIZED" }
```

## References

- @ref:specs/mcp.spec.dir/error-handling
- @ref:specs/validation.spec.dir/rules
- SIP 22: Validation
- SIP 65: Validation Rules

## Copyright

This document is in the public domain.
