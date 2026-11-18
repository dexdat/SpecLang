# speclang-header lines:12
id: "@speclang/roadmap/beta/performance-optimization"
parent: "@ref:speclang/roadmap/beta"
version: 0.1.0
layer: 2
project_level: Beta
agent_support: agent_assisted
status: draft
tags: [roadmap, beta, performance, measurement]
imports: ["@speclang/cascade", "@speclang/sqlite"]
short: Beta latency and memory budgets with measured performance evidence
---

# Beta: Performance Optimization

## Scope

Extracts the performance requirements from @ref:speclang/roadmap/beta. Budgets
are targets to verify, not measurements of the current implementation.

## Requirements

### @block::budgets @kind:policy

- Complete a cascade over 100 spec files in under 30 seconds.
- Respond to file watcher events in under 100 milliseconds.
- Execute SQLite queries in under 10 milliseconds.
- Keep peak resident memory below 500 MB.
- Use query optimization, connection pooling, lazy loading, and caching as
  described by the parent milestone; measure before and after each optimization.

## Acceptance Criteria

- Record corpus size, wall-clock cascade duration, and peak resident memory.
- Measure watcher latency and database query latency independently.
- A missed budget remains a failed target; caching must not omit required work
  merely to make the timing pass.
