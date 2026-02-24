# speclang-header lines:13
id: @specs/validation/index
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
target: src/validation/index.ts
tags: [validation, exports]
short: Validation module exports
---

# Validation Module Index

### @block:exports @kind:code

Exports all validation types, engine, reporter, CLI, and rules.

```typescript
export * from './types';
export { ValidationEngine, getEngine, resetEngine, validate, validateAll } from './engine';
export { ValidationReporter, format, formatBatch, formatJSON, formatSummary } from './reporter';
export { validateCommand, ValidateOptions, ValidateResult } from './cli';
export { RuleRegistry, getRegistry, resetRegistry, headerRule, idRule, refsRule, blocksRule, autonomousRule, BUILTIN_RULES } from './rules';
```
