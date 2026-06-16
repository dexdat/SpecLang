---
id: "@spec/skills/scala-code-gen"
target_lang: scala
short: "Code gen for Scala"
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
