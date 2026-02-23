---
name: sip-007-cascade-system-speclang-v0
title: "SIP 7: Cascade System"
version: 0.1.0
description: Reactive cascade where files trigger agents trigger files
category: standard
---

# SIP 7: Cascade System

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the reactive cascade system where files trigger agents trigger files.

### Quick Start

1. **Trigger:** File changes (user or agent)
2. **Route:** Daemon finds owning agent
3. **Process:** Agent writes files
4. **Repeat:** More triggers
5. **Converge:** Quiet period (30s default)

### Example

```
User edits project.scl
  → North Star writes specs/auth.spec.yaml
  → Spec Writer expands auth/entities.spec.yaml
  → Code Gen writes auth/entities.go.spec
  → Quiet period → Done
```

### Key Concepts

- **Reactive:** Like a spreadsheet
- **Event-Driven:** File changes trigger agents
- **Convergence:** No changes = done
- **Loop Prevention:** Test results go to ignored dirs

### When to Read This

- **Understanding flow:** How cascade works
- **Debugging:** Why files changed
- **Optimization:** Manage cascade depth

### Related SIPs

- SIP 6: Agent Protocol
- SIP 8: Configuration

## Abstract

This SIP defines the cascade system for Speclang. The cascade is the reactive loop where file changes trigger agents, agents write files, and files trigger more agents until convergence.

## Motivation

Software development is reactive:
- User changes requirements
- Code must update
- Tests must update
- Dependencies must update

Traditional build systems are batch. Speclang is reactive - like a spreadsheet.

## Rationale

**Reactive Cascade:**
```
File A changes
  ↓
Agent processes A
  ↓
Writes File B
  ↓
Agent processes B
  ↓
Writes File C
  ↓
...
  ↓
Quiet period → Done
```

**Benefits:**
- Immediate feedback
- Always consistent
- No manual rebuilds
- Self-correcting

## Specification

### Cascade Triggers

**File Events:**

| Event | Description |
|-------|-------------|
| `file.edited` | Content changed |
| `file.created` | New file |
| `file.deleted` | File removed |
| `file.renamed` | File moved |

**Trigger Sources:**
- User edits
- Agent writes
- Git operations
- External sync

### Cascade Flow

**Step-by-Step:**

```
1. Event Detection
   - inotify/fsnotify detects change
   - debounce 100ms
   - validate file is spec
   
2. Event Routing
   - Parse header
   - Find owning agent
   - Check file ownership
   - Create/send event
   
3. Agent Processing
   - Agent receives event
   - Reads file
   - Reads dependencies
   - Processes content
   
4. Agent Writing
   - Writes new files
   - Updates existing
   - Validates headers
   - Checks size limits
   
5. Git Commit
   - Commit changed files
   - With agent summary
   - Atomic per file
   
6. Repeat
   - New events trigger
   - New agents spawn
   - Cascade continues
```

### Convergence

**Definition:** No file changes for quiet period

**Detection:**
```python
def check_convergence():
    last_event = get_last_event_time()
    quiet_period = config.cascade.quiet_period  # 30s
    
    if now() - last_event > quiet_period:
        return True
    return False
```

**On Convergence:**
1. Run pipeline
2. Execute tests
3. Build artifacts
4. Notify completion

### Cascade Depth

**Tracking:**
```python
cascade:
  depth: 0      # Current depth
  max_depth: 50 # Safety limit
  files: []     # Files touched this cascade
  count: 0      # Total changes
```

**Limits:**
- `max_depth: 50` - Safety limit
- `max_files: 1000` - Safety limit
- `max_time: 3600s` - Safety limit

**On Limit Reached:**
- Block cascade
- Notify North Star
- Log diagnostic
- Require manual intervention

### Loop Prevention

**Ignored Files:**
```yaml
config:
  watcher:
    ignore:
      - uses: ".gitignore"
      - plus: [".speclang/", "*.log", "reports/"]
```

**Why It Works:**
- Test results → reports/ (ignored)
- Logs → .speclang/logs (ignored)
- Generated code → generated/ (watched but only .go.spec triggers)

**No Infinite Loop:**
```
Write test spec
  ↓
Test runs
  ↓
Results written to reports/
  ↓
reports/ ignored
  ↓
No trigger
  ✓ Done
```

### Cascade Graph

**Dependency Tracking:**
```python
graph = {
    '@specs/auth': {
        'refs': ['@specs/user', '@stdlib/Result'],
        'dependents': ['@specs/auth/login', '@tests/auth']
    }
}
```

**On Change:**
```python
def on_file_change(file_id):
    # Find dependents
    dependents = graph[file_id]['dependents']
    
    # Trigger each
    for dep in dependents:
        trigger_cascade(dep)
```

## Configuration

**project.scl:**

```yaml
config:
  cascade:
    quiet_period: 30          # Seconds
    max_depth: 50            # Safety
    max_files: 1000          # Safety
    max_time: 3600           # Seconds
    debounce: 100            # Milliseconds
    
  watcher:
    patterns: ["**/*.spec.*"]
    ignore:
      uses: ".gitignore"
      plus: [".speclang/", "*.log"]
```

## Implementation

### Event Queue

```python
class Cascade:
    def __init__(self):
        self.events = Queue()
        self.processing = set()
        self.depth = 0
        
    def add_event(self, event):
        self.events.put(event)
        
    def process(self):
        while not self.events.empty():
            event = self.events.get()
            self.handle(event)
            
    def handle(self, event):
        # Find agent
        agent = find_owner(event.file)
        
        # Spawn session
        session = spawn_agent(agent, event.file)
        
        # Process
        session.process(event)
        
        # Complete
        session.complete()
        
        # Check convergence
        if check_convergence():
            self.finalize()
```

### Debouncing

```python
from threading import Timer

class Debouncer:
    def __init__(self, callback, delay=0.1):
        self.callback = callback
        self.delay = delay
        self.timer = None
        
    def trigger(self, event):
        if self.timer:
            self.timer.cancel()
        self.timer = Timer(self.delay, self.callback, [event])
        self.timer.start()
```

### Convergence Detection

```python
class ConvergenceDetector:
    def __init__(self, quiet_period=30):
        self.quiet_period = quiet_period
        self.last_event = time.now()
        self.timer = None
        
    def on_event(self):
        self.last_event = time.now()
        if self.timer:
            self.timer.cancel()
        self.timer = Timer(self.quiet_period, self.on_converge)
        self.timer.start()
        
    def on_converge(self):
        print("Cascade converged!")
        run_pipeline()
```

## Integration

**With Agents:**
- Events trigger agents
- Agents write files
- Files trigger more events

**With Git:**
- Commits per agent
- Clear history
- Easy rollback

**With SQLite:**
- Events logged
- State tracked
- Graph queryable

## Examples

### Simple Cascade

```
User: "Add user profile"

1. User edits project.scl
2. North Star writes specs/user.spec.yaml
3. Spec Writer expands user/entities, user/operations
4. Spec Writer writes user/entities.spec.yaml
5. Code Gen writes user/entities.go.spec
6. Build system generates generated/go/user/entities.go
7. Test Writer writes tests/user.test.spec.yaml
8. Quiet period (30s)
9. Pipeline runs
10. Tests pass
11. Done
```

### Complex Cascade

```
User: "Add authentication"

1. project.scl updated
2. specs/auth.spec.yaml created
3. auth splits into auth.spec.spec.dir/
   - entities.spec.yaml
   - operations.spec.yaml
   - policies.spec.yaml
4. Each child triggers Code Gen
   - auth/entities.go.spec
   - auth/operations.go.spec
   - auth/policies.go.spec
5. Generated code triggers tests
   - auth/entities.test.spec.yaml
   - auth/operations.test.spec.yaml
6. Tests run
7. Build completes
8. Convergence
```

## Debugging

**Tools:**

```bash
# View cascade log
speclang cascade log

# Visualize graph
speclang cascade graph

# Check status
speclang cascade status

# Why did file change?
speclang cascade why specs/auth.go.spec
```

**Logs:**
```
2024-01-15T10:30:00Z [EVENT] file.edited specs/auth.spec.yaml
2024-01-15T10:30:01Z [AGENT] spawn spec-writer sess-001
2024-01-15T10:30:05Z [WRITE] specs/auth/entities.spec.yaml
2024-01-15T10:30:06Z [COMMIT] specs/auth/entities.spec.yaml
2024-01-15T10:30:07Z [EVENT] file.edited specs/auth/entities.spec.yaml
...
2024-01-15T10:30:37Z [CONVERGE] Quiet period detected
2024-01-15T10:30:38Z [PIPELINE] Starting build...
```

## References

- SIP 6: Agent Protocol
- SIP 8: Configuration
- SIP 3: Block System

## Copyright

This document is in the public domain.