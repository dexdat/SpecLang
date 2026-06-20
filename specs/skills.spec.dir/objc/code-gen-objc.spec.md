# speclang-header lines:8
id: "@spec/skills/objc-code-gen"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Code gen for Objc"
target_lang: objc
---

# Code Gen: Objc

.m → Objc.

```speclang
# @block:code-gen-objc/assemble @kind:operation
@speclang
# #import → src/{project}/{component}.m | clang-format + clang
```
