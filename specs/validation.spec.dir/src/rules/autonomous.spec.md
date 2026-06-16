# speclang-header lines:9
id: "@specs/validation/rules/autonomous"
version: 1.1.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
target: src/validation/rules/autonomous.ts
tags: [validation, rules, autonomous]
short: "Autonomous mode validation rule"
---

# Autonomous Mode Validation Rule

### @block::rule @kind:operation

Additional validation for specs with agent_support: agent_autonomous

**Required fields:** layer, project_level, tags, short

**Steps:**
1. Only applies to agent_autonomous specs
2. Check required fields present (layer, project_level, tags, short)
3. Check operation blocks have step-by-step descriptions
4. Check for ambiguous language (modal verbs, uncertainty, vague quantifiers, imprecise terms, subjective language)
5. Check tags not empty
6. Check layer 0-10
7. Check @ref: in content declared in header

**Ambiguous patterns:** modal verbs (should, could, might, may, would), uncertainty (maybe, perhaps, possibly, probably), vague quantifiers (some, few, many, several, various), imprecise terms (etc., and so on, and more, among others), subjective language (better, worse, fast, slow, easy, hard).

**Step detection:** numbered steps, "step N", bullets (2+), sequence words (first, then, next, finally)

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
