# Go Generics Reference
# Loaded when target_lang includes go (1.18+)

## Type Parameters

Go 1.18+ supports generics with type parameters:

```go
// Generic function
func Map[T, U any](slice []T, fn func(T) U) []U {
    result := make([]U, len(slice))
    for i, v := range slice {
        result[i] = fn(v)
    }
    return result
}

// Generic type
type Set[T comparable] struct {
    items map[T]struct{}
}

func NewSet[T comparable]() *Set[T] {
    return &Set[T]{items: make(map[T]struct{})}
}

func (s *Set[T]) Add(item T) {
    s.items[item] = struct{}{}
}

func (s *Set[T]) Contains(item T) bool {
    _, ok := s.items[item]
    return ok
}
```

## Constraints

```go
// Built-in constraints
import "golang.org/x/exp/constraints"

func Max[T constraints.Ordered](a, b T) T {
    if a > b { return a }
    return b
}

// Custom constraint interface
type Validator[T any] interface {
    Validate(T) error
}
```

## Type Inference

```go
// Type parameter inferred from arguments
result := Map([]int{1, 2, 3}, func(n int) string {
    return fmt.Sprintf("n=%d", n)
})
// T=int, U=string inferred automatically
```

## CodeGen Rules

1. Use `[T any]` or `[T comparable]` for generic types
2. Import `constraints` from stdlib for Ordered/Signed/Unsigned
3. Prefer type inference where possible
4. Use `any` instead of `interface{}` (Go 1.18+)
5. Constructor functions should match type parameter names: `func NewSet[T comparable]()`
