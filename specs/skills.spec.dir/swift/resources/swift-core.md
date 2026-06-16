# Swift Resources
# Loaded for target_lang: swift

## Protocol-Oriented Programming
```swift
protocol Drawable {
    func draw() -> String
}
extension Drawable {
    func describe() -> String { "Drawable: \(draw())" }
}
struct Circle: Drawable {
    let radius: Double
    func draw() -> String { "Circle(r: \(radius))" }
}
```

## Optionals
```swift
var name: String? = nil
// Optional binding
if let unwrapped = name { print(unwrapped) }
// Guard
guard let unwrapped = name else { return }
// Optional chaining
let count = name?.count
// Nil coalescing
let display = name ?? "Anonymous"
```

## ARC & Memory Management
```swift
class Parent {
    var child: Child?
}
class Child {
    weak var parent: Parent?  // weak to avoid retain cycle
}
// Capture lists in closures: { [weak self] in ... }
```

## Swift Concurrency (async/await)
```swift
func fetchUser(id: Int) async throws -> User {
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(User.self, from: data)
}
// Task groups, actors, @MainActor
```

## Result Type & Error Handling
```swift
func load() -> Result<Data, LoadingError> {
    // ...
}
// With throwing: func load() throws -> Data

// Async alternative
do {
    let user = try await fetchUser(id: 1)
} catch {
    print("Failed: \(error)")
}
```

## Key Frameworks
- SwiftUI — declarative UI
- Combine — reactive streams
- Vapor — server-side web
- SwiftData/CoreData — persistence
