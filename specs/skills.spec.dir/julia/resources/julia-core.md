# Julia Resources
# Loaded for target_lang: jl / julia

## Multiple Dispatch (Core Paradigm)
```julia
# Methods dispatch on ALL argument types
process(x::Int, y::Int) = x + y
process(x::String, y::String) = x * y
process(x::Int, y::String) = repeat(y, x)
# Same function name, different behavior based on type combination
```

## Type System
```julia
abstract type Animal end
struct Dog <: Animal
    name::String
    breed::String
end
struct Cat <: Animal
    name::String
    color::String
end

# Parametric types
struct Point{T}
    x::T
    y::T
end
```

## Metaprogramming
```julia
# Macros and generated functions
macro sayhello(name)
    return :(println("Hello, ", $name))
end

# @generated functions for type-specialized code
@generated function myfunc(x::T) where T
    # This runs at compile time
    if T <: Integer
        return :(x + 1)
    else
        return :(x)
    end
end
```

## Performance Patterns
- `@inbounds` — skip bounds checking
- `@simd` — SIMD vectorization hint
- `@views` — avoid allocations with slice views
- Type stability: all variables have concrete types
- `const` globals for type inference

## Common Packages
- DataFrames — data manipulation
- Plots/Makie — visualization
- DifferentialEquations — ODE/PDE solving
- Flux — machine learning
- Genie — web framework
