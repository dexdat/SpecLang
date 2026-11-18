# speclang-header lines:12
id: "@speclang/roadmap/beta/monitoring"
parent: "@ref:speclang/roadmap/beta"
version: 0.1.0
layer: 2
project_level: Beta
agent_support: agent_assisted
status: draft
tags: [roadmap, beta, monitoring, observability]
imports: ["@speclang/ui", "@speclang/cascade"]
short: Beta live system health, cascade visualization, and error tracking
---

# Beta: Monitoring and Observability

## Scope

Extracts monitoring requirements from @ref:speclang/roadmap/beta as a draft
milestone contract.

## Requirements

### @block::monitoring @kind:operation

1. Collect system health, cascade progress, performance, and error metrics.
2. Display live cascade status and system health on the web dashboard.
3. Aggregate logs so operators can inspect failures alongside the relevant cascade.
4. Deliver alerts for failures through the monitoring system.
5. Distinguish absent or disconnected telemetry from a healthy idle system.

## Acceptance Criteria

- Opening the dashboard during an active cascade shows real-time status.
- A failed cascade appears in error tracking and has corresponding log evidence.
- Performance metrics reflect observed work, not static demonstration values.
- Loss of telemetry is visible instead of being rendered as healthy zeroes.
