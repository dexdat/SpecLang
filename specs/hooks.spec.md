# speclang-header lines:10
id: "@speclang/hooks"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [typescript, generated, auto-generated]
children:
short: "Hook execution system for pipeline - lifecycle and built-in handlers"
---
# Hook Execution System

Provides hook execution capabilities for the pipeline. Splits into two sub‑specs:

- **Lifecycle** (`@ref:specs/hooks.spec.dir/lifecycle`): Hook execution, context creation, and lifecycle management.
- **Handlers** (`@ref:specs/hooks.spec.dir/handlers`): Built‑in hook utilities and custom handler creation.

## @block:hooksystem @kind:entity

```typescript
// High-level hook system overview
export interface HookSystem {
  executor: HookExecutor;
  builtIn: typeof BuiltInHooks;
  createContext: typeof createHookContext;
}
```

