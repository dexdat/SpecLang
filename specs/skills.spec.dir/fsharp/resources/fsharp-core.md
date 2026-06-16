# F# Resources
# Loaded for target_lang: fs / fsharp

## Discriminated Unions
```fsharp
type Shape =
    | Circle of radius: float
    | Rectangle of width: float * height: float
    | Triangle of base: float * height: float

let area shape =
    match shape with
    | Circle r -> Math.PI * r * r
    | Rectangle (w, h) -> w * h
    | Triangle (b, h) -> 0.5 * b * h
```

## Computation Expressions
```fsharp
// Async workflows
let fetchData url = async {
    let! response = Http.AsyncRequestString(url)
    let parsed = parseJson response
    return parsed
}

// Result/option builders
let divide x y = option {
    let! result = if y = 0 then None else Some (x / y)
    return result * 2
}
```

## Type Providers
```fsharp
// Compile-time type generation from external data
type Weather = JsonProvider<"https://api.weather.gov/sample">
let forecast = Weather.GetSample()
let temp = forecast.Properties.Temperature // Autocompleted, type-safe
```

## Pipe Forward
```fsharp
let result =
    data
    |> List.filter isValid
    |> List.map transform
    |> List.groupBy category
    |> Map.map (fun _ items -> List.sum items)
```

## Pattern Matching (Exhaustive)
```fsharp
match value with
| Some x when x > 0 -> $"positive: {x}"
| Some _ -> "zero/negative"
| None -> "absent"
```

## Key Libraries
- Giraffe/Saturn — web
- FSharp.Data — type providers
- FsCheck — property-based testing
- Expecto — testing
- Farmer — Azure IaC
