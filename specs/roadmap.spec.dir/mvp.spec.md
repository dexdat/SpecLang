# speclang-header lines:15
id: "@speclang/roadmap/mvp"
parent: "@ref:specs/roadmap"
version: 1.0.0
layer: 1
target: specs/roadmap.spec.dir/mvp.spec.dir/
short: "MVP phase: Multi-agent coordination system"
project_level: MVP
agent_support: agent_autonomous
tags: [roadmap, mvp, phase-2, agents, coordination]
depends_on:
  - "@ref:specs/roadmap/poc"
  - "@ref:specs/agents"
  - "@ref:specs/agent-protocol"
---

# MVP Phase: Minimum Viable Product

**Goal**: Multiple agents coordinating to expand specs and generate code autonomously.

## User Story

> As a developer, I can write high-level specs and watch as multiple AI agents collaborate to expand them into detailed specifications and working code.

## Technical Requirements

### 1. Agent Session Manager (P1-002)

**Must Have:**
- [ ] Spawn agent processes
- [ ] Manage agent lifecycle (create, pause, resume, terminate)
- [ ] Track agent state
- [ ] Handle agent failures

**Implementation:**
- Session per agent
- State machine: created → idle → active → paused → done/error
- SQLite for state persistence

### 2. Multi-Agent Coordination (P1-004)

**Must Have:**
- [ ] North Star agent (user intent)
- [ ] Spec Writer agent (expands specs)
- [ ] Code Gen agent (generates code)
- [ ] Agent-to-agent communication

**Implementation:**
- Each agent owns specific files
- Agents react to changes in files they depend on
- Message passing via SQLite/events

### 3. Agent Tools API (P1-005, P1-012)

**Must Have:**
- [ ] File creation tools
- [ ] File update tools
- [ ] Spec parsing tools
- [ ] Validation tools

**Implementation:**
- Tool registry
- Tool permissions per agent
- Audit logging

### 4. File Ownership (P1-011)

**Must Have:**
- [ ] Enforce one agent per file
- [ ] Guard against unauthorized edits
- [ ] Ownership transfer protocol

**Implementation:**
- Lock files in SQLite
- Pre-commit hooks verify ownership
- Violation tracking

## Acceptance Criteria

✅ **Agent Spawning**
```
Given: Cascade triggers
When: An agent is needed
Then: Agent spawns within 2 seconds
```

✅ **Multi-Agent Cascade**
```
Given: North Star updates project.scl
When: Cascade runs
Then: Spec Writer → Code Gen agents execute in sequence
```

✅ **File Ownership**
```
Given: Code Gen owns src/hello.ts
When: Another agent tries to edit it
Then: Edit is blocked, violation logged
```

✅ **Agent Tools**
```
Given: Spec Writer is active
When: It calls createFile tool
Then: File is created with proper header
```

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Agent spawn time | < 2s | Time to spawn new agent |
| Multi-agent cascade | < 30s | End-to-end with 3+ agents |
| Ownership violations | 0 | Unauthorized edits blocked |
| Tool success rate | > 95% | Tool invocations succeed |

## Timeline

**Week 1-2**: Agent session manager + lifecycle
**Week 3-4**: Multi-agent coordination
**Week 5-6**: Agent tools + file ownership

**Target**: 6 weeks from POC completion

## Definition of Done

MVP is complete when:
- [ ] 3+ agents coordinate automatically
- [ ] File ownership enforced
- [ ] All tools working
- [ ] Integration tests pass

---

**Previous**: [POC](poc.spec.md) | **Next**: [Alpha](alpha.spec.md)
