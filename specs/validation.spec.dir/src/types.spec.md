---
id: "@specs/validation/types"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
target: src/validation/types.ts
tags: [validation, types]
short: Validation type definitions
---

# Validation Types

### @block::interfaces @kind:entity

Core type definitions for the validation system.

```typescript
interface ValidationRule {
  id: string;
  name: string;
  level: 'error' | 'warning';
  check: (spec: ParsedSpec, context?: ValidationContext) => ValidationResult[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

interface ValidationResult {
  rule: string;
  level: 'error' | 'warning';
  location: { file: string; line: number | 'header' | 'content' | 'metadata'; column?: number };
  message: string;
  suggestion?: string;
}

interface ValidationReport {
  file: string;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  passed: boolean;
  timestamp: Date;
}

interface ValidationContext {
  baseDir: string;
  allSpecs: Map<string, ParsedSpec>;
  dependencyGraph: Map<string, string[]>;
  config: ValidationConfig;
  fs: ValidationFileSystem;
}

interface ValidationConfig {
  enabled?: boolean;
  strict?: boolean;
  customRules?: CustomRuleConfig[];
  rules?: Record<string, RuleSetting>;
}
```

### @block::helpers @kind:code

Helper functions: createError(), createWarning(), DEFAULT_VALIDATION_CONFIG
