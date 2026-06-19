# WI-SL-013: Agent Communication — inter-agent messaging (AC-012)

## Goal
Implement the inter-agent communication module as defined in `specs/agents.spec.md#agent-communication` and `specs/agent-protocol.spec.md`. Three protocols: pub_sub (topic-based messaging), request_response (query/response), broadcast (system-wide announcements).

## Context
- Existing types: `specs/agents.spec.dir/src/types.ts` defines `AgentEventType`, `AgentEvent`, `Agent`, `AgentSession`, `Task`, `Tool`, `ToolRegistry`
- The spec types are annotated with `owned_by: spec-gen` and are symlinked to `src/agents/types.ts`
- Current `src/agents/` directory has types.ts, session.ts, session-api.ts, tools.ts, state.ts, violations.ts — NO communication module yet
- No tests exist for communication
- Project uses: TypeScript, Vitest, SQLite (better-sqlite3 via `npm:better-sqlite3`)

## Files to Create

### 1. `src/agents/communication.ts` — Main communication module

```typescript
import { AgentEventType, AgentEvent, AgentRole } from './types';

// Topics match the four message types from the spec
export type CommunicationTopic = 'file_changed' | 'cascade_trigger' | 'cascade_complete' | 'agent_status';

// Message interface
export interface AgentMessage {
  id: string;
  topic: CommunicationTopic;
  sender: AgentRole | 'system';
  target?: AgentRole | 'all' | 'orchestrator';
  payload: any;
  timestamp: number;
  ttl?: number; // time-to-live in ms, 0 = no expiry
}

// Handler type
export type MessageHandler = (message: AgentMessage) => void | Promise<void>;

// Callback for request/response
export type ResponseCallback = (response: AgentMessage) => void;

// === PubSubService ===
export class PubSubService {
  private subscribers: Map<CommunicationTopic, Set<MessageHandler>>;
  private topics: Set<CommunicationTopic>;

  constructor() { ... }
  subscribe(topic: CommunicationTopic, handler: MessageHandler): void { ... }
  unsubscribe(topic: CommunicationTopic, handler: MessageHandler): void { ... }
  publish(message: AgentMessage): Promise<void> { ... }   // Deliver to all subscribers + SQLite persist
  getTopics(): CommunicationTopic[] { ... }
}

// === RequestResponseClient ===
export class RequestResponseClient {
  private pendingRequests: Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>;
  private pubsub: PubSubService;
  private agentRole: AgentRole;

  constructor(pubsub: PubSubService, agentRole: AgentRole) { ... }
  
  // Send request and wait for response
  request(target: AgentRole, query: any, timeoutMs?: number): Promise<AgentMessage> { ... }
  
  // Handle incoming request — called by PubSubService when matching topic arrives
  respond(message: AgentMessage, response: any): Promise<void> { ... }
  
  // Register handler for incoming requests
  onRequest(topic: string, handler: (message: AgentMessage) => Promise<any>): void { ... }
  
  dispose(): void { ... }  // Clean up timeouts
}

// === BroadcastService ===
export class BroadcastService {
  private listeners: Map<string, Set<MessageHandler>>;
  
  constructor(pubsub: PubSubService) { ... }
  
  // Broadcast to all active agents
  broadcast(event: AgentEventType, data: any): Promise<void> { ... }
  
  // Listen for specific broadcast events
  on(event: AgentEventType, handler: MessageHandler): void { ... }
  
  // Remove listener
  off(event: AgentEventType, handler: MessageHandler): void { ... }
}

// === SQLite-backed Message Queue (optional but nice to have) ===
// persistAgentMessage(db: Database, message: AgentMessage): void
// getPendingMessages(db: Database, agentId: string, since: number): AgentMessage[]
```

### 2. `tests/agents/communication.test.ts` — Tests for all three protocols

Test at minimum:
1. PubSubService: subscribe → publish → handler receives message
2. PubSubService: unsubscribe → publish → handler NOT called
3. RequestResponseClient: request → response delivers
4. RequestResponseClient: request timeout → rejects
5. BroadcastService: broadcast reaches all listeners
6. Integration: cascade_trigger topic propagates correctly

## Design Constraints

1. **UUID generation**: Use `crypto.randomUUID()` (Node.js 19+ built-in)
2. **No external dependencies**: Use only Node.js built-ins + existing project deps
3. **ESM module**: The project uses `"type": "module"` — use import/export syntax
4. **Reuse existing types**: Import `AgentEventType`, `AgentEvent` from './types'
5. **Error handling**: Wrap async handlers, never throw from handler — log and swallow
6. **Memory safety**: Clean up subscriptions on service dispose

## Verification
```bash
cd /home/kara/SpecLang && npx vitest run tests/agents/communication.test.ts 2>&1 | tail -5
# Expected: All tests pass
```

## Constraints
- DO NOT modify any existing source files
- DO NOT modify test files outside tests/agents/communication.test.ts
- All existing 2154 tests must still pass after this change
- After creating files, run: `npm run build && npm test`
