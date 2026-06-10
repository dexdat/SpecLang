---
id: "@specs/validation/reporter"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
target: src/validation/reporter.ts
tags: [validation, reporter]
short: Validation error reporter
---

# Validation Reporter

### @block::class @kind:entity

Formats validation results for display in various formats.

```typescript
class ValidationReporter {
  constructor(verbose?: boolean)
  format(report: ValidationReport): string
  formatBatch(batch: ValidationReportBatch): string
  formatJSON(report: ValidationReport): string
  formatBatchJSON(batch: ValidationReportBatch): string
  formatSummary(reports: ValidationReport[]): string
  formatMinimal(reports: ValidationReport[]): string
  setVerbose(verbose: boolean): void
}

function format(report: ValidationReport, verbose?: boolean): string
function formatBatch(batch: ValidationReportBatch, verbose?: boolean): string
function formatJSON(report: ValidationReport): string
function formatSummary(reports: ValidationReport[]): string
```
