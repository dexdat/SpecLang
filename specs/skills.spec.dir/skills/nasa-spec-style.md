# NASA spec style — agent skill

Write and review specs in this repository the way NASA writes requirements: every statement is
atomic, identified, verifiable and traced. The full rationale is
`docs/playbook/NASA-SE-PLAYBOOK.md`; this skill is the working loop.

## When to use

- Writing a new spec, or editing requirement text
- Reviewing a spec, or judging whether one is ready to build against
- Generating docs from specs (the doc inherits the spec's discipline)
- Any time a requirement sounds reasonable but cannot be tested

## The five-line discipline

1. **One `shall` per requirement.** Two behaviours = two requirements. Join nothing with "and".
2. **Always an ID.** `PROJ-REQ-NNN`, `AC-NNN`, `ICD-NNN`. IDs are allocated once and never
   renumbered; a retired requirement keeps its ID.
3. **Always a verification method.** `[V: T]` test, `[V: D]` demonstration, `[V: A]` analysis,
   `[V: I]` inspection. No method means the requirement is a wish.
4. **Never an unmeasurable adjective** without a number and unit. "fast" is not a requirement;
   "responds in under 200 ms at p95 on the reference host" is.
5. **Trace both ways.** Upward: `parent: @ref:<spec-id>`. Downward: the block that implements it
   and the AC that verifies it. Orphans in either direction are the bug.

## TBD discipline

`TBD-<n>` / `TBR-<n>` must name the question, an owner, and a closing date (`YYYY-MM-DD`).
An unowned TBD is an undocumented assumption; the checker fails it.

## Ready gate

A spec is ready to build against when all of these hold:

```bash
python3 scripts/nasa_style_check.py specs/            # 0 findings for the file you touched
python3 scripts/check_compliance.py --dir specs/      # dual-view: content lives in specs/, working paths symlink
npm run build && npm test                             # the repo's own validation gate
```

Plus the human pass: active voice, one behaviour per sentence, defined terms only, conditions
stated explicitly ("when X"), units on every number.

## Anti-patterns (reject on sight)

- "The system shall be robust/scalable/user-friendly" — unverifiable.
- A requirement with an implementation but no acceptance criterion.
- Renumbering IDs to make a diff look tidy — destroys traceability, always.
- A TBD with no owner.
- Editing a requirement's meaning in place without bumping the spec version.
- Docs written by hand instead of derived from the spec: create the spec first, then the
  working file as a symlink (dual-view), so the doc cannot drift.

## Reporting a spec review

State, per finding: the requirement ID, the rule violated (R1–R9 as reported by the checker),
and the smallest edit that satisfies it. Never rewrite requirement *meaning* to make a check
pass — that is the failure the check exists to prevent.
