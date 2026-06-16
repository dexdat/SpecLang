# Python 3.12+ Features Reference
# Loaded when target_lang includes py:3.12 or higher

## type Statement (PEP 695)

Python 3.12 introduced the `type` statement for defining generic type aliases:

```python
type Point[T] = tuple[T, T]
type IntPoint = Point[int]
type Callback[T] = Callable[[T], None]
```

Prefer `type` over `TypeVar` + `Generic` for new code targeting 3.12+.

## @override Decorator (PEP 698)

```python
from typing import override

class Base:
    def greet(self) -> str: ...

class Child(Base):
    @override
    def greet(self) -> str:  # Type checker verifies this overrides Base.greet
        return "hello"
```

## Improved f-string Grammar (PEP 701)

F-strings can now contain any valid Python expression, including nested f-strings and backslashes:

```python
f"{f'{nested}'}"  # Valid in 3.12+
f"{'quotes \"inside\" are fine'}"
```

## Per-Interpreter GIL (PEP 684)

Available as a C-API feature. Not relevant for most generated code.

## Pathlib

`pathlib.Path.walk()` added — prefer over `os.walk()`.

## Unstable C-API Tier

Not relevant for generated code.

---

## Python 3.11 Features (baseline for speclang py target)

### Exception Groups (PEP 654)
```python
try:
    raise ExceptionGroup("errors", [ValueError("a"), TypeError("b")])
except* ValueError as e:
    ...
```

### Self Type (PEP 673)
```python
from typing import Self

class Builder:
    def set_x(self, x: int) -> Self:
        return self
```

### Variadic Generics (PEP 646)
```python
from typing import TypeVarTuple
Ts = TypeVarTuple('Ts')
type Array[*Ts] = tuple[*Ts]
```

### TOML stdlib
```python
import tomllib  # Built-in in 3.11+
```

### asyncio TaskGroup
```python
async with asyncio.TaskGroup() as tg:
    tg.create_task(fetch(url))  # Structured concurrency
```
