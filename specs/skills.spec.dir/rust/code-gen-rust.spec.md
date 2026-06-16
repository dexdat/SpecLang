---
id: "@spec/skills/rust-code-gen"
target_lang: rust
short: "Code gen for Rust"
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
