# Rust Resources
# Loaded for target_lang: rs / rust

## Ownership & Borrow Checker
- Every value has exactly one owner
- References: `&T` (shared, immutable) and `&mut T` (exclusive, mutable)
- Cannot have both `&mut` and `&` to same value simultaneously
- Lifetimes prevent dangling references: `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str`

## Traits vs Interfaces
```rust
trait Summary {
    fn summarize(&self) -> String;
    fn default_method(&self) -> String { "default".into() }  // default impl
}
impl Summary for Article { ... }
// Trait bounds: fn notify<T: Summary>(item: &T) { ... }
// Or: fn notify(item: &impl Summary) { ... }
```

## Error Handling
```rust
// Result<T, E> with ? operator
fn read_file() -> Result<String, io::Error> {
    let content = std::fs::read_to_string("file.txt")?;
    Ok(content)
}
// Custom errors with thiserror or anyhow
// thiserror: #[derive(Error, Debug)]
// anyhow: anyhow::Result<T> for application code
```

## Pattern Matching
```rust
match value {
    Some(x) if x > 0 => println!("positive"),
    Some(_) => println!("zero or negative"),
    None => println!("nothing"),
}
```

## Async/Await
```rust
async fn fetch(url: &str) -> Result<Response, reqwest::Error> {
    reqwest::get(url).await
}
// Runtime: tokio or async-std
// #[tokio::main] or #[tokio::test]
```

## Macros
```rust
// Declarative: macro_rules! my_vec { ($($x:expr),*) => { vec![$($x),*] }; }
// Procedural: #[derive(Debug, Clone, Serialize, Deserialize)]
```

## Smart Pointers
- `Box<T>` — heap allocation
- `Rc<T>` — reference counting (single-threaded)
- `Arc<T>` — atomic reference counting (thread-safe)
- `RefCell<T>` — interior mutability with runtime borrow checking

## Common Crates
- serde/serde_json — serialization
- tokio — async runtime
- reqwest — HTTP client
- axum/actix-web — web frameworks
- sqlx/diesel — database
- clap — CLI parsing
