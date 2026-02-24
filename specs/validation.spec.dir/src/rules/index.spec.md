# speclang-header lines:13
id: @specs/validation/rules/index
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
target: src/validation/rules/index.ts
tags: [validation, rules, registry]
short: Rule registry and exports
---

# Validation Rules Index

### @block:registry @kind:entity

Manages registration and retrieval of validation rules.

```typescript
class RuleRegistry {
  constructor()
  register(rule: ValidationRule): void
  unregister(id: string): boolean
  get(id: string): ValidationRule | undefined
  getAll(): ValidationRule[]
  getEnabled(): ValidationRule[]
  getByLevel(level: 'error' | 'warning'): ValidationRule[]
  enable(id: string): boolean
  disable(id: string): boolean
  isEnabled(id: string): boolean
  applyConfig(config: ValidationConfig): void
  async loadCustomRules(paths: string[]): void
  get count(): number
  get enabledCount(): number
}

const BUILTIN_RULES: ValidationRule[]
function getRegistry(): RuleRegistry
function resetRegistry(): void
export { headerRule, idRule, refsRule, blocksRule, autonomousRule }
```
