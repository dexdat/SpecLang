# speclang-header lines:10
id: "@specs/validation/cli"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
target: src/validation/cli.ts
tags: [validation, cli]
short: Validation CLI command
---

# Validation CLI

### @block::command @kind:operation

Command-line interface for running validation.

**Steps:**
1. Parse CLI options (files, projectDir, strict, verbose, format)
2. Create ValidationEngine with strict mode setting
3. Create ValidationReporter with verbose setting
4. Expand glob patterns to find all spec files
5. For each file: parse spec and run validation. In `text` output, print a per-file block ONLY for a file that failed (its errors are the actionable part); clean files print nothing unless `--verbose`
6. Print the summary (files, passed, failed, errors, warnings) and, when `warnings > 0`, the compact `formatWarningSummary` breakdown — detail stays on `--verbose` / `--format json`
7. Return ValidateResult with summary statistics

Warnings never affect `success`: only errors (and, in strict mode, warnings
promoted to errors) do.

```typescript
interface ValidateOptions {
  files: string[];
  projectDir: string;
  strict?: boolean;
  verbose?: boolean;
  format?: 'text' | 'json' | 'minimal';
}

interface ValidateResult {
  success: boolean;
  totalFiles: number;
  passedFiles: number;
  failedFiles: number;
  errors: number;
  warnings: number;
  reports?: any[];
}

async function validateCommand(options: ValidateOptions): Promise<ValidateResult>
```
