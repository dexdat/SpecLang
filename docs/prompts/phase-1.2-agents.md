# Bootstrap Phase 1.2: Agent Session Manager

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.2 of the bootstrap process.

**Prerequisites**: 
- Phase 0 (Foundation) complete
- Phase 1.1 (Daemon design) in progress

## Your Task
Implement the agent session manager that coordinates AI agents, tracks file ownership, and provides tools for spec manipulation.

## Read These Specs First
1. `specs/agent-protocol.spec.md` - Agent communication protocol
2. `specs/tools.spec.md` - Tool API definitions
3. `specs/cascade.spec.md` - How agents participate in cascade

## What to Build

### Files to Create
```
src/agents/
├── index.ts            # Main exports
├── session.ts          # Session lifecycle
├── registry.ts         # Agent registry
├── ownership.ts        # File ownership tracking
├── tools.ts            # Tool implementations
└── state.ts            # State persistence

tests/
└── agents.test.ts
```

### Requirements

#### 1. Agent Types (from agent-protocol.spec.md)
```typescript
type AgentRole = 
  | 'north-star'    // User intent coordinator
  | 'spec-writer'   // Expands specs
  | 'code-gen'      // Generates code
  | 'test-writer'   // Writes tests
  | 'back-sync';    // Syncs code changes back

interface Agent {
  id: string;
  role: AgentRole;
  owns: string[];           // File patterns this agent owns
  depends_on: string[];     // Files this agent watches
  status: 'idle' | 'working' | 'waiting' | 'error';
  last_activity: Date;
}
```

#### 2. Session Management (session.ts)
```typescript
interface Session {
  id: string;
  agent: Agent;
  created: Date;
  state: SessionState;
  tools: ToolRegistry;
}

class SessionManager {
  // Create new agent session
  create(role: AgentRole): Session;
  
  // Get session by ID
  get(sessionId: string): Session | null;
  
  // List active sessions
  list(): Session[];
  
  // End session
  end(sessionId: string): void;
  
  // Resume from persisted state
  resume(sessionId: string): Session;
}
```

#### 3. File Ownership (ownership.ts)
```typescript
interface OwnershipRule {
  agent: AgentRole;
  patterns: string[];   // Glob patterns
  priority: number;     // Higher wins on conflict
}

const DEFAULT_RULES: OwnershipRule[] = [
  { agent: 'north-star', patterns: ['project.scl'], priority: 100 },
  { agent: 'spec-writer', patterns: ['specs/**/*.scl', 'specs/**/*.spec.*'], priority: 50 },
  { agent: 'code-gen', patterns: ['src/**/*.{ts,go,py,rs}'], priority: 40 },
  { agent: 'test-writer', patterns: ['tests/**/*'], priority: 30 },
];

class OwnershipRegistry {
  // Who owns this file?
  getOwner(filepath: string): AgentRole | null;
  
  // Can this agent write to this file?
  canWrite(agentId: string, filepath: string): boolean;
  
  // Register ownership rule
  register(rule: OwnershipRule): void;
  
  // Get all files owned by agent
  getOwnedFiles(role: AgentRole): string[];
}
```

#### 4. Agent Tools (tools.ts)
```typescript
// Tools available to all agents

interface Tool {
  name: string;
  description: string;
  inputSchema: object;
  handler: (input: any, session: Session) => Promise<any>;
}

const TOOLS: Tool[] = [
  // Spec operations
  { name: 'read_spec', handler: readSpecHandler },
  { name: 'write_spec', handler: writeSpecHandler },
  { name: 'search_specs', handler: searchSpecsHandler },
  
  // File operations
  { name: 'read_file', handler: readFileHandler },
  { name: 'write_file', handler: writeFileHandler },
  { name: 'list_files', handler: listFilesHandler },
  
  // Index operations
  { name: 'get_dependencies', handler: getDepsHandler },
  { name: 'get_dependents', handler: getDependentsHandler },
  { name: 'impact_analysis', handler: impactAnalysisHandler },
  
  // Cascade operations
  { name: 'trigger_cascade', handler: triggerCascadeHandler },
  { name: 'cascade_status', handler: cascadeStatusHandler },
];
```

#### 5. Tool Handlers
```typescript
async function readSpecHandler(input: { id: string }, session: Session) {
  // 1. Validate agent can read (always allowed)
  // 2. Look up spec in index
  // 3. Read file content
  // 4. Return parsed spec
}

async function writeSpecHandler(input: { 
  id: string; 
  content: string;
  message: string;
}, session: Session) {
  // 1. Validate agent owns this file
  // 2. Validate content (headers, refs)
  // 3. Write to file
  // 4. Update index
  // 5. Log change
  // 6. Return success
}

async function searchSpecsHandler(input: {
  query: string;
  tags?: string[];
  layer?: number;
}, session: Session) {
  // 1. Use SQLite FTS
  // 2. Filter by tags/layer if provided
  // 3. Return matching specs
}
```

#### 6. State Persistence (state.ts)
```typescript
interface AgentState {
  sessionId: string;
  agentRole: AgentRole;
  workingOn: string | null;  // Current file
  pendingTasks: Task[];
  completedTasks: Task[];
  errors: Error[];
}

class StateManager {
  // Persist state to .speclang/sessions/{id}.json
  save(sessionId: string, state: AgentState): void;
  
  // Load state
  load(sessionId: string): AgentState | null;
  
  // List all persisted sessions
  list(): string[];
  
  // Clean up old sessions
  gc(maxAge: Duration): void;
}
```

### Integration with SQLite
Store agent state in database:
```sql
INSERT INTO agents (id, role, status, working_on, last_activity)
VALUES (?, ?, ?, ?, ?);
```

### Integration with Daemon
```typescript
// When daemon detects file change
daemon.on('file-change', (event) => {
  // Find responsible agent
  const agent = registry.getOwner(event.path);
  
  // Create or resume session
  const session = sessions.getOrCreate(agent);
  
  // Queue task
  session.queueTask({
    type: 'react',
    trigger: event.path,
  });
});
```

## Test Cases
1. Create session for each agent type
2. Verify ownership rules
3. Block write to non-owned file
4. Read any spec (allowed)
5. Write to owned spec (allowed)
6. Persist and resume session
7. Concurrent sessions don't conflict

## Validation
```bash
bun test tests/agents.test.ts
```

## Output Format
After completing, output:
1. Files created
2. Test results
3. Ownership rule summary
