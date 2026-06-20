# speclang-header lines:8
id: "@spec/skills/haskell-spec-writer"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Spec writer for Haskell"
---

# Spec Writer: Haskell

Generates hs spec files for Haskell (purely functional).

## Implementation

```speclang
# @block:spec-writer-haskell/conventions @kind:operation
@speclang
# Header: module/import
# Testing: hspec
# Linting: hlint
# Type check: ghc
```
