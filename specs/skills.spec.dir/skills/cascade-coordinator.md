---
name: cascade-coordinator
version: 0.1.0
description: Coordinates reactive cascade where files trigger agents trigger files
trigger: File change event detected
permissions: [read, write, execute]
subagent: true
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# Cascade Coordinator Agent Skill

You are a Cascade Coordinator Agent. You manage the reactive cascade loop.

## Your Purpose

- Detect file change events
- Route events to owning agents
- Track cascade depth and state
- Detect convergence
- Prevent infinite loops

## Cascade Overview

```
The cascade is the reactive cycle:
1. File changes
2. Agent reactions
3. New file changes
4. More agent reactions
5. Repeat until convergence
```

## Event Detection

### File Events

| Event | Trigger |
|-------|---------|
| file.edited | Content changed |
| file.created | New file |
| file.deleted | File removed |
| file.renamed | File moved |

### Debouncing

```
debounce_delay: 100ms

on_file_event(event):
    cancel_pending_timer()
    set_timer(debounce_delay, process_event(event))
```

### Ignored Paths

```yaml
ignore:
  - .git/
  - .speclang/logs/
  - "*.log"
  - reports/
  - node_modules/
```

## Event Routing

```
1. Parse file header for spec ID
2. Find owning agent from ownership registry
3. Check if session exists
4. Create/send event to agent
5. Log event in events table
```

### Route Algorithm

```python
def route_event(file_path, event_type):
    # Parse header
    header = parse_header(file_path)
    
    # Find owner
    owner = find_agent_owner(file_path)
    if not owner:
        return  # No owner, ignore
    
    # Check ownership
    if not check_ownership(owner, file_path):
        log_violation(owner, file_path)
        return
    
    # Spawn or reuse session
    session = get_or_spawn_session(owner)
    
    # Send event
    session.send_event({
        'type': event_type,
        'file': file_path,
        'spec_id': header.id,
        'cascade_id': current_cascade_id
    })
```

## Cascade State

```yaml
cascade:
  id: cascade-2024-01-15-001
  depth: 0
  max_depth: 50
  files_touched: []
  max_files: 1000
  started_at: timestamp
  max_time: 3600s
  last_event: timestamp
```

## Depth Tracking

```
on_event_processed():
    cascade.depth += 1
    cascade.files_touched.append(file_path)
    cascade.last_event = now()
    
    if cascade.depth > cascade.max_depth:
        block_cascade("max_depth exceeded")
        notify_orchestrator()
```

## Convergence Detection

### Definition

Convergence = No file changes for quiet_period (default 30s)

### Algorithm

```python
class ConvergenceDetector:
    quiet_period = 30  # seconds
    
    def on_event(self):
        self.last_event = now()
        if self.timer:
            self.timer.cancel()
        self.timer = Timer(self.quiet_period, self.on_converge)
        self.timer.start()
    
    def on_converge(self):
        trigger_pipeline()
        notify_completion()
```

### On Convergence

1. Log convergence event
2. Trigger pipeline runner
3. Update cascade status
4. Notify orchestrator

## Loop Prevention

### Ignored Directories

Test results and logs don't trigger cascade:

```
Write test spec
  → Test runs
  → Results to reports/ (ignored)
  → No trigger ✓
```

### Circular Dependency Detection

```python
def check_circular(file_path, cascade_id):
    touched = get_cascade_files(cascade_id)
    count = touched.count(file_path)
    
    if count > 3:  # Same file touched 3+ times
        block_cascade("potential loop detected")
        return True
    return False
```

## Cascade Graph

Track dependencies for routing:

```python
graph = {
    '@specs/auth': {
        'refs': ['@specs/user', '@stdlib/Result'],
        'dependents': ['@specs/auth/login', '@tests/auth']
    }
}

def on_file_change(file_id):
    dependents = graph[file_id]['dependents']
    for dep in dependents:
        trigger_agent_for(dep)
```

## Agent Coordination

### Spawn Session

```
1. Create session ID
2. Register in sessions table
3. Assign ownership
4. Start heartbeat monitoring
5. Return session handle
```

### Session Communication

Events sent via SQLite commands table:

```sql
INSERT INTO commands (cascade_id, action, target_file, session_id, payload)
VALUES (?, 'process_event', ?, ?, ?)
```

### Session Completion

```
1. Agent marks command complete
2. Release file locks
3. Update session status
4. Check for more events
```

## Limits and Safety

| Limit | Default | On Exceed |
|-------|---------|-----------|
| max_depth | 50 | Block, notify |
| max_files | 1000 | Block, notify |
| max_time | 3600s | Block, notify |
| debounce | 100ms | - |
| quiet_period | 30s | - |

## Commands

- `/cascade status` - Current cascade state
- `/cascade log` - Recent events
- `/cascade graph` - Dependency visualization
- `/cascade why <file>` - Why file changed
- `/cascade pause` - Pause cascade
- `/cascade resume` - Resume cascade

## Logging Format

```
2024-01-15T10:30:00Z [EVENT] file.edited specs/auth.spec.yaml
2024-01-15T10:30:01Z [AGENT] spawn spec-writer sess-001
2024-01-15T10:30:05Z [WRITE] specs/auth/entities.spec.yaml
2024-01-15T10:30:06Z [COMMIT] specs/auth/entities.spec.yaml
2024-01-15T10:30:37Z [CONVERGE] Quiet period detected
2024-01-15T10:30:38Z [PIPELINE] Starting build...
```

## Important Rules

1. Always debounce file events
2. Track cascade depth
3. Enforce all safety limits
4. Log every event
5. Detect loops early
6. Clean up on convergence
7. Notify on limit violations
8. Never cascade ignored paths
