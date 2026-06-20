# speclang-header lines:8
id: "@spec/skills/fsharp-code-gen"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Code gen for Fsharp"
target_lang: fsharp
---

# Code Gen: Fsharp

.fs specs → Fsharp source.

```speclang
# @block:code-gen-fsharp/assemble @kind:operation
@speclang
# Extract blocks → module/open → src/{project}/{component}.fs
# Fantomas + fsc
```
