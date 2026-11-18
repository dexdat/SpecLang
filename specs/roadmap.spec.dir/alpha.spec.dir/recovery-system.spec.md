# speclang-header lines:12
id: "@speclang/roadmap/alpha/recovery-system"
parent: "@ref:speclang/roadmap/alpha"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_assisted
status: draft
tags: [roadmap, alpha, recovery, errors]
imports: ["@speclang/recovery"]
short: Alpha classified retries, Git rollback, and human escalation
---

# Alpha: Recovery System

## Scope

Extracts P4-003 and P4-007 from @ref:speclang/roadmap/alpha as draft requirements.

## Requirements

### @block::recovery @kind:operation

1. Capture the failed stage and classify the error as transient or permanent.
2. Retry transient failures with backoff according to the recovery policy.
3. Roll back failed cascade changes through Git to the last known good state.
4. Send unresolved errors to a human via MCP with the original diagnostics.
5. Report recovery outcomes separately from the failed operation's outcome.

## Acceptance Criteria

- A failed test run can return the cascade to the last known good state.
- A permanent error is escalated rather than retried indefinitely.
- An unresolved pipeline failure reaches the human with detailed context.
- Measure automatic recovery success against the parent target of greater than 80%.
