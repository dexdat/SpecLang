# speclang-header lines:12
id: "@speclang/roadmap/mvp/agent-tools-api"
parent: "@ref:speclang/roadmap/mvp"
version: 0.1.0
layer: 2
project_level: MVP
agent_support: agent_assisted
status: draft
tags: [roadmap, mvp, agents, tools]
imports: ["@speclang/tools"]
short: MVP registered tools with per-agent permissions and audit logging
---

# MVP: Agent Tools API

## Scope

Extracts P1-005 and P1-012 from @ref:speclang/roadmap/mvp. This is a draft
milestone contract, not an implementation completion record.

## Requirements

### @block::invocation @kind:operation

1. Register file creation, file update, spec parsing, and validation tools.
2. Check the calling agent's tool permissions before invocation.
3. Validate the tool input, then execute authorized operations.
4. Audit the agent identity, operation, target, and outcome.
5. Return failures explicitly rather than reporting denied operations as success.

## Acceptance Criteria

- An active Spec Writer can call createFile and produce a file with a proper header.
- Unauthorized agents cannot invoke tools outside their assigned permissions.
- Both successful and denied calls have audit records.
- Measure the milestone's tool success-rate target of greater than 95% separately
  from permission-denial checks; do not bypass permissions to improve the metric.
