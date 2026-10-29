# speclang-header lines:9
id: "@specs/scripts/nasa-style-check"
parent: "@ref:specs/scripts"
version: 1.0.0
layer: 3
target: scripts/nasa_style_check.py
tags: [scripts, specs, requirements, validation, review-gate]
---
# NASA-style spec check (script spec)

Source of truth for `scripts/nasa_style_check.py`. Enforces the machine-checkable subset of
@ref:specs/docs/nasa-se-playbook over the specs tree.

## Purpose

Turn the mechanical half of a spec review into an exit code: unmeasurable adjectives, untestable
requirement statements, unreferenced identities and dangling `@ref` targets are found by a scan
rather than by a reviewer's attention.

## Behaviour

- NSC-001 The script shall scan every `*.spec.md` under the given paths and report findings with file, line and rule id. [V: T]
- NSC-002 The script shall report R1 when a spec header omits id, version or layer. [V: T]
- NSC-003 The script shall report R2 when a `### @block:<slug>` slug repeats within one file. [V: T]
- NSC-004 The script shall report R3 when a requirement line carries more than one `shall`. [V: T]
- NSC-005 The script shall report R4 for a requirement line without a `PROJ-REQ-NNN`, `AC-NNN` or `ICD-NNN` id. [V: T]
- NSC-006 The script shall report R5 for a requirement line without a `[V: T|D|A|I]` method marker. [V: T]
- NSC-007 The script shall report R6 for a vague adjective on a line with no digit, `ms` or `%`. [V: T]
- NSC-008 The script shall report R7 for a `TBD-` or `TBR-` token without an owner or a YYYY-MM-DD date. [V: T]
- NSC-009 The script shall resolve `@ref:` targets against spec header ids and spec paths before reporting R8. [V: T]
- NSC-010 The script shall ignore content inside fenced code blocks. [V: T]
- NSC-011 The script shall exit 0 when there are no findings, 1 when there are findings, and 2 on a usage error. [V: T]
- NSC-012 The script shall emit a JSON form with `--json` containing the file count and the finding list. [V: T]
- NSC-013 The script shall not modify any file it scans. [V: I]

## Acceptance criteria

- AC-101 Running the script over `specs/` completes in under 60 seconds and prints one summary line. [V: T]
- AC-102 A spec containing `shall` with two clauses reports exactly one R3 finding. [V: T]
- AC-103 A `@ref` naming an existing spec id reports no R8 finding, and one naming a missing id reports one. [V: T]
- AC-104 `--json` output parses as JSON and its `findings` length equals the count of printed findings in text mode. [V: T]
