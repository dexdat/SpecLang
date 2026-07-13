# speclang-header lines:12
id: "@speclang/agents"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [agents, system, autonomous]
short: Agent system implementation
status: draft
depends_on:
  - "@speclang/agent-protocol"
---

# Agents Module

This spec defines the agent system for SpecLang - the autonomous agents that react to file changes and maintain the reactive cascade.

## Overview

```speclang
# @block:agents/overview @kind:entity
AgentsModule:
  purpose: Autonomous agent execution system for SpecLang
  
  components:
    - agent_sessions: Persistent agent execution contexts
    - agent_pool: Manages available agent instances
    - agent_guard: Enforces file ownership rules
    - agent_communication: Inter-agent messaging
  
  agent_types:
    - spec_writer: Creates and updates spec files
    - code_gen: Generates code from specs
    - test_writer: Creates test specifications
    - orchestrator: Coordinates multi-agent workflows
```

## Agent Sessions

```speclang
# @block:agents/sessions @kind:interface
interface AgentSession:
  id: string
  owner: string
  owned_files: string[]
  state: SessionState
  created_at: timestamp
  last_activity: timestamp
  
  methods:
    - acquire_file(path: string): boolean
    - release_file(path: string): void
    - get_owned_files(): string[]
    - update_state(state: SessionState): void
```

## Agent Pool

```speclang
# @block:agents/pool @kind:entity
AgentPool:
  properties:
    - max_agents: number (default: 10)
    - idle_timeout: number (seconds, default: 300)
    - max_retries: number (default: 3)
  
  methods:
    - acquire_agent(role: AgentRole): AgentSession
    - release_agent(session_id: string): void
    - get_available_agents(): AgentRole[]
    - health_check(): HealthStatus
```

## Agent Communication

```speclang
# @block:agents/communication @kind:operation
AgentCommunication:
  message_types:
    - file_changed: Notifies agents of file updates
    - cascade_trigger: Starts cascade processing
    - cascade_complete: Reports cascade results
    - agent_status: Reports agent health/state
  
  protocols:
    - pub_sub: File change notifications
    - request_response: Query/response patterns
    - broadcast: System-wide announcements
```

## Implementation

```speclang
# @block:agents/implementation @kind:note
The agents module is implemented in:
- src/agents/session.ts: Agent session management
- src/agents/pool.ts: Agent pool and lifecycle
- src/agents/guard.ts: File ownership enforcement
- src/agents/communication.ts: Inter-agent messaging

Integration points:
- Daemon: Agents are started/stopped by speclangd
- Cascade: Agents react to cascade events
- Database: Agent state persisted in SQLite
```

## Status

```speclang
# @block:agents/status @kind:entity
AgentStatus:
  current:
    - session_management: Implemented
    - basic_pool: Implemented
    - file_guard: Implemented
  
  todo:
    - agent_communication: Not fully implemented
    - advanced_pooling: Future enhancement
    - cross_project_agents: Future enhancement
```
