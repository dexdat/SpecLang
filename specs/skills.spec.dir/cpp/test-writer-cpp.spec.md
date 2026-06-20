# speclang-header lines:8
id: "@spec/skills/cpp-test-writer"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Test writer for Cpp"
---

# Test Writer: Cpp

Uses Google Test/Catch2.

```speclang
# @block:test-writer-cpp/unit-tests @kind:operation
@speclang
# @kind:operation → tests/test_{module}.cpp via Google Test/Catch2
```
