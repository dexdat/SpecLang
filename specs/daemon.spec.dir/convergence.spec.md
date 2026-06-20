# speclang-header lines:13
id: "@speclang/daemon/convergence"
parent: "@ref:specs/daemon"
part: 4/4
siblings:
  prev: "@ref:specs/daemon.spec.dir/routing"
short: Convergence detection and finalization
project_level: Alpha
agent_support: agent_assisted
tags: [daemon, convergence, detection]
version: 0.1.0
layer: 2
---
# Daemon Convergence Detection

Convergence detection and finalization for speclangd.

## Convergence Detector

### @daemon/convergence

```speclang
# @block:daemon/convergence @kind:entity
ConvergenceDetector:
  purpose: know when the cascade is done
  
  signals:
    - quiet_period: no events for N seconds
    - all_agents_done: every agent reports idle
    - user_finalize: /finalize in north star
  
  default_quiet: 30 seconds
  
  on_converge:
    1. wait for all in-flight events
    2. verify all agents idle
    3. run tests
    4. commit changes
    5. notify user
    6. await next input
```

### @daemon/convergence-impl

```speclang
# @block:daemon/convergence-impl @kind:pseudocode
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
```
