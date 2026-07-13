# speclang-header lines:10
id: "@speclang/core/concurrency"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [core]
short: Concurrency model for agent sessions
parent: ""@ref:speclang/corepart: 6/6
---

## Concurrency Model

### @speclang/concurrency

```speclang
# @block:speclang/concurrency @kind:entity
Concurrency:
  model: one agent session per file
  
  safety:
    - file locks prevent write conflicts
    - read operations are concurrent
    - write operations are serialized per file
    - agents can read while another writes
    
  flow:
    1. daemon detects change
    2. daemon finds owning agent
    3. daemon notifies agent
    4. agent acquires lock
    5. agent reads/writes
    6. agent releases lock
    7. daemon sees new changes
    8. repeat
```