# speclang-header lines:13
id: @specs/validation/rules/autonomous
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
target: src/validation/rules/autonomous.ts
tags: [validation, rules, autonomous]
short: Autonomous mode validation rule
---

# Autonomous Mode Validation Rule

### @block:rule @kind:operation

Additional validation for specs with agent_support: agent_autonomous

**Required fields:** layer, project_level, tags, short

**Steps:**
1. Only applies to agent_autonomous specs
2. Check required fields present
3. Check operation blocks have step-by-step
4. Check for ambiguous language (TBD, TODO, maybe)
5. Check tags not empty
6. Check layer 0-10
7. Check @ref: in content declared in header

**Step detection:** numbered steps, "step N", bullets (2+), sequence words

```typescript
const REQUIRED_AUTONOMOUS_FIELDS = ['layer', 'project_level', 'tags', 'short']
const AMBIGUOUS_PATTERNS = [...]

const autonomousRule: ValidationRule = {
  id: '@validation/autonomous',
  name: 'Autonomous Mode Validation',
  level: 'error',
  check(spec, context?): ValidationResult[]
}
```
