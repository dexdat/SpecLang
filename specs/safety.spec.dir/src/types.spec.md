# speclang-header lines:12
id: "@specs/safety/types"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [safety, types]
short: Common types for safety modules
target: src/safety/types.ts
---

# Safety Common Types Spec

Common types used across safety modules.

## @block:types @kind:interface

### Spec

```typescript
export interface Spec {
  id: string;
  metadata: {
    agent_support: 'human_only' | 'agent_assisted' | 'agent_autonomous';
    tags?: string[];
  };
}
```

### ConfidenceScore

```typescript
export interface ConfidenceScore {
  score: number;
  factors: {
    historicalReliability: number;
    authorReputation: number;
    similarityToGood: number;
    testCoverage: number;
    reviewStatus: number;
  };
}
```

### Database (placeholder)

```typescript
export interface Database {
  run(query: string, ...params: any[]): Promise<void>;
}
```