---
id: "@specs/validation/rules/blocks"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
target: src/validation/rules/blocks.ts
tags: [validation, rules, blocks]
short: Block validation rule
---

# Block Validation Rule

### @block::rule @kind:operation

Validates content blocks in specs.

**Valid kinds:** entity, operation, policy, test, mock, diagram, code, note, question, decision

**Steps:**
1. Check block IDs are unique
2. Check block IDs follow @block::name format
3. Check block kinds are valid
4. Check content not empty for required types

```typescript
const VALID_BLOCK_KINDS = ['entity', 'operation', 'policy', 'test', 'mock', 'diagram', 'code', 'note', 'question', 'decision']

const blocksRule: ValidationRule = {
  id: '@validation/blocks',
  name: 'Block Validation',
  level: 'error',
  check(spec, context?): ValidationResult[]
}

function validateBlock(block, filepath): ValidationResult[]
function isValidBlockKind(kind: string): boolean
```
