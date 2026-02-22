# speclang-header lines:10
id: "@speclang/cli.dir/interactive-mode"
version: 0.1.0
layer: 1
tags: [cli, interactive]
parent: "@ref:speclang/cli"
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