# Pseudo-Code Guide
# Loaded when target_lang is any or *

## Purpose

Pseudo-code is the language-agnostic intermediate representation. It captures
algorithm intent without committing to a specific language syntax.

## Syntax Rules

### Functions
```
FUNCTION name(param1: Type, param2: Type) -> ReturnType
  statements
  RETURN value
END
```

### Variables
```
LET x: Type = initial_value
SET x = new_value
```

### Control Flow
```
IF condition THEN
  statements
ELSE IF other_condition THEN
  statements
ELSE
  statements
END

FOR EACH item IN collection
  statements
END

WHILE condition
  statements
END
```

### Data Structures
```
STRUCT Name
  field1: Type
  field2: Type
END

ENUM Name
  VALUE1
  VALUE2 = 5
END
```

### Error Handling
```
TRY
  risky_operation()
CATCH ErrorType AS e
  handle_error(e)
FINALLY
  cleanup()
END
```

### Concurrency (optional)
```
SPAWN task_name()
AWAIT result FROM task_name
```

## Example

```pseudo
FUNCTION authenticate(email: String, password: String) -> Result<Token, AuthError>
  LET user: Optional<User> = REPOSITORY.find_by_email(email)
  IF user IS NULL THEN
    RETURN Err(AuthError::UserNotFound)
  END
  IF NOT HASH.verify(password, user.password_hash) THEN
    RETURN Err(AuthError::InvalidPassword)
  END
  LET token: Token = JWT.sign({sub: user.id, exp: NOW + 24h})
  RETURN Ok(token)
END
```

## Translation Rules

Language-specific code-gen skills translate pseudo-code as follows:

| Pseudo | TypeScript | Python | Go | Rust |
|--------|-----------|--------|----|----|
| `FUNCTION f(x: T) -> R` | `function f(x: T): R` | `def f(x: T) -> R:` | `func f(x T) R` | `fn f(x: T) -> R` |
| `LET x: T = v` | `const x: T = v` | `x: T = v` | `x := v` | `let x: T = v` |
| `IF c THEN...END` | `if (c) {...}` | `if c: ...` | `if c {...}` | `if c {...}` |
| `RETURN v` | `return v` | `return v` | `return v` | `v` (implicit) |
| `Result<T, E>` | `Result<T, E>` | `Result[T, E]` | `(T, error)` | `Result<T, E>` |
| `Optional<T>` | `T \| null` | `Optional[T]` | `*T` | `Option<T>` |
