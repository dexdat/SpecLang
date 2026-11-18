# speclang-header lines:12
id: "@speclang/roadmap/mvp/multi-agent-coordination"
parent: "@ref:speclang/roadmap/mvp"
version: 0.1.0
layer: 2
project_level: MVP
agent_support: agent_assisted
status: draft
tags: [roadmap, mvp, agents, coordination]
imports: ["@speclang/agent-protocol", "@speclang/cascade"]
short: MVP coordination between North Star, Spec Writer, and Code Gen agents
---

# MVP: Multi-Agent Coordination

## Scope

Extracts P1-004 from @ref:speclang/roadmap/mvp without marking it implemented.

## Requirements

### @block::coordination @kind:operation

1. Assign user-intent handling to North Star, spec expansion to Spec Writer,
   and code generation to Code Gen.
2. Assign each agent ownership of its files before permitting edits.
3. Notify agents when a dependency changes using SQLite-backed messages/events.
4. Run downstream agents after upstream work completes.
5. Track failures so incomplete upstream output is not treated as ready input.

## Acceptance Criteria

- Updating project.scl produces the North Star → Spec Writer → Code Gen sequence.
- At least three agents coordinate without manual dispatch.
- The MVP end-to-end cascade target is under 30 seconds.
- Coordination does not permit two agents to own the same file simultaneously.
