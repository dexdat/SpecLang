# Bootstrap Phase 7.2: Hello World Example

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 7.2 of the bootstrap process.

**Prerequisites**: 
- Phase 0-7.1 complete
- Core system operational
- Code generation working
- Examples directory exists

## Your Task
Create a minimal hello world example that demonstrates the complete SpecLang workflow: write spec, generate code, compile, run, and verify. This serves as the quick start tutorial.

## Read These Specs First
1. `specs/examples.spec.dir/hello-world.spec.md` - Hello world spec
2. `specs/speclang.spec.md` - How to use SpecLang
3. `specs/tutorial.spec.md` - Tutorial spec

## What to Build

### Files to Create
```
specs/examples/
├── hello-world.spec.md           # The hello world spec (exists)

src/examples/
├── hello-world.ts                # Generated implementation
└── hello-world.test.ts           # Generated tests

dist/examples/
└── hello-world.js                # Compiled output

examples/
└── hello-world/
    ├── README.md                 # Example README
    ├── package.json              # Example package
    └── run.sh                    # Run script
```

### Requirements

#### 1. The Hello World Spec

The spec already exists at `specs/examples.spec.dir/hello-world.spec.md`:

```yaml
# speclang-header lines:13
id: @speclang/examples/hello-world
version: 1.0.0
layer: 10
tags: [example, hello-world, tutorial]
status: draft
project_level: POC
agent_support: agent_autonomous
short: Hello World Example
parent: @ref:speclang/examples
part: 1/3
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

### @block:hello/function @kind:code
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
```

#### 2. Generated Implementation

```typescript
// src/examples/hello-world.ts
// @generated-from @speclang/examples/hello-world
// @block-ref hello/function

/**
 * Hello World function
 * Generated from @speclang/examples/hello-world
 */
export function helloWorld(name: string): string {
  return `Hello, ${name}!`;
}

// Example usage
if (typeof require !== 'undefined' && require.main === module) {
  console.log(helloWorld("SpecLang"));
}
```

#### 3. Generated Tests

```typescript
// src/examples/hello-world.test.ts
// @generated-from @speclang/examples/hello-world
// @generated-test

import { describe, it, expect } from 'bun:test';
import { helloWorld } from './hello-world';

describe('helloWorld', () => {
  it('returns greeting with provided name', () => {
    expect(helloWorld('World')).toBe('Hello, World!');
  });

  it('returns greeting with SpecLang', () => {
    expect(helloWorld('SpecLang')).toBe('Hello, SpecLang!');
  });

  it('handles empty string', () => {
    expect(helloWorld('')).toBe('Hello, !');
  });

  it('handles special characters', () => {
    expect(helloWorld('🚀')).toBe('Hello, 🚀!');
  });

  it('handles unicode names', () => {
    expect(helloWorld('世界')).toBe('Hello, 世界!');
  });
});
```

#### 4. Example README

```markdown
# Hello World Example

This is the minimal SpecLang example demonstrating the complete workflow.

## Quick Start

```bash
# Generate code from spec
speclang generate specs/examples/hello-world.spec.md

# Compile TypeScript
bun run tsc

# Run the example
node dist/examples/hello-world.js
```

## Expected Output

```
Hello, SpecLang!
```

## What Happened

1. **Spec**: `specs/examples/hello-world.spec.md` defines the `helloWorld` function
2. **Generate**: `speclang generate` reads the spec and creates `src/examples/hello-world.ts`
3. **Compile**: TypeScript compiles to `dist/examples/hello-world.js`
4. **Run**: Node.js executes and prints the greeting

## Key Concepts

### Spec Header

```yaml
# speclang-header lines:13
id: @speclang/examples/hello-world
version: 1.0.0
layer: 10
agent_support: agent_autonomous
short: Hello World Example
---
```

The header contains:
- `id`: Unique identifier for the spec
- `version`: Semantic version
- `layer`: Abstraction level (10 = concrete code)
- `agent_support`: How autonomous the agent can be
- `short`: Brief description

### Block Definition

```yaml
### @block:hello/function @kind:code
```

Blocks are the unit of code generation:
- `@block:` defines a block ID
- `@kind:` specifies the block type (code, entity, operation, etc.)

### Generated Header

Every generated file includes:
```typescript
// @generated-from @speclang/examples/hello-world
// @block-ref hello/function
```

This traces the code back to its source spec.

## Extending the Example

Add a new block to the spec:

```yaml
### @block:hello/greeting @kind:entity
```typescript
export interface Greeting {
  message: string;
  timestamp: Date;
}
```
```

Then regenerate:

```bash
speclang generate specs/examples/hello-world.spec.md
```

## Testing

```bash
# Run tests
bun test src/examples/hello-world.test.ts
```

## Next Steps

1. See `specs/examples/auth.spec.md` for a more complex example
2. Read `specs/tutorial.spec.md` for the full tutorial
3. Explore `specs/speclang.spec.md` to understand all features
```

#### 5. Run Script

```bash
#!/bin/bash
# examples/hello-world/run.sh
# Run the hello world example

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "  SPEC LANG  HELLO WORLD EXAMPLE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Step 1: Generate from spec
echo "Step 1: Generating code from spec..."
speclang generate specs/examples.spec.dir/hello-world.spec.md -o src/examples/
echo "  ✓ Generated src/examples/hello-world.ts"

# Step 2: Type check
echo ""
echo "Step 2: Type checking..."
bun run tsc --noEmit --skipLibCheck src/examples/hello-world.ts
echo "  ✓ TypeScript compiles"

# Step 3: Run
echo ""
echo "Step 3: Running..."
echo ""
echo "  Output:"
bun run src/examples/hello-world.ts
echo ""

# Step 4: Run tests
echo ""
echo "Step 4: Running tests..."
bun test src/examples/hello-world.test.ts --silent
echo "  ✓ All tests pass"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✓ HELLO WORLD EXAMPLE COMPLETE"
echo "═══════════════════════════════════════════════════════════════"
```

#### 6. Verification Script

```typescript
// scripts/verify-hello-world.ts

import { $ } from 'bun';
import { expect, describe, it } from 'bun:test';

describe('Hello World Verification', () => {
  it('spec file exists', async () => {
    const file = Bun.file('specs/examples.spec.dir/hello-world.spec.md');
    expect(await file.exists()).toBe(true);
  });

  it('spec has valid header', async () => {
    const content = await Bun.file('specs/examples.spec.dir/hello-world.spec.md').text();
    expect(content).toContain('speclang-header');
    expect(content).toContain('id: @speclang/examples/hello-world');
  });

  it('spec has helloWorld block', async () => {
    const content = await Bun.file('specs/examples.spec.dir/hello-world.spec.md').text();
    expect(content).toContain('@block:hello/function');
    expect(content).toContain('helloWorld');
  });

  it('generates code', async () => {
    // Run generator
    await $`speclang generate specs/examples.spec.dir/hello-world.spec.md -o src/examples/`.quiet();
    
    const file = Bun.file('src/examples/hello-world.ts');
    expect(await file.exists()).toBe(true);
  });

  it('generated code has correct header', async () => {
    const content = await Bun.file('src/examples/hello-world.ts').text();
    expect(content).toContain('@generated-from @speclang/examples/hello-world');
  });

  it('generated code exports helloWorld', async () => {
    const content = await Bun.file('src/examples/hello-world.ts').text();
    expect(content).toContain('export function helloWorld');
  });

  it('type checks', async () => {
    const result = await $`bun run tsc --noEmit --skipLibCheck src/examples/hello-world.ts`.quiet();
    expect(result.exitCode).toBe(0);
  });

  it('produces correct output', async () => {
    const { helloWorld } = await import('../src/examples/hello-world');
    expect(helloWorld('SpecLang')).toBe('Hello, SpecLang!');
    expect(helloWorld('World')).toBe('Hello, World!');
  });
});

// Run verification
const verify = async () => {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  HELLO WORLD VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const checks = [
    { name: 'Spec file exists', check: async () => {
      const file = Bun.file('specs/examples.spec.dir/hello-world.spec.md');
      return await file.exists();
    }},
    { name: 'Spec has valid header', check: async () => {
      const content = await Bun.file('specs/examples.spec.dir/hello-world.spec.md').text();
      return content.includes('speclang-header') && content.includes('id: @speclang/examples/hello-world');
    }},
    { name: 'Spec has helloWorld block', check: async () => {
      const content = await Bun.file('specs/examples.spec.dir/hello-world.spec.md').text();
      return content.includes('@block:hello/function') && content.includes('helloWorld');
    }},
    { name: 'Generated code exists', check: async () => {
      const file = Bun.file('src/examples/hello-world.ts');
      return await file.exists();
    }},
    { name: 'Generated code has header', check: async () => {
      const content = await Bun.file('src/examples/hello-world.ts').text();
      return content.includes('@generated-from');
    }},
    { name: 'helloWorld function works', check: async () => {
      const { helloWorld } = await import('../src/examples/hello-world');
      return helloWorld('Test') === 'Hello, Test!';
    }},
  ];

  let passed = 0;
  for (const { name, check } of checks) {
    try {
      const result = await check();
      if (result) {
        console.log(`  ✓ ${name}`);
        passed++;
      } else {
        console.log(`  ✗ ${name}`);
      }
    } catch (e) {
      console.log(`  ✗ ${name}: ${e}`);
    }
  }

  console.log('');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  ${passed}/${checks.length} checks passed`);
  console.log('');

  if (passed === checks.length) {
    console.log('  ✓ HELLO WORLD VERIFICATION PASSED');
    console.log('═══════════════════════════════════════════════════════════════');
    process.exit(0);
  } else {
    console.log('  ✗ HELLO WORLD VERIFICATION FAILED');
    console.log('═══════════════════════════════════════════════════════════════');
    process.exit(1);
  }
};

verify();
```

#### 7. Quick Start Guide

```markdown
# Quick Start: Hello World in 60 Seconds

## Prerequisites
- Node.js 18+ or Bun
- TypeScript

## Steps

### 1. Create the Spec (10 seconds)

Create `specs/hello.spec.md`:

```yaml
# speclang-header lines:8
id: @myapp/hello
version: 1.0.0
layer: 10
short: Hello World
---
## @block:main @kind:code
```typescript
export function hello(name: string): string {
  return `Hello, ${name}!`;
}
```
```

### 2. Generate Code (5 seconds)

```bash
speclang generate specs/hello.spec.md -o src/
```

Creates `src/hello.ts`:

```typescript
// @generated-from @myapp/hello
export function hello(name: string): string {
  return `Hello, ${name}!`;
}
```

### 3. Use It (5 seconds)

```typescript
import { hello } from './hello';
console.log(hello('World')); // Hello, World!
```

### 4. Test It (10 seconds)

```bash
bun test src/hello.test.ts
```

## That's It!

You've just:
- Written a spec
- Generated code from it
- Used the generated code
- Tested it

## Next

- Add more blocks to your spec
- Reference other specs with `@ref:`
- Watch the cascade with `speclang watch`
```

## Test Cases

1. Spec file exists and has valid header
2. Code generates from spec
3. Generated code has correct header
4. Generated code type checks
5. helloWorld function works correctly
6. Tests pass
7. Run script completes successfully

## Validation

```bash
# Run verification
bun run scripts/verify-hello-world.ts

# Or run the example
./examples/hello-world/run.sh

# Run tests
bun test src/examples/hello-world.test.ts
```

## Output Format

After completing, output:
1. Files created
2. Verification results
3. Test results
4. Example output: "Hello, SpecLang!"
