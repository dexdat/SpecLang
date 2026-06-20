# speclang-header lines:8
id: "@spec/skills/csharp-code-gen"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Code gen for Csharp"
target_lang: csharp
---

# Code Gen: Csharp

.cs → Csharp.

```speclang
# @block:code-gen-csharp/assemble @kind:operation
@speclang
# using/namespace → src/{project}/{component}.cs | Roslyn analyzers + csc
```
