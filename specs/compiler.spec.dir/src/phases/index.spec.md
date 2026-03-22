# speclang-header lines:12
id: "@specs/compiler/phases"
version: 1.0.0
layer: 4
project_level: Alpha
agent_support: agent_autonomous
tags: [compiler, phases]
short: Compiler phases - parse, validate, resolve, transform, codegen
target: src/compiler/phases/index.ts
---

# Compiler Phases

The compilation pipeline consists of distinct phases that transform specs into code.

### @block::phases-export @kind:code

```typescript
export * from './types';
export * from './errors';
export { parse, parsePhase } from './parse';
export { validate } from './validate';
export { resolve } from './resolve';
export { transform } from './transform';
export { codegen } from './codegen';
export { detectDrift, syncCodeToSpec, syncSpecToCode } from './sync';
export { compileIncremental, invalidateCache } from './incremental';
export * from './plugins';
```
