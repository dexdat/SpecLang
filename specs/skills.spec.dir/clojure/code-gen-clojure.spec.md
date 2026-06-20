# speclang-header lines:8
id: "@spec/skills/clojure-code-gen"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Code gen for Clojure"
target_lang: clojure
---

# Code Gen: Clojure

Expands .clj specs into Clojure source.

## Implementation

```speclang
# @block:code-gen-clojure/assemble @kind:operation
@speclang
# Extract @speclang blocks → generate ns/:require → write src/{project}/{component}.clj
# Lint: clj-kondo — Type check: spec/Malli
```
