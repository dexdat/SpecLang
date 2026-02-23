# speclang-header lines:13
id: "@speclang/stdlib"
version: 0.1.0
layer: 0
tags: [stdlib, builtins, types]
imports: ["@speclang/core"]
project_level: Alpha
agent_support: agent_assisted
short: Standard Library
children:
  - "@ref:specs/stdlib.spec.dir/types"
  - "@ref:specs/stdlib.spec.dir/mapping"
---
# Standard Library

Built-in blocks available to all specs without import.

This spec has been split into multiple parts for better organization and autonomous agent operation.

## Parts

- @ref:specs/stdlib.spec.dir/types - Standard Library Types (primitives, composites, results, common types)
- @ref:specs/stdlib.spec.dir/mapping - Standard Library Functions & Assertions

---

*See individual parts in stdlib.spec.dir/*
