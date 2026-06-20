# speclang-header lines:8
id: "@spec/skills/haskell-test-writer"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Test writer for Haskell"
---

# Test Writer: Haskell

Uses hspec.

## Implementation

```speclang
# @block:test-writer-haskell/unit-tests @kind:operation
@speclang
# For each @kind:operation → tests/test_{module}.hs using hspec
# Happy path, edge cases, error paths
```
