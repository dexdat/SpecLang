# speclang-header lines:20
id: "@speclang/cli-spec"
version: 0.1.0
target: src/cli/
layer: 0
tags: [cli, commands, interface]
imports: ["@speclang/core", "@speclang/stdlib"]
children:
    - "@ref:speclang/cli-spec-dir/installation"
    - "@ref:speclang/cli-spec-dir/commands"
    - "@ref:speclang/cli-spec-dir/global-options"
    - "@ref:speclang/cli-spec-dir/configuration"
    - "@ref:speclang/cli-spec-dir/exit-codes"
    - "@ref:speclang/cli-spec-dir/output-formats"
    - "@ref:speclang/cli-spec-dir/interactive-mode"
    - "@ref:speclang/cli-spec-dir/integration"
project_level: Alpha
agent_support: agent_assisted
short: Speclang CLI (8 sub-specs)
---

# Speclang CLI

Command line interface for speclang.

This spec has been split into sub-specs. See `cli.spec.dir/` for details.