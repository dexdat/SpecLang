# speclang-header lines:14
id: "@speclang/compiler"
version: 0.1.0
layer: 0
tags: [compiler, codegen, transform]
imports: ["@speclang/core", "@speclang/stdlib", "@speclang/spec-format"]
children:
  - "@ref:speclang/compiler.dir/phases"
  - "@ref:speclang/compiler.dir/targets"
  - "@ref:speclang/compiler.dir/templates"

project_level: Alpha
agent_support: agent_assisted
short: Speclang Compiler (3 sub-specs)
---
# Speclang Compiler

Transforms specs into code. Multi-target. Bidirectional.

This spec has been split into sub-specs. See `compiler.dir/` for details.