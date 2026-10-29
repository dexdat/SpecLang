# The NASA school of specification — house playbook

This is the writing standard for specs in this repository. It is adapted from the practice
NASA documents in **NASA/SP-2016-6105 Rev 2 (Systems Engineering Handbook)**, **NPR 7150.2
(NASA Software Engineering Requirements)**, and the checklists in the **NASA Software
Engineering Handbook (SWEHB)**. Read this before writing or reviewing a spec; the mechanical
parts are enforced by `scripts/nasa_style_check.py`.

Nothing here requires NASA-scale process. What transfers is discipline: every requirement is
identifiable, atomic, verifiable, traced, and reviewed — because the alternative is a spec
nobody can test and code nobody can trace.

## 1. Requirement grammar

A requirement is one sentence, in the form:

```
<PROJ>-REQ-<NNN>  <subject> shall <behaviour> <under condition> [V: T|D|A|I]
```

- **`shall`** = mandatory. **`should`** = recommended. **`may`** = optional. Never mix them in
  one sentence; never use "will" as a requirement word.
- **One `shall` per requirement.** Two behaviours joined by "and" are two requirements (NASA
  calls this "atomic"); split them or they cannot be verified independently.
- **`[V: …]`** is the verification method: **T**est (measure it), **D**emonstration (watch it
  work), **A**nalysis (prove it by reasoning/calculation), **I**nspection (read it and confirm
  the property exists). A requirement with no verification method is a wish.
- **No unmeasurable adjectives.** "fast", "robust", "user-friendly", "scalable", "appropriate"
  are only acceptable with a number and a unit attached — `shall respond in < 200 ms at p95`.

## 2. Identifiers

- Requirement IDs are allocated once, never reused, never renumbered. A retired requirement
  keeps its ID with `status: retired` — renumbering destroys traceability.
- Acceptance criteria get their own IDs: `AC-<NNN>`, and each names the requirement(s) it
  verifies.
- Interfaces get their own IDs (`ICD-<NNN>`) when two components exchange data or control.
- Blocks (`### @block:<name>`) carry stable slugs; renaming a block is a breaking change to
  every `@ref` that points at it.

## 3. Traceability, in both directions

- **Upward**: every requirement states the parent it implements (`parent: @ref:…`).
- **Downward**: every requirement is implemented by a block and verified by an AC. A
  requirement with no implementation, or an implementation with no requirement, is a finding —
  NASA runs this as a bidirectional traceability matrix; here it is `@ref` plus the checker.
- Orphans are the point of the exercise: the failure you are preventing is a spec that quietly
  disagrees with the code.

## 4. TBD discipline

Unresolved values are written as `TBD-<n>` (to be determined) or `TBR-<n>` (to be resolved),
and each carries:

- the question being resolved,
- an owner,
- a date by which it closes.

An unowned TBD is the same as an undocumented assumption. The checker fails a bare TBD.

## 5. Rationale and derived requirements

- State **why** when a requirement is non-obvious, inherited from a constraint, or would
  otherwise look arbitrary. Rationale is not part of the requirement; it is the context that
  stops someone deleting it in six months.
- A **derived** requirement (one that follows from a design choice) names the parent it derives
  from. NASA treats underived requirements as scope creep.

## 6. Verification and acceptance

- Every requirement maps to at least one acceptance criterion with an explicit method and
  observable evidence. "Verified by inspection" must name what is inspected.
- Acceptance criteria are written so a second party can execute them without asking the author.
- A test that cannot fail proves nothing: state the observable, the expected value, and the
  tolerance.

## 7. Configuration management

- A spec change lands as a commit whose message names the requirement IDs it touched.
- Requirements are never edited in place to mean something new. Change the text **and** bump
  the spec version, or retire the ID and issue a new one.
- The spec is the source of truth; the code and docs are generated or derived from it. When
  they disagree, the spec wins and the divergence is a finding.

## 8. Review gates (what "ready" means)

A spec is ready to build against only when:

1. every requirement is atomic, uses `shall`, and carries a verification method;
2. every requirement is traced up (parent) and down (implementation + AC);
3. no requirement uses an unmeasurable adjective;
4. every TBD has an owner and a date;
5. every `@ref` resolves — no dangling block or file references;
6. no duplicate block or requirement IDs in the file;
7. the style check passes: `python3 scripts/nasa_style_check.py specs/`.

These are the practical descendants of NASA's SRR/PDR/CDR review gates: the point is that the
gate is *mechanical* wherever it can be, so human review spends its attention on meaning rather
than bookkeeping.

## 9. Language checklist (inspection pass)

- [ ] Active voice, present tense, one behaviour per sentence.
- [ ] Defined terms only; a term used two ways is a defect.
- [ ] No pronouns with ambiguous antecedents ("it", "this") in requirements.
- [ ] Units on every number; tolerance on every measurement.
- [ ] Conditions named explicitly ("when X", "if Y") rather than implied.
- [ ] No "etc.", "and so on", "TBD" without an owner.

## 10. How this repository applies it

| NASA practice | Here |
|---|---|
| Requirement ID + shall statement | `- PROJ-REQ-012 … shall … [V: T]` in a spec block |
| Bidirectional traceability | `parent: @ref:…` upward, `@ref:…#block` downward |
| Verification method | `[V: T|D|A|I]` on the requirement, method repeated on the AC |
| TBD/TBR register | `TBD-<n>` with question, owner, date |
| CM and change control | one commit per spec change, requirement IDs in the message |
| Review gates | section 8 checklist + `scripts/nasa_style_check.py` |
| Documentation set | `docs/` files each generated from a `*.spec.md` sibling |

The machine-checkable subset (sections 1, 2, 4, 5 and 8.5–8.6) runs as
`python3 scripts/nasa_style_check.py specs/ [--json]`. It reports findings with file, line and
rule, and exits non-zero when any requirement is untestable, untraced or ambiguous. Everything
else is a human review pass using section 9.
