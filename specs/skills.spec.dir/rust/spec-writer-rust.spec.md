# speclang-header lines:8
id: "@spec/skills/rust-spec-writer"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Spec writer for Rust"
---

# Spec Writer: Rust

Generates rs spec files for Rust (systems).

## Implementation

```speclang
# @block:spec-writer-rust/conventions @kind:operation
@speclang
# Header: use/mod
# Testing: cargo test
# Linting: clippy
# Type check: cargo check
```
