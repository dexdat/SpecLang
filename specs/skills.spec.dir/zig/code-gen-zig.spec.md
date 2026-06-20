# speclang-header lines:8
id: "@spec/skills/zig-code-gen"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Code gen for Zig"
target_lang: zig
---

# Code Gen: Zig

.zig specs → Zig source.

```speclang
# @block:code-gen-zig/assemble @kind:operation
@speclang
# Extract blocks → @import("std") → src/{project}/{component}.zig
# zig fmt + zig build
```
