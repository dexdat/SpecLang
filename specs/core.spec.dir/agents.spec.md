# speclang-header lines:10
id: "@speclang/core/agents"
version: 0.1.0
layer: 2
project_level: "Alpha"
agent_support: "agent_autonomous"
tags: [core]
short: "Agent responsibilities: spec, code, test, backsync"
parent: "@ref:speclang/core"part: 4/6
---

## Agent Responsibilities

### @speclang/spec-agent

```speclang
# @block:speclang/spec-agent @kind:entity
SpecAgent:
  owns: specs/**/*.scl
  listens_to: northstar changes, other spec changes
  
  on_event:
    1. read changed file
    2. find refs to expand
    3. generate/update downstream specs
    4. write new spec files
    5. update pointer graph
```

### @speclang/code-agent

```speclang
# @block:speclang/code-agent @kind:entity
CodeAgent:
  owns: generated/**/*.{go,ts,py,rs,java}
  listens_to: spec file changes
  
  on_event:
    1. read spec file
    2. resolve all refs
    3. generate target language code
    4. inject SPECLANG markers
    5. write to generated/
```

### @speclang/test-agent

```speclang
# @block:speclang/test-agent @kind:entity
TestAgent:
  owns: tests/**/*.test.spec.scl, tests/**/*_test.{go,ts,py}
  listens_to: test spec changes, code changes
  
  on_event:
    1. read test spec
    2. parse natural language criteria
    3. generate test code in target language
    4. run tests
    5. report results back to spec
```

### @speclang/backsync-agent

```speclang
# @block:speclang/backsync-agent @kind:entity
BackSyncAgent:
  owns: nothing (reads generated/)
  listens_to: generated file changes (human edits)
  
  on_event:
    1. detect non-AI edit to generated file
    2. parse change with SPECLANG markers
    3. propose spec update
    4. if approved, update spec file
```