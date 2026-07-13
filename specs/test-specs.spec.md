# speclang-header lines:14
id: "@speclang/test-specs"
version: 0.1.0
layer: 0
target: src/test-specs/
tags: [tests, bdd, natural-language]
imports: ["@speclang/core"]
status: draft

project_level: Alpha
agent_support: agent_assisted
short: Test Specs
children: ["@speclang/test-specs/format.spec", "@speclang/test-specs/examples.spec"]
---

# Test Specs

Tests written as specs in natural language. First-class citizens.

This spec has been split into sub-specs:

- @ref:speclang/test-specs/format.spec – Format and structure definitions
- @ref:speclang/test-specs/examples.spec – Concrete test examples

## Philosophy

```speclang
# @block:tests/philosophy @kind:note
Tests are specs. Specs are tests.

- Test specs describe expected behavior
- TestWriter agent converts to executable tests
- Results flow back to test specs
- Tests and code stay in sync automatically
```
