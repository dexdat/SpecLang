# speclang-header lines:10
id: "@speclang/cli.spec.dir/global-options"
version: 0.1.0
layer: 1
tags: [cli, options]
project_level: Alpha
agent_support: agent_assisted
parent: ""@ref:specs/cli.spec"part: 3/8
short: CLI global options
---

## Global Options

```speclang
# @block:cli/global-options @kind:table
| Flag | Description |
|------|-------------|
| --config | Path to .speclangrc |
| --verbose | Detailed output |
| --quiet | Minimal output |
| --json | JSON output |
| --no-color | Disable colors |
```