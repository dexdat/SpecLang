# Zig Resources
# Loaded for target_lang: zig

## Comptime (Compile-Time Execution)
```zig
// Functions can run at compile time
fn factorial(comptime n: u64) u64 {
    var result: u64 = 1;
    var i: u64 = 1;
    while (i <= n) : (i += 1) {
        result *= i;
    }
    return result;
}
const fact5 = comptime factorial(5);  // computed at compile time

// Types as first-class values
fn Matrix(comptime T: type, comptime rows: usize, comptime cols: usize) type {
    return struct { data: [rows * cols]T };
}
```

## Explicit Allocators
```zig
// All allocations take explicit allocator
var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

const slice = try allocator.alloc(u8, 100);
defer allocator.free(slice);
```

## Error Handling
```zig
// Error union types: !T
fn readFile(path: []const u8) ![]u8 {
    const file = try std.fs.cwd().openFile(path, .{});
    defer file.close();
    return try file.readToEndAlloc(allocator, 1024 * 1024);
}

// try = propagate error, catch = handle error
const data = readFile("config.txt") catch |err| {
    std.debug.print("Error: {}\n", .{err});
    return;
};
```

## No Hidden Control Flow
- No operator overloading
- No exceptions (explicit error returns)
- No implicit allocations
- No destructors/finalizers
- `defer` for cleanup guarantee

## Cross-Compilation
```zig
// Target any platform from any host
const target = std.zig.CrossTarget{
    .cpu_arch = .aarch64,
    .os_tag = .linux,
};
```
