# speclang-header lines:11
id: "@speclang/core/entities"
version: 0.2.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [core, entities, daemon, agent]
short: "Core entities: daemon, agent, northstar, pointer-graph, autonomous-readiness"
parent: "@ref:specs/core"
part: 1/6
---

# Core Entities

### @speclang/daemon

```speclang
# @block:speclang/daemon @kind:entity
speclangd:
  description: "File watcher daemon (inotify-based)"
  triggers: file create/modify/delete
  broadcasts: change events to owning agents
  detects: convergence (quiet period)
  
  responsibilities:
    - watch specs/ directory
    - watch generated/ directory
    - route events to correct agent sessions
    - manage file locks for concurrent writes
    - detect when cascade is complete
```

### @speclang/agent

```speclang
# @block:speclang/agent @kind:entity
Agent:
  id: String              # unique agent identifier
  owns: FilePattern[]     # which files this agent handles
  triggers: ChangeKind[]  # what events wake it
  produces: FilePattern[] # what files it outputs
  
  lifecycle:
    - idle: waiting for event
    - active: processing file change
    - blocked: waiting for upstream
    - done: no more work needed

AgentKind:
  - NorthStar: user intent, high-level direction
  - SpecWriter: expands specs from north star
  - CodeGen: generates target language code
  - TestWriter: writes test specs and test code
  - BackSync: syncs code changes back to specs
```

### @speclang/northstar

```speclang
# @block:speclang/northstar @kind:entity
NorthStar:
  description: "The top-level spec the user edits"
  file: project.scl (or user-defined)
  purpose: single source of human intent
  
  contents:
    - project description
    - high-level requirements
    - technology choices
    - active pointers to all specs
  
  special:
    - everything references back to here
    - user's main conversation point
    - AI reads this for full context
```

### @speclang/pointer-graph

```speclang
# @block:speclang/pointer-graph @kind:entity
PointerGraph:
  description: "Universal reference system"
  
  format:
    "@ref:path/to/file#block-id"
    
  examples:
    "@ref:northstar#auth"
    @ref:specs/auth#login-handler
    @ref:generated/auth.ts#login-fn
    
  purpose:
    - AI never loses context
    - every file points to dependencies
    - north star is always reachable
    
  markers:
    // SPECLANG-ID: "@ref:specs/auth#login"
    // SPECLANG-PARENT: "@ref:northstar#auth"
```

### @speclang/autonomous-readiness

```speclang
# @block:speclang/autonomous-readiness @kind:entity
AutonomousReadiness:
  description: "Spec depth and completeness for autonomous agent usage"
  
  fields:
    - layer: depth in dependency tree (non-negative integer)
    - project_level: maturity stage (POC, MVP, Alpha, Beta, Production, Startup, SMB, MSB, Enterprise)
    - agent_support: readiness level (human_only, agent_assisted, agent_autonomous)
  
  goal:
    - specs should have enough depth to be used by autonomous agents totally
    - agents can generate code, tests, and further specs without human intervention
    - spec completeness increases with project_level maturity
  
  guidelines:
    - POC: minimal specs, human-heavy
    - MVP: specs detailed enough for agent-assisted generation
    - Alpha/Beta: agent_autonomous capable for most features
    - Production: full autonomous agent support with validation
```