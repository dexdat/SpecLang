# speclang-header lines:16
id: "@specs/agents/implementation"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
tags: [agents, implementation]
target: src/agents/
short: Agent system implementation files
refs:
  - "@ref:specs/agent-protocol"
---

# Agents Implementation

Implementation of the agent system including ownership, sessions, registry, and tools.

## Files

### @block::index @kind:code
Main agent module exports and initialization.

### @block::types @kind:code
TypeScript type definitions for agents, sessions, and ownership.

### @block::session @kind:code
Session management implementation.

### @block::registry @kind:code
Agent registry for tracking active agents.

### @block::ownership @kind:code
File ownership tracking and conflict resolution.

### @block::tools @kind:code
Agent tools and capabilities.

### @block::lifecycle @kind:code
Agent lifecycle management (start, stop, pause).

### @block::interceptor @kind:code
Request/response interception for agent actions.

### @block::metadata-routing @kind:code
Metadata-based routing for agent requests.

### @block::rules @kind:code
Agent rules and constraint definitions.

### @block::session-api @kind:code
Session API endpoints and handlers.

### @block::state @kind:code
Agent state management.

### @block::violations @kind:code
Ownership and rule violation detection.
