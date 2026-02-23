# speclang-header lines:11
id: @speclang/registry
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [typescript, generated, auto-generated]
short: "Auto-generated spec for registry.ts"
status: generated
children: ["@speclang/registry/storage", "@speclang/registry/lookup"]
---
## @block:agentregistry @kind:entity
```text
export class AgentRegistry extends EventEmitter {
```

## @block:createagentregistry @kind:code
```typescript
export function createAgentRegistry(): AgentRegistry {
```

## Sub-specs

This spec has been split into focused sub-specs for better organization:

### @ref:specs/registry/storage
- Storage and indexing aspects of agent registry
- Register, unregister, setStatus, clear operations
- Internal data structures (agents map, role index)

### @ref:specs/registry/lookup
- Lookup and querying aspects of agent registry
- Get, getAll, getByRole, getBySessionId, getByStatus, getActive, has, countByRole, count operations
- Private emitEvent helper

*See individual parts in `registry.spec.dir/`.*