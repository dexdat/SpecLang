# speclang-header lines:9
id: "@specs/docs/nasa-se-playbook"
version: 1.0.0
layer: 5
target: docs/playbook/NASA-SE-PLAYBOOK.md
tags: [docs, playbook, requirements, traceability, verification, style]
---
# NASA-SE spec playbook (document spec)

Source of truth for `docs/playbook/NASA-SE-PLAYBOOK.md`, the writing standard for specs in
this repository. Derived from NASA/SP-2016-6105 Rev 2 (Systems Engineering Handbook),
NPR 7150.2 (Software Engineering Requirements) and the NASA SWEHB checklists, reduced to what
applies to a single-repository spec compiler.

## Purpose

The playbook defines how a requirement is written, identified, traced and reviewed so that
the mechanical parts of a review can run as a script instead of as prose in a reviewer's head.
It pairs with @ref:specs/scripts/nasa-style-check, which enforces the machine-checkable
subset.

## Rules the document must state

- USA-PB-001 The playbook shall define requirement grammar as one `shall` per statement with an ID and a verification method. [V: I]
- USA-PB-002 The playbook shall specify that requirement IDs are allocated once and never renumbered. [V: I]
- USA-PB-003 The playbook shall require upward and downward traceability for every requirement. [V: I]
- USA-PB-004 The playbook shall require every TBD-<n> to name a question, an owner and a closing date. [V: I]
- USA-PB-005 The playbook shall state the four verification methods (test, demonstration, analysis, inspection). [V: I]
- USA-PB-006 The playbook shall define the review gate as a checklist plus the automated style check. [V: I]
- USA-PB-007 The playbook shall map each NASA practice to its repository artifact in one table. [V: I]

## Non-goals

The playbook does not prescribe NASA programme process (phase reviews, programme boards,
contract data requirements). It transfers specification discipline only.

## Acceptance criteria

- AC-001 `python3 scripts/nasa_style_check.py specs/` runs against the playbook with no finding attributable to the playbook file. [V: T]
- AC-002 Every rule in section 8 of the playbook has a corresponding rule id in this spec. [V: I]
- AC-003 The repository table in section 10 names a command that exists at the recorded path. [V: T]
