# speclang-header lines:10
id: "@specs/maturity/validation"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [maturity, validation]
short: Maturity Validation Spec
target: src/maturity/validation.ts
---

# Maturity Validation Spec

### @block:validation-interface @kind:interface
```typescript
export interface ValidationResult {
  valid: boolean;
  violations: Violation[];
  suggestions: string[];
  level: MaturityLevel;
}

export interface Violation {
  rule: string;
  message: string;
  severity: 'error' | 'warning';
  block?: string;
}

export type MaturityLevel = 'POC' | 'MVP' | 'Alpha' | 'Beta' | 'Production' | 'Startup' | 'SMB' | 'MSB' | 'Enterprise';
```

### @block:validate-function @kind:function
```typescript
export function validateMaturity(spec: Spec): ValidationResult {
  // Check required fields
  // Validate consistency rules
  // Return result with violations and suggestions
}
```

### @block:consistency-rules @kind:entity
```typescript
const CONSISTENCY_RULES = {
  autonomousRequiresBeta: {
    check: (spec: Spec) => spec.agent_support === 'agent_autonomous' ? spec.project_level >= 'Beta' : true,
    message: 'Specs with agent_autonomous must have project_level >= Beta'
  },
  productionRequiresDeps: {
    check: (spec: Spec) => spec.project_level === 'Production' ? spec.depends_on?.length > 0 : true,
    message: 'Production specs must have complete depends_on references'
  },
  enterpriseRequiresCompliance: {
    check: (spec: Spec) => spec.project_level === 'Enterprise' ? spec.tags?.includes('compliance') : true,
    message: 'Enterprise specs must have compliance tags'
  }
};
```
