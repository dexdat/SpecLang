# speclang-header lines:8
id: "@spec/skills/scala-code-gen"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Code gen for Scala"
target_lang: scala
---

# Code Gen: Scala

Expands .scala specs into Scala source.

## Implementation

```speclang
# @block:code-gen-scala/assemble @kind:operation
@speclang
# Extract @speclang blocks → generate package/import → write src/{project}/{component}.scala
# Lint: scalafix — Type check: scalac
```
