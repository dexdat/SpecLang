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

Run each step from the repository root, in order, after `npm ci`. Every command below is executed
verbatim by `tests/examples/hello-world-verification.test.ts`.

1. Generate: npx speclang generate specs/examples.spec.dir/hello-world.spec.md --dry-run
2. Compile: npm run build
3. Run: node dist/src/examples/hello-world.js
4. Verify: Output matches "Hello, SpecLang!"

Step 1 re-extracts this spec's single TypeScript block and writes nothing (`--dry-run`); the checked-in
artifact of that block is `src/examples/hello-world.ts`, and the test asserts the two still hold the same
code. Steps 2-4 compile and run that artifact. Two layout facts decide the commands: `tsconfig.json` sets
`rootDir: "."`, so build output mirrors the repository tree and the example lands at
`dist/src/examples/hello-world.js` (there is no `dist/examples/`); and TypeScript 7 refuses a bare file
argument while a `tsconfig.json` is present (`TS5112`), so the compile goes through the project config,
whose `include` already covers `src/**/*.ts`.

## Success Criteria

- [ ] Code generates without errors
- [ ] TypeScript compilation passes
- [ ] Function exports correctly
- [ ] Example usage runs
- [ ] Steering packet accurately reflects status
