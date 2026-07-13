# speclang-header lines:11
id: "@speclang/router/agents"
parent: ""@ref:specs/routerpart: 2/2
siblings:
  prev: ""@ref:specs/router.spec.dir/routingshort: Agent sessions and registration
project_level: Alpha
agent_support: agent_assisted
tags: [router, agents, daemon, typescript]
version: 0.1.0
layer: 2
---
# Router Agents

Agent session management and mapping of tasks to agents.

## Agent Session

### @router/agent-session

```speclang
# @block:router/agent-session @kind:entity
AgentSession:
  id: AgentId
  status: idle | busy | error
  current_task: optional AgentTask
  
  notify(event, task): Promise<boolean>
```

### @router/agent-registration

```speclang
# @block:router/agent-registration @kind:entity
AgentRegistration:
  sessions: Map<AgentId, AgentSession>
  
  register(agentId, session):
    - add to sessions map
    - log registration
    
  unregister(agentId):
    - remove from sessions map
    - log unregistration
    
  get_agent_for_task(task):
    switch task.kind:
      SpecWriter → 'spec-agent'
      CodeGen → code_agent_for_target(task.target)
      TestWriter → 'test-agent'
      BackSync → 'backsync-agent'
      default → 'unknown'
  
  code_agent_for_target(target):
    if target ends with .go → 'code-agent-go'
    if target ends with .ts → 'code-agent-ts'
    if target ends with .js → 'code-agent-js'
    if target ends with .py → 'code-agent-python'
    if target ends with .rs → 'code-agent-rust'
    default → 'code-agent'
```

### @router/agent-registration-impl

```speclang
# @block:router/agent-registration-impl @kind:pseudocode
```
register_agent(agentId, session):
  agentSessions.set(agentId, session)
  log(`[Router] Registered agent: ${agentId}`)

unregister_agent(agentId):
  agentSessions.delete(agentId)
  log(`[Router] Unregistered agent: ${agentId}`)

get_agent_for_task(task):
  switch task.kind:
    case SpecWriter:
      return 'spec-agent'
    case CodeGen:
      return get_code_agent_for_target(task.target)
    case TestWriter:
      return 'test-agent'
    case BackSync:
      return 'backsync-agent'
    default:
      return 'unknown'

get_code_agent_for_target(target):
  if target.endsWith('.go'): return 'code-agent-go'
  if target.endsWith('.ts'): return 'code-agent-ts'
  if target.endsWith('.js'): return 'code-agent-js'
  if target.endsWith('.py'): return 'code-agent-python'
  if target.endsWith('.rs'): return 'code-agent-rust'
  return 'code-agent'
```