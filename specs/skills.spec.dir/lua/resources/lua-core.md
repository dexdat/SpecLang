# Lua Resources
# Loaded for target_lang: lua

## Tables (The One Data Structure)
```lua
-- Arrays
local arr = {1, 2, 3}
arr[4] = 4
-- Maps
local map = {name = "Alice", age = 30}
map["email"] = "alice@test.com"
-- Mixed
local mixed = {10, 20, name = "mixed", [30] = "key is number"}
-- Length: #arr (only for arrays without holes)
```

## Metatables & Metamethods
```lua
local mt = {
    __add = function(a, b) return a.value + b.value end,
    __tostring = function(t) return "Value: " .. t.value end,
    __index = function(t, k) return "default" end
}
local obj = setmetatable({value = 10}, mt)
```

## Coroutines
```lua
local co = coroutine.create(function()
    for i = 1, 3 do
        coroutine.yield(i)
    end
end)
print(coroutine.resume(co))  -- true, 1
print(coroutine.resume(co))  -- true, 2
print(coroutine.status(co))  -- "suspended"
```

## Multiple Return Values
```lua
function divrem(a, b)
    return math.floor(a / b), a % b
end
local q, r = divrem(10, 3)  -- q=3, r=1
```

## C API / FFI
```lua
local ffi = require("ffi")
ffi.cdef[[ int printf(const char *fmt, ...); ]]
ffi.C.printf("Hello %s!\n", "LuaJIT")
```

## Common Libraries
- LuaRocks — package manager
- Luvit — async I/O (libuv binding)
- LuaSocket — networking
- Penlight — stdlib extensions
- busted — testing
