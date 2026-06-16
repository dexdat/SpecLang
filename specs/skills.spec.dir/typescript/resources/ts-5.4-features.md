# TypeScript 5.4+ Features
# Loaded when target_lang includes ts:5.4

## NoInfer Utility Type

```typescript
// Prevents inference for specific type parameters
function create<T, U extends string>(value: T, tag: NoInfer<U>): [T, U] {
  return [value, tag];
}

create(42, "hello"); // U inferred as "hello", NoInfer prevents widening to string
```

## Preserved Narrowing in Closures

TypeScript 5.4 preserves type narrowing inside closures passed as last arguments:

```typescript
function getUrls(url: string | URL, names: string[]) {
  if (typeof url === "string") {
    url = new URL(url);
  }
  // Previously TS would forget url is URL here; 5.4 remembers it
  return names.map(name => new URL(name, url));
}
```

## Object.groupBy / Map.groupBy

```typescript
const inventory = [
  { name: "asparagus", type: "vegetables" },
  { name: "bananas", type: "fruit" },
];

const grouped = Object.groupBy(inventory, ({ type }) => type);
// { vegetables: [...], fruit: [...] }
```

## CodeGen Rules

1. Use `NoInfer<T>` for generic constraints when available
2. Use `Object.groupBy` over manual reduce() for grouping
3. Target `lib: ["ES2024"]` in tsconfig when using 5.4+ features
