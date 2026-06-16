# TypeScript Decorators (Experimental)
# Loaded when target_lang includes ts:decorators-experimental

## Stage 3 Decorators (TC39)

TypeScript 5.0+ supports the TC39 Stage 3 decorator proposal:

```typescript
// Class decorator
function logged<T extends new (...args: any[]) => any>(target: T) {
  return class extends target {
    constructor(...args: any[]) {
      console.log(`Creating ${target.name}`);
      super(...args);
    }
  };
}

@logged
class Service {
  doWork() {}
}

// Method decorator
function measure(target: any, context: ClassMethodDecoratorContext) {
  return function (this: any, ...args: any[]) {
    const start = performance.now();
    const result = target.apply(this, args);
    console.log(`${String(context.name)} took ${performance.now() - start}ms`);
    return result;
  };
}

class Calculator {
  @measure
  add(a: number, b: number): number {
    return a + b;
  }
}
```

## Legacy Decorators (TypeScript < 5.0)

```typescript
// Requires experimentalDecorators: true in tsconfig
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class Greeter {
  greeting: string;
  constructor(message: string) {
    this.greeting = message;
  }
}
```

## CodeGen Rules

1. For `ts:5.0+`, use Stage 3 decorator syntax with context parameter
2. For `ts:decorators-experimental`, use legacy decorator syntax
3. Always emit `// SPECLANG-EXPERIMENTAL: decorators` marker
4. Don't mix Stage 3 and legacy decorators in same file
