# speclang-header lines:8
id: "@spec/skills/haskell-code-gen"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
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
