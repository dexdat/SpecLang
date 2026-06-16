# C# Resources
# Loaded for target_lang: cs / csharp

## LINQ
```csharp
var result = items
    .Where(i => i.IsActive)
    .Select(i => new { i.Name, i.Price })
    .OrderBy(i => i.Price)
    .ToList();

// Query syntax
var query = from i in items
            where i.IsActive
            orderby i.Price
            select new { i.Name, i.Price };
```

## async/await & Tasks
```csharp
async Task<User> FetchUserAsync(int id)
{
    using var client = new HttpClient();
    var json = await client.GetStringAsync($"/users/{id}");
    return JsonSerializer.Deserialize<User>(json);
}

// Parallel execution
var tasks = ids.Select(id => FetchUserAsync(id));
var users = await Task.WhenAll(tasks);
```

## Pattern Matching (C# 8+)
```csharp
string Describe(object obj) => obj switch
{
    int i when i > 0 => $"positive: {i}",
    string s => $"string length: {s.Length}",
    User { Age: >= 18 } u => $"adult: {u.Name}",
    null => "nothing",
    _ => "unknown"
};
```

## Records & Init-Only (C# 9+)
```csharp
public record User(string Name, int Age, string Email);
// Value equality, with-expressions, auto-generated ToString
var updated = user with { Age = 31 };
```

## Dependency Injection (Built-in)
```csharp
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddSingleton<ICache, RedisCache>();
// Minimal API (C# 10+)
app.MapGet("/users/{id}", async (int id, IUserService svc) => 
    await svc.GetUserAsync(id) is User u ? Results.Ok(u) : Results.NotFound());
```

## Key Libraries
- ASP.NET Core — web
- Entity Framework Core — ORM
- MediatR — CQRS/Mediator
- FluentValidation — validation
- xUnit/NUnit — testing
