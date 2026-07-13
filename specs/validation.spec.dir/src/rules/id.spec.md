# speclang-header lines:10
id: "@specs/validation/rules/id"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
target: src/validation/rules/id.ts
tags: [validation, rules, id]
short: ID format validation rule
---

# ID Format Validation Rule

### @block::rule @kind:operation

Validates spec IDs according to format: @domain/path

**Steps:**
1. ID must start with @
2. Domain must be lowercase
3. Path must use forward slashes
4. No special characters except letters, numbers, /, -, _
5. No empty path segments
6. Must not end with /
7. Warn if ID > 200 chars

```typescript
const idRule: ValidationRule = {
  id: '@validation/id',
  name: 'ID Format Validation',
  level: 'error',
  check(spec, context?): ValidationResult[]
}

function validateId(id: string): ValidationResult[]
```
