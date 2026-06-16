# Kotlin Resources
# Loaded for target_lang: kt / kotlin

## Coroutines (Structured Concurrency)
```kotlin
suspend fun fetchUser(id: Int): User = withContext(Dispatchers.IO) {
    // Network call
}
// Launch and async
val job = CoroutineScope(Dispatchers.Main).launch {
    val user = async { fetchUser(1) }
    val orders = async { fetchOrders(1) }
    updateUI(user.await(), orders.await())
}
```

## Extension Functions
```kotlin
fun String.isEmail(): Boolean = matches(Regex("[\\w.-]+@[\\w.-]+"))
"test@example.com".isEmail()  // true

fun <T> List<T>.secondOrNull(): T? = if (size >= 2) get(1) else null
```

## Sealed Classes / Interfaces
```kotlin
sealed class Result<out T> {
    data class Success<T>(val value: T) : Result<T>()
    data class Error(val message: String) : Result<Nothing>()
}

when (result) {
    is Result.Success -> println(result.value)
    is Result.Error -> println(result.message)
}  // Exhaustive — no else needed
```

## Null Safety
```kotlin
var name: String? = null
val length = name?.length          // null if name is null
val len = name?.length ?: 0        // Elvis operator
name!!.length                      // Force unwrap (throws NPE if null)
```

## Scope Functions
```kotlin
user.let { it.name }               // transform
user.apply { name = "New" }        // configure and return this
user.also { log(it) }              // side effect
user.run { this.name }             // execute with this
with(user) { name }                // non-extension scope
```

## Key Libraries
- Ktor — HTTP client/server
- kotlinx.coroutines — structured concurrency
- kotlinx.serialization — JSON
- Exposed — SQL DSL
- Compose Multiplatform — UI
