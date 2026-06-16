# Bootstrap Phase 2.13: MCP Lock Management Tools

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 2.13 of the bootstrap process.

**Prerequisites**: 
- Phase 2.1-2.12 (MCP components) complete

## Your Task
Implement MCP tools for lock management that enable coordination between multiple agents working on the same specs.

## Read These Specs First
1. `specs/mcp.spec.dir/overview.spec.md` - MCP server overview
2. `specs/mcp.spec.dir/locks.spec.md` - Lock management
3. `specs/mcp.spec.dir/tools.spec.md` - Tool definitions

## What to Build

### Files to Create
```
src/mcp/
├── locks/
│   ├── index.ts            # Main exports
│   ├── lock-manager.ts     # Lock management logic
│   ├── types.ts            # Lock types
│   └── tools.ts            # MCP tool definitions
```

### Requirements

#### 1. Lock Types (types.ts)

```typescript
export type LockType = 'read' | 'write' | 'admin';

export type LockStatus = 'active' | 'released' | 'expired' | 'broken';

export interface Lock {
  id: string;
  type: LockType;
  resource: string;
  sessionId: string;
  agentId: string;
  createdAt: number;
  expiresAt: number;
  status: LockStatus;
  metadata?: Record<string, unknown>;
}

export interface LockRequest {
  type: LockType;
  resource: string;
  sessionId: string;
  agentId: string;
  timeout?: number;
  metadata?: Record<string, unknown>;
}

export interface LockRelease {
  lockId: string;
  sessionId: string;
  force?: boolean;
}

export interface LockQuery {
  resource?: string;
  sessionId?: string;
  agentId?: string;
  status?: LockStatus;
}

export interface LockResult {
  success: boolean;
  lock?: Lock;
  error?: string;
}

export interface LockListResult {
  locks: Lock[];
  total: number;
}
```

#### 2. Lock Manager (lock-manager.ts)

```typescript
import { Lock, LockRequest, LockRelease, LockQuery, LockResult, LockListResult, LockType, LockStatus } from './types';

export class LockManager {
  private locks: Map<string, Lock> = new Map();
  private defaultTTL = 300000; // 5 minutes
  
  async acquire(request: LockRequest): Promise<LockResult> {
    const { type, resource, sessionId, agentId, timeout, metadata } = request;
    
    // Check for existing lock on resource
    const existingLock = this.findActiveLock(resource);
    if (existingLock) {
      // Read locks allow concurrent access
      if (existingLock.type === 'read' && type === 'read') {
        return this.createReadLock(request);
      }
      
      // Check if same session holds lock
      if (existingLock.sessionId === sessionId) {
        return this.extendLock(existingLock, timeout);
      }
      
      // Check if lock is expired
      if (existingLock.expiresAt < Date.now()) {
        await this.release({ lockId: existingLock.id, sessionId });
      } else {
        return {
          success: false,
          error: `Resource ${resource} is locked by ${existingLock.agentId}`
        };
      }
    }
    
    // Create new lock
    const lock: Lock = {
      id: this.generateId(),
      type,
      resource,
      sessionId,
      agentId,
      createdAt: Date.now(),
      expiresAt: Date.now() + (timeout || this.defaultTTL),
      status: 'active',
      metadata
    };
    
    this.locks.set(lock.id, lock);
    
    return { success: true, lock };
  }
  
  async release(request: LockRelease): Promise<LockResult> {
    const { lockId, sessionId, force } = request;
    
    const lock = this.locks.get(lockId);
    if (!lock) {
      return { success: false, error: 'Lock not found' };
    }
    
    // Check ownership or force flag
    if (lock.sessionId !== sessionId && !force) {
      return { success: false, error: 'Not authorized to release this lock' };
    }
    
    lock.status = 'released';
    lock.expiresAt = Date.now();
    
    return { success: true, lock };
  }
  
  async query(query: LockQuery): Promise<LockListResult> {
    let locks = Array.from(this.locks.values());
    
    if (query.resource) {
      locks = locks.filter(l => l.resource === query.resource);
    }
    
    if (query.sessionId) {
      locks = locks.filter(l => l.sessionId === query.sessionId);
    }
    
    if (query.agentId) {
      locks = locks.filter(l => l.agentId === query.agentId);
    }
    
    if (query.status) {
      locks = locks.filter(l => l.status === query.status);
    }
    
    // Filter out expired locks
    locks = locks.filter(l => l.status === 'active' || l.expiresAt > Date.now());
    
    return { locks, total: locks.length };
  }
  
  async check(resource: string, sessionId: string): Promise<{ locked: boolean; lock?: Lock }> {
    const lock = this.findActiveLock(resource);
    
    if (!lock) {
      return { locked: false };
    }
    
    // Same session can always access
    if (lock.sessionId === sessionId) {
      return { locked: false };
    }
    
    return { locked: true, lock };
  }
  
  async forceRelease(resource: string, sessionId: string): Promise<LockResult> {
    const lock = this.findActiveLock(resource);
    
    if (!lock) {
      return { success: false, error: 'No active lock found' };
    }
    
    if (lock.sessionId === sessionId) {
      return this.release({ lockId: lock.id, sessionId });
    }
    
    // Force release
    lock.status = 'broken';
    lock.expiresAt = Date.now();
    
    return { success: true, lock };
  }
  
  async extend(lockId: string, sessionId: string, timeout: number): Promise<LockResult> {
    const lock = this.locks.get(lockId);
    
    if (!lock) {
      return { success: false, error: 'Lock not found' };
    }
    
    if (lock.sessionId !== sessionId) {
      return { success: false, error: 'Not authorized' };
    }
    
    if (lock.status !== 'active') {
      return { success: false, error: 'Lock is not active' };
    }
    
    lock.expiresAt = Date.now() + timeout;
    
    return { success: true, lock };
  }
  
  async renewSession(sessionId: string): Promise<number> {
    const sessionLocks = Array.from(this.locks.values())
      .filter(l => l.sessionId === sessionId && l.status === 'active');
    
    let renewed = 0;
    for (const lock of sessionLocks) {
      lock.expiresAt = Date.now() + this.defaultTTL;
      renewed++;
    }
    
    return renewed;
  }
  
  private findActiveLock(resource: string): Lock | undefined {
    return Array.from(this.locks.values())
      .filter(l => l.resource === resource && l.status === 'active')
      .sort((a, b) => b.createdAt - a.createdAt)[0];
  }
  
  private createReadLock(request: LockRequest): LockResult {
    const lock: Lock = {
      id: this.generateId(),
      type: 'read',
      resource: request.resource,
      sessionId: request.sessionId,
      agentId: request.agentId,
      createdAt: Date.now(),
      expiresAt: Date.now() + (request.timeout || this.defaultTTL),
      status: 'active',
      metadata: request.metadata
    };
    
    this.locks.set(lock.id, lock);
    return { success: true, lock };
  }
  
  private extendLock(lock: Lock, timeout?: number): LockResult {
    lock.expiresAt = Date.now() + (timeout || this.defaultTTL);
    return { success: true, lock };
  }
  
  private generateId(): string {
    return `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

#### 3. MCP Tools (tools.ts)

```typescript
import { LockManager } from './lock-manager';
import { LockRequest, LockRelease, LockQuery } from './types';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: object;
}

export function createLockTools(lockManager: LockManager): MCPTool[] {
  return [
    {
      name: 'speclang_lock_acquire',
      description: 'Acquire a lock on a spec resource',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['read', 'write', 'admin'],
            description: 'Type of lock to acquire'
          },
          resource: {
            type: 'string',
            description: 'Resource to lock (spec ID or file path)'
          },
          sessionId: {
            type: 'string',
            description: 'Session ID requesting the lock'
          },
          agentId: {
            type: 'string',
            description: 'Agent ID requesting the lock'
          },
          timeout: {
            type: 'number',
            description: 'Lock timeout in milliseconds (default: 300000)'
          },
          metadata: {
            type: 'object',
            description: 'Optional metadata for the lock'
          }
        },
        required: ['type', 'resource', 'sessionId', 'agentId']
      }
    },
    {
      name: 'speclang_lock_release',
      description: 'Release a lock',
      inputSchema: {
        type: 'object',
        properties: {
          lockId: {
            type: 'string',
            description: 'ID of the lock to release'
          },
          sessionId: {
            type: 'string',
            description: 'Session ID releasing the lock'
          },
          force: {
            type: 'boolean',
            description: 'Force release even if not owner'
          }
        },
        required: ['lockId', 'sessionId']
      }
    },
    {
      name: 'speclang_lock_check',
      description: 'Check if a resource is locked',
      inputSchema: {
        type: 'object',
        properties: {
          resource: {
            type: 'string',
            description: 'Resource to check'
          },
          sessionId: {
            type: 'string',
            description: 'Session ID to check against'
          }
        },
        required: ['resource', 'sessionId']
      }
    },
    {
      name: 'speclang_lock_list',
      description: 'List active locks',
      inputSchema: {
        type: 'object',
        properties: {
          resource: {
            type: 'string',
            description: 'Filter by resource'
          },
          sessionId: {
            type: 'string',
            description: 'Filter by session'
          },
          agentId: {
            type: 'string',
            description: 'Filter by agent'
          }
        }
      }
    },
    {
      name: 'speclang_lock_extend',
      description: 'Extend a lock timeout',
      inputSchema: {
        type: 'object',
        properties: {
          lockId: {
            type: 'string',
            description: 'ID of the lock to extend'
          },
          sessionId: {
            type: 'string',
            description: 'Session ID extending the lock'
          },
          timeout: {
            type: 'number',
            description: 'New timeout in milliseconds'
          }
        },
        required: ['lockId', 'sessionId', 'timeout']
      }
    },
    {
      name: 'speclang_lock_force_release',
      description: 'Force release a lock (admin only)',
      inputSchema: {
        type: 'object',
        properties: {
          resource: {
            type: 'string',
            description: 'Resource to force release'
          },
          sessionId: {
            type: 'string',
            description: 'Session ID requesting force release'
          }
        },
        required: ['resource', 'sessionId']
      }
    }
  ];
}

export async function handleLockTool(
  toolName: string,
  input: unknown,
  lockManager: LockManager
): Promise<unknown> {
  switch (toolName) {
    case 'speclang_lock_acquire': {
      const request = input as LockRequest;
      return lockManager.acquire(request);
    }
    
    case 'speclang_lock_release': {
      const request = input as LockRelease;
      return lockManager.release(request);
    }
    
    case 'speclang_lock_check': {
      const { resource, sessionId } = input as { resource: string; sessionId: string };
      return lockManager.check(resource, sessionId);
    }
    
    case 'speclang_lock_list': {
      const query = input as LockQuery;
      return lockManager.query(query);
    }
    
    case 'speclang_lock_extend': {
      const { lockId, sessionId, timeout } = input as { lockId: string; sessionId: string; timeout: number };
      return lockManager.extend(lockId, sessionId, timeout);
    }
    
    case 'speclang_lock_force_release': {
      const { resource, sessionId } = input as { resource: string; sessionId: string };
      return lockManager.forceRelease(resource, sessionId);
    }
    
    default:
      throw new Error(`Unknown lock tool: ${toolName}`);
  }
}
```

#### 4. Main Exports (index.ts)

```typescript
export * from './types';
export * from './lock-manager';
export * from './tools';

export { LockManager } from './lock-manager';
export { createLockTools, handleLockTool } from './tools';
```

## Test Cases
1. Acquire write lock
2. Acquire read lock (concurrent)
3. Release own lock
4. Fail to release others lock
5. Force release works
6. Lock expires
7. Query locks by resource
8. Query locks by session
9. Extend lock timeout
10. Renew session locks

## Validation
```bash
bun test tests/mcp/locks.test.ts

# Manual test
node -e "
const { LockManager } = require('./dist/mcp/locks');
const m = new LockManager();
m.acquire({ type: 'write', resource: '@specs/auth', sessionId: 's1', agentId: 'a1' }).then(r => console.log('Acquire:', JSON.stringify(r)));
"
```

## Output Format
After completing, output:
1. Files created
2. Tools registered
3. Test results
