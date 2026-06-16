---
id: "@spec/skills/haskell-code-gen"
target_lang: haskell
short: "Code gen for Haskell"
---

# Code Gen: Haskell

Expands .hs specs into Haskell source.

## Implementation

```speclang
# @block:code-gen-haskell/assemble @kind:operation
@speclang
# Extract @speclang blocks → generate module/import → write src/{project}/{component}.hs
# Lint: hlint — Type check: ghc
```
