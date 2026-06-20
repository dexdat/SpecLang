# speclang-header lines:8
id: "@spec/skills/zig-test-writer"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Test writer for Zig"
---

# Test Writer: Zig

Uses zig test.

```speclang
# @block:test-writer-zig/unit-tests @kind:operation
@speclang
# @kind:operation → tests/test_{module}.zig via zig test
```
