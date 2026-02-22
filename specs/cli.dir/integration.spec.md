# speclang-header lines:10
id: "@speclang/cli.dir/integration"
version: 0.1.0
layer: 1
tags: [cli, integration]
parent: "@ref:speclang/cli"
part: 8/8
short: CLI integration
---

## Integration

### @cli/git-hooks

```speclang
# @block:cli/git-hooks @kind:note
speclang install-hooks

Installs:
  pre-commit: run speclang check
  pre-push: run speclang test
```

### @cli/editor

```speclang
# @block:cli/editor @kind:note
VS Code extension available:
  - syntax highlighting
  - @id autocomplete
  - ref navigation
  - inline AI expansion
```