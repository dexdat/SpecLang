# speclang-header lines:8
id: "@spec/skills/clojure-spec-writer"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Spec writer for Clojure"
target_lang: clojure
---

# Spec Writer: Clojure

Generates clj spec files for Clojure (functional Lisp JVM).

## Implementation

```speclang
# @block:spec-writer-clojure/conventions @kind:operation
@speclang
# Header: ns/:require
# Testing: clojure.test
# Linting: clj-kondo
# Type check: spec/Malli
```
