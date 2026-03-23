---
name: sip-052-daemon-locks-speclang-v0
title: "SIP 52: Daemon Locks"
version: 0.1.0
description: Lock types, lock protocol, and deadlock prevention
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 52: Daemon Locks

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the locking system used by speclangd to prevent concurrent write conflicts.

### Quick Start

```
1. Agent requests lock on file
2. Daemon checks if lock available
3. If available: grant lock, agent writes, releases lock
4. If unavailable: agent waits or fails
```

### Lock Types

- **File Lock:** Exclusive write access to a file
- **Cascade Lock:** Prevent concurrent cascades
- **Resource Lock:** Limit concurrent operations

### When to Read This

- **Building agents:** Understanding lock protocol
- **Debugging:** Resolving lock conflicts
- **Architecture:** Understanding concurrency model

### Related SIPs

- SIP 10: Daemon Architecture
- SIP 51: Daemon Events
- SIP 43: MCP Daemon

## Abstract

This SIP specifies the lock types, lock protocol, and deadlock prevention mechanisms used by speclangd.

## Specification

### Lock Types

```yaml
LockTypes:
  file_lock:
    description: Exclusive write access to a file
    scope: single file
    granularity: file-level
    default_timeout: 30s
    max_timeout: 300s
    
  cascade_lock:
    description: Prevent concurrent cascades on same spec tree
    scope: spec tree
    granularity: tree-level
    default_timeout: 60s
    max_timeout: 600s
    
  resource_lock:
    description: Limit concurrent operations on a resource
    scope: named resource
    granularity: resource-level
    default_timeout: 60s
    max_timeout: 600s
    
  advisory_lock:
    description: Cooperative lock for coordination
    scope: arbitrary
    granularity: user-defined
    default_timeout: 300s
    max_timeout: 3600s
```

### Lock Structure

```typescript
interface Lock {
  lock_pk: number;
  lock_id: string;
  lock_type: LockType;
  resource: string;
  session_id: string;
  lock_token: string;
  acquired_at: string;
  expires_at: string;
  metadata: {
    cascade_id?: string;
    agent_type?: string;
    priority?: number;
  };
}

type LockType = "file_lock" | "cascade_lock" | "resource_lock" | "advisory_lock";
```

### Lock Protocol

```yaml
LockProtocol:
  acquire:
    steps:
      1: Generate UUID lock_token
      2: Call speclang_acquire_lock with params
      3: If success, proceed with operation
      4: If failure, retry or abort
      
    request:
      file_path: string (for file_lock)
      resource: string (for resource_lock)
      session_id: string
      lock_token: string (UUID)
      timeout: integer (seconds)
      
    response:
      success: boolean
      lock_id: string (if success)
      expires_at: string (if success)
      conflict_with: string (if failure)
      message: string
      
  release:
    steps:
      1: Call speclang_release_lock with lock_token
      2: Verify release successful
      3: Lock removed, other agents can acquire
      
    request:
      file_path: string (or resource)
      lock_token: string
      
    response:
      success: boolean
      message: string
      
  extend:
    steps:
      1: Call before lock expires
      2: Specify additional timeout
      3: Lock expiration extended
      
    request:
      lock_token: string
      additional_timeout: integer (seconds)
      
    response:
      success: boolean
      new_expires_at: string
```

### Lock States

```yaml
LockStates:
  available:
    description: No lock exists on resource
    transitions: [acquired]
    
  acquired:
    description: Lock held by session
    transitions: [released, expired, extended]
    
  released:
    description: Lock explicitly released
    transitions: []
    
  expired:
    description: Lock auto-expired
    transitions: []
    
  extended:
    description: Lock timeout extended
    transitions: [released, expired, extended]
```

### Lock Acquisition Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Lock Acquisition Flow                        │
└─────────────────────────────────────────────────────────────────┘

  Agent                     Daemon                    Lock Store
    │                         │                          │
    │  1. acquire_lock        │                          │
    │  ─────────────────────> │                          │
    │                         │  2. check existing       │
    │                         │  ──────────────────────> │
    │                         │                          │
    │                         │  3. return status        │
    │                         │  <────────────────────── │
    │                         │                          │
    │                         │  [if available]          │
    │                         │  4. create lock          │
    │                         │  ──────────────────────> │
    │                         │                          │
    │  5. success + lock_id   │                          │
    │  <───────────────────── │                          │
    │                         │                          │
    │  6. perform operation   │                          │
    │  (write file, etc.)     │                          │
    │                         │                          │
    │  7. release_lock        │                          │
    │  ─────────────────────> │                          │
    │                         │  8. delete lock          │
    │                         │  ──────────────────────> │
    │                         │                          │
    │  9. success             │                          │
    │  <───────────────────── │                          │
```

### Deadlock Prevention

```yaml
DeadlockPrevention:
  strategies:
    timeout_based:
      description: All locks auto-expire
      default_timeout: 30s
      max_timeout: 300s
      
    ordered_acquisition:
      description: Acquire locks in consistent order
      rule: "alphabetical by file path"
      example:
        - Always acquire auth.spec before user.spec
        - If need both, acquire in alphabetical order
        
    try_lock:
      description: Non-blocking lock attempt
      behavior: "Return immediately if unavailable"
      retry_strategy: "exponential backoff"
      
    lock_hierarchy:
      description: Define lock ordering levels
      levels:
        1: cascade_lock (highest)
        2: resource_lock
        3: file_lock
      rule: "Never acquire lower level before higher"
      
  detection:
    timeout_detection:
      description: Treat stuck operations as potential deadlock
      threshold: 60s
      action: "Log warning, increment metrics"
      
    wait_for_graph:
      description: Build dependency graph
      check_interval: 10s
      action_on_cycle: "Abort youngest transaction"
```

### Lock Ordering Rules

```yaml
LockOrdering:
  file_locks:
    rule: "Alphabetical by file path"
    example:
      correct:
        - acquire("specs/auth.spec")
        - acquire("specs/user.spec")
      incorrect:
        - acquire("specs/user.spec")
        - acquire("specs/auth.spec")  # WRONG ORDER
        
  mixed_locks:
    rule: "Hierarchy order, then alphabetical"
    order:
      1: cascade_lock
      2: resource_lock
      3: file_lock
      
  same_type:
    rule: "Alphabetical by resource name"
```

### Retry Strategy

```yaml
RetryStrategy:
  algorithm: exponential_backoff
  
  parameters:
    initial_delay: 100ms
    max_delay: 5000ms
    multiplier: 2.0
    jitter: 10%
    max_retries: 5
    
  per_lock_type:
    file_lock:
      max_retries: 5
      max_wait: 30s
      
    cascade_lock:
      max_retries: 10
      max_wait: 60s
      
    resource_lock:
      max_retries: 3
      max_wait: 15s
```

### Lock Commands

```yaml
LockCommands:
  CLI:
    speclang locks list:
      description: List all active locks
      output: table of locks with details
      
    speclang locks show <resource>:
      description: Show lock details
      output: lock info or "no lock"
      
    speclang locks release <lock_id>:
      description: Force release a lock
      requires: admin or owning session
      
    speclang locks expire:
      description: Clean up expired locks
      output: count of removed locks
      
  MCP:
    speclang_acquire_lock:
      params: [resource, session_id, lock_token, timeout]
      
    speclang_release_lock:
      params: [resource, lock_token]
      
    speclang_extend_lock:
      params: [lock_token, additional_timeout]
      
    speclang_list_locks:
      params: [filter?]
      
    speclang_force_release:
      params: [lock_id, reason]
      requires: admin
```

### Lock Storage

```sql
CREATE TABLE locks (
  lock_pk INTEGER PRIMARY KEY,
  lock_id TEXT UNIQUE NOT NULL,
  lock_type TEXT NOT NULL,
  resource TEXT NOT NULL,
  session_id TEXT NOT NULL,
  lock_token TEXT UNIQUE NOT NULL,
  acquired_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locks_resource ON locks(resource);
CREATE INDEX idx_locks_session ON locks(session_id);
CREATE INDEX idx_locks_expires ON locks(expires_at);
CREATE UNIQUE INDEX idx_locks_unique ON locks(lock_type, resource) 
  WHERE expires_at > CURRENT_TIMESTAMP;
```

### Lock Metrics

```yaml
LockMetrics:
  counters:
    locks_acquired_total: by lock_type
    locks_released_total: by lock_type
    locks_expired_total: by lock_type
    lock_conflicts_total: by lock_type
    deadlocks_detected: overall
    
  gauges:
    locks_active: current count
    lock_wait_seconds: histogram
    
  labels:
    - lock_type
    - session_id
    - agent_type
```

### Lock Events

```yaml
LockEvents:
  lock.acquired:
    payload:
      lock_id: string
      lock_type: string
      resource: string
      session_id: string
      expires_at: string
      
  lock.released:
    payload:
      lock_id: string
      resource: string
      duration_seconds: integer
      
  lock.expired:
    payload:
      lock_id: string
      resource: string
      session_id: string
      
  lock.conflict:
    payload:
      resource: string
      requesting_session: string
      holding_session: string
```

## References

- "@ref:specs/daemon.spec.dir/locks
- SIP 10: Daemon Architecture
- SIP 51: Daemon Events
- SIP 54: SQLite Schema

## Copyright

This document is in the public domain.
