# C Resources
# Loaded for target_lang: c

## Manual Memory Management
```c
// malloc/free — no GC, no RAII
int* arr = malloc(100 * sizeof(int));
if (arr == NULL) { /* handle error */ }
// ... use arr ...
free(arr);
arr = NULL;  // prevent use-after-free

// Common pitfalls: double-free, use-after-free, memory leaks, buffer overflow
```

## Pointers
```c
int x = 42;
int* p = &x;       // pointer to x
*p = 10;            // dereference to modify
int** pp = &p;      // pointer to pointer

// Function pointers
int (*cmp)(const void*, const void*) = compare;
qsort(arr, n, sizeof(int), cmp);
```

## Structs & Unions
```c
typedef struct {
    char name[64];
    int age;
    float salary;
} Employee;

// Union: same memory, different interpretations
typedef union {
    int i;
    float f;
    char bytes[4];
} Data;
```

## Preprocessor Macros
```c
#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define ARRAY_SIZE(arr) (sizeof(arr) / sizeof((arr)[0]))
#ifdef DEBUG
    #define LOG(msg) fprintf(stderr, "[DEBUG] %s\n", msg)
#else
    #define LOG(msg)
#endif
```

## Common Patterns
- Opaque pointers for encapsulation
- Callback functions for iteration
- `errno` + return codes for error handling
- `setjmp`/`longjmp` for non-local exits (rare, careful)
