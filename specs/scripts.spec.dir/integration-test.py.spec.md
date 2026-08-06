# speclang-header lines:10
id: "@speclang/scripts/integration-test"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: End-to-end dogfooding harness
target: scripts/integration-test.py
tags: [scripts, integration-test, dogfooding, end-to-end]
---

# SpecLang Integration Test

End-to-end dogfooding harness — generates a fresh project in `_tmp/test-project/`
using SpecLang, then verifies that the generated project actually builds and
runs. Referenced from `docs/DOGFOODING.md` (the dogfooding guide).

## Usage

```bash
python3 scripts/integration-test.py
cat _tmp/integration-test-bugs.md  # if any bugs were discovered
```

## What it does

1. Creates `_tmp/test-project/` (cleaned up first).
2. Runs SpecLang generation against a representative spec set.
3. Executes the generated project's smoke tests.
4. Records every deviation, unexpected exit code, or missing file to
   `_tmp/integration-test-bugs.md`.
5. Exits non-zero if any bug category was hit.

## Class

```python
class IntegrationTest:
    def __init__(self)             # sets project_root and test_dir
    def run(self) -> int           # returns 0 on clean, non-zero on bugs
```

## Output

- Console: colored progress (GREEN/RED/YELLOW with `NC` reset).
- File: `_tmp/integration-test-bugs.md` — markdown report of discovered issues.

## Dependencies

- Python 3.8+ stdlib: `os`, `subprocess`, `shutil`, `sys`, `pathlib`,
  `datetime`.
- Working SpecLang install reachable via PATH or as `python3 -m speclang`.

docs/dogfooding
@ref:specs/compliance §Dual-View Pattern
