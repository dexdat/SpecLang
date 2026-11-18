# speclang-header lines:12
id: "@speclang/roadmap/beta/scalability"
parent: "@ref:speclang/roadmap/beta"
version: 0.1.0
layer: 2
project_level: Beta
agent_support: agent_assisted
status: draft
tags: [roadmap, beta, scale, dependencies]
imports: ["@speclang/cascade", "@speclang/agents"]
short: Beta large-corpus indexing and concurrent-agent capacity requirements
---

# Beta: Scalability

## Scope

Extracts scalability requirements from @ref:speclang/roadmap/beta. This draft
contract does not certify present capacity.

## Requirements

### @block::scaling @kind:operation

1. Index projects containing at least 1000 spec files.
2. Track dependencies as a graph and update affected entries incrementally.
3. Support at least 10 concurrent agents without losing ownership isolation.
4. Use parallel processing, incremental compilation, and file watching to avoid
   rebuilding unrelated work on each change.
5. Keep indexing and agent failures observable to the operator.

## Acceptance Criteria

- Indexing 1000 spec files completes without out-of-memory errors.
- Verify concurrent-agent operation with at least 10 active agents.
- A single-file update refreshes its dependents without dropping unrelated entries.
- Capacity measurements include corpus size, concurrency, and resource usage.
