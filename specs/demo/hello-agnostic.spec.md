---
id: "@specs/demo/hello-agnostic"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
tags: [demo, agnostic, catch-all]
short: "Demo agnostic spec — pseudo-code"
target_lang: any
output: .speclang/demo/hello-agnostic.spec.md
---

# Hello Agnostic Demo

A language-agnostic spec using pseudo-code blocks to prove the catch-all path.

## Entity: Greeter

```yaml
# @block:greeter @kind:entity
entity: Greeter
  properties:
    - prefix: String (default: "Hello")
    - count: Integer (readonly, starts at 0)
  methods:
    - greet(name: String) -> String — returns "{prefix}, {name}!" and increments count
```

## Algorithm

```pseudo
# @block:greet @kind:algorithm
FUNCTION greet(name: String) -> String
  count = count + 1
  RETURN prefix + ", " + name + "!"
END
```
