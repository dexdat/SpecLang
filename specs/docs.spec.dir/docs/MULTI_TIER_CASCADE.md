# Multi-Tier Cascade System

SpecLang's Multi-Tier Cascade extends the single-spec assembly pipeline into a
**thinking system**. Specs are no longer just code generators — they capture
**WHY** (meta), **HOW** (plan), **WHAT** (code), and **PROVE** (test) in
separate but linked tiers.

## Tier Overview

| Tier       | `target_lang` | Output Prefix       | Purpose                        |
|------------|---------------|---------------------|--------------------------------|
| Meta       | `meta`        | `thinking/`         | Context, stakeholders, goals   |
| Plan       | `plan`        | `thinking/`         | Approach, steps, dependencies  |
| Decision   | `decision`    | `thinking/`         | Architecture decisions         |
| Context    | `context`     | `thinking/`         | Background research            |
| Pattern    | `pattern`     | `thinking/patterns/`| Reusable patterns              |
| Code       | `ts/py/go/…`  | `src/`              | Implementation                 |
| Test       | `test`        | `tests/`            | Verification                   |

## Cascade Flow

```
specs/feature.spec.meta.md  ──→  thinking/feature.meta.md    [WHY]
         │
         ▼
specs/feature.spec.plan.md  ──→  thinking/feature.plan.md    [HOW]
         │
         ▼
specs/feature.spec.ts.md    ──→  src/feature.ts              [WHAT]
         │
         ▼
specs/feature.spec.test.md  ──→  tests/feature.test.ts       [PROVE]
```

## Section Extraction Rules

- **Thinking tiers** (meta, plan, decision, context, pattern): **ALL** markdown
  sections are preserved verbatim. No filtering.
- **Code targets** (ts, py, go, rs, etc.): Only `## Implementation` and
  `## @block:` sections are extracted.
- **Test target**: Only `## Test Cases` sections are extracted.

## Quick Start

### Create a multi-tier spec scaffold

```bash
speclang init my-feature --tiers
```

This creates 4 files in `specs/my-feature/`:

```
specs/my-feature/
├── my-feature.spec.meta.md   # Context, stakeholders, constraints
├── my-feature.spec.plan.md    # Approach, steps, dependencies
├── my-feature.spec.ts.md      # Implementation code blocks
└── my-feature.spec.test.md    # Test cases
```

### Assemble a thinking tier spec

```bash
# Assemble meta spec → thinking/
npx tsx .speclang/assembler.spec.ts assemble specs/my-feature/my-feature.spec.meta.md

# Assemble test spec → tests/ (derives language from @ref)
npx tsx .speclang/assembler.spec.ts assemble specs/my-feature/my-feature.spec.test.md
```

### Auto-derived output paths

| Spec file                                          | Output path                        |
|-----------------------------------------------------|------------------------------------|
| `specs/auth/login.spec.meta.md`                     | `thinking/auth/login.meta.md`      |
| `specs/auth/login.spec.plan.md`                     | `thinking/auth/login.plan.md`      |
| `specs/auth/login.spec.decision.md`                 | `thinking/auth/login.decision.md`  |
| `specs/auth/login.spec.context.md`                  | `thinking/auth/login.context.md`   |
| `specs/auth/login.spec.pattern.md`                  | `thinking/patterns/auth/login.pattern.md` |
| `specs/auth/login.spec.ts.md`                       | `src/auth/login.ts`                |
| `specs/auth/login.spec.test.md` (refs a TS spec)   | `tests/auth/login.test.ts`         |
| `specs/auth/login.spec.test.md` (refs a Python spec)| `tests/auth/login.test.py`         |

## Test Language Derivation

When `target_lang: test`, the assembler reads the `@ref:` annotation to
determine the test file's language:

```yaml
---
id: "@my-feature/test"
target_lang: test
@ref: specs/my-feature/my-feature.spec.py.md
---
## Test Cases
def test_feature():
    assert True
```

The assembler resolves `@ref:`, reads the referenced spec's `target_lang`
(`py`), and produces `tests/my-feature/test.py`.

Default language is `ts` when no `@ref` is present or when the referenced spec
has no `target_lang`.

## Spec File Naming Convention

| Target       | Spec extension       |
|--------------|----------------------|
| meta         | `.spec.meta.md`      |
| plan         | `.spec.plan.md`      |
| decision     | `.spec.decision.md`  |
| context      | `.spec.context.md`   |
| pattern      | `.spec.pattern.md`   |
| test         | `.spec.test.md`      |
| ts           | `.spec.ts.md`        |
| py           | `.spec.py.md`        |
| go           | `.spec.go.md`        |
| md           | `.spec.md`           |

## Example: Full Feature Pipeline

```bash
# 1. Scaffold
speclang init auth --tiers

# 2. Edit specs with domain content
vim specs/auth/auth.spec.meta.md   # Add context
vim specs/auth/auth.spec.plan.md   # Add plan
vim specs/auth/auth.spec.ts.md     # Add code blocks
vim specs/auth/auth.spec.test.md   # Add test cases

# 3. Assemble all tiers
npx tsx .speclang/assembler.spec.ts assemble specs/auth/auth.spec.meta.md
npx tsx .speclang/assembler.spec.ts assemble specs/auth/auth.spec.plan.md
npx tsx .speclang/assembler.spec.ts assemble specs/auth/auth.spec.ts.md
npx tsx .speclang/assembler.spec.ts assemble specs/auth/auth.spec.test.md

# 4. Verify
ls thinking/auth/
ls src/auth/
ls tests/auth/
```

## Benefits

- **Traceability**: Every output links back to its spec.
- **Separation of concerns**: WHY, HOW, WHAT, and PROVE live in separate files.
- **Language-agnostic tests**: Test specs adapt to whatever language the code
  spec uses via `@ref:` resolution.
- **Self-documenting**: The `thinking/` directory holds the full design rationale.
