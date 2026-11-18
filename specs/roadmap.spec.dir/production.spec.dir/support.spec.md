# speclang-header lines:12
id: "@speclang/roadmap/production/support"
parent: "@ref:speclang/roadmap/production"
version: 0.1.0
layer: 2
project_level: Production
agent_support: agent_assisted
status: draft
tags: [roadmap, production, support, availability]
imports: ["@speclang/deployment"]
short: Production support coverage, availability evidence, and training requirements
---

# Production: Support and SLAs

## Scope

Extracts support and SLA requirements from @ref:speclang/roadmap/production.
These are draft service targets, not an offer of an already-operating SLA.

## Requirements

### @block::support @kind:policy

- Target a 99.9% uptime SLA and provide 24/7 support coverage.
- Supply maintained documentation and training materials.
- Track support tickets and response times.
- Preserve availability observations and incident intervals for reporting.

## Acceptance Criteria

- The parent acceptance gate requires greater than 99.9% observed uptime over
  30 days; report the actual window and any missing observations.
- The average support-ticket response target is under 24 hours.
- Verify support coverage and training resources independently of uptime.
- Missing monitoring data does not count as available service; an incomplete
  observation window cannot certify the 30-day target.
