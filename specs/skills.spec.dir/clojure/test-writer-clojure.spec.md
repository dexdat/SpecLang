# speclang-header lines:8
id: "@spec/skills/clojure-test-writer"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Test writer for Clojure"
---

# Test Writer: Clojure

Uses clojure.test.

## Implementation

```speclang
# @block:test-writer-clojure/unit-tests @kind:operation
@speclang
# For each @kind:operation → tests/test_{module}.clj using clojure.test
# Happy path, edge cases, error paths
```
