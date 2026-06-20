# speclang-header lines:12
id: "@speclang/convergence/detection"
version: 0.1.0
layer: 2
parent: "@ref:speclang/convergence"
part: 1/2
siblings:
  next: "@ref:speclang/convergence/triggers"
project_level: Alpha
agent_support: agent_autonomous
tags: [convergence, detection, algorithm]
short: Convergence detection algorithms
---
# Convergence Detection

How the system detects when the reactive cascade has converged.

## Detection Signals

### @convergence/detection-signals

```speclang
# @block:convergence/detection-signals @kind:entity
ConvergenceSignals:
  quiet_period:
    description: "No file changes or events for configured period"
    default: 30 seconds
    config_key: "convergence.quiet_period"
    
  all_agents_idle:
    description: "All agents report idle status (no active sessions)"
    check: "agent.status == 'idle'"
    
  user_finalize:
    description: "User explicitly triggers convergence via /finalize command"
    command: "/finalize"
    
  max_depth_reached:
    description: "Cascade depth limit reached (safety boundary)"
    default: 5
    config_key: "cascade.max_depth"
```

## Detection Algorithm

### @convergence/detector

```speclang
# @block:convergence/detector @kind:entity
ConvergenceDetector:
  purpose: "Determine when cascade is complete"
  implements: "EventEmitter"
  
  properties:
    - last_event_time: "timestamp of last file change or agent activity"
    - quiet_period_seconds: "configurable threshold"
    - agent_registry: "reference to active agents"
    
  methods:
    - check(): "returns Converged | StillCascading"
    - reset(): "reset timers after new activity"
    - force(): "trigger convergence immediately"
```

### @convergence/algorithm

```speclang
# @block:convergence/algorithm @kind:pseudocode
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

## Implementation Notes

- The detector runs on a timer (e.g., every 5 seconds)
- Each file change or agent activity resets the timer
- Convergence triggers the pipeline (build, test, commit)