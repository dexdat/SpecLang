# speclang-header lines:13
id: "@speclang/stdlib/mapping"
parent: "@ref:specs/stdlib"
part: 2/2
siblings:
  prev: "@ref:specs/stdlib.dir/types"
short: Standard Library Functions & Assertions
project_level: Alpha
agent_support: agent_assisted
tags: [stdlib, functions, assertions]
version: 0.1.0
layer: 2
---
# Standard Library Functions & Assertions

Built-in functions and assertion operations.

## Functions

### @stdlib/identity

```speclang
# @block:stdlib/identity @kind:operation @tparams:[T]
identity(x: T) -> T:
  description: "Returns input unchanged"
  steps:
    1. Return input unchanged
  body: return x
```

### @stdlib/compose

```speclang
# @block:stdlib/compose @kind:operation @tparams:[A, B, C]
compose(f: (B) -> C, g: (A) -> B) -> (A) -> C:
  description: "Function composition"
  steps:
    1. Take functions f and g
    2. Return new function that applies g then f
  body: return (a) => f(g(a))
```

### @stdlib/pipe

```speclang
# @block:stdlib/pipe @kind:operation @tparams:[T]
pipe(value: T, ...fns: ((T) -> T)[]) -> T:
  description: "Chain operations left to right"
  steps:
    1. Take initial value and array of functions
    2. Apply each function sequentially, passing result to next
    3. Return final result
  body: return fns.reduce((v, f) => f(v), value)
```

### @stdlib/curry

```speclang
# @block:stdlib/curry @kind:operation
curry(fn: Function) -> Function:
  description: "Partial application"
  steps:
    1. Take function fn
    2. Return curried function that accumulates arguments
    3. When enough arguments collected, call original function
  body: |
    return function curried(...args) {
      if (args.length >= fn.length) return fn(...args)
      return curried.bind(null, ...args)
    }
```

---

## Assertions

### @stdlib/assert

```speclang
# @block:stdlib/assert @kind:operation
assert(condition: Bool, message?: String) -> Void:
  description: "Panic if false"
  steps:
    1. Check condition
    2. If false, throw error with message or default
  body: |
    if (!condition) throw Error(message || "assertion failed")
```

### @stdlib/assertEquals

```speclang
# @block:stdlib/assertEquals @kind:operation @tparams:[T]
assertEquals(actual: T, expected: T, message?: String) -> Void:
  description: "Panic if not equal"
  steps:
    1. Compare actual and expected values
    2. If not equal, call assert with message
  refs: [@stdlib/assert]
```