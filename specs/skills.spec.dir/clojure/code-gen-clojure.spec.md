---
id: "@spec/skills/clojure-code-gen"
target_lang: clojure
short: "Code gen for Clojure"
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
