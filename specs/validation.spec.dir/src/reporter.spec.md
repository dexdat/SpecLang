# speclang-header lines:10
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
  formatWarningSummary(reports: ValidationReport[], options?: WarningSummaryOptions): string
  formatBatch(batch: ValidationReportBatch): string
  formatJSON(report: ValidationReport): string
  formatBatchJSON(batch: ValidationReportBatch): string
  formatSummary(reports: ValidationReport[]): string
  formatMinimal(reports: ValidationReport[]): string
  setVerbose(verbose: boolean): void
}

interface WarningSummaryOptions {
  topMessages?: number      // default 5; 0 = list none
  maxMessageWidth?: number  // default 80
  indent?: string           // default two spaces
}

function format(report: ValidationReport, verbose?: boolean): string
function formatBatch(batch: ValidationReportBatch, verbose?: boolean): string
function formatJSON(report: ValidationReport): string
function formatSummary(reports: ValidationReport[]): string
```

### @block::contract @kind:operation

`formatWarningSummary` renders the DEFAULT text view of warnings: a count, a
breakdown by rule (with how many files carry warnings), the most frequent
distinct messages, and a pointer to `--verbose` / `--format json`. It returns
an empty string when there are no warnings, so callers may append it
unconditionally.

**Steps:**
1. Flatten every report's warnings; return `''` when the list is empty
2. Count warnings per rule and per distinct message
3. Emit "Warnings by rule (N of M files):" with one row per rule, most frequent first
4. Emit "Most frequent warnings:" with the top `topMessages` distinct messages, truncated to `maxMessageWidth`
5. Append the "… K more distinct warning(s)" remainder line when messages were omitted
6. Append the `--verbose` / `--format json` hint unless the reporter itself is verbose
