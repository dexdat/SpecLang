# speclang-header lines:11
id: "@speclang/convergence/triggers"
version: 0.1.0
layer: 2
parent: "@ref:speclang/convergence"
part: 2/2
project_level: Alpha
agent_support: agent_autonomous
tags: [convergence, triggers, termination]
short: Convergence triggers and termination conditions
---
# Convergence Triggers

What causes convergence to be triggered, either normally or forced.

## Normal Termination

### @convergence/normal-termination

```speclang
# @block:convergence/normal-termination @kind:entity
NormalTermination:
  conditions:
    - quiet_period: "no changes for configured time (default: 30s)"
    - all_agents_idle: "no active agent sessions"
    - depth_stable: "cascade depth not increasing"
    - no_pending_events: "no unprocessed events in queue"
  
  verification:
    - wait for in-flight writes
    - confirm all file locks released
    - validate spec index consistency
  
  on_success:
    1. log cascade summary
    2. trigger pipeline (build, test, commit)
    3. notify orchestrator
    4. await next input
```

## Forced Termination

### @convergence/forced-termination

```speclang
# @block:convergence/forced-termination @kind:entity
ForcedTermination:
  triggers:
    - user_finalize: "/finalize command"
    - max_depth_reached: "cascade depth limit hit"
    - max_files_reached: "too many files changed in single cascade"
    - max_time_reached: "cascade running too long"
    - error_requiring_intervention: "system error that cannot auto-recover"
  
  behavior:
    - immediate termination (no waiting for quiet period)
    - rollback of incomplete transactions if possible
    - error reporting to user
    - system reset for next cascade
  
  safety:
    - forced termination does NOT run pipeline
    - logs detailed diagnostics
    - requires manual restart
```

## Cascade vs Build

### @convergence/cascade-vs-build

```speclang
# @block:convergence/cascade-vs-build @kind:table
| Cascade | Build |
|---------|-------|
| Reactive, continuous | Triggered, one-shot |
| AI agents write files | Scripts compile files |
| Ends on convergence | Ends on success/failure |
| Produces specs + code | Produces artifacts |
| Runs during development | Runs after convergence |

Cascade happens first, then build runs on converged state.
```

## Debugging Convergence

### @convergence/debug

```speclang
# @block:convergence/debug @kind:entity
ConvergenceDebug:
  description: "Tools to understand convergence behavior"
  
  logs:
    - .speclang/cascade.log: all events
    - .speclang/agents.log: agent activity
    - .speclang/locks.log: lock acquisitions
  
  commands:
    /convergence-log: show recent convergence checks
    /convergence-stats: depth, files, duration
    /why-converged: explain why convergence triggered
  
  visualization:
    - timeline of events leading to convergence
    - agent activity heatmap
    - quiet period countdown
```