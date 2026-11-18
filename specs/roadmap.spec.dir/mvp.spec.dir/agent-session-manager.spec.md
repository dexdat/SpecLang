# speclang-header lines:12
id: "@speclang/roadmap/mvp/agent-session-manager"
parent: "@ref:speclang/roadmap/mvp"
version: 0.1.0
layer: 2
project_level: MVP
agent_support: agent_assisted
status: draft
tags: [roadmap, mvp, agents, sessions]
imports: ["@speclang/agents"]
short: MVP agent process lifecycle and persistent session state
---

# MVP: Agent Session Manager

## Scope

Extracts requirement P1-002 from @ref:speclang/roadmap/mvp. These are roadmap
requirements, not a claim that the milestone has passed.

## Requirements

### @block::lifecycle @kind:operation

1. Create a session for each agent and spawn its process when a cascade needs it.
2. Persist session state in SQLite.
3. Track transitions through created, idle, active, paused, and done/error.
4. Expose pause, resume, and terminate operations.
5. Record agent failures and make the failed session state visible to coordination.

## Acceptance Criteria

- A required agent spawns within 2 seconds, as specified by the MVP milestone.
- Pause and resume preserve the session identity and persisted state.
- A terminated or failed process does not remain marked active.
- Integration verification exercises creation, pause, resume, and failure paths.
