---
id: "@speclang/cli.spec.dir/exit-codes"
version: 0.1.0
layer: 1
tags: [cli, exit-codes]
project_level: Alpha
agent_support: agent_assisted
parent: ""@ref:specs/cli.spec"part: 5/8
short: CLI exit codes
---

## Exit Codes

```speclang
# @block:cli/exit-codes @kind:table
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error |
| 2 | Validation failed |
| 3 | No changes |
| 130 | Interrupted (Ctrl+C) |
```