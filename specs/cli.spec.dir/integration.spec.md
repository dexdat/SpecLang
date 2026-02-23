# speclang-header lines:12
id: "@speclang/cli.dir/integration"
version: 0.1.0
layer: 1
tags: [cli, integration]
project_level: Alpha
agent_support: agent_assisted
parent: "@ref:specs/cli.spec"
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