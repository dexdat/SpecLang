---
name: sip-080-cli-validate-speclang-v0
title: "SIP 80: CLI Validate Command"
version: 0.1.0
description: Spec validation and error reporting with speclang validate
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 80: CLI Validate Command

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the `speclang validate` command for spec validation.

### Quick Start

```bash
# Validate all specs
speclang validate

# Validate specific spec
speclang validate specs/auth.spec.md

# Strict mode with auto-fix
speclang validate --strict --fix
```

### Validation Levels

| Level | Description |
|-------|-------------|
| syntax | YAML/frontmatter parsing |
| headers | Required fields, format |
| refs | Reference resolution |
| blocks | Block syntax and IDs |
| semantic | Cross-spec consistency |

### When to Read This

- **CI/CD:** Validation pipeline
- **Pre-commit:** Hook integration
- **Debugging:** Error investigation

### Related SIPs

- SIP 37: CLI
- SIP 22: Validation
- SIP 65: Validation Rules

## Abstract

This SIP defines the `speclang validate` command that checks spec files for syntax errors, invalid references, and semantic consistency.

## Motivation

Users need:
- Fast validation
- Clear error messages
- Auto-fix capability
- CI/CD integration

## Rationale

**Multi-Level Validation:**
- Syntax first (fast fail)
- References second (dependencies)
- Semantic last (complex)

**Error Categories:**
- Errors: Must fix
- Warnings: Should fix
- Info: Suggestions

## Specification

### Command Signature

**@cli/validate:**

```bash
speclang validate [files...] [options]

Arguments:
  files        Specific files to validate (default: all)

Options:
  --strict     Treat warnings as errors
  --fix        Auto-fix simple issues
  --format     Output format: text, json, junit
  --level      Minimum level: error, warn, info
  --rules      Custom rules file
  --exclude    Exclude patterns
  --cache      Use validation cache

Aliases:
  speclang check
  speclang lint
```

### Validation Rules

**@validate/rules:**

#### Syntax Rules

| Rule | Level | Description |
|------|-------|-------------|
| yaml-parse | error | Valid YAML syntax |
| header-present | error | Header block exists |
| header-lines | error | Lines directive matches |
| id-format | error | Valid @id format |
| version-format | warn | SemVer format |

#### Reference Rules

| Rule | Level | Description |
|------|-------|-------------|
| ref-exists | error | Referenced block exists |
| ref-format | error | Valid @ref format |
| circular-ref | warn | Circular dependencies |
| orphan-block | warn | Unreferenced blocks |

#### Semantic Rules

| Rule | Level | Description |
|------|-------|-------------|
| layer-consistent | warn | Layer value reasonable |
| kind-valid | error | Valid block kind |
| id-unique | error | No duplicate IDs |
| tag-format | info | Tags follow convention |

### Error Reporting

**@validate/output:**

#### Text Format

```
speclang validate

specs/auth.spec.md
  12:3  error  yaml-parse  Invalid YAML: unexpected character
  45:1  error  ref-exists  Reference @refs/users not found
  78:5  warn   circular-ref  Circular dependency: @auth -> @users -> @auth

specs/user.spec.md
  23:1  warn   orphan-block  Block @user/helper is never referenced

✖ 3 errors, 2 warnings
```

#### JSON Format

```json
{
  "success": false,
  "summary": {
    "errors": 3,
    "warnings": 2,
    "info": 1,
    "files_checked": 15
  },
  "results": [
    {
      "file": "specs/auth.spec.md",
      "issues": [
        {
          "line": 12,
          "column": 3,
          "level": "error",
          "rule": "yaml-parse",
          "message": "Invalid YAML: unexpected character"
        }
      ]
    }
  ]
}
```

#### JUnit Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="speclang-validate" tests="15" failures="3">
    <testcase name="specs/auth.spec.md">
      <failure message="yaml-parse">
        Line 12: Invalid YAML: unexpected character
      </failure>
    </testcase>
  </testsuite>
</testsuites>
```

### Auto-Fix

**@validate/fix:**

#### Fixable Issues

| Issue | Fix |
|-------|-----|
| trailing-whitespace | Remove spaces |
| missing-newline | Add final newline |
| id-lowercase | Convert to lowercase |
| sort-header | Reorder header fields |
| normalize-refs | Standardize @ref format |

```bash
# Auto-fix simple issues
speclang validate --fix

# Preview fixes without applying
speclang validate --fix --dry-run
```

### Strict Mode

**@validate/strict:**

```bash
# Warnings become errors
speclang validate --strict

# With specific level
speclang validate --level=warn
```

### Custom Rules

**@validate/custom:**

```yaml
# .speclang-rules.yaml
rules:
  - name: require-layer
    level: error
    check: header.layer exists
    message: "Header must include layer field"

  - name: max-line-length
    level: warn
    check: line.length <= 120
    message: "Line exceeds 120 characters"

  - name: require-short
    level: error
    check: header.short exists
    message: "Header must include short description"
```

### Exclude Patterns

```bash
# Exclude generated specs
speclang validate --exclude="specs/generated/**"

# Multiple patterns
speclang validate --exclude="specs/draft/**" --exclude="**/*.tmp.spec.md"
```

### Caching

**@validate/cache:**

```bash
# Use cache for unchanged files
speclang validate --cache

# Cache location: .speclang/cache/validate.json
```

## Implementation

### Command Handler

```typescript
import { glob } from 'glob';
import { validateSpec, loadRules } from '@speclang/core';

interface ValidateOptions {
  strict: boolean;
  fix: boolean;
  format: 'text' | 'json' | 'junit';
  level: 'error' | 'warn' | 'info';
  rules?: string;
  exclude?: string[];
  cache: boolean;
}

export async function validateCommand(
  files: string[],
  options: ValidateOptions
) {
  const specFiles = files.length > 0
    ? files
    : await glob('specs/**/*.spec.{md,yaml,yml}');

  const excludePatterns = options.exclude || [];
  const filteredFiles = specFiles.filter(
    f => !excludePatterns.some(p => minimatch(f, p))
  );

  const rules = options.rules
    ? await loadRules(options.rules)
    : getDefaultRules();

  const results = await Promise.all(
    filteredFiles.map(f => validateSpec(f, rules, options))
  );

  if (options.fix) {
    await applyFixes(results, options.dryRun);
  }

  const output = formatResults(results, options.format);
  console.log(output);

  const hasErrors = results.some(r => r.errors > 0);
  const hasWarnings = results.some(r => r.warnings > 0);

  if (hasErrors || (options.strict && hasWarnings)) {
    process.exit(2);
  }
}
```

### Validator

```typescript
interface ValidationResult {
  file: string;
  issues: Issue[];
  errors: number;
  warnings: number;
  info: number;
}

interface Issue {
  line: number;
  column: number;
  level: 'error' | 'warn' | 'info';
  rule: string;
  message: string;
  fix?: Fix;
}

export async function validateSpec(
  filePath: string,
  rules: Rule[],
  options: ValidateOptions
): Promise<ValidationResult> {
  const content = await fs.readFile(filePath, 'utf-8');
  const issues: Issue[] = [];

  for (const rule of rules) {
    const ruleIssues = await rule.check(filePath, content);
    issues.push(...ruleIssues);
  }

  return {
    file: filePath,
    issues,
    errors: issues.filter(i => i.level === 'error').length,
    warnings: issues.filter(i => i.level === 'warn').length,
    info: issues.filter(i => i.level === 'info').length,
  };
}
```

### Rules Engine

```typescript
interface Rule {
  name: string;
  level: 'error' | 'warn' | 'info';
  check: (file: string, content: string) => Promise<Issue[]>;
}

const defaultRules: Rule[] = [
  {
    name: 'yaml-parse',
    level: 'error',
    check: async (file, content) => {
      const headerMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!headerMatch) return [];
      try {
        yaml.parse(headerMatch[1]);
        return [];
      } catch (e) {
        return [{
          line: 1,
          column: 1,
          level: 'error',
          rule: 'yaml-parse',
          message: `Invalid YAML: ${e.message}`,
        }];
      }
    },
  },
  {
    name: 'ref-exists',
    level: 'error',
    check: async (file, content) => {
      const refs = extractRefs(content);
      const issues: Issue[] = [];
      for (const ref of refs) {
        if (!(await refExists(ref))) {
          issues.push({
            line: ref.line,
            column: ref.column,
            level: 'error',
            rule: 'ref-exists',
            message: `Reference ${ref.id} not found`,
          });
        }
      }
      return issues;
    },
  },
];
```

### Output Formatters

```typescript
function formatText(results: ValidationResult[]): string {
  const lines: string[] = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const result of results) {
    if (result.issues.length > 0) {
      lines.push(result.file);
      for (const issue of result.issues) {
        lines.push(
          `  ${issue.line}:${issue.column}  ${issue.level}  ${issue.rule}  ${issue.message}`
        );
      }
      lines.push('');
    }
    totalErrors += result.errors;
    totalWarnings += result.warnings;
  }

  lines.push(`✖ ${totalErrors} errors, ${totalWarnings} warnings`);
  return lines.join('\n');
}

function formatJson(results: ValidationResult[]): string {
  return JSON.stringify({
    success: !results.some(r => r.errors > 0),
    summary: {
      errors: results.reduce((sum, r) => sum + r.errors, 0),
      warnings: results.reduce((sum, r) => sum + r.warnings, 0),
      files_checked: results.length,
    },
    results,
  }, null, 2);
}
```

### Auto-Fix Implementation

```typescript
async function applyFixes(
  results: ValidationResult[],
  dryRun: boolean
) {
  for (const result of results) {
    const fixableIssues = result.issues.filter(i => i.fix);
    if (fixableIssues.length === 0) continue;

    let content = await fs.readFile(result.file, 'utf-8');

    for (const issue of fixableIssues) {
      content = applyFix(content, issue.fix!);
    }

    if (dryRun) {
      console.log(`Would fix: ${result.file}`);
    } else {
      await fs.writeFile(result.file, content);
      console.log(`Fixed: ${result.file}`);
    }
  }
}

function applyFix(content: string, fix: Fix): string {
  switch (fix.type) {
    case 'replace-line':
      const lines = content.split('\n');
      lines[fix.line - 1] = fix.newLine;
      return lines.join('\n');
    case 'insert':
      return content.slice(0, fix.position) + fix.text + content.slice(fix.position);
    default:
      return content;
  }
}
```

## CI/CD Integration

### GitHub Actions

```yaml
validate:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - run: npm install -g speclang
    - run: speclang validate --strict --format=junit > results.xml
    - uses: actions/upload-artifact@v3
      with:
        name: validation-results
        path: results.xml
```

### Pre-commit Hook

```bash
#!/bin/bash
speclang validate --strict
if [ $? -ne 0 ]; then
  echo "Validation failed. Fix issues or use --no-verify to skip."
  exit 1
fi
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Validation passed |
| 2 | Validation errors found |
| 3 | Warnings in strict mode |
| 4 | Invalid options |

## References

- "@ref:sip-037-cli
- @ref:sip-022-validation
- @ref:sip-065-validation-rules
- @ref:sip-064-cli-commands

## Copyright

This document is in the public domain.
