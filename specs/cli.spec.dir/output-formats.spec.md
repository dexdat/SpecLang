# speclang-header lines:12
id: "@speclang/cli.dir/output-formats"
version: 0.1.0
layer: 1
tags: [cli, output]
project_level: Alpha
agent_support: agent_assisted
parent: "@ref:specs/cli.spec"
part: 6/8
short: CLI output formats
---

## Output Formats

```speclang
# @block:cli/output @kind:note
Default: human-readable with colors

--json flag:
{
  "success": true,
  "artifacts": [...],
  "errors": [],
  "duration_ms": 234
}
```