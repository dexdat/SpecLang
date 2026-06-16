# C++ Resources
# Loaded for target_lang: cpp / c++

## RAII (Resource Acquisition Is Initialization)
```cpp
class FileHandle {
    FILE* f;
public:
    FileHandle(const char* path) : f(fopen(path, "r")) {}
    ~FileHandle() { if (f) fclose(f); }
    // Delete copies, allow moves
    FileHandle(const FileHandle&) = delete;
    FileHandle(FileHandle&& other) noexcept : f(other.f) { other.f = nullptr; }
};
```

## Smart Pointers
```cpp
std::unique_ptr<Widget> w = std::make_unique<Widget>();  // exclusive ownership
std::shared_ptr<Widget> s = std::make_shared<Widget>();   // shared ownership
std::weak_ptr<Widget> weak = s;                            // non-owning observer
```

## Move Semantics
```cpp
class Buffer {
    std::vector<int> data;
public:
    Buffer(Buffer&& other) noexcept : data(std::move(other.data)) {}
    Buffer& operator=(Buffer&& other) noexcept {
        data = std::move(other.data);
        return *this;
    }
};
```

## Templates & Concepts (C++20)
```cpp
template<typename T>
concept Numeric = std::is_arithmetic_v<T>;

template<Numeric T>
T add(T a, T b) { return a + b; }
```

## Common Patterns (C++17/20)
- `std::optional<T>` — maybe value
- `std::variant<A,B,C>` — type-safe union
- `std::string_view` — non-owning string ref
- `auto [a, b] = pair` — structured binding
- `if constexpr` — compile-time if
- `std::span<T>` — non-owning array view

## Common Libraries
- fmt — formatting
- nlohmann/json — JSON
- boost — everything
- abseil — Google libraries
- catch2/doctest — testing
