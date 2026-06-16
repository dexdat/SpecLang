# Bootstrap Phase 1.7: Daemon Convergence Detection

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.7 of the bootstrap process.

**Prerequisites**: Phase 1.1 (Daemon Core), Phase 1.6 (Events) complete.

## Your Task
Implement convergence detection - knowing when the cascade is done and it's safe to run tests and commit.

## Read These Specs First
1. `specs/daemon.spec.dir/convergence.spec.md` - Convergence detection

## Convergence Signals

A cascade has converged when:
1. **Quiet period**: No events for N seconds (default 30s)
2. **All agents done**: Every agent reports idle
3. **User finalize**: `/finalize` command in north star

## Implementation

### 1. Convergence Detector (`daemon/convergence.rs`)
```rust
use std::time::{Duration, Instant};

pub struct ConvergenceDetector {
    last_event_time: Instant,
    quiet_period: Duration,  // default 30s
    start_time: Instant,
    files_changed: u32,
}

impl ConvergenceDetector {
    pub fn new(quiet_period: Duration) -> Self {
        Self {
            last_event_time: Instant::now(),
            quiet_period,
            start_time: Instant::now(),
            files_changed: 0,
        }
    }
    
    pub fn on_event(&mut self) {
        self.last_event_time = Instant::now();
        self.files_changed += 1;
    }
    
    pub fn is_converged(&self, agents: &[Agent]) -> bool {
        // Check quiet period
        if Instant::now().duration_since(self.last_event_time) < self.quiet_period {
            return false;
        }
        
        // Check all agents idle
        for agent in agents {
            if agent.status() != AgentStatus::Idle {
                return false;
            }
        }
        
        true
    }
    
    pub fn time_remaining(&self) -> Option<Duration> {
        let elapsed = Instant::now().duration_since(self.last_event_time);
        if elapsed >= self.quiet_period {
            None
        } else {
            Some(self.quiet_period - elapsed)
        }
    }
    
    pub fn reset(&mut self) {
        self.last_event_time = Instant::now();
        self.start_time = Instant::now();
        self.files_changed = 0;
    }
}
```

### 2. Convergence Result
```rust
pub struct Converged {
    pub files_changed: u32,
    pub duration: Duration,
    pub test_results: Option<TestResults>,
}

pub enum CascadeStatus {
    Idle,
    Cascading {
        depth: u32,
        files_changed: u32,
        time_remaining: Duration,
    },
    Converged(Converged),
    Paused,
}
```

### 3. Convergence Actions
```rust
impl ConvergenceDetector {
    pub fn on_converge(&self) -> Result<()> {
        // 1. Wait for all in-flight events
        self.wait_for_inflight()?;
        
        // 2. Verify all agents idle
        self.verify_agents_idle()?;
        
        // 3. Run tests
        let results = self.run_tests()?;
        
        // 4. Commit changes
        self.commit_changes()?;
        
        // 5. Notify user
        self.notify_convergence()?;
        
        // 6. Await next input
        Ok(())
    }
}
```

## Convergence Algorithm

```
check_convergence():
  now = timestamp()
  
  # quiet period check
  if now - last_event_time < QUIET_SECONDS:
    return StillCascading
    
  # agent status check
  for agent in all_agents:
    if agent.status != Idle:
      return StillCascading
  
  # converged!
  return Converged(
    files_changed: changed_count,
    duration: start_time - now,
    test_results: run_tests()
  )
```

## Configuration

```yaml
cascade:
  quiet_period: 30      # seconds of quiet before converged
  max_depth: 50         # maximum cascade depth
  max_files: 1000       # maximum files to change in one cascade
```

## Integration with Daemon

```rust
impl Daemon {
    pub fn tick(&mut self) -> Option<Converged> {
        // Process any pending events
        self.process_events();
        
        // Check for convergence
        if self.convergence.is_converged(&self.agents) {
            let result = self.convergence.on_converge()?;
            self.convergence.reset();
            return Some(result);
        }
        
        None
    }
}
```

## CLI Interface

```bash
# Check convergence status
speclangd status
# Output: Cascading (15s remaining) or Converged or Idle

# Force finalization (skip quiet period)
speclangd finalize

# Pause cascade (don't auto-trigger)
speclangd pause

# Resume cascade
speclangd resume
```

## Test Cases
1. Converged after quiet period with no events
2. Still cascading if event during quiet period
3. Still cascading if agent active
4. Reset timer on new event
5. Report time remaining correctly
6. Run tests on convergence
7. Commit changes on convergence
8. Handle max depth limit
9. Handle max files limit

## Output
1. ConvergenceDetector implementation
2. CascadeStatus enum
3. Convergence actions (tests, commit, notify)
4. CLI status and finalize commands
5. Integration with daemon tick loop
