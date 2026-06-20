# speclang-header lines:8
id: "@spec/skills/julia-test-writer"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Test writer for Julia"
target_lang: julia
---

# Test Writer: Julia

Uses Test.

```speclang
# @block:test-writer-julia/unit-tests @kind:operation
@speclang
# @kind:operation → tests/test_{module}.jl via Test
```
