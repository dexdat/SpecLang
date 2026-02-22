# speclang-header lines:20
id: "@speclang/cli"
version: 0.1.0
layer: 0
tags: [cli, commands, interface]
imports: ["@speclang/core", "@speclang/stdlib"]
children:
  - "@ref:speclang/cli.dir/installation"
  - "@ref:speclang/cli.dir/commands"
  - "@ref:speclang/cli.dir/global-options"
  - "@ref:speclang/cli.dir/configuration"
  - "@ref:speclang/cli.dir/exit-codes"
  - "@ref:speclang/cli.dir/output-formats"
  - "@ref:speclang/cli.dir/interactive-mode"
  - "@ref:speclang/cli.dir/integration"

project_level: Alpha
agent_support: agent_assisted
short: Speclang CLI (8 sub-specs)
---

# Speclang CLI

Command line interface for speclang.

This spec has been split into sub-specs. See `cli.dir/` for details.