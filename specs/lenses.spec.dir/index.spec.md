# speclang-header lines:18
id: "@specs/lenses"
version: 1.0.0
layer: 3
project_level: Alpha
agent_support: agent_assisted
tags: [lenses, parser, renderer, bidirectional]
target: src/lenses/index.ts
short: Lens System - bidirectional parsers/renderers for spec content
---

# Lens System Specification

The Lens System provides bidirectional conversion between structured Block objects and various content formats. Each lens is a specialized parser/renderer that detects and processes specific content types.

## Architecture

### Core Components

| Component | File | Purpose |
|-----------|------|---------|
| Index | `index.ts` | Main exports and initialization |
| Types | `types.ts` | Type definitions for Lens, Block, etc. |
| Registry | `registry.ts` | Lens registration and lookup |
| Converter | `converter.ts` | Unified conversion API |

### Lens Types

| Lens | Kind | Priority | Purpose |
|------|------|----------|---------|
| prose-lens | prose | 0 | Fallback for plain text |
| code-lens | code | 50 | Code blocks with syntax |
| entity-lens | entity | 60 | Entity/component definitions |
| operation-lens | operation | 55 | Operation blocks |
| math-lens | math | 45 | Mathematical expressions |
| acceptance-lens | acceptance | 65 | BDD acceptance criteria |
| diagram-lens | diagram | 70 | Diagrams (mermaid, etc.) |
| table-lens | table | 40 | Table structures |
| policy-lens | policy | 35 | Policy definitions |
| question-lens | question | 30 | Question blocks |
| decision-lens | decision | 32 | Decision records |

## @block:lens-interface @kind:interface

**Lens Interface:**
```typescript
interface Lens<TInput = any, TOutput = Block> {
  name: string;
  kind: string;
  description: string;
  priority: number;
  detect: (content: string) => boolean;
  parse: (content: string, context: LensContext) => Promise<Block>;
  render: (block: Block, context: LensContext) => Promise<string>;
}
```

**Block Structure:**
```typescript
interface Block {
  id: string;
  kind: string;
  content: string;
  metadata: Record<string, any>;
  children?: Block[];
  source?: {
    lens: string;
    original: string;
    line: number;
  };
}
```

## @block:initialization @kind:operation

**Steps:**
1. Create LensRegistry instance
2. Register each lens by priority (highest first)
3. Wrap registry in LensConverter
4. Export default registry and converter

**Priority Order:**
- diagramLens: 70
- acceptanceLens: 65
- entityLens: 60
- operationLens: 55
- codeLens: 50
- mathLens: 45
- tableLens: 40
- policyLens: 35
- decisionLens: 32
- questionLens: 30
- proseLens: 0 (fallback)

## @block:detection @kind:operation

**Detection Process:**
1. Iterate through registered lenses by priority
2. Call `detect()` on each lens with content
3. Return first matching lens (highest priority)
4. Fall back to proseLens if no match

**Error Handling:**
- If all lenses fail detection → use proseLens as fallback
- If parse fails → return error block with kind "error"
- If render fails → return original content wrapped in error

---

**References:**
- @ref:specs/core#blocks
