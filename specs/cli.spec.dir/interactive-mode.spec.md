# speclang-header lines:11
id: "@speclang/cli.spec.dir/interactive-mode"
version: 0.1.0
layer: 1
tags: [cli, interactive]
project_level: Alpha
agent_support: agent_assisted
parent: "@ref:specs/cli.spec"
part: 7/8
short: CLI interactive mode
---

## Interactive Mode

```speclang
# @block:cli/interactive @kind:operation
speclang

Starts interactive REPL.

Commands:
  :help        Show help
  :load <id>   Load spec block
  :edit <id>   Open in editor  
  :expand <id> Expand block
  :compile     Compile current
  :quit        Exit

Example:
  $ speclang
  > :load @auth/login
  > :expand
  > :compile
  > :quit
```