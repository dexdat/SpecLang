# speclang-header lines:8
id: "@spec/skills/c-code-gen"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Code gen for C"
target_lang: c
---

# Code Gen: C

.c → C.

```speclang
# @block:code-gen-c/assemble @kind:operation
@speclang
# #include → src/{project}/{component}.c | cppcheck + gcc -Wall -Wextra
```
