# speclang-header lines:14
id: @speclang/registry/lookup
version: 0.0.1
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [registry, lookup, agents]
short: Lookup and querying aspects of agent registry
parent: @ref:specs/registry
part: 2/2
---
## @block:agentregistry @kind:entity
```text
export class AgentRegistry extends EventEmitter {
```

## @block:get @kind:code
```typescript
get(agentId: string): Agent | undefined
```

### Description
Retrieves an agent by its ID.

### Implementation Details
- Returns `agents.get(agentId)`
- Returns `undefined` if agent not found

## @block:getall @kind:code
```typescript
getAll(): Agent[]
```

### Description
Returns all registered agents as an array.

### Implementation Details
- Returns `Array.from(agents.values())`
- Order is not guaranteed

## @block:getbyrole @kind:code
```typescript
getByRole(role: AgentRole): Agent[]
```

### Description
Returns all agents with a specific role.

### Implementation Details
- Looks up `roleIndex.get(role)` to get set of agent IDs
- Maps each ID to agent object via `agents.get`
- Filters out undefined entries
- Returns array of Agent objects

## @block:getbysessionid @kind:code
```typescript
getBySessionId(sessionId: string): Agent | undefined
```

### Description
Finds an agent by its session ID.

### Implementation Details
- Iterates over `agents.values()`
- Returns first agent where `agent.session_id === sessionId`
- Returns `undefined` if no match

## @block:getbystatus @kind:code
```typescript
getByStatus(status: AgentStatus): Agent[]
```

### Description
Returns all agents with a specific status.

### Implementation Details
- Filters `agents.values()` by `agent.status === status`
- Returns array of Agent objects

## @block:getactive @kind:code
```typescript
getActive(): Agent[]
```

### Description
Returns all agents that are not idle.

### Implementation Details
- Filters `agents.values()` by `agent.status !== 'idle'`
- Returns array of Agent objects

## @block:has @kind:code
```typescript
has(agentId: string): boolean
```

### Description
Checks if an agent exists in the registry.

### Implementation Details
- Returns `agents.has(agentId)`

## @block:countbyrole @kind:code
```typescript
countByRole(role: AgentRole): number
```

### Description
Returns the number of agents with a specific role.

### Implementation Details
- Returns `roleIndex.get(role)?.size || 0`

## @block:count @kind:code
```typescript
count(): number
```

### Description
Returns total number of registered agents.

### Implementation Details
- Returns `agents.size`

## @block:emitevent @kind:code
```typescript
private emitEvent(type: AgentEventType, agentId: string, data?: unknown): void
```

### Description
Internal helper to emit agent events.

### Implementation Details
- Constructs `AgentEvent` object with timestamp
- Calls `this.emit(type, event)`