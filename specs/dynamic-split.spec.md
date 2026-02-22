# speclang-header lines:12
id: "@speclang/dynamic-split"
version: 0.1.0
layer: 0
tags: [splitting, sizing, tokens, limits]
imports: ["@speclang/core", "@speclang/headers"]
status: draft
project_level: Alpha
agent_support: agent_assisted
children:
  - @ref:speclang/dynamic-split/strategy
  - @ref:speclang/dynamic-split/token-budget
short: Dynamic Splitting (split into 2 sub-specs)
---

This spec has been split into focused sub-specs. See `dynamic-split.dir/` for details.

## Sub‑specs

1. **Strategy** (`strategy.spec.md`) – splitting logic, configuration, tools, user control
2. **Token Budget** (`token-budget.spec.md`) – token counting, budget calculation, limits

Both sub‑specs link back to this parent and can be navigated independently.