# speclang-header lines:8
id: "@spec/skills/cpp-code-gen"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
short: "Code gen for Cpp"
target_lang: cpp
---

# Code Gen: Cpp

.cpp specs → Cpp source.

```speclang
# @block:code-gen-cpp/assemble @kind:operation
@speclang
# Extract blocks → #include/namespace → src/{project}/{component}.cpp
# clang-tidy + g++/clang++
```
