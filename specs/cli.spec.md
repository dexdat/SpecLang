# speclang-header lines:20
id: "@speclang/cli-spec"
version: 0.1.0
target: src/cli/
layer: 0
tags: [cli, commands, interface]
imports: ["@speclang/core", "@speclang/stdlib"]
children:
    - "@ref:specs/cli.spec.dir/installation"
    - "@ref:specs/cli.spec.dir/commands"
    - "@ref:specs/cli.spec.dir/global-options"
    - "@ref:specs/cli.spec.dir/configuration"
    - "@ref:specs/cli.spec.dir/exit-codes"
    - "@ref:specs/cli.spec.dir/output-formats"
    - "@ref:specs/cli.spec.dir/interactive-mode"
    - "@ref:specs/cli.spec.dir/integration"
project_level: Alpha
agent_support: agent_assisted
short: Speclang CLI (8 sub-specs)
---

# Speclang CLI

Command line interface for speclang.

This spec has been split into sub-specs. See `cli.spec.dir/` for details.