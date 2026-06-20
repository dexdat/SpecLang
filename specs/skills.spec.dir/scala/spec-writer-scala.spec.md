# speclang-header lines:8
id: "@spec/skills/scala-spec-writer"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Spec writer for Scala"
target_lang: scala
---

# Spec Writer: Scala

Generates scala spec files for Scala (functional+OOP JVM).

## Implementation

```speclang
# @block:spec-writer-scala/conventions @kind:operation
@speclang
# Header: package/import
# Testing: ScalaTest
# Linting: scalafix
# Type check: scalac
```
