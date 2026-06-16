# Java Resources
# Loaded for target_lang: java

## Streams & Lambdas
```java
List<String> result = items.stream()
    .filter(i -> i.isActive())
    .map(Item::getName)
    .sorted()
    .collect(Collectors.toList());

// Parallel streams
items.parallelStream().map(expensiveOp).toList();
```

## Optional (Avoid Null)
```java
Optional<User> user = findUser(id);
String name = user.map(User::getName).orElse("Unknown");
user.ifPresent(u -> sendEmail(u.getEmail()));
user.orElseThrow(() -> new NotFoundException("User not found"));
```

## Records (Java 16+)
```java
public record User(String name, int age, String email) {
    // Auto-generates: constructor, getters, equals, hashCode, toString
    public User {
        if (age < 0) throw new IllegalArgumentException("Invalid age");
    }
}
```

## Sealed Classes (Java 17+)
```java
sealed interface Result<T> permits Success, Failure {}
record Success<T>(T value) implements Result<T> {}
record Failure(String error) implements Result<T> {}
```

## Virtual Threads (Java 21+)
```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> fetchFromAPI());
    executor.submit(() -> queryDatabase());
}
```

## Key Libraries
- Spring Boot — web framework
- Jackson/Gson — JSON
- JUnit 5 — testing
- Mockito — mocking
- Hibernate/JPA — ORM
- Lombok — boilerplate reduction
