# speclang-header lines:8
id: "@spec/skills/fsharp-spec-writer"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Spec writer for Fsharp"
---

# Spec Writer: Fsharp

Generates fs specs for Fsharp (functional .NET).

```speclang
# @block:spec-writer-fsharp/conventions @kind:operation
@speclang
# Header: module/open
# Testing: xUnit/Expecto
# Linting: Fantomas
# Type check: fsc
```
