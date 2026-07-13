---
name: sip-063-examples-hello-world-speclang-v0
title: "SIP 63: Hello World Example"
version: 0.1.0
description: Minimal working example of the SpecLang cascade for quick start
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 63: Hello World Example

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP provides a minimal working example of the SpecLang cascade for quick start.

### Quick Start

1. **Write Spec:** Create hello-world.spec
2. **Generate:** speclang generate
3. **Compile:** npx tsc
4. **Run:** node dist/examples/hello-world.js
5. **Verify:** Output matches "Hello, SpecLang!"

### Example

```speclang
# speclang-header lines:11
id: "@speclang/examples/hello-world"
version: 1.0.0
layer: 10
tags: [example, hello-world, tutorial]
status: draft
project_level: POC
agent_support: agent_autonomous
short: Hello World Example
parent: @ref:speclang/examples

---

# Hello World Example

Minimal working example of the SpecLang cascade.

## Implementation

### @block::hello/function @kind:code
```typescript
export function helloWorld(name: string): string {
  return `Hello, ${name}!`;
}
```
```

### Key Concepts

- **Minimal Spec:** Simplest working example
- **Code Generation:** Spec to TypeScript
- **Verification:** Compile and run
- **Steering Packet:** Status tracking

### When to Read This

- **Learning:** First Speclang example
- **Quick Start:** Getting started quickly
- **Testing:** Validating setup

### Related SIPs

- SIP 41: Examples
- SIP 12: Codegen
- SIP 13: Pipeline

## Abstract

This SIP provides a minimal "Hello World" example demonstrating the complete SpecLang workflow from spec to running code.

## Motivation

Users need:
- Simple starting point
- Complete workflow demonstration
- Quick success experience
- Validation of setup

## Rationale

**Workflow:**

```
Spec → Generate → Compile → Run → Verify
```

**Benefits:**
- Minimal complexity
- Complete cycle
- Easy to understand
- Quick validation

## Specification

### Overview

This spec demonstrates:
1. Writing a spec
2. Generating code from spec
3. Verifying code compiles
4. Creating accurate steering packet

### Implementation

**@block:hello/function:**

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

### Expected Output

When compiled and run:
```
Hello, SpecLang!
```

### Verification Steps

1. Generate: src/examples/hello-world.ts
2. Compile: npx tsc --noEmit --skipLibCheck src/examples/hello-world.ts
3. Run: node dist/examples/hello-world.js (after compilation)
4. Verify: Output matches "Hello, SpecLang!"

### Success Criteria

- [ ] Code generates without errors
- [ ] TypeScript compilation passes
- [ ] Function exports correctly
- [ ] Example usage runs
- [ ] Steering packet accurately reflects status

## Implementation

### Complete Spec File

```speclang
# speclang-header lines:13
id: "@speclang/examples/hello-world"
version: 1.0.0
layer: 10
tags: [example, hello-world, tutorial]
status: draft
project_level: POC
agent_support: agent_autonomous
short: Hello World Example
parent: @ref:speclang/examples

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
```

### Generation Script

```bash
#!/bin/bash
# run-hello-world.sh

set -e

echo "=== Hello World Example ==="
echo ""

echo "1. Generating code..."
speclang generate @speclang/examples/hello-world

echo "2. Compiling TypeScript..."
npx tsc --noEmit --skipLibCheck src/examples/hello-world.ts

echo "3. Running..."
node dist/examples/hello-world.js

echo ""
echo "=== Complete ==="
```

### Test Script

```typescript
// hello-world.test.ts
import { helloWorld } from './generated/hello-world';

describe('Hello World', () => {
  it('returns greeting with name', () => {
    expect(helloWorld('World')).toBe('Hello, World!');
  });

  it('returns greeting with SpecLang', () => {
    expect(helloWorld('SpecLang')).toBe('Hello, SpecLang!');
  });

  it('handles empty name', () => {
    expect(helloWorld('')).toBe('Hello, !');
  });
});
```

### Steering Packet Template

```json
{
  "spec_id": "@speclang/examples/hello-world",
  "version": "1.0.0",
  "status": "complete",
  "artifacts": [
    {
      "path": "src/examples/hello-world.ts",
      "kind": "code",
      "status": "generated"
    }
  ],
  "checks": {
    "compilation": "passed",
    "tests": "passed",
    "lint": "passed"
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Quick Start Commands

```bash
# Create new project with hello-world example
speclang new my-first-project --template=hello-world

# Or add to existing project
mkdir -p specs/examples
cat > specs/examples/hello-world.spec << 'EOF'
# speclang-header lines:13
id: "@my-project/examples/hello-world"
version: 1.0.0
layer: 10
tags: [example]
status: draft
project_level: POC
agent_support: agent_autonomous
short: Hello World
---

### @block::hello @kind:code
export function hello(name: string): string {
  return `Hello, ${name}!`;
}
EOF

# Generate and run
speclang generate
npx ts-node generated/hello.ts
```

## Configuration

**Minimal Config:**

```yaml
# .speclangrc
name: hello-world-example
version: 1.0.0
specs_dir: specs
output_dir: generated
targets:
  - typescript
```

## Extensions

### Extended Example with Multiple Blocks

```speclang
# speclang-header lines:13
id: "@speclang/examples/hello-extended"
version: 1.0.0
layer: 10
tags: [example, extended]
---

### @block::greeting/formatter @kind:code
export function formatGreeting(name: string, time: Date): string {
  const hour = time.getHours();
  const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  return `Good ${period}, ${name}!`;
}

### @block::greeting/validator @kind:code
export function validateName(name: string): boolean {
  return name.length > 0 && name.length < 100;
}

### @block::greeting/main @kind:code
export function greet(name: string): string {
  if (!validateName(name)) {
    throw new Error('Invalid name');
  }
  return formatGreeting(name, new Date());
}
```

## References

- "@ref:specs/examples.spec.spec.dir/hello-world
- SIP 41: Examples
- SIP 12: Codegen
- SIP 13: Pipeline

## Copyright

This document is in the public domain.
