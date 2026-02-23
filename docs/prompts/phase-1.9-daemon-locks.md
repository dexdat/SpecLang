# Bootstrap Phase 1.9: Daemon File Locking

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.9 of the bootstrap process.

**Prerequisites**: Phase 1.1 (Daemon Core), Phase 1.6 (Events), Phase 1.8 (Routing) complete.

## Your Task
Implement file locking to prevent race conditions when multiple agents access the same files.

## Read These Specs First
1. `specs/mcp.spec.dir/tools/locks.spec.md` - Lock and event tools
2. `specs/agent-protocol.spec.dir/ownership.spec.md` - File ownership patterns

## Locking Requirements

When multiple agents work concurrently:
- Only one agent can write to a file at a time
- Locks must expire to prevent deadlocks
- Agents must retry with backoff when lock unavailable

## Implementation

### 1. Lock Manager (`daemon/locks.rs`)

```rust
use std::collections::HashMap;
use std::time::{Duration, Instant};

pub struct LockManager {
    locks: HashMap<String, FileLock>,
    default_timeout: Duration,
}

struct FileLock {
    file_path: String,
    session_id: String,
    lock_token: String,
    acquired_at: Instant,
    expires_at: Instant,
}

#[derive(Debug)]
pub enum LockResult {
    Acquired { token: String },
    Conflict { holder: String, expires_in: Duration },
    Expired { reclaimed: bool },
}

impl LockManager {
    pub fn new(default_timeout: Duration) -> Self {
        Self {
            locks: HashMap::new(),
            default_timeout,
        }
    }
    
    pub fn acquire(&mut self, file_path: &str, session_id: &str, timeout: Option<Duration>) -> LockResult {
        let timeout = timeout.unwrap_or(self.default_timeout);
        let now = Instant::now();
        
        if let Some(existing) = self.locks.get(file_path) {
            // Check if lock expired
            if now >= existing.expires_at {
                // Lock expired, reclaim it
                let token = uuid::Uuid::new_v4().to_string();
                self.locks.insert(file_path.to_string(), FileLock {
                    file_path: file_path.to_string(),
                    session_id: session_id.to_string(),
                    lock_token: token.clone(),
                    acquired_at: now,
                    expires_at: now + timeout,
                });
                return LockResult::Expired { reclaimed: true };
            }
            
            // Lock held by another session
            if existing.session_id != session_id {
                return LockResult::Conflict {
                    holder: existing.session_id.clone(),
                    expires_in: existing.expires_at - now,
                };
            }
            
            // Same session, refresh the lock
            let token = existing.lock_token.clone();
            self.locks.get_mut(file_path).unwrap().expires_at = now + timeout;
            return LockResult::Acquired { token };
        }
        
        // No existing lock, acquire new
        let token = uuid::Uuid::new_v4().to_string();
        self.locks.insert(file_path.to_string(), FileLock {
            file_path: file_path.to_string(),
            session_id: session_id.to_string(),
            lock_token: token.clone(),
            acquired_at: now,
            expires_at: now + timeout,
        });
        
        LockResult::Acquired { token }
    }
    
    pub fn release(&mut self, file_path: &str, lock_token: &str) -> bool {
        if let Some(lock) = self.locks.get(file_path) {
            if lock.lock_token == lock_token {
                self.locks.remove(file_path);
                return true;
            }
        }
        false
    }
    
    pub fn is_locked(&self, file_path: &str) -> bool {
        if let Some(lock) = self.locks.get(file_path) {
            return Instant::now() < lock.expires_at;
        }
        false
    }
    
    pub fn cleanup_expired(&mut self) -> usize {
        let now = Instant::now();
        let expired: Vec<_> = self.locks.iter()
            .filter(|(_, lock)| now >= lock.expires_at)
            .map(|(path, _)| path.clone())
            .collect();
        
        let count = expired.len();
        for path in expired {
            self.locks.remove(&path);
        }
        count
    }
}
```

### 2. Deadlock Prevention

```rust
pub struct DeadlockPrevention {
    wait_for_graph: HashMap<String, Vec<String>>,
}

impl DeadlockPrevention {
    pub fn check_acquire_order(&self, session_id: &str, files: &[&str]) -> Result<(), DeadlockRisk> {
        // Rule: Always acquire locks in alphabetical order
        let mut sorted: Vec<_> = files.iter().collect();
        sorted.sort();
        
        for (i, file) in files.iter().enumerate() {
            if file != &sorted[i] {
                return Err(DeadlockRisk::OutOfOrder {
                    requested: files.to_vec(),
                    recommended: sorted.iter().map(|s| s.to_string()).collect(),
                });
            }
        }
        
        Ok(())
    }
    
    pub fn detect_deadlock(&self) -> Option<Vec<String>> {
        // Cycle detection in wait-for graph
        // If agent A waits for lock held by B, and B waits for lock held by A
        // -> deadlock
        
        for (agent, waiting_for) in &self.wait_for_graph {
            for other_agent in waiting_for {
                if let Some(other_waiting) = self.wait_for_graph.get(other_agent) {
                    if other_waiting.contains(agent) {
                        return Some(vec![agent.clone(), other_agent.clone()]);
                    }
                }
            }
        }
        None
    }
}
```

### 3. Retry with Exponential Backoff

```rust
pub struct LockClient {
    manager: Arc<Mutex<LockManager>>,
    max_retries: u32,
    base_delay: Duration,
    max_delay: Duration,
}

impl LockClient {
    pub async fn acquire_with_retry(&self, file_path: &str, session_id: &str) -> Result<String, LockError> {
        let mut delay = self.base_delay;
        
        for attempt in 0..self.max_retries {
            let result = self.manager.lock().unwrap().acquire(
                file_path,
                session_id,
                None,
            );
            
            match result {
                LockResult::Acquired { token } => return Ok(token),
                LockResult::Conflict { holder, expires_in } => {
                    if attempt == self.max_retries - 1 {
                        return Err(LockError::MaxRetriesExceeded { holder, expires_in });
                    }
                    
                    // Wait before retry
                    tokio::time::sleep(delay).await;
                    delay = std::cmp::min(delay * 2, self.max_delay);
                }
                LockResult::Expired { .. } => {
                    // Reclaimed expired lock
                    if let LockResult::Acquired { token } = self.manager.lock().unwrap().acquire(file_path, session_id, None) {
                        return Ok(token);
                    }
                }
            }
        }
        
        Err(LockError::MaxRetriesExceeded { holder: "unknown".to_string(), expires_in: Duration::ZERO })
    }
}
```

### 4. SQLite-Based Locking (Distributed)

```sql
-- Schema
CREATE TABLE file_locks (
    file_path TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    lock_token TEXT NOT NULL,
    acquired_at INTEGER NOT NULL,
    expires_at INTEGER
);

CREATE INDEX idx_locks_expires ON file_locks(expires_at);
```

```rust
impl LockManager {
    pub fn acquire_sqlite(&self, db: &Connection, file_path: &str, session_id: &str, timeout: i64) -> Result<String> {
        let token = uuid::Uuid::new_v4().to_string();
        let now = SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs() as i64;
        
        // Atomic acquire with conflict detection
        let result = db.execute_named(
            "INSERT INTO file_locks(file_path, session_id, lock_token, acquired_at, expires_at)
             VALUES (:path, :session, :token, :now, :expires)
             ON CONFLICT(file_path) DO UPDATE SET
               session_id = excluded.session_id,
               lock_token = excluded.lock_token,
               acquired_at = excluded.acquired_at,
               expires_at = excluded.expires_at
             WHERE file_locks.expires_at IS NULL OR file_locks.expires_at < :now
             RETURNING lock_token",
            named_params! {
                ":path": file_path,
                ":session": session_id,
                ":token": token,
                ":now": now,
                ":expires": now + timeout,
            },
        )?;
        
        if result > 0 {
            Ok(token)
        } else {
            Err(anyhow!("Lock held by another session"))
        }
    }
}
```

### 5. Lock Integration with Events

```rust
impl Daemon {
    pub async fn process_event(&mut self, event: FileEvent) -> Result<()> {
        // Try to acquire lock
        let lock_result = self.locks.acquire(&event.path, &event.session_id, None);
        
        match lock_result {
            LockResult::Acquired { token } => {
                // Process event
                self.handle_event(&event).await?;
                
                // Release lock
                self.locks.release(&event.path, &token);
            }
            LockResult::Conflict { holder, expires_in } => {
                // Queue event for later
                self.pending_events.push(event, determine_priority(&event));
                
                // Schedule retry
                self.schedule_retry(expires_in);
            }
            LockResult::Expired { reclaimed: true } => {
                // Lock was stale, reclaimed
                self.handle_event(&event).await?;
            }
        }
        
        Ok(())
    }
}
```

## Configuration

```yaml
locking:
  default_timeout: 60        # seconds
  max_retries: 5
  retry_base_delay: 100      # milliseconds
  retry_max_delay: 5000      # milliseconds
  cleanup_interval: 30       # seconds between expired lock cleanup
  
deadlock_prevention:
  enforce_ordering: true     # Require alphabetical lock acquisition
  detection_interval: 10     # seconds between deadlock checks
  timeout_as_deadlock: true  # Treat timeout as potential deadlock
```

## CLI Interface

```bash
# View current locks
speclangd locks list
# Output:
#   FILE                        HOLDER          EXPIRES_IN
#   specs/auth.spec.scl         spec-agent      45s
#   generated/go/auth.go        code-go         12s

# Force release a lock (admin)
speclangd locks release specs/auth.spec.scl --force

# Clear all expired locks
speclangd locks cleanup

# Check lock status
speclangd locks status specs/auth.spec.scl
```

## Test Cases
1. Acquire lock successfully
2. Reject lock when held by another
3. Allow same session to re-acquire
4. Release lock successfully
5. Lock expires after timeout
6. Retry with backoff on conflict
7. Deadlock detection works
8. Alphabetical ordering prevents deadlock
9. SQLite-based locking works
10. Expired lock cleanup works
11. Pending events queue on lock conflict
12. Multiple files locked atomically

## Output
1. LockManager implementation
2. DeadlockPrevention module
3. Retry logic with exponential backoff
4. SQLite-based distributed locking
5. CLI commands for lock management
6. Integration with event processing
