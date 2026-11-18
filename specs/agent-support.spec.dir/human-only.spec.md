# speclang-header lines:12
id: "@speclang/agent-support/human-only"
parent: "@ref:speclang/agent-support"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_assisted
status: draft
tags: [agent, support, human-only, policy]
imports: ["@speclang/agent-support-levels/levels"]
short: Human-only policy enforcement and approval requirements
---

# Human-Only Agent Support

## Scope

Apply the human_only level defined by @ref:speclang/agent-support-levels/levels.
The implementation is in `src/human-only/` within this spec directory; this
contract describes its existing policy, not a new autonomy level.

## Policy

### @block::policy @kind:policy

- Humans interpret specs and make implementation decisions.
- The default allowed actions are read_spec and suggest_improvements.
- Require interpretation_confirmation and decision_confirmation, with a domain
  expert approving spec interpretation and a technical lead approving decisions.
- Continuously review spec changes manually.
- Block generate_draft_code and run_tests; propose_edits requires confirmation
  under the restriction policy and is not in the default action allowlist.

## Validation

### @block::validation @kind:operation

1. Compare each requested action with the policy's allowedActions.
2. Record a high-severity action_not_allowed violation for every denied action.
3. Return passed only when the violations list is empty.
4. Suggest read-only access when validation fails.

## Acceptance Criteria

- read_spec and suggest_improvements pass under the default policy.
- generate_draft_code is denied and yields an action_not_allowed violation.
- A denied action is never reported as a successful policy validation.
- Policy data retains both required confirmations and both approval roles.
