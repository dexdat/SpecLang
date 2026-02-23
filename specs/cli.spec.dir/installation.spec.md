# speclang-header lines:12
id: "@speclang/cli.spec.dir/installation"
version: 0.1.0
layer: 1
tags: [cli, installation]
project_level: Alpha
agent_support: agent_assisted
parent: "@ref:specs/cli.spec"
part: 1/8
short: CLI installation
---

# Installation

```speclang
# @block:cli/install @kind:note
npm install -g speclang
# or
cargo install speclang
# or
go install github.com/speclang/cli@latest
```