# speclang-header lines:8
id: "@spec/skills/erlang-code-gen"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Code gen for Erlang"
target_lang: erlang
---

# Code Gen: Erlang

.erl specs → Erlang source.

```speclang
# @block:code-gen-erlang/assemble @kind:operation
@speclang
# Extract blocks → -module/-export → src/{project}/{component}.erl
# elvis + dialyzer
```
