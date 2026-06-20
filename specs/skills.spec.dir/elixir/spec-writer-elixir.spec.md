# speclang-header lines:8
id: "@spec/skills/elixir-spec-writer"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Spec writer for Elixir"
---

# Spec Writer: Elixir

Generates ex spec files for Elixir (actor-based BEAM).

## Implementation

```speclang
# @block:spec-writer-elixir/conventions @kind:operation
@speclang
# Header: defmodule/alias
# Testing: ExUnit
# Linting: credo
# Type check: dialyxir
```
