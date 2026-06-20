# speclang-header lines:32
id: "@speclang/cascade/convergence"
version: 0.1.0
layer: 2
tags: [cascade, reactive, convergence, termination]
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Cascade Convergence
parent: "@ref:speclang/cascade"
part: 2/2
# Cascade Convergence

How the cascade ends and what happens after.

## Cascade vs Build

### @cascade/vs-build

```speclang
| Cascade | Build |
|---------|-------|
| Reactive, continuous | Triggered, one-shot |
| AI agents write files | Scripts compile files |
| Ends on convergence | Ends on success/failure |
| Produces specs + code | Produces artifacts |
| Runs during development | Runs after convergence |

Cascade happens first, then build runs on converged state.
```

---

## Debugging Cascades

### @cascade/debug

```speclang
# @block:cascade/debug @kind:entity
CascadeDebug:
  description: "Tools to understand cascade behavior"
  
  logs:
    - .speclang/cascade.log: all events
    - .speclang/agents.log: agent activity
    - .speclang/locks.log: lock acquisitions
  
  commands:
    /cascade-log: show recent events
    /cascade-graph: visualize dependencies
    /cascade-stats: depth, files, duration
    /why {file}: show what triggered this file
  
  visualization:
    - mermaid graph of cascade
    - timeline of events
    - agent activity heatmap
```

---

## Cascade Termination

### @cascade/termination

```speclang
# @block:cascade/termination @kind:entity
TerminationConditions:
  normal:
    - quiet_period: no changes for 30s
    - all_agents_idle: no active sessions
    - depth_stable: depth not increasing
    - no_pending_events: no events with processed=0 and claimed_by IS NULL
  
  forced:
    - /finalize command
    - max_depth reached
    - max_files reached
    - max_time reached
    - error requiring intervention
  
  on_terminate:
    1. wait for in-flight writes
    2. log cascade summary
    3. trigger pipeline if normal termination
    4. notify orchestrator
```