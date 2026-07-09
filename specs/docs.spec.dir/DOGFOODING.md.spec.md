# speclang-header lines:6
id: "@specs/docs/dogfooding"
version: 1.0.0
layer: 5
target: docs/DOGFOODING.md
tags: [docs, dogfooding, integration-test, quality-assurance]
---

# SpecLang Dogfooding Guide

User-facing guide for finding bugs in SpecLang by *using* SpecLang to build
real projects with SpecLang. Companion to `scripts/integration-test.py`.

## Workflow Steps

1. **Create Test Project** — fresh `_tmp/test-project/` directory.
2. **Run SpecLang Generation** — produce code from a representative spec set.
3. **Smoke Test** — execute generated build/tests.
4. **Triage** — read `_tmp/integration-test-bugs.md` and file issues.
5. **Iterate** — repeat until clean.

## Key Commands

```bash
python3 scripts/integration-test.py            # full end-to-end
cat _tmp/integration-test-bugs.md              # review issues
```

## Audience

Internal SpecLang contributors and integration-test maintainers. Not for
end-users of generated projects.

@ref:specs/scripts/integration-test
