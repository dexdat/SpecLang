# speclang-header lines:8
id: "@spec/skills/fsharp-test-writer"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Test writer for Fsharp"
target_lang: fsharp
---

# Test Writer: Fsharp

Uses xUnit/Expecto.

```speclang
# @block:test-writer-fsharp/unit-tests @kind:operation
@speclang
# @kind:operation → tests/test_{module}.fs via xUnit/Expecto
```
