# speclang-header lines:11
id: "@speclang/scripts-verify-system"
version: 0.1.0
layer: 1
tags: [scripts, verification, testing]
parent: "@ref:specs/scripts"
status: draft
project_level: Alpha
agent_support: agent_assisted
short: System Verification Script
---

# System Verification Script

End-to-end verification that the SpecLang system works.

## Purpose

Runs a series of tests to confirm the system is functional.

## Tests

1. **TypeScript Build** - `npm run build`
2. **Test Suite** - `npm test`
3. **CLI Help** - `./bin/speclang --help`
4. **Reference Validation** - `python3 scripts/validate_refs.py`
5. **Spec Index Generation** - `python3 generate_index.py`
6. **Database Check** - Verifies SQLite database exists

## Usage

```bash
./scripts/verify_system.py
```

Exit code: 0 if all tests pass, 1 otherwise.