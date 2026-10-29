# speclang-header lines:9
id: "@specs/skills/nasa-spec-style"
parent: "@ref:specs/skills"
version: 1.0.0
layer: 2
tags: [skills, specs, requirements, nasa, review]
imports: ["@specs/skills"]
status: active
project_level: Alpha
agent_support: agent_assisted
short: NASA spec style skill
---
# NASA spec style skill

Agent-facing companion to @ref:specs/docs/nasa-se-playbook. Installs as
`.opencode/skills/nasa-spec-style.md` (dual-view symlink into `specs/skills.spec.dir/skills/`).

## Purpose

Give an agent the working loop for writing, reviewing and gating specs in this repository:
the five-line discipline, the TBD rule, the ready gate, and the anti-pattern list.

## Behaviour

- NSS-001 The skill shall state one `shall` per requirement as the first rule. [V: I]
- NSS-002 The skill shall require a requirement ID and a verification method on every requirement. [V: I]
- NSS-003 The skill shall require TBD tokens to carry an owner and a closing date. [V: I]
- NSS-004 The skill shall name the three gate commands a spec change must pass. [V: T]
- NSS-005 The skill shall forbid rewriting requirement meaning to satisfy a check. [V: I]

## Acceptance criteria

- AC-201 Every gate command in the skill exists at the recorded path in this repository. [V: T]
- AC-202 The anti-pattern list names at least five failure modes that the checker reports as R1-R9 findings. [V: I]
