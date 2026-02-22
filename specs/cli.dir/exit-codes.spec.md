# speclang-header lines:10
id: "@speclang/cli.dir/exit-codes"
version: 0.1.0
layer: 1
tags: [cli, exit-codes]
parent: "@ref:speclang/cli"
part: 5/8
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