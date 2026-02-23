# Bootstrap Phase 1.10: Agent Sessions and Lifecycle

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.10 of the bootstrap process.

**Prerequisites**: 
- Phase 0 (Foundation) complete
- Phase 1.1-1.9 (Daemon, Agents, Cascade) in progress

## Your Task
Implement the agent session management system that creates, tracks, and persists agent sessions throughout their lifecycle.

## Read These Specs First
1. `specs/agent-protocol.spec.dir/sessions.spec.md` - Session definitions
2. `specs/core.spec.dir/agents.spec.md` - Agent roles
3. `specs/daemon.spec.md` - Daemon integration

## What to Build

### Files to Create
```
src/agents/
├── sessions/
│   ├── index.ts           # Main exports
│   ├── types.ts           # Session types
│   ├── manager.ts         # Session manager
│   ├── lifecycle.ts       # Lifecycle states
│   ├── persistence.ts     # State persistence
│   └── api.ts             # Session API
│
.speclang/
└── sessions/              # Persisted session state

tests/
└── agent-sessions.test.ts
```

### Requirements

#### 1. Session Types

```typescript
// src/agents/sessions/types.ts

type AgentKind = 
  | 'orchestrator'   // User's primary AI
  | 'spec-writer'    // Expands specs
  | 'code-gen'       // Generates code
  | 'test-writer'    // Writes tests
  | 'back-sync';     // Syncs code to spec

type SessionStatus = 
  | 'created'   // Just spawned
  | 'idle'      // Registered, waiting
  | 'active'    // Processing work
  | 'paused'    // Paused by user
  | 'done'      // Converged
  | 'error';    // Failed

interface AgentSession {
  id: string;
  agent: AgentKind;
  owns: string[];          // File patterns this session can write
  created: Date;
  last_active: Date;
  status: SessionStatus;
  cascade_id?: string;
  current_task?: string;
  completed_tasks: string[];
  error?: AgentError;
}

interface AgentError {
  type: 'AccessDenied' | 'LockTimeout' | 'SessionNotFound' | 'AgentTimeout';
  message: string;
  timestamp: Date;
  recoverable: boolean;
}
```

#### 2. Session Lifecycle

```typescript
// src/agents/sessions/lifecycle.ts

/**
 * Session Lifecycle:
 * 
 * [*] --> Created: speclangd spawns
 * Created --> Idle: registered
 * Idle --> Active: file event received
 * Active --> Idle: work done
 * Active --> Error: failure
 * Idle --> Done: convergence detected
 * Done --> [*]: session ends
 * Error --> [*]: after recovery
 */

export class SessionLifecycle {
  private transitions: Map<SessionStatus, SessionStatus[]>;
  
  constructor() {
    this.transitions = new Map([
      ['created', ['idle', 'error']],
      ['idle', ['active', 'done', 'error']],
      ['active', ['idle', 'paused', 'error']],
      ['paused', ['active', 'done']],
      ['done', []],
      ['error', ['idle']] // Recovery possible
    ]);
  }
  
  canTransition(from: SessionStatus, to: SessionStatus): boolean {
    const allowed = this.transitions.get(from) || [];
    return allowed.includes(to);
  }
  
  transition(session: AgentSession, to: SessionStatus): TransitionResult {
    if (!this.canTransition(session.status, to)) {
      return {
        success: false,
        error: `Invalid transition: ${session.status} -> ${to}`
      };
    }
    
    const previous = session.status;
    session.status = to;
    session.last_active = new Date();
    
    return {
      success: true,
      previous,
      current: to
    };
  }
}

interface TransitionResult {
  success: boolean;
  previous?: SessionStatus;
  current?: SessionStatus;
  error?: string;
}
```

#### 3. Session Manager

```typescript
// src/agents/sessions/manager.ts

export class SessionManager {
  private sessions: Map<string, AgentSession>;
  private lifecycle: SessionLifecycle;
  private persistence: SessionPersistence;
  private maxConcurrent: number;
  
  constructor(config: SessionConfig = {}) {
    this.sessions = new Map();
    this.lifecycle = new SessionLifecycle();
    this.persistence = new SessionPersistence();
    this.maxConcurrent = config.maxConcurrent || 50;
  }
  
  create(agent: AgentKind, owns: string[]): AgentSession {
    // Check concurrent limit
    const activeCount = this.getActiveSessions().length;
    if (activeCount >= this.maxConcurrent) {
      throw new Error(`Max concurrent sessions reached: ${this.maxConcurrent}`);
    }
    
    const session: AgentSession = {
      id: this.generateId(agent),
      agent,
      owns,
      created: new Date(),
      last_active: new Date(),
      status: 'created',
      completed_tasks: []
    };
    
    this.sessions.set(session.id, session);
    this.lifecycle.transition(session, 'idle');
    this.persistence.save(session);
    
    return session;
  }
  
  get(sessionId: string): AgentSession | null {
    return this.sessions.get(sessionId) || null;
  }
  
  list(filter?: SessionFilter): AgentSession[] {
    let sessions = Array.from(this.sessions.values());
    
    if (filter) {
      if (filter.agent) {
        sessions = sessions.filter(s => s.agent === filter.agent);
      }
      if (filter.status) {
        sessions = sessions.filter(s => s.status === filter.status);
      }
    }
    
    return sessions;
  }
  
  getActiveSessions(): AgentSession[] {
    return this.list({ status: 'active' });
  }
  
  activate(sessionId: string, task: string): void {
    const session = this.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    session.current_task = task;
    this.lifecycle.transition(session, 'active');
    this.persistence.save(session);
  }
  
  complete(sessionId: string): void {
    const session = this.get(sessionId);
    if (!session) return;
    
    if (session.current_task) {
      session.completed_tasks.push(session.current_task);
      session.current_task = undefined;
    }
    
    this.lifecycle.transition(session, 'idle');
    this.persistence.save(session);
  }
  
  finish(sessionId: string): void {
    const session = this.get(sessionId);
    if (!session) return;
    
    this.lifecycle.transition(session, 'done');
    this.persistence.save(session);
  }
  
  error(sessionId: string, error: AgentError): void {
    const session = this.get(sessionId);
    if (!session) return;
    
    session.error = error;
    this.lifecycle.transition(session, 'error');
    this.persistence.save(session);
  }
  
  recover(sessionId: string): boolean {
    const session = this.get(sessionId);
    if (!session || session.status !== 'error') return false;
    
    if (session.error?.recoverable) {
      session.error = undefined;
      this.lifecycle.transition(session, 'idle');
      this.persistence.save(session);
      return true;
    }
    
    return false;
  }
  
  end(sessionId: string): void {
    const session = this.get(sessionId);
    if (!session) return;
    
    this.persistence.archive(session);
    this.sessions.delete(sessionId);
  }
  
  private generateId(agent: AgentKind): string {
    const prefix = agent.replace(/-/g, '');
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 6);
    return `${prefix}-${timestamp}-${random}`;
  }
}

interface SessionConfig {
  maxConcurrent?: number;
}

interface SessionFilter {
  agent?: AgentKind;
  status?: SessionStatus;
}
```

#### 4. Session Persistence

```typescript
// src/agents/sessions/persistence.ts

const SESSIONS_DIR = '.speclang/sessions';

export class SessionPersistence {
  private sessionsDir: string;
  
  constructor(sessionsDir: string = SESSIONS_DIR) {
    this.sessionsDir = sessionsDir;
    this.ensureDir();
  }
  
  save(session: AgentSession): void {
    const path = this.getSessionPath(session.id);
    const data = JSON.stringify(session, null, 2);
    writeFileSync(path, data);
  }
  
  load(sessionId: string): AgentSession | null {
    const path = this.getSessionPath(sessionId);
    
    try {
      const data = readFileSync(path, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  
  list(): string[] {
    const files = globSync(`${this.sessionsDir}/*.json`);
    return files.map(f => basename(f, '.json'));
  }
  
  archive(session: AgentSession): void {
    const archiveDir = `${this.sessionsDir}/archive`;
    mkdirSync(archiveDir, { recursive: true });
    
    const source = this.getSessionPath(session.id);
    const dest = `${archiveDir}/${session.id}.json`;
    
    renameSync(source, dest);
  }
  
  gc(maxAge: Duration = { days: 7 }): void {
    const cutoff = Date.now() - toMs(maxAge);
    
    for (const sessionId of this.list()) {
      const session = this.load(sessionId);
      if (session && session.last_active.getTime() < cutoff) {
        this.archive(session);
      }
    }
  }
  
  private getSessionPath(sessionId: string): string {
    return `${this.sessionsDir}/${sessionId}.json`;
  }
  
  private ensureDir(): void {
    mkdirSync(this.sessionsDir, { recursive: true });
  }
}
```

#### 5. Session API

```typescript
// src/agents/sessions/api.ts

export class SessionAPI {
  private manager: SessionManager;
  private port: number;
  
  constructor(manager: SessionManager, port: number = 3000) {
    this.manager = manager;
    this.port = port;
  }
  
  getRoutes(): RouteDefinition[] {
    return [
      {
        method: 'POST',
        path: '/session/create',
        handler: this.handleCreate.bind(this)
      },
      {
        method: 'GET',
        path: '/session/:id/status',
        handler: this.handleStatus.bind(this)
      },
      {
        method: 'POST',
        path: '/session/:id/event',
        handler: this.handleEvent.bind(this)
      },
      {
        method: 'DELETE',
        path: '/session/:id',
        handler: this.handleDelete.bind(this)
      }
    ];
  }
  
  private async handleCreate(req: Request): Promise<Response> {
    const { agent, owns } = await req.json();
    
    try {
      const session = this.manager.create(agent, owns);
      return Response.json({ session_id: session.id });
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
  }
  
  private async handleStatus(req: Request): Promise<Response> {
    const sessionId = req.params.id;
    const session = this.manager.get(sessionId);
    
    if (!session) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }
    
    return Response.json({
      status: session.status,
      files: session.owns,
      last_active: session.last_active,
      current_task: session.current_task
    });
  }
  
  private async handleEvent(req: Request): Promise<Response> {
    const sessionId = req.params.id;
    const { kind, path: filePath, details } = await req.json();
    
    const session = this.manager.get(sessionId);
    if (!session) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }
    
    // Process event based on kind
    switch (kind) {
      case 'file_change':
        this.manager.activate(sessionId, `Processing ${filePath}`);
        break;
      case 'task_complete':
        this.manager.complete(sessionId);
        break;
      case 'converge':
        this.manager.finish(sessionId);
        break;
    }
    
    return Response.json({ accepted: true });
  }
  
  private async handleDelete(req: Request): Promise<Response> {
    const sessionId = req.params.id;
    this.manager.end(sessionId);
    return Response.json({ ok: true });
  }
}
```

#### 6. Concurrency Model

```typescript
// src/agents/sessions/concurrency.ts

export const CONCURRENCY_MODEL = {
  description: 'Multiple agents run concurrently, one per file',
  
  guarantees: [
    'No two agents write same file',
    'Reads are always allowed',
    'Writes are serialized per file',
    'Agents can read while another writes'
  ],
  
  limits: {
    max_concurrent_agents: 50,
    max_file_changes_per_cascade: 100
  }
};

export class ConcurrencyController {
  private fileLocks: Map<string, string>; // file -> sessionId
  private maxConcurrent: number;
  
  constructor(maxConcurrent: number = 50) {
    this.fileLocks = new Map();
    this.maxConcurrent = maxConcurrent;
  }
  
  acquireLock(sessionId: string, filePath: string): boolean {
    const current = this.fileLocks.get(filePath);
    
    if (current && current !== sessionId) {
      return false; // Locked by another session
    }
    
    this.fileLocks.set(filePath, sessionId);
    return true;
  }
  
  releaseLock(sessionId: string, filePath: string): void {
    const current = this.fileLocks.get(filePath);
    
    if (current === sessionId) {
      this.fileLocks.delete(filePath);
    }
  }
  
  getLockedFiles(): string[] {
    return Array.from(this.fileLocks.keys());
  }
}
```

## Test Cases
1. Create session for each agent type
2. Transition through lifecycle states
3. Block invalid transitions
4. Persist and load session
5. Archive completed sessions
6. GC old sessions
7. Concurrent session limit
8. Error recovery works
9. API endpoints work

## Validation
```bash
bun test tests/agent-sessions.test.ts
```

## Output Format
After completing, output:
1. Files created
2. Test results
3. Session lifecycle diagram
