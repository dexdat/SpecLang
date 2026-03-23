# speclang-header lines:10
id: "@speclang/registry/storage"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [registry, storage, agents]
short: Storage and indexing aspects of agent registry
parent: @ref:specs/registry
part: 1/2
---
## @block:agentregistry @kind:entity
```text
export class AgentRegistry extends EventEmitter {
```

## @block:register @kind:code
```typescript
register(agent: Agent): void
```

### Description
Adds an agent to the registry and indexes it by role.

### Implementation Details
- Stores agent in `agents` Map keyed by agent ID
- Updates `roleIndex` Map to maintain set of agent IDs per role
- Emits `session-created` event via `emitEvent`

## @block:unregister @kind:code
```typescript
unregister(agentId: string): void
```

### Description
Removes an agent from the registry and cleans up indexes.

### Implementation Details
- Removes agent from `agents` Map
- Removes agent ID from `roleIndex` set for its role
- Emits `session-ended` event via `emitEvent`

## @block:setstatus @kind:code
```typescript
setStatus(agentId: string, status: AgentStatus): void
```

### Description
Updates the status of an existing agent.

### Implementation Details
- Updates `agent.status` field
- Updates `agent.last_activity` timestamp
- Emits `ownership-changed` event via `emitEvent`

## @block:clear @kind:code
```typescript
clear(): void
```

### Description
Removes all agents from the registry.

### Implementation Details
- Clears `agents` Map
- Clears `roleIndex` Map
- No events emitted

## @block:storage-indexes @kind:entity
```text
private agents: Map<string, Agent>;
private roleIndex: Map<AgentRole, Set<string>>;
```

### Description
Internal data structures for agent storage and role-based indexing.

### Implementation Details
- `agents`: Map from agent ID to Agent object
- `roleIndex`: Map from AgentRole to Set of agent IDs
- Both initialized in constructor