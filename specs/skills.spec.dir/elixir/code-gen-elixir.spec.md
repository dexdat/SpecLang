# speclang-header lines:8
id: "@spec/skills/elixir-code-gen"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Code gen for Elixir"
target_lang: elixir
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
