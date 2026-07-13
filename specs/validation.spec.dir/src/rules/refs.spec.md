# speclang-header lines:10
id: "@specs/validation/rules/refs"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
target: src/validation/rules/refs.ts
tags: [validation, rules, refs]
short: Reference validation rule
---

# Reference Validation Rule

### @block::rule @kind:operation

Validates references in specs.

**Steps:**
1. Parse reference format: @ref:path or @ref:path#block
2. Check target spec exists
3. Check target block exists (if specified)
4. Detect circular dependencies

```typescript
const refsRule: ValidationRule = {
  id: '@validation/refs',
  name: 'Reference Validation',
  level: 'error',
  check(spec, context?): ValidationResult[]
}

function buildDependencyGraph(specs: ParsedSpec[]): Map<string, string[]>
```
