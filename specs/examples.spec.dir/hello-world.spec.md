# speclang-header lines:12
id: "@speclang/examples/hello-world"
version: 1.0.0
layer: 10
tags: [example, hello-world, tutorial]
status: draft
project_level: Beta
agent_support: agent_autonomous
short: Hello World Example
parent: "@ref:speclang/examples-spec"

---

# Hello World Example

Minimal working example of the SpecLang cascade.

## Overview

This spec demonstrates:
1. Writing a spec
2. Generating code from spec
3. Verifying code compiles
4. Creating accurate steering packet

## Implementation

### @block::hello/function @kind:code
```typescript
/**
 * Hello World function
 * Generated from @speclang/examples/hello-world
 */
export function helloWorld(name: string): string {
  return `Hello, ${name}!`;
}

// Example usage
if (require.main === module) {
  console.log(helloWorld("SpecLang"));
}
```

## Expected Output

When compiled and run:
```
Hello, SpecLang!
```

## Verification Steps

1. Generate: src/examples/hello-world.ts
2. Compile: npx tsc --noEmit --skipLibCheck src/examples/hello-world.ts
3. Run: node dist/examples/hello-world.js (after compilation)
4. Verify: Output matches "Hello, SpecLang!"

## Success Criteria

- [ ] Code generates without errors
- [ ] TypeScript compilation passes
- [ ] Function exports correctly
- [ ] Example usage runs
- [ ] Steering packet accurately reflects status
