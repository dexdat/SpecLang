---
id: "@spec/skills/elixir-code-gen"
target_lang: elixir
short: "Code gen for Elixir"
---

# Code Gen: Elixir

Expands .ex specs into Elixir source.

## Implementation

```speclang
# @block:code-gen-elixir/assemble @kind:operation
@speclang
# Extract @speclang blocks → generate defmodule/alias → write src/{project}/{component}.ex
# Lint: credo — Type check: dialyxir
```
