---
name: sip-068-concurrency-speclang-v0
title: "SIP 68: Concurrency Model"
version: 0.1.0
description: Concurrency model for agent sessions with locking and deadlock prevention
category: standard
---

# SIP 68: Concurrency Model

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the concurrency model for SpecLang agent sessions.

### Quick Start

1. **Model:** One agent per file at a time
2. **Locks:** File-level write locks
3. **Reads:** Concurrent reads allowed
4. **Writes:** Serialized per file

### Key Concepts

| Concept | Description |
|---------|-------------|
| File Lock | Prevents concurrent writes |
| Read Lock | Allows concurrent reads |
| Write Lock | Exclusive access |
| Session | Agent working on file |

### When to Read This

- **Multi-agent:** Concurrent agent operation
- **Locking:** Understanding lock behavior
- **Deadlocks:** Prevention strategies

### Related SIPs

- SIP 10: Daemon
- SIP 52: Daemon Locks
- SIP 56: Agent Sessions

## Abstract

This SIP specifies the concurrency model for SpecLang, ensuring safe multi-agent operation with file-level locking and deadlock prevention.

## Motivation

Multiple agents may need to:
- Read specs concurrently
- Write to different files
- Coordinate complex changes

## Rationale

**Concurrency Flow:**

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Agent 1 │     │ Agent 2 │     │ Agent 3 │
└────┬────┘     └────┬────┘     └────┬────┘
     │               │               │
     ▼               ▼               ▼
┌─────────────────────────────────────────┐
│            Lock Manager                  │
│  ┌───────┐  ┌───────┐  ┌───────┐        │
│  │ spec1 │  │ spec2 │  │ spec3 │        │
│  │  R    │  │  W    │  │  -    │        │
│  └───────┘  └───────┘  └───────┘        │
└─────────────────────────────────────────┘
```

**Benefits:**
- Safe concurrent reads
- No write conflicts
- Deadlock prevention
- Fair lock acquisition

## Specification

### Concurrency Model

**@speclang/concurrency:**

```speclang
# @block:speclang/concurrency @kind:entity
Concurrency:
  model: one agent session per file
  
  safety:
    - file locks prevent write conflicts
    - read operations are concurrent
    - write operations are serialized per file
    - agents can read while another writes
    
  flow:
    1. daemon detects change
    2. daemon finds owning agent
    3. daemon notifies agent
    4. agent acquires lock
    5. agent reads/writes
    6. agent releases lock
    7. daemon sees new changes
    8. repeat
```

### Lock Types

**@locks/types:**

```speclang
# @block:locks/types @kind:entity
LockType:
  read:
    - Multiple holders allowed
    - Blocks write locks
    - Does not block other reads
    
  write:
    - Single holder only
    - Blocks all other locks
    - Exclusive access
    
  intention:
    - Signals intent to upgrade
    - Prevents starvation
```

### Lock Manager

**@locks/manager:**

```speclang
# @block:locks/manager @kind:entity
LockManager:
  state:
    locks: Map<FileId, LockEntry>
    waiters: Map<FileId, Waiter[]>
    timeouts: Map<LockId, Timeout>
    
  operations:
    acquireRead(file, agent): LockResult
    acquireWrite(file, agent): LockResult
    release(file, agent): void
    upgrade(file, agent): LockResult
    downgrade(file, agent): void
```

### Lock Entry

**@locks/entry:**

```speclang
# @block:locks/entry @kind:entity
LockEntry:
  file: FileId
  type: LockType
  holders: AgentId[]
  acquired_at: DateTime
  version: Int
  
  rules:
    - read: holders.length >= 1
    - write: holders.length == 1
```

### Lock Result

**@locks/result:**

```speclang
# @block:locks/result @kind:entity
LockResult:
  success: Boolean
  lock_id: LockId?
  error: LockError?
  wait_time: Duration
  
LockError:
  - CONFLICT: Another holder exists
  - TIMEOUT: Lock acquisition timed out
  - DEADLOCK: Deadlock detected
  - INVALID: Invalid lock request
```

## Deadlock Prevention

### @deadlock/detection

```speclang
# @block:deadlock/detection @kind:entity
DeadlockDetection:
  algorithm: wait-die or wound-wait
  
  wait_die:
    - Younger waits for older
    - Older never waits for younger
    - Prevents circular wait
    
  wound_wait:
    - Older preempts younger
    - Younger always waits
    - Prevents circular wait
    
  timeout:
    - Default: 30 seconds
    - On timeout: abort and retry
```

### @deadlock/prevention

```speclang
# @block:deadlock/prevention @kind:operation
DeadlockPrevention:
  strategies:
    - ordered_locking: Always lock in consistent order
    - timeout_abort: Abort after timeout
    - victim_selection: Select victim to abort
    - wait_graph: Detect cycles in wait graph
    
  ordering:
    - Sort files by ID before locking
    - Lock in sorted order
    - Release in reverse order
```

### @deadlock/recovery

```speclang
# @block:deadlock/recovery @kind:operation
DeadlockRecovery:
  steps:
    1. Detect deadlock cycle
    2. Select victim agent
    3. Abort victim's transaction
    4. Release victim's locks
    5. Notify victim agent
    6. Allow victim to retry
    
  victim_selection:
    - youngest: Abort newest transaction
    - least_work: Abort transaction with least changes
    - priority: Use agent priority
```

## Session Management

### @session/model

```speclang
# @block:session/model @kind:entity
AgentSession:
  id: SessionId
  agent: AgentId
  file: FileId
  lock: LockEntry?
  state: idle | reading | writing | waiting
  
  created_at: DateTime
  last_activity: DateTime
  
  operations: Operation[]
```

### @session/lifecycle

```speclang
# @block:session/lifecycle @kind:operation
SessionLifecycle:
  create:
    1. Agent requests session
    2. Create session record
    3. Set state to idle
    
  acquire:
    1. Agent requests file access
    2. Session requests lock
    3. Wait for lock or fail
    4. Set state to reading/writing
    
  release:
    1. Agent releases file
    2. Release lock
    3. Notify waiters
    4. Set state to idle
    
  close:
    1. Release all locks
    2. Clean up session
    3. Notify daemon
```

## Implementation

### Lock Manager Core

```typescript
interface LockEntry {
  fileId: string;
  type: 'read' | 'write';
  holders: string[];
  acquiredAt: Date;
  version: number;
}

interface Waiter {
  agentId: string;
  type: 'read' | 'write';
  timestamp: Date;
  resolve: (result: LockResult) => void;
  reject: (error: Error) => void;
}

class LockManager {
  private locks = new Map<string, LockEntry>();
  private waiters = new Map<string, Waiter[]>();
  private timeouts = new Map<string, NodeJS.Timeout>();
  
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  
  async acquireRead(
    fileId: string,
    agentId: string,
    timeout = this.DEFAULT_TIMEOUT
  ): Promise<LockResult> {
    const entry = this.locks.get(fileId);
    
    // No lock or read lock - can acquire
    if (!entry || entry.type === 'read') {
      return this.grantReadLock(fileId, agentId);
    }
    
    // Write lock exists - must wait
    return this.waitForLock(fileId, agentId, 'read', timeout);
  }
  
  async acquireWrite(
    fileId: string,
    agentId: string,
    timeout = this.DEFAULT_TIMEOUT
  ): Promise<LockResult> {
    const entry = this.locks.get(fileId);
    
    // No lock - can acquire
    if (!entry) {
      return this.grantWriteLock(fileId, agentId);
    }
    
    // Already holding write lock - reentrant
    if (entry.type === 'write' && entry.holders[0] === agentId) {
      return { success: true, lock_id: `${fileId}:write`, wait_time: 0 };
    }
    
    // Must wait
    return this.waitForLock(fileId, agentId, 'write', timeout);
  }
  
  release(fileId: string, agentId: string): void {
    const entry = this.locks.get(fileId);
    
    if (!entry) return;
    
    // Remove agent from holders
    entry.holders = entry.holders.filter(h => h !== agentId);
    
    // If no more holders, remove lock and notify waiters
    if (entry.holders.length === 0) {
      this.locks.delete(fileId);
      this.notifyWaiters(fileId);
    }
    
    // Clear timeout
    const timeoutKey = `${fileId}:${agentId}`;
    const timeout = this.timeouts.get(timeoutKey);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(timeoutKey);
    }
  }
  
  private grantReadLock(fileId: string, agentId: string): LockResult {
    let entry = this.locks.get(fileId);
    
    if (!entry) {
      entry = {
        fileId,
        type: 'read',
        holders: [],
        acquiredAt: new Date(),
        version: 0,
      };
      this.locks.set(fileId, entry);
    }
    
    entry.holders.push(agentId);
    
    return {
      success: true,
      lock_id: `${fileId}:read:${agentId}`,
      wait_time: 0,
    };
  }
  
  private grantWriteLock(fileId: string, agentId: string): LockResult {
    const entry: LockEntry = {
      fileId,
      type: 'write',
      holders: [agentId],
      acquiredAt: new Date(),
      version: 0,
    };
    
    this.locks.set(fileId, entry);
    
    return {
      success: true,
      lock_id: `${fileId}:write:${agentId}`,
      wait_time: 0,
    };
  }
  
  private async waitForLock(
    fileId: string,
    agentId: string,
    type: 'read' | 'write',
    timeout: number
  ): Promise<LockResult> {
    return new Promise((resolve, reject) => {
      const waiter: Waiter = {
        agentId,
        type,
        timestamp: new Date(),
        resolve,
        reject,
      };
      
      // Add to waiters
      if (!this.waiters.has(fileId)) {
        this.waiters.set(fileId, []);
      }
      this.waiters.get(fileId)!.push(waiter);
      
      // Set timeout
      const timeoutId = setTimeout(() => {
        this.removeWaiter(fileId, waiter);
        resolve({
          success: false,
          error: 'TIMEOUT',
          wait_time: timeout,
        });
      }, timeout);
      
      this.timeouts.set(`${fileId}:${agentId}`, timeoutId);
    });
  }
  
  private notifyWaiters(fileId: string): void {
    const waiters = this.waiters.get(fileId);
    if (!waiters || waiters.length === 0) return;
    
    // Try to grant to first waiter
    const waiter = waiters[0];
    
    if (waiter.type === 'write') {
      // Grant write lock
      const result = this.grantWriteLock(fileId, waiter.agentId);
      this.removeWaiter(fileId, waiter);
      waiter.resolve(result);
    } else {
      // Grant read lock to all waiting readers
      const readers = waiters.filter(w => w.type === 'read');
      for (const reader of readers) {
        const result = this.grantReadLock(fileId, reader.agentId);
        this.removeWaiter(fileId, reader);
        reader.resolve(result);
      }
    }
  }
  
  private removeWaiter(fileId: string, waiter: Waiter): void {
    const waiters = this.waiters.get(fileId);
    if (!waiters) return;
    
    const index = waiters.indexOf(waiter);
    if (index >= 0) {
      waiters.splice(index, 1);
    }
  }
}
```

### Deadlock Detector

```typescript
class DeadlockDetector {
  private waitGraph = new Map<string, Set<string>>();
  
  addWait(agentId: string, waitingFor: string): void {
    if (!this.waitGraph.has(agentId)) {
      this.waitGraph.set(agentId, new Set());
    }
    this.waitGraph.get(agentId)!.add(waitingFor);
  }
  
  removeWait(agentId: string): void {
    this.waitGraph.delete(agentId);
  }
  
  detectCycle(): string[] | null {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    for (const [agent] of this.waitGraph) {
      const cycle = this.detectCycleDFS(agent, visited, recursionStack, []);
      if (cycle) {
        return cycle;
      }
    }
    
    return null;
  }
  
  private detectCycleDFS(
    agent: string,
    visited: Set<string>,
    stack: Set<string>,
    path: string[]
  ): string[] | null {
    visited.add(agent);
    stack.add(agent);
    path.push(agent);
    
    const waitingFor = this.waitGraph.get(agent);
    if (waitingFor) {
      for (const other of waitingFor) {
        if (!visited.has(other)) {
          const result = this.detectCycleDFS(other, visited, stack, path);
          if (result) return result;
        } else if (stack.has(other)) {
          // Found cycle
          const cycleStart = path.indexOf(other);
          return path.slice(cycleStart);
        }
      }
    }
    
    path.pop();
    stack.delete(agent);
    return null;
  }
}
```

### Ordered Locking Helper

```typescript
async function acquireMultipleLocks(
  manager: LockManager,
  agentId: string,
  files: string[],
  type: 'read' | 'write'
): Promise<LockResult[]> {
  // Sort files to ensure consistent ordering
  const sortedFiles = [...files].sort();
  
  const results: LockResult[] = [];
  const acquired: string[] = [];
  
  try {
    for (const file of sortedFiles) {
      const result = type === 'read'
        ? await manager.acquireRead(file, agentId)
        : await manager.acquireWrite(file, agentId);
        
      if (!result.success) {
        // Release all and return failure
        for (const f of acquired) {
          manager.release(f, agentId);
        }
        return [result];
      }
      
      results.push(result);
      acquired.push(file);
    }
    
    return results;
  } catch (error) {
    // Release all on error
    for (const file of acquired) {
      manager.release(file, agentId);
    }
    throw error;
  }
}
```

## Database Integration

### @locks/database

```speclang
# @block:locks/database @kind:entity
DatabaseLocks:
  table: file_locks
  
  schema:
    file_id: TEXT PRIMARY KEY
    lock_type: TEXT  -- 'read' or 'write'
    holders: JSON    -- array of agent_ids
    acquired_at: TEXT
    version: INTEGER
    
  operations:
    - SQLite BEGIN IMMEDIATE for atomicity
    - Row-level locking via UPDATE
    - Timeout via busy_timeout
```

## References

- @ref:specs/core.spec.dir/concurrency
- @ref:specs/daemon.spec.dir/locks
- SIP 10: Daemon
- SIP 52: Daemon Locks
- SIP 56: Agent Sessions

## Copyright

This document is in the public domain.
