# speclang-header lines:8
id: "@spec/skills/lua-code-gen"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Code gen for Lua"
target_lang: lua
---

# Code Gen: Lua

.lua → Lua.

```speclang
# @block:code-gen-lua/assemble @kind:operation
@speclang
# require → src/{project}/{component}.lua | luacheck + teal LSP
```
