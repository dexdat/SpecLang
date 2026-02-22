# speclang-header lines:10
id: "@speclang/router"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [typescript, generated, auto-generated]
short: "Auto-generated spec for router.ts"
status: generated
---

## @block:router @kind:entity
```text
export class Router extends EventEmitter {
```


## @block:agentsession @kind:entity
```text
export interface AgentSession {
```

## @block:router-subspecs @kind:reference
```speclang
# @block:router-subspecs @kind:reference
Subspecs:
  routing: "@ref:specs/router.dir/routing"
  agents: "@ref:specs/router.dir/agents"
```

