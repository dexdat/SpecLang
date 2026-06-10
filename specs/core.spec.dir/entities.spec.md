---
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
    - watch specs/ directory recursively
    - parse watch: patterns from all spec headers
    - maintain notification graph: which specs watch which files
    - route events to all dependent specs via notification graph
    - handle watch pattern matching: literal paths and glob patterns (**.spec.md, **.spec.go.md, etc.)
    - emit FileChangeEvent with path, kind, and list of dependent specs
    - manage file locks for concurrent writes
    - detect when cascade is complete
    - detect file contention for throttle deferral
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
  - SpecWriter: expands specs from higher-level specs
  - CodeGen: assembles source code from code-pair specs
  - TestWriter: writes test specs and test code
  - BackSync: syncs code changes back to specs
  - Assembler: reads .spec.{lang}.md files and generates .spec.{lang} files
  - Pipeline: executes build, test, deploy on convergence
```

### SpecFileType

```speclang
# @block:speclang/spec-file-type @kind:entity
SpecFileType:
  - InformationalSpec: "{name}.spec.md — no code pair, describes concepts and architecture"
  - CodePairSpec: "{name}.spec.{lang}.md — design doc for specific code file, 1:1 with generated code"
  - GeneratedCode: "{name}.spec.{lang} — actual implementation assembled from the code-pair spec"
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
    @ref:path/to/file#block-id

  examples:
    @ref:northstar#auth
    @ref:specs/auth#login-handler
    @ref:generated/auth.ts#login-fn

  purpose:
    - AI never loses context
    - every file points to dependencies
    - north star is always reachable

  markers:
    // SPECLANG-ID: @ref:specs/auth#login
    // SPECLANG-PARENT: @ref:northstar#auth
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
