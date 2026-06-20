# speclang-header lines:14
id: "@specs/examples/hello-world"
version: 1.0.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [example, hello-world]
short: Hello World example for SpecLang
depends_on:
  - "@ref:specs/core"
---

# Hello World Example

This is a minimal example demonstrating the SpecLang cascade.

### @block:hello-world-function @kind:function
A simple function that returns a greeting message.

```typescript
function hello(name: string): string {
  return `Hello, ${name}!`;
}
```

### @block:main-function @kind:function
The main entry point that demonstrates usage.

```typescript
function main(): void {
  const message = hello("World");
  console.log(message);
}
```

### @block:test-cases @kind:test
Test cases for the hello-world example.

```typescript
describe("hello", () => {
  it("should greet with name", () => {
    expect(hello("Alice")).toBe("Hello, Alice!");
  });
  
  it("should greet World by default", () => {
    expect(hello("World")).toBe("Hello, World!");
  });
});
```
