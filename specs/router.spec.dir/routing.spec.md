# speclang-header lines:12
id: "@speclang/router/routing"
parent: ""@ref:specs/router"part: 1/2
siblings:
  next: ""@ref:specs/router.spec.dir/agents"short: Routing rules and cascade depth
project_level: Alpha
agent_support: agent_assisted
tags: [router, routing, daemon, typescript]
version: 0.1.0
layer: 2
---
# Router Routing

Routing of file events to responsible agents based on file patterns.

## Router

### @router/routing

```speclang
# @block:router/routing @kind:entity
Router:
  input: file change event
  output: agent task
  
  routing_rules:
    project.scl → NorthStarAgent
    specs/**/*.scl → SpecAgent
    specs/**/*.spec.md → SpecAgent
    specs/**/*.spec.yaml → SpecAgent
    tests/**/*.test.spec.scl → TestAgent
    generated/**/*.go → CodeAgent-Go
    generated/**/*.ts → CodeAgent-TS
    generated/**/*.js → CodeAgent-JS
    generated/**/*.py → CodeAgent-Python
    generated/**/*.rs → CodeAgent-Rust
    
  cascade_depth:
    tracks: depth of generated file changes
    max: 5
    reset: on convergence detection
    
  extraction:
    spec_path: from file path
    target_path: from spec path
```

### @router/routing-impl

```speclang
# @block:router/routing-impl @kind:pseudocode
```
route(event):
  file = event.path
  
  for rule in routing_rules:
    if file matches rule.pattern:
      task = create_task(rule.agent, rule.taskKind, event)
      
      if file includes 'generated/':
        cascade_depth++
        
      emit('route', { event, task, agent: rule.agent })
      return task
  
  if file includes 'generated/' and is_human_edit(file):
    return create_backsync_task(event)
  
  return null

extract_spec_path(file):
  if file matches /\.spec\.[^.]+$/:
    return file without extension
  
  if file includes 'generated/':
    basename = file basename without extension
    return 'specs/' + basename
  
  return file

extract_target_path(file):
  if file starts with 'specs/':
    return file.replace('specs/', 'generated/')
  
  return file
```