# speclang-header lines:10
id: "@speclang/scripts.hard-checks"
version: 0.1.0
layer: 1
tags: [scripts, verification, validation]
parent: ""@ref:specs/scripts"status: draft
project_level: Alpha
agent_support: agent_assisted
short: Hard Verification System Script
---

# Hard Verification System Script

Comprehensive checks to ensure specs and implementation are in sync.

## Purpose

Runs critical verification checks before packaging or release.

## Checks Performed

1. **TypeScript Build** - Compiles without errors
2. **Test Suite** - All tests pass
3. **Reference Validation** - No broken spec references
4. **Spec-Implementation Sync** - Specs have corresponding implementations
5. **CLI Commands** - CLI functional
6. **Database Schema** - Migration files present
7. **Dual-View Symlinks** - Symlinks working
8. **Test Coverage** - Test files exist
9. **Documentation** - Core docs present

## Usage

```bash
# Run all checks
./scripts/hard-checks.py

# Exit code: 0 if all critical checks pass, 1 otherwise
```

## Dependencies

- Python 3.8+
- npm (for build and test checks)
- speclang CLI (for command checks)