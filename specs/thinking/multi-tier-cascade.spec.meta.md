---
id: "@speclang/thinking/multi-tier-cascade"
version: 1.0.0
layer: 0
project_level: Alpha
agent_support: agent_autonomous
tags: [architecture, thinking, cascade, memory-bank, multi-tier]
short: "Multi-Tier SpecLang Thinking System — specs as memory bank, cascade through all thinking layers"
status: draft
---

# Multi-Tier SpecLang Thinking System

SpecLang isn't just a code assembler. It's a **thinking system** where specs serve as the memory bank — capturing WHY something exists (meta), HOW to build it (plan), WHAT the code is (implementation), and how to PROVE it works (test). The cascade flows through ALL tiers, not just code specs.

## The Problem

Code-only specs miss the critical thinking artifacts that make autonomous development possible:
- **Why does this spec exist?** — context, stakeholders, problem space
- **What decisions were made?** — trade-offs, alternatives considered
- **How was it planned?** — phases, dependencies, verification strategy
- **What patterns emerged?** — reusable conventions discovered during development

Without these, an agent reading a spec file has no memory of the thinking that produced it. It can't self-correct or iterate intelligently.

## The Solution: Multi-Tier Specs → The Memory Bank

Every feature or component gets a **stack of specs** at different thinking levels:

```
specs/feature-x/
├── feature-x.spec.meta.md     # Tier 0: WHY — context, problem, stakeholders
├── feature-x.spec.plan.md     # Tier 1: HOW — approach, phases, ADRs
├── feature-x.spec.ts.md       # Tier 2: WHAT — TypeScript interfaces/code
├── feature-x.spec.test.md     # Tier 3: PROVE — test cases, verification
└── feature-x.spec.py.md       # Tier 2: WHAT — Python code (language variant)
```

### Tier 0: `.spec.meta.md` — Metacognition
**What it captures:** Context, stakeholders, problem space, constraints, success criteria. This is the "north star" for the feature.
**Output:** `thinking/<path>/<name>.meta.md`
**Regenerated when:** Parent spec changes, project context shifts (new dependencies, new constraints)
**Extraction rules:** All sections (no filtering — meta specs capture everything)

### Tier 1: `.spec.plan.md` — Implementation Planning
**What it captures:** Phases, approach, architecture decisions, dependency order, verification strategy. This is the "ADRs + roadmap".
**Output:** `thinking/<path>/<name>.plan.md`
**Regenerated when:** Meta spec changes, code spec diverges from plan
**Extraction rules:** All sections + `## Decision` blocks extracted as ADR fragments

### Tier 2: `.spec.{lang}.md` — Code Specification
**What it captures:** Interfaces, types, function signatures, `## Implementation` blocks, `## @block:` annotations. This is the code spec.
**Output:** `src/<path>/<name>.<ext>` (unchanged — current behavior)
**Regenerated when:** Plan spec changes, meta spec changes
**Extraction rules:** Current rules — `## Implementation` and `### @block:` sections only

### Tier 3: `.spec.test.md` — Test Specification
**What it captures:** Test cases, edge cases, verification commands, expected outputs. This is the test plan.
**Output:** `tests/<path>/<name>.test.<ext>` (target lang matches the code it tests)
**Regenerated when:** Code spec changes, plan verification strategy changes
**Extraction rules:** `## Test Cases` sections extracted as test stubs

### Tier M (Meta-Language): `.spec.md` — Documentation Spec (existing `md` target)
**What it captures:** READMEs, ROADMAPs, architectural decision records, user guides.
**Output:** Project root (existing behavior for `target_lang: md`)

## Target Language Map

| `target_lang` | Extension | Spec suffix | Output directory | Purpose |
|---|---|---|---|---|
| `meta` | `.md` | `.spec.meta.md` | `thinking/` | Metacognition |
| `plan` | `.md` | `.spec.plan.md` | `thinking/` | Implementation planning |
| `decision` | `.md` | `.spec.decision.md` | `thinking/` | Architectural decisions |
| `context` | `.md` | `.spec.context.md` | `thinking/` | Active context / current state |
| `pattern` | `.md` | `.spec.pattern.md` | `thinking/patterns/` | Reusable conventions |
| `ts`, `py`, `go`, `rs`, etc. | Language-specific | `.spec.<lang>.md` | `src/` | Code (unchanged) |
| `md` | `.md` | `.spec.md` | Project root | Documentation (unchanged) |
| `test` | Language-specific | `.spec.test.md` | `tests/` | Test specs |

## Cascade Flow

The cascade now spans ALL tiers. When a spec changes, the ripple flows DOWN through the thinking layers:

```
User (or Pi Agent) edits specs/feature-x/feature-x.spec.meta.md
    │
    ▼ Cascade detects change in meta tier
Cascade regenerates: specs/feature-x/feature-x.spec.plan.md
    │  (reads meta context + applies planning heuristics)
    ▼
Cascade regenerates: specs/feature-x/feature-x.spec.ts.md
    │  (reads plan phases + generates structured code spec)
    ▼
Cascade regenerates: specs/feature-x/feature-x.spec.test.md
    │  (reads code spec + generates test cases)
    ▼
Assembler produces: src/feature-x/feature-x.ts + tests/feature-x/feature-x.test.ts
    │
    ▼
Tests run → verification report fed back into .spec.context.md
```

**Key insight:** The user (or their agent) only touches the `.spec.meta.md` or `.spec.plan.md` — describing WHAT they want and WHY. The cascade handles the HOW, generating structured code specs that flow into the assembler. This is the same pattern Axiom uses: meta-plan → plan → implementation → verification.

## `@ref:` Traceability Through All Tiers

Every spec block carries traceability markers:

```markdown
## @block:authentication-flow @kind:code
@ref:specs/auth/auth.spec.meta.md  ← "This code was generated from this meta context"
@ref:specs/auth/auth.spec.plan.md  ← "This code follows this plan phase"
```

The cascade inserts these `@ref:` markers automatically, creating a full audit trail from meta → plan → code → test → verification.

## Axiom Memory Bank Comparison

| Axiom Concept | SpecLang Equivalent |
|---|---|
| `meta-planning.md` | `.spec.meta.md` (Tier 0) |
| `plan.yaml` + `plan.md` | `.spec.plan.md` (Tier 1) |
| `activeContext.md` | `.spec.context.md` |
| `decisionLog.md` | `.spec.decision.md` |
| `systemPatterns.md` | `.spec.pattern.md` |
| `implementation plans` | `.spec.{lang}.md` (Tier 2) |
| `verification.md` | `.spec.test.md` (Tier 3) |
| `AGENTS.md` / `TODO.md` | Assembled from meta + plan tiers |

## Implementation Plan

### Phase 1: Assembler Support (AC-072 to AC-075)
1. Add `meta`, `plan`, `decision`, `context`, `pattern` to `extMap` (all map to `.md`)
2. Add these to `autoDeriveOutputPath` — output to `thinking/` directory (not `src/`)
3. Add `test` as a pseudo-target_lang — derives language from the code spec it references
4. Section extraction: meta/plan/decision/context/pattern targets extract ALL sections (not just `## Implementation`)

### Phase 2: Cascade Tier Awareness (AC-076 to AC-078)
1. Cascade engine understands tier hierarchy: meta → plan → code → test
2. When tier N changes, cascade regenerates tier N+1 specs
3. `@ref:` auto-insertion between tiers
4. Cascade summary shows full tier-to-tier change impact

### Phase 3: Spec Discovery + Generator (AC-079 to AC-080)
1. `speclang init feature-name` scaffolds all 4 tiers for a new feature
2. Assembler `--meta` flag assembles thinking tiers independently of code tiers
3. `speclang cascade --full` runs all tiers end-to-end

## Verification

- All new target_lang values assemble correctly
- `thinking/` directory populated with assembled meta/plan/decision/context/pattern specs
- Cascade detects changes in Tier 0 and triggers regeneration through all tiers
- Existing code specs (ts, py, go, rs, md) unaffected by new tier targets
- Self-hosting: 6 components still byte-identical after changes
- Full test suite: 1720+ tests pass (no regression)
