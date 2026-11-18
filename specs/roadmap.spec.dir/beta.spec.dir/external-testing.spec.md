# speclang-header lines:12
id: "@speclang/roadmap/beta/external-testing"
parent: "@ref:speclang/roadmap/beta"
version: 0.1.0
layer: 2
project_level: Beta
agent_support: agent_assisted
status: draft
tags: [roadmap, beta, onboarding, feedback]
imports: ["@speclang/testing-strategy"]
short: Beta external-user onboarding, examples, troubleshooting, and feedback
---

# Beta: External User Testing

## Scope

Extracts external testing requirements from @ref:speclang/roadmap/beta. These
remain draft acceptance targets, not reported user-study results.

## Requirements

### @block::user-testing @kind:operation

1. Provide new-user documentation and runnable example projects.
2. Have an external developer follow the onboarding guide without maintainer setup.
3. Supply troubleshooting guidance for encountered failures.
4. Collect feedback on completion, elapsed time, and satisfaction.
5. Preserve blockers and unsuccessful attempts in the evaluation record.

## Acceptance Criteria

- A new developer reaches working generated code in under 1 hour.
- Example instructions produce the documented result in a fresh user environment.
- Record user satisfaction against the parent target of greater than 4.0/5.
- Missing feedback is reported as unmeasured, not counted as a positive rating.
