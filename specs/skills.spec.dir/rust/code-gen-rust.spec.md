# speclang-header lines:8
id: "@spec/skills/rust-code-gen"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Code gen for Rust"
target_lang: rust
---

# Code Gen: Rust

Expands .rs specs into Rust source.

## Implementation

```speclang
# @block:code-gen-rust/assemble @kind:operation
@speclang
# Extract @speclang blocks → generate use/mod → write src/{project}/{component}.rs
# Lint: clippy — Type check: cargo check
```
