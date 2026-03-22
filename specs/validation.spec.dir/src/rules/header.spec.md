# speclang-header lines:13
id: "@specs/validation/rules/header"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
target: src/validation/rules/header.ts
tags: [validation, rules, header]
short: Header validation rule
---

# Header Validation Rule

### @block::rule @kind:operation

Validates spec file headers according to the universal header format.

**Steps:**
1. Check line 1 is comment or blank or contains speclang-header
2. Verify speclang-header declaration exists
3. Check speclang-header declares line count
4. Validate required fields: id, version
5. Validate project_level, agent_support, status if present
6. Validate layer is 0-10 if present
7. Validate version is semver format if present

```typescript
const VALID_PROJECT_LEVELS = ['POC', 'MVP', 'Alpha', 'Beta', 'Production', 'Startup', 'SMB', 'MSB', 'Enterprise']
const VALID_AGENT_SUPPORT = ['human_only', 'agent_assisted', 'agent_autonomous']
const VALID_STATUSES = ['draft', 'stable', 'deprecated', 'active', 'generated']

const headerRule: ValidationRule = {
  id: '@validation/header',
  name: 'Header Validation',
  level: 'error',
  check(spec, context?): ValidationResult[]
}
```
