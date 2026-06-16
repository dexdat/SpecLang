---
id: "@spec/skills/zig-code-gen"
target_lang: zig
short: "Code gen for Zig"
---

# Code Gen: Zig

.zig specs → Zig source.

```speclang
# @block:code-gen-zig/assemble @kind:operation
@speclang
# Extract blocks → @import("std") → src/{project}/{component}.zig
# zig fmt + zig build
```
