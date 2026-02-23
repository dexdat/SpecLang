# Bootstrap Phase 4.8: Pipeline Conditions

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 4.8 of the bootstrap process.

**Prerequisites**: 
- Phase 4.1-4.7 (Pipeline system) complete
- Hooks and stages implemented
- Recovery actions defined

## Your Task
Implement the pipeline condition system for conditional stage execution, boolean evaluation, and complex condition composition.

## Read These Specs First
1. `specs/pipeline.spec.md` - Pipeline overview
2. `specs/hooks.spec.md` - Hook definitions
3. `specs/guard.spec.md` - Guard conditions

## What to Build

### Files to Create
```
src/pipeline/
├── conditions/
│   ├── index.ts           # Condition exports
│   ├── evaluator.ts       # Condition evaluation engine
│   ├── types.ts           # Condition type definitions
│   ├── builtins.ts        # Built-in conditions
│   ├── composition.ts     # AND, OR, NOT composition
│   └── context.ts         # Condition evaluation context

tests/pipeline/
└── conditions.test.ts
```

### Requirements

#### 1. Condition Types

```typescript
// src/pipeline/conditions/types.ts

export type ConditionResult = 
  | { passed: true; value: true }
  | { passed: false; value: false; reason: string };

export interface Condition {
  type: string;
  evaluate(context: ConditionContext): Promise<ConditionResult>;
  description?: string;
}

export interface ConditionContext {
  stage: string;
  file?: string;
  spec?: SpecInfo;
  metadata: Record<string, unknown>;
  env: Record<string, string>;
  previousResults: Map<string, ConditionResult>;
}

export interface SpecInfo {
  id: string;
  filepath: string;
  header: Record<string, unknown>;
  blocks: Block[];
}

export type ConditionOperator = 
  | 'eq'      // equals
  | 'ne'      // not equals
  | 'gt'      // greater than
  | 'gte'     // greater than or equal
  | 'lt'      // less than
  | 'lte'     // less than or equal
  | 'contains'
  | 'matches' // regex
  | 'exists';

export interface ValueCondition extends Condition {
  type: 'value';
  field: string;
  operator: ConditionOperator;
  expected: unknown;
}

export interface FileCondition extends Condition {
  type: 'file';
  pattern?: string;
  exists?: boolean;
  modifiedAfter?: string;
  size?: { min?: number; max?: number };
}

export interface SpecCondition extends Condition {
  type: 'spec';
  hasTag?: string | string[];
  hasLayer?: number | { min?: number; max?: number };
  hasBlock?: string;
  hasRef?: string;
  projectLevel?: string | string[];
}

export interface EnvCondition extends Condition {
  type: 'env';
  variable: string;
  operator: ConditionOperator;
  expected?: string;
}

export interface CompositeCondition extends Condition {
  type: 'and' | 'or' | 'not';
  conditions: Condition[];
}

export interface CustomCondition extends Condition {
  type: 'custom';
  name: string;
  params?: Record<string, unknown>;
}
```

#### 2. Condition Evaluator

```typescript
// src/pipeline/conditions/evaluator.ts

import { Condition, ConditionResult, ConditionContext } from './types';

export class ConditionEvaluator {
  private customConditions: Map<string, Condition> = new Map();
  
  registerCustom(name: string, condition: Condition): void {
    this.customConditions.set(name, condition);
  }
  
  async evaluate(condition: Condition, context: ConditionContext): Promise<ConditionResult> {
    try {
      return await condition.evaluate(context);
    } catch (error) {
      return {
        passed: false,
        value: false,
        reason: `Evaluation error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
  
  async evaluateAll(conditions: Condition[], context: ConditionContext): Promise<Map<string, ConditionResult>> {
    const results = new Map<string, ConditionResult>();
    
    for (const condition of conditions) {
      const result = await this.evaluate(condition, context);
      results.set(this.getConditionKey(condition), result);
    }
    
    return results;
  }
  
  private getConditionKey(condition: Condition): string {
    return `${condition.type}:${JSON.stringify(condition)}`;
  }
}

export function createEvaluator(): ConditionEvaluator {
  return new ConditionEvaluator();
}
```

#### 3. Built-in Conditions

```typescript
// src/pipeline/conditions/builtins.ts

import { 
  Condition, 
  ConditionResult, 
  ConditionContext,
  ValueCondition,
  FileCondition,
  SpecCondition,
  EnvCondition,
} from './types';
import { existsSync, statSync } from 'fs';
import { glob } from 'glob';

// Value condition
export class ValueConditionImpl implements Condition {
  type = 'value' as const;
  
  constructor(
    public field: string,
    public operator: ConditionOperator,
    public expected: unknown,
    public description?: string
  ) {}
  
  async evaluate(context: ConditionContext): Promise<ConditionResult> {
    const value = this.getFieldValue(context);
    const passed = this.compare(value, this.expected, this.operator);
    
    return {
      passed,
      value: passed,
      reason: passed 
        ? '' 
        : `Expected ${this.field} ${this.operator} ${this.expected}, got ${value}`,
    };
  }
  
  private getFieldValue(context: ConditionContext): unknown {
    const parts = this.field.split('.');
    let value: unknown = context;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }
  
  private compare(actual: unknown, expected: unknown, op: ConditionOperator): boolean {
    switch (op) {
      case 'eq': return actual === expected;
      case 'ne': return actual !== expected;
      case 'gt': return Number(actual) > Number(expected);
      case 'gte': return Number(actual) >= Number(expected);
      case 'lt': return Number(actual) < Number(expected);
      case 'lte': return Number(actual) <= Number(expected);
      case 'contains': 
        if (Array.isArray(actual)) return actual.includes(expected);
        if (typeof actual === 'string') return actual.includes(String(expected));
        return false;
      case 'matches':
        if (typeof actual !== 'string') return false;
        return new RegExp(String(expected)).test(actual);
      case 'exists': return actual !== undefined && actual !== null;
      default: return false;
    }
  }
}

// File condition
export class FileConditionImpl implements Condition {
  type = 'file' as const;
  
  constructor(
    public pattern?: string,
    public exists?: boolean,
    public modifiedAfter?: string,
    public size?: { min?: number; max?: number },
    public description?: string
  ) {}
  
  async evaluate(context: ConditionContext): Promise<ConditionResult> {
    const filepath = context.file;
    
    if (!filepath) {
      return { passed: false, value: false, reason: 'No file in context' };
    }
    
    // Check existence
    if (this.exists !== undefined) {
      const fileExists = existsSync(filepath);
      if (fileExists !== this.exists) {
        return {
          passed: false,
          value: false,
          reason: `File ${this.exists ? 'should exist' : 'should not exist'}: ${filepath}`,
        };
      }
    }
    
    // Check pattern match
    if (this.pattern) {
      const matches = await glob(this.pattern);
      if (!matches.includes(filepath)) {
        return {
          passed: false,
          value: false,
          reason: `File does not match pattern: ${this.pattern}`,
        };
      }
    }
    
    // Check modification time
    if (this.modifiedAfter) {
      const stats = statSync(filepath);
      const threshold = new Date(this.modifiedAfter);
      if (stats.mtime < threshold) {
        return {
          passed: false,
          value: false,
          reason: `File modified before ${this.modifiedAfter}`,
        };
      }
    }
    
    // Check size
    if (this.size) {
      const stats = statSync(filepath);
      if (this.size.min !== undefined && stats.size < this.size.min) {
        return {
          passed: false,
          value: false,
          reason: `File size ${stats.size} < minimum ${this.size.min}`,
        };
      }
      if (this.size.max !== undefined && stats.size > this.size.max) {
        return {
          passed: false,
          value: false,
          reason: `File size ${stats.size} > maximum ${this.size.max}`,
        };
      }
    }
    
    return { passed: true, value: true };
  }
}

// Spec condition
export class SpecConditionImpl implements Condition {
  type = 'spec' as const;
  
  constructor(
    public hasTag?: string | string[],
    public hasLayer?: number | { min?: number; max?: number },
    public hasBlock?: string,
    public hasRef?: string,
    public projectLevel?: string | string[],
    public description?: string
  ) {}
  
  async evaluate(context: ConditionContext): Promise<ConditionResult> {
    const spec = context.spec;
    
    if (!spec) {
      return { passed: false, value: false, reason: 'No spec in context' };
    }
    
    // Check tags
    if (this.hasTag) {
      const tags = spec.header.tags as string[] || [];
      const requiredTags = Array.isArray(this.hasTag) ? this.hasTag : [this.hasTag];
      const missing = requiredTags.filter(t => !tags.includes(t));
      if (missing.length > 0) {
        return {
          passed: false,
          value: false,
          reason: `Missing tags: ${missing.join(', ')}`,
        };
      }
    }
    
    // Check layer
    if (this.hasLayer !== undefined) {
      const layer = spec.header.layer as number;
      if (typeof this.hasLayer === 'number') {
        if (layer !== this.hasLayer) {
          return {
            passed: false,
            value: false,
            reason: `Expected layer ${this.hasLayer}, got ${layer}`,
          };
        }
      } else {
        if (this.hasLayer.min !== undefined && layer < this.hasLayer.min) {
          return {
            passed: false,
            value: false,
            reason: `Layer ${layer} < minimum ${this.hasLayer.min}`,
          };
        }
        if (this.hasLayer.max !== undefined && layer > this.hasLayer.max) {
          return {
            passed: false,
            value: false,
            reason: `Layer ${layer} > maximum ${this.hasLayer.max}`,
          };
        }
      }
    }
    
    // Check block
    if (this.hasBlock) {
      const hasBlock = spec.blocks.some(b => b.id === this.hasBlock);
      if (!hasBlock) {
        return {
          passed: false,
          value: false,
          reason: `Missing block: ${this.hasBlock}`,
        };
      }
    }
    
    // Check ref
    if (this.hasRef) {
      const content = JSON.stringify(spec);
      if (!content.includes(this.hasRef)) {
        return {
          passed: false,
          value: false,
          reason: `Missing reference: ${this.hasRef}`,
        };
      }
    }
    
    // Check project level
    if (this.projectLevel) {
      const level = spec.header.project_level as string;
      const requiredLevels = Array.isArray(this.projectLevel) ? this.projectLevel : [this.projectLevel];
      if (!requiredLevels.includes(level)) {
        return {
          passed: false,
          value: false,
          reason: `Expected project level in [${requiredLevels.join(', ')}], got ${level}`,
        };
      }
    }
    
    return { passed: true, value: true };
  }
}

// Environment condition
export class EnvConditionImpl implements Condition {
  type = 'env' as const;
  
  constructor(
    public variable: string,
    public operator: ConditionOperator,
    public expected?: string,
    public description?: string
  ) {}
  
  async evaluate(context: ConditionContext): Promise<ConditionResult> {
    const value = context.env[this.variable];
    
    switch (this.operator) {
      case 'exists':
        return value !== undefined
          ? { passed: true, value: true }
          : { passed: false, value: false, reason: `Environment variable not set: ${this.variable}` };
      
      case 'eq':
        return value === this.expected
          ? { passed: true, value: true }
          : { passed: false, value: false, reason: `Expected ${this.variable}=${this.expected}, got ${value}` };
      
      case 'ne':
        return value !== this.expected
          ? { passed: true, value: true }
          : { passed: false, value: false, reason: `${this.variable} should not equal ${this.expected}` };
      
      case 'contains':
        return value?.includes(String(this.expected))
          ? { passed: true, value: true }
          : { passed: false, value: false, reason: `${this.variable} does not contain ${this.expected}` };
      
      case 'matches':
        return value && new RegExp(String(this.expected)).test(value)
          ? { passed: true, value: true }
          : { passed: false, value: false, reason: `${this.variable} does not match ${this.expected}` };
      
      default:
        return { passed: false, value: false, reason: `Unknown operator: ${this.operator}` };
    }
  }
}

// Factory functions
export const Conditions = {
  value: (field: string, operator: ConditionOperator, expected: unknown, description?: string): ValueConditionImpl =>
    new ValueConditionImpl(field, operator, expected, description),
  
  file: (options: Omit<FileCondition, 'type' | 'evaluate'>): FileConditionImpl =>
    new FileConditionImpl(options.pattern, options.exists, options.modifiedAfter, options.size, options.description),
  
  spec: (options: Omit<SpecCondition, 'type' | 'evaluate'>): SpecConditionImpl =>
    new SpecConditionImpl(options.hasTag, options.hasLayer, options.hasBlock, options.hasRef, options.projectLevel, options.description),
  
  env: (variable: string, operator: ConditionOperator, expected?: string, description?: string): EnvConditionImpl =>
    new EnvConditionImpl(variable, operator, expected, description),
};
```

#### 4. Condition Composition

```typescript
// src/pipeline/conditions/composition.ts

import { Condition, ConditionResult, ConditionContext, CompositeCondition } from './types';

export class AndCondition implements Condition {
  type = 'and' as const;
  
  constructor(
    public conditions: Condition[],
    public description?: string
  ) {}
  
  async evaluate(context: ConditionContext): Promise<ConditionResult> {
    const results: ConditionResult[] = [];
    
    for (const condition of this.conditions) {
      const result = await condition.evaluate(context);
      results.push(result);
      
      if (!result.passed) {
        return {
          passed: false,
          value: false,
          reason: `AND failed at condition ${results.length}: ${result.reason}`,
        };
      }
    }
    
    return { passed: true, value: true };
  }
}

export class OrCondition implements Condition {
  type = 'or' as const;
  
  constructor(
    public conditions: Condition[],
    public description?: string
  ) {}
  
  async evaluate(context: ConditionContext): Promise<ConditionResult> {
    const reasons: string[] = [];
    
    for (const condition of this.conditions) {
      const result = await condition.evaluate(context);
      
      if (result.passed) {
        return { passed: true, value: true };
      }
      
      reasons.push(result.reason);
    }
    
    return {
      passed: false,
      value: false,
      reason: `OR failed: ${reasons.join('; ')}`,
    };
  }
}

export class NotCondition implements Condition {
  type = 'not' as const;
  
  constructor(
    public conditions: [Condition],
    public description?: string
  ) {}
  
  async evaluate(context: ConditionContext): Promise<ConditionResult> {
    const result = await this.conditions[0].evaluate(context);
    
    return {
      passed: !result.passed,
      value: !result.passed,
      reason: result.passed 
        ? 'NOT: condition was true' 
        : '',
    };
  }
}

// Short-circuit evaluation
export class AllCondition implements Condition {
  type = 'and' as const;
  
  constructor(
    public conditions: Condition[],
    public shortCircuit = true,
    public description?: string
  ) {}
  
  async evaluate(context: ConditionContext): Promise<ConditionResult> {
    const results = await Promise.all(
      this.conditions.map(c => c.evaluate(context))
    );
    
    const allPassed = results.every(r => r.passed);
    
    if (allPassed) {
      return { passed: true, value: true };
    }
    
    const failedReasons = results
      .filter(r => !r.passed)
      .map(r => r.reason);
    
    return {
      passed: false,
      value: false,
      reason: `All failed: ${failedReasons.join('; ')}`,
    };
  }
}

export class AnyCondition implements Condition {
  type = 'or' as const;
  
  constructor(
    public conditions: Condition[],
    public description?: string
  ) {}
  
  async evaluate(context: ConditionContext): Promise<ConditionResult> {
    const results = await Promise.all(
      this.conditions.map(c => c.evaluate(context))
    );
    
    const anyPassed = results.some(r => r.passed);
    
    if (anyPassed) {
      return { passed: true, value: true };
    }
    
    const allReasons = results.map(r => r.reason);
    
    return {
      passed: false,
      value: false,
      reason: `Any failed: ${allReasons.join('; ')}`,
    };
  }
}

// Factory functions
export const compose = {
  and: (...conditions: Condition[]): AndCondition => new AndCondition(conditions),
  or: (...conditions: Condition[]): OrCondition => new OrCondition(conditions),
  not: (condition: Condition): NotCondition => new NotCondition([condition]),
  all: (conditions: Condition[], shortCircuit = true): AllCondition => 
    new AllCondition(conditions, shortCircuit),
  any: (conditions: Condition[]): AnyCondition => new AnyCondition(conditions),
};
```

#### 5. Condition Context Builder

```typescript
// src/pipeline/conditions/context.ts

import { ConditionContext, SpecInfo } from './types';

export interface ConditionContextBuilder {
  setStage(stage: string): this;
  setFile(filepath: string): this;
  setSpec(spec: SpecInfo): this;
  setMetadata(key: string, value: unknown): this;
  setEnv(key: string, value: string): this;
  addPreviousResult(key: string, result: ConditionResult): this;
  build(): ConditionContext;
}

export class ConditionContextImpl implements ConditionContext, ConditionContextBuilder {
  stage: string = '';
  file?: string;
  spec?: SpecInfo;
  metadata: Record<string, unknown> = {};
  env: Record<string, string> = {};
  previousResults: Map<string, ConditionResult> = new Map();
  
  setStage(stage: string): this {
    this.stage = stage;
    return this;
  }
  
  setFile(filepath: string): this {
    this.file = filepath;
    return this;
  }
  
  setSpec(spec: SpecInfo): this {
    this.spec = spec;
    return this;
  }
  
  setMetadata(key: string, value: unknown): this {
    this.metadata[key] = value;
    return this;
  }
  
  setEnv(key: string, value: string): this {
    this.env[key] = value;
    return this;
  }
  
  addPreviousResult(key: string, result: ConditionResult): this {
    this.previousResults.set(key, result);
    return this;
  }
  
  build(): ConditionContext {
    return {
      stage: this.stage,
      file: this.file,
      spec: this.spec,
      metadata: { ...this.metadata },
      env: { ...this.env },
      previousResults: new Map(this.previousResults),
    };
  }
}

export function createContext(): ConditionContextBuilder {
  return new ConditionContextImpl();
}
```

#### 6. Stage Conditional Execution

```typescript
// src/pipeline/conditions/stage-execution.ts

import { Condition, ConditionContext, ConditionResult } from './types';
import { ConditionEvaluator } from './evaluator';

export interface StageExecution {
  stage: string;
  condition: Condition;
  onPass: () => Promise<void>;
  onFail?: (reason: string) => Promise<void>;
  skipOnFail?: boolean;
}

export interface ConditionalPipeline {
  stages: StageExecution[];
  evaluator: ConditionEvaluator;
}

export async function executeConditionalPipeline(
  pipeline: ConditionalPipeline,
  initialContext: ConditionContext
): Promise<Map<string, ConditionResult>> {
  const results = new Map<string, ConditionResult>();
  const context = { ...initialContext };
  
  for (const stage of pipeline.stages) {
    context.stage = stage.stage;
    context.previousResults = results;
    
    const result = await pipeline.evaluator.evaluate(stage.condition, context);
    results.set(stage.stage, result);
    
    if (result.passed) {
      await stage.onPass();
    } else if (stage.onFail && !stage.skipOnFail) {
      await stage.onFail(result.reason);
    }
  }
  
  return results;
}

// Helper to create conditional stage
export function when(
  stage: string,
  condition: Condition,
  onPass: () => Promise<void>,
  options?: { onFail?: (reason: string) => Promise<void>; skipOnFail?: boolean }
): StageExecution {
  return {
    stage,
    condition,
    onPass,
    onFail: options?.onFail,
    skipOnFail: options?.skipOnFail ?? false,
  };
}
```

### Condition Exports

```typescript
// src/pipeline/conditions/index.ts

export * from './types';
export * from './evaluator';
export * from './builtins';
export * from './composition';
export * from './context';
export * from './stage-execution';
```

## Test Cases
1. Value condition evaluates correctly
2. File condition checks existence
3. Spec condition checks tags/layers
4. Environment condition checks vars
5. AND composition short-circuits
6. OR composition passes on first match
7. NOT inverts result
8. Context builder creates valid context
9. Conditional pipeline executes stages
10. Previous results available to conditions

## Validation
```bash
bun test tests/pipeline/conditions.test.ts
npx tsc --noEmit src/pipeline/conditions/
```

## Output Format
After completing, output:
1. Condition types implemented
2. Evaluator implemented
3. Built-in conditions implemented
4. Composition operators implemented
5. Context builder implemented
6. Stage execution implemented
7. Test results
