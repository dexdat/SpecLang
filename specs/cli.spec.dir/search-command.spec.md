# speclang-header lines:11
id: "@speclang/cli.spec.dir/search-command"
version: 0.1.0
layer: 1
tags: [cli, commands]
project_level: Alpha
agent_support: agent_assisted
parent: "@ref:specs/cli.spec.dir/commands"
part: 1/1
short: CLI search command

---

### @cli/search

```speclang
# @block:cli/search @kind:operation
speclang search <query>

Search across all specs.

Arguments:
  query        Search term or @id pattern

Options:
  --kind       Filter by block kind
  --tag        Filter by tag

Example:
  speclang search login
  speclang search @auth
  speclang search --kind=entity
```