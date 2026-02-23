---
name: sip-055-cascade-triggers-speclang-v0
title: "SIP 55: Cascade Triggers"
version: 0.1.0
description: Trigger types and handling in the reactive cascade system
category: standard
---

# SIP 55: Cascade Triggers

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines trigger types and handling in the reactive cascade system.

### Quick Start

1. **User Edit:** Human edits north star or level-0 specs
2. **Agent Write:** Agent writes its owned file
3. **External:** Git pull, file sync from outside
4. **Detection:** inotify/fsnotify catches changes
5. **Routing:** Daemon finds owning agent

### Example

```
Trigger: User edits project.scl
  → speclangd detects change
  → Route to spec-writer agent
  → Agent writes specs/auth.spec.yaml
  → New trigger: agent_write for auth.spec.yaml
  → Route to code-gen agent
  → ...
```

### Key Concepts

- **Trigger Types:** user_edit, agent_write, external
- **Priority:** high (user), normal (agent), low (external)
- **Flow:** Trigger → Route → React → Cycle
- **Convergence:** Quiet period ends cascade

### When to Read This

- **Understanding triggers:** What starts cascades
- **Debugging:** Why cascade started
- **Optimization:** Configure trigger priorities

### Related SIPs

- SIP 7: Cascade System
- SIP 28: Cascade Protocol
- SIP 6: Agent Protocol

## Abstract

This SIP defines the trigger system for Speclang cascades. Triggers are the events that start and continue the reactive loop where files trigger agents trigger files.

## Motivation

The cascade needs to know:
- What starts a cascade
- How to route triggers
- When to stop cascading
- How to prevent infinite loops

## Rationale

**Trigger Types:**

| Type | Priority | Source | Result |
|------|----------|--------|--------|
| user_edit | high | Human/orchestrator | Starts full cascade |
| agent_write | normal | Agent | Triggers downstream |
| external | low | Git/sync | Detected by inotify |

**Benefits:**
- Clear separation of trigger sources
- Priority-based routing
- Predictable cascade behavior
- Easy debugging

## Specification

### Trigger Types

**@cascade/triggers:**

```yaml
Trigger:
  description: "What starts a cascade"
  
  types:
    user_edit:
      who: human or orchestrator
      what: edits north star or level-0 specs
      result: starts full cascade
      priority: high
      
    agent_write:
      who: any agent
      what: writes its owned file
      result: triggers downstream agents
      priority: normal
      
    external:
      who: git pull, file sync
      what: files appear/change from outside
      result: detected by inotify, cascade starts
      priority: low
```

### Trigger Flow

**@cascade/trigger-flow:**

```yaml
trigger_sources:
  - source: user
    files: [project.scl, specs/core/**]
    priority: high
    starts_cascade: true
    
  - source: spec-writer
    files: [specs/**/*.scl, specs/**/*.spec.*]
    priority: normal
    triggers: [code-gen, test-writer]
    
  - source: code-gen
    files: [generated/**/*]
    priority: normal
    triggers: [test-runner]
    
  - source: external
    files: ["**/*"]
    priority: low
    triggers: depends_on_file
```

### Trigger Detection

**Detection Mechanism:**

```python
class TriggerDetector:
    def __init__(self):
        self.watcher = FileWatcher()
        self.debounce_ms = 100
        
    def start(self):
        self.watcher.on_change(self.handle_change)
        
    def handle_change(self, event):
        # Debounce rapid changes
        self.debounce(event, self.process)
        
    def process(self, event):
        trigger = Trigger(
            type=self.classify(event),
            file=event.path,
            kind=event.kind,  # create, modify, delete
            timestamp=now()
        )
        self.route(trigger)
```

### Trigger Classification

```python
def classify_trigger(event):
    if is_user_edit(event):
        return 'user_edit'
    elif is_agent_write(event):
        return 'agent_write'
    else:
        return 'external'

def is_user_edit(event):
    # Check if from human/orchestrator
    return event.source == 'user'

def is_agent_write(event):
    # Check if from active agent session
    return get_active_session(event.file) is not None
```

### Trigger Routing

**Routing Rules:**

```python
def route_trigger(trigger):
    # Find owning agent
    agent = find_owner(trigger.file)
    
    # Check priority
    priority = get_priority(trigger.type)
    
    # Create event
    event = Event(
        trigger=trigger,
        agent=agent,
        priority=priority
    )
    
    # Queue for processing
    event_queue.put(event)
```

### Cascade Depth

**@cascade/depth:**

```yaml
CascadeDepth:
  description: "How deep a cascade can go"
  
  limits:
    max_depth: 100
    max_files_per_cascade: 1000
    max_duration: 10 minutes
    
  depth_tracking:
    - each file change increments depth
    - depth resets on convergence
    - max depth triggers pause + notify
    
  purpose:
    - prevent infinite loops
    - detect circular dependencies
    - protect system resources
```

**Depth Example:**

```
Depth 0:  user edits project.scl
Depth 1:  spec-writer creates auth.scl
Depth 2:  spec-writer creates auth/entities.scl
Depth 3:  spec-writer creates auth/operations.scl
Depth 4:  code-gen creates auth.go.spec
Depth 5:  code-gen creates generated/go/auth.go
Depth 6:  test-writer creates auth.test.spec.scl
Depth 7:  test-writer creates auth_test.go
Depth 8:  convergence detected
```

### Concurrent Cascades

**@cascade/concurrent:**

```yaml
ConcurrentCascades:
  description: "Multiple cascades running at once"
  
  rules:
    - One cascade per root trigger
    - Cascades can run in parallel
    - File locks prevent conflicts
    - Each cascade has own depth counter
  
  example:
    Cascade A: user edits project.scl → auth system
    Cascade B: user edits another feature → user profile
    Both run concurrently, different files
```

### Cascade Events

**@cascade/events:**

```yaml
CascadeEvent:
  cascade_id: String
  depth: Int
  trigger: FileChange
  agent: SessionId
  output: FilePath[]
  timestamp: DateTime
  
EventLog:
  location: .speclang/cascade.log
  format: JSON lines
  purpose: debugging, rollback, analysis
```

**Event Example:**

```json
{"cascade_id":"cas-001","depth":2,"trigger":{"file":"specs/auth.scl","kind":"modify"},"agent":"spec-writer","output":["specs/auth/entities.scl"],"timestamp":"2024-01-15T10:30:01Z"}
{"cascade_id":"cas-001","depth":3,"trigger":{"file":"specs/auth/entities.scl","kind":"create"},"agent":"code-gen-go","output":["generated/go/auth/entities.go"],"timestamp":"2024-01-15T10:30:02Z"}
```

### Cascade Control

**@cascade/control:**

```yaml
CascadeControl:
  description: "How to control the cascade"
  
  commands:
    /pause: stop cascade, keep state
    /resume: continue paused cascade
    /abort: kill cascade, rollback
    /step: one iteration, then pause
    /status: show cascade state
    
  limits:
    max_cascades: 10 concurrent
    max_depth: 100
    max_files: 1000
    max_time: 10 minutes
    
  on_limit:
    - pause cascade
    - notify orchestrator
    - wait for /resume or /abort
```

### Loop Prevention

**@cascade/loop-prevention:**

```yaml
LoopPrevention:
  description: "Prevent infinite cascades"
  
  watcher_ignores:
    - Uses: .gitignore patterns
    - Plus: [".speclang/", "*.log", "reports/", ".git/"]
    - Support negation: !path/to/spec
  
  ignore_patterns:
    - "*.log"
    - "reports/**/*"
    - ".speclang/**/*"
    - "generated/**/*"
  
  watch_patterns:
    - "**/*.spec.{md,yaml,yml,scl}"
    - "**/*.{go,ts,js,py,rs,java}.spec"
    - "**/project.scl"
    - "**/build.{scl,yaml}"
  
  why_it_works:
    - Test results written to reports/
    - Logs written to .speclang/logs/
    - Generated code watched but...
    - Only .go.spec files trigger, not .go files
    - Result: test results don't re-trigger tests
```

## Configuration

**project.scl:**

```yaml
config:
  cascade:
    triggers:
      user_edit:
        priority: high
        debounce: 100
      agent_write:
        priority: normal
        debounce: 50
      external:
        priority: low
        debounce: 500
        
    limits:
      max_depth: 100
      max_files: 1000
      max_time: 600
      max_concurrent: 10
```

## Implementation

### Trigger Handler

```python
class TriggerHandler:
    def __init__(self, config):
        self.config = config
        self.detector = TriggerDetector()
        self.router = TriggerRouter()
        self.depth_tracker = DepthTracker()
        
    def on_file_change(self, event):
        trigger = self.create_trigger(event)
        
        if self.should_process(trigger):
            self.router.route(trigger)
            
    def create_trigger(self, event):
        return Trigger(
            type=self.classify(event),
            file=event.path,
            kind=event.kind,
            timestamp=now(),
            cascade_id=self.get_or_create_cascade_id()
        )
        
    def should_process(self, trigger):
        # Check ignore patterns
        if self.is_ignored(trigger.file):
            return False
            
        # Check depth limit
        if self.depth_tracker.at_limit(trigger.cascade_id):
            return False
            
        return True
```

### Depth Tracker

```python
class DepthTracker:
    def __init__(self, max_depth=100):
        self.max_depth = max_depth
        self.cascades = {}
        
    def increment(self, cascade_id):
        if cascade_id not in self.cascades:
            self.cascades[cascade_id] = 0
        self.cascades[cascade_id] += 1
        return self.cascades[cascade_id]
        
    def at_limit(self, cascade_id):
        return self.cascades.get(cascade_id, 0) >= self.max_depth
        
    def reset(self, cascade_id):
        self.cascades[cascade_id] = 0
```

## Debugging

**Commands:**

```bash
# View cascade log
speclang cascade log

# Check trigger history
speclang cascade triggers

# Why did this cascade start?
speclang cascade why specs/auth.scl

# View depth of current cascades
speclang cascade depth
```

**Log Output:**

```
2024-01-15T10:30:00Z [TRIGGER] user_edit project.scl priority=high
2024-01-15T10:30:00Z [CASCADE] started cas-001
2024-01-15T10:30:01Z [TRIGGER] agent_write specs/auth.scl priority=normal
2024-01-15T10:30:01Z [DEPTH] cas-001 depth=1
...
2024-01-15T10:30:37Z [CONVERGE] cas-001 depth=8
```

## References

- SIP 7: Cascade System
- SIP 28: Cascade Protocol
- SIP 6: Agent Protocol
- SIP 10: Daemon

## Copyright

This document is in the public domain.
