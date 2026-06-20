# speclang-header lines:8
id: "@spec/skills/julia-spec-writer"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Spec writer for Julia"
target_lang: julia
---

# Spec Writer: Julia

Generates jl specs for Julia (multiple dispatch).

```speclang
# @block:spec-writer-julia/conventions @kind:operation
@speclang
# Header: using/import
# Testing: Test
# Linting: JET.jl
# Type check: JET.jl
```
