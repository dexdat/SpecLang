# speclang-header lines:13
id: "@speclang/mcp.tools.locks"
version: 0.1.0
layer: 3
project_level: Alpha
agent_support: agent_assisted
tags: [mcp, tools, locks]
parent: "@ref:speclang/mcp"
part: 7/12
siblings:
  next: "@ref:specs/mcp.dir/authentication"
short: "Lock and event tools: claim event, acquire lock, release lock"
---
# MCP Lock and Event Tools

### @mcp/tools-locks

```speclang
# @block:mcp/tools-locks @kind:entity
MCP_TOOLS:
  
  speclang_claim_event:
    description: Atomically claim an event for processing
    params:
      worker_id: string
    returns:
      event: object or null
    sql: |
      UPDATE events
      SET claimed_by = ?, claimed_at = strftime('%s','now'), attempts = attempts + 1
      WHERE event_pk = (
        SELECT event_pk FROM events
        WHERE processed = 0 AND claimed_by IS NULL
        ORDER BY timestamp
        LIMIT 1
      )
      RETURNING *
    
  speclang_acquire_lock:
    description: Acquire file lock
    params:
      file_path: string
      session_id: string
      lock_token: string
      timeout: integer (seconds)
    returns:
      success: boolean
    sql: |
      INSERT INTO file_locks(file_path, session_id, lock_token, expires_at)
      VALUES (?, ?, ?, strftime('%s,'now') + ?)
      ON CONFLICT(file_path) DO UPDATE SET
        session_id = excluded.session_id,
        lock_token = excluded.lock_token,
        acquired_at = excluded.acquired_at,
        expires_at = excluded.expires_at
      WHERE file_locks.expires_at IS NULL OR file_locks.expires_at < strftime('%s,'now')
    
  speclang_release_lock:
    description: Release file lock
    params:
      file_path: string
      lock_token: string
    returns:
      success: boolean
    sql: |
      DELETE FROM file_locks 
      WHERE file_path = ? AND lock_token = ?

  speclang_deadlock_prevention:
    description: Deadlock prevention strategies
    note: |
      - All locks have expiration timeouts
      - Clients implement retry with exponential backoff
      - Lock ordering: acquire locks in alphabetical file path order
      - Deadlock detection via timeout; release locks on timeout
```

### @mcp/tool-handler-locks

```speclang
# @block:mcp/tool-handler-locks @kind:code
```typescript
async handleClaimEvent(args: any) {
  const { worker_id } = args;
  
  // Atomic claim - returns the event or null
  const event = this.db.prepare(`
    UPDATE events
    SET claimed_by = ?, claimed_at = strftime('%s','now'), attempts = attempts + 1
    WHERE event_pk = (
      SELECT event_pk FROM events
      WHERE processed = 0 AND claimed_by IS NULL
      ORDER BY timestamp
      LIMIT 1
    )
    RETURNING *
  `).get(worker_id);
  
  return { event };
}

async handleAcquireLock(args: any) {
  const { file_path, session_id, lock_token, timeout = 60 } = args;
  
  const result = this.db.prepare(`
    INSERT INTO file_locks(file_path, session_id, lock_token, expires_at)
    VALUES (?, ?, ?, strftime('%s','now') + ?)
    ON CONFLICT(file_path) DO UPDATE SET
      session_id = excluded.session_id,
      lock_token = excluded.lock_token,
      acquired_at = excluded.acquired_at,
      expires_at = excluded.expires_at
    WHERE file_locks.expires_at IS NULL OR file_locks.expires_at < strftime('%s','now')
    RETURNING file_path
  `).get(file_path, session_id, lock_token, timeout);
  
  return { success: !!result };
}
```
```