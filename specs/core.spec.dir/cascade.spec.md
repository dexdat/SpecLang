---
id: "@speclang/core/cascade"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [core]
short: Reactive loop and convergence detection
parent: ""@ref:speclang/core"part: 2/6
---

## The Reactive Loop

### @speclang/cascade

```speclang
# @block:speclang/cascade @kind:diagram
```mermaid
flowchart TB
    subgraph User
        U[Human edits NorthStar]
    end
    
    subgraph Daemon
        D[speclangd]
        D -->|file event| E{Route to Agent}
    end
    
    subgraph Agents
        E -->|spec file| S[SpecAgent]
        E -->|test file| T[TestAgent]
        E -->|code file| C[CodeAgent]
    end
    
    S -->|writes| F1[spec files]
    T -->|writes| F2[test files]
    C -->|writes| F3[code files]
    
    F1 & F2 & F3 -->|triggers| D
    
    U --> D
```
```

### @speclang/convergence

```speclang
# @block:speclang/convergence @kind:entity
Convergence:
  description: "How the system knows it's done"
  
  signals:
    - quiet_period: no file changes for N seconds
    - user_command: /finalize in north star
    - explicit_done: agent marks itself complete
    
  default:
    quiet_period: 30 seconds
    
  on_converge:
    - commit all changes
    - run tests
    - report status
    - await next user input
```