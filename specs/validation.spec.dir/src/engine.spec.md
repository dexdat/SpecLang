# speclang-header lines:10
id: "@specs/validation/engine"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
target: src/validation/engine.ts
tags: [validation, engine]
short: Validation engine implementation
---

# Validation Engine

### @block::class @kind:entity

The ValidationEngine executes validation rules against specs and produces reports.

```typescript
class ValidationEngine {
  constructor(config?: Partial<ValidationConfig>)
  async validate(spec: ParsedSpec, context?: Partial<ValidationContext>): Promise<ValidationReport>
  async validateAll(specs: ParsedSpec[]): Promise<ValidationReport[]>
  async validateBatch(specs: ParsedSpec[]): Promise<ValidationReportBatch>
  getRegistry(): RuleRegistry
  setConfig(config: Partial<ValidationConfig>): void
  getConfig(): ValidationConfig
  addRule(rule: ValidationRule): void
  removeRule(id: string): boolean
}

function getEngine(config?: Partial<ValidationConfig>): ValidationEngine
function resetEngine(): void
async function validate(spec: ParsedSpec, context?: Partial<ValidationContext>): Promise<ValidationReport>
async function validateAll(specs: ParsedSpec[]): Promise<ValidationReport[]>
```
