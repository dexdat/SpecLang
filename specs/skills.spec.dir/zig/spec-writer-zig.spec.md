# speclang-header lines:8
id: "@spec/skills/zig-spec-writer"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Spec writer for Zig"
---

# Spec Writer: Zig

Generates zig specs for Zig (C alternative).

```speclang
# @block:spec-writer-zig/conventions @kind:operation
@speclang
# Header: @import("std")
# Testing: zig test
# Linting: zig fmt
# Type check: zig build
```
