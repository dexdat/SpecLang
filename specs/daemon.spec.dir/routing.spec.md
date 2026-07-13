# speclang-header lines:9
id: "@speclang/daemon/routing"
parent: "@ref:specs/daemon"
project_level: Alpha
agent_support: agent_assisted
tags: [daemon, router, routing, agents]
version: 0.1.0
layer: 2
---
# Daemon Routing

Event routing and agent notification for speclangd.

## Router

### @daemon/router

```speclang
# @block:daemon/router @kind:entity
Router:
  input: file change event
  output: notification to owning agent
  
  routing_rules:
    project.scl → NorthStarAgent
    specs/**/*.scl → SpecAgent (by file pattern)
    tests/**/*.test.spec.scl → TestAgent
    generated/**/*.go → CodeAgent-Go
    generated/**/*.ts → CodeAgent-TS
    
  notification:
    method: HTTP POST to agent session
    payload: { event, file, diff? }
```

### @daemon/router-impl

```speclang
# @block:daemon/router-impl @kind:pseudocode
```
route(event):
  file = event.path
  
  if file matches "project.scl":
    return notify(NorthStarAgent, event)
    
  if file matches "specs/*.scl":
    agent = find_owner(file) or SpecAgent
    return notify(agent, event)
    
  if file matches "tests/*.test.spec.scl":
    return notify(TestAgent, event)
    
  if file matches "generated/**/*.go":
    return notify(CodeAgent-Go, event)
    
  if file matches "generated/**/*.ts":
    return notify(CodeAgent-TS, event)
    
  if file matches "generated/*" and is_human_edit(file):
    return notify(BackSyncAgent, event)
```
```
