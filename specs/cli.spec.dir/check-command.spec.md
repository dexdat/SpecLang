# speclang-header lines:12
id: "@speclang/cli-spec-dir/check-command"
version: 0.1.0
layer: 1
tags: [cli, commands]
project_level: Alpha
agent_support: agent_assisted
parent: "@ref:specs/cli.spec.dir/commands"

short: CLI check command

---

### @cli/check

```speclang
# @block:cli/check @kind:operation
speclang check [options]

Validate specs without generating.

Options:
  --strict     Fail on warnings (default: true)
  --fix        Auto-fix simple issues

Steps:
  - parse all specs
  - validate headers
  - validate refs exist
  - validate block syntax
  - report errors/warnings

Example:
  speclang check
  speclang check --fix
```