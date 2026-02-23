# speclang-header lines:11
id: "@speclang/validation-tool/api"
version: 0.1.0
layer: 4
project_level: Alpha
agent_support: agent_autonomous
tags: [validation, tool, api, autonomous]
short: Validation tool API definitions
parent: "@speclang/validation-tool"
---

# Validation Tool API

API definitions for the autonomous validation tool.

## CLI Interface

### @validation-tool/api/cli

```speclang
# @block:validation-tool/api/cli @kind:code
speclang validate [files...] [options]

Options:
  -d, --dir <directory>    Project directory (default: ".")
  -s, --strict            Treat warnings as errors
  -v, --verbose           Show detailed output
  -f, --format <format>   Output format: text, json, minimal
```

## TypeScript API

### @validation-tool/api/engine

```speclang
# @block:validation-tool/api/engine @kind:code
class ValidationEngine {
  validate(spec: ParsedSpec): Promise<ValidationReport>
  validateAll(specs: ParsedSpec[]): Promise<ValidationReport[]>
  validateBatch(specs: ParsedSpec[]): Promise<ValidationReportBatch>
  addRule(rule: ValidationRule): void
  removeRule(id: string): boolean
}
```

### @validation-tool/api/rules

```speclang
# @block:validation-tool/api/rules @kind:code
interface ValidationRule {
  id: string
  name: string
  level: 'error' | 'warning'
  check(spec: ParsedSpec, context?: ValidationContext): ValidationResult[]
}
```

### @validation-tool/api/reporter

```speclang
# @block:validation-tool/api/reporter @kind:code
class ValidationReporter {
  format(report: ValidationReport): string
  formatBatch(batch: ValidationReportBatch): string
  formatJSON(report: ValidationReport): string
  formatSummary(reports: ValidationReport[]): string
}
```

## Validation Logic

### @validation-tool/api/rules-reference

Rules check:
1. Header format and required fields
2. ID format (@domain/path)
3. Reference resolution (@ref:)
4. Block syntax
5. Autonomous mode completeness

## Node API

### @validation-tool/api/mcp

MCP tool endpoint for remote validation.
