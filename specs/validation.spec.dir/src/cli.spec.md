# speclang-header lines:13
id: @specs/validation/cli
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
target: src/validation/cli.ts
tags: [validation, cli]
short: Validation CLI command
---

# Validation CLI

### @block:command @kind:operation

Command-line interface for running validation.

**Steps:**
1. Parse CLI options (files, projectDir, strict, verbose, format)
2. Create ValidationEngine with strict mode setting
3. Create ValidationReporter with verbose setting
4. Expand glob patterns to find all spec files
5. For each file: parse spec, run validation, output results
6. Return ValidateResult with summary statistics

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
