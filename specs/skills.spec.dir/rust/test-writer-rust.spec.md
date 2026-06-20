# speclang-header lines:8
id: "@spec/skills/rust-test-writer"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Test writer for Rust"
target_lang: rust
---

# Test Writer: Rust

Uses cargo test.

## Implementation

```speclang
# @block:test-writer-rust/unit-tests @kind:operation
@speclang
# For each @kind:operation → tests/test_{module}.rs using cargo test
# Happy path, edge cases, error paths
```
