# Bootstrap Phase 5.1: Self-Specifying Specs

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 5.1 of the bootstrap process.

**Prerequisites**: 
- Phase 0-4 complete
- All infrastructure in place

## Your Task
Create the self-specifying specs that define how SpecLang works. These specs should be detailed enough that the system can regenerate itself from them.

## Read These Specs First
1. `specs/bootstrap.spec.md` - Bootstrap process
2. `docs/NORTH_STAR.md` - Vision
3. All existing specs in `specs/`

## What to Build

### The Meta-Circular Test

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  THE ULTIMATE TEST:                                             │
│                                                                 │
│  1. Clean all generated code (rm -rf src/)                      │
│  2. Run: speclang build                                         │
│  3. All of src/ should be regenerated                           │
│  4. Tests should pass                                           │
│  5. System should work identically                              │
│                                                                 │
│  If this works, SpecLang has successfully built itself.         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Files to Create/Enhance

```
specs/
├── speclang.spec.md              # How to use SpecLang (NEW)
├── tutorial.spec.md              # Step-by-step tutorial (NEW)
├── examples/
│   ├── hello-world.spec.md       # Minimal example (NEW)
│   └── auth-system.spec.md       # Full example (NEW)
└── (enhance existing specs with agent_autonomous)
```

### Requirements

#### 1. Self-Specifying Spec

```yaml
# specs/speclang.spec.md

# speclang-header lines:16
id: @speclang/speclang
version: 0.1.0
layer: 0
project_level: Alpha
agent_support: agent_autonomous
tags: [meta, self-specifying, tutorial]
short: How to use SpecLang - the spec that defines using specs
---

## @speclang/overview

SpecLang is a specification-driven programming language where:
- Specs are the source of truth
- Code is generated from specs
- AI agents read specs and produce code

## @speclang/quick-start

### Step 1: Initialize Project
```bash
speclang init my-project
cd my-project
```

Creates:
- specs/project.scl (north star)
- specs/ (spec directory)
- src/ (generated code)

### Step 2: Write Spec
Create `specs/auth.spec.md`:
```yaml
# speclang-header lines:12
id: @specs/auth
version: 1.0.0
layer: 3
agent_support: agent_autonomous
short: Authentication system
---

## @block:auth/entities
```typescript
export interface User {
  id: string;
  email: string;
  passwordHash: string;
}
```

## @block:auth/operations
```typescript
export async function login(email: string, password: string): Promise<User>;
export async function register(email: string, password: string): Promise<User>;
export async function logout(): Promise<void>;
```
```

### Step 3: Generate Code
```bash
speclang generate
```

Creates:
- src/auth/entities.ts
- src/auth/operations.ts

### Step 4: Implement Details
Fill in SPECLANG-IMPLEMENT markers with actual logic.

### Step 5: Test
```bash
speclang test
```

## @speclang/agent-support-levels

| Level | Description | Use Case |
|-------|-------------|----------|
| human_only | Human must write all code | Experimental features |
| agent_assisted | Human reviews, AI suggests | Standard development |
| agent_autonomous | AI writes, tests, commits | Well-defined features |

## @speclang/project-maturity

| Level | Specs | Testing | Deployment |
|-------|-------|---------|------------|
| POC | Minimal | Manual | Local |
| MVP | Basic | Unit tests | Staging |
| Alpha | Complete | Integration | Beta users |
| Beta | Refined | E2E tests | Production |
| Production | Full | All tests | Multi-region |

## @speclang/best-practices

1. Start with high-level specs (layer 0-2)
2. Let AI expand into detailed specs (layer 3-7)
3. Generate code specs (layer 8-9)
4. Generate code (layer 10)
5. Test and validate
6. Commit per file
```

#### 2. Tutorial Spec

```yaml
# specs/tutorial.spec.md

# speclang-header lines:12
id: @speclang/tutorial
version: 0.1.0
layer: 0
agent_support: agent_autonomous
tags: [tutorial, getting-started]
short: Step-by-step SpecLang tutorial
---

## @tutorial/building-a-feature

### Goal
Build a user authentication system from scratch using SpecLang.

### Step 1: Create North Star Entry
Edit `specs/project.scl`:
```yaml
Components:
  auth:
    description: User authentication
    refs:
      - @ref:speclang/auth
```

### Step 2: Create Feature Spec
Create `specs/auth.spec.md` with:
- Entities (User, Session, Token)
- Operations (login, logout, register)
- Validation rules

### Step 3: Watch Cascade
```bash
speclang watch
```

Observe:
- spec-writer expands auth.spec.md
- code-gen creates src/auth/
- test-writer creates tests/auth/

### Step 4: Review Generated Code
Check:
- Headers reference source specs
- Types match spec definitions
- Functions have correct signatures

### Step 5: Implement Logic
Fill in SPECLANG-IMPLEMENT markers.

### Step 6: Validate
```bash
speclang validate
speclang test
```

## @tutorial/common-patterns

### Pattern: Entity Spec
```yaml
## @block:users/entities
```typescript
export interface User {
  id: UUID;
  email: string;
  createdAt: DateTime;
}
```
```

### Pattern: Operation Spec
```yaml
## @block:users/operations
```typescript
export async function getUser(id: UUID): Promise<User | null>;
export async function createUser(data: CreateUserInput): Promise<User>;
export async function updateUser(id: UUID, data: UpdateUserInput): Promise<User>;
```
```

### Pattern: Test Spec
```yaml
## @block:users/tests
Given: A user with email "test@example.com"
When: getUser is called with that user's ID
Then: The user is returned with correct email
```
```

#### 3. Example Specs

Create `specs/examples/hello-world.spec.md`:
```yaml
# speclang-header lines:10
id: @specs/examples/hello-world
version: 1.0.0
layer: 5
agent_support: agent_autonomous
short: Minimal hello world example
---

## @block:hello/main
```typescript
export function hello(name: string): string {
  return `Hello, ${name}!`;
}
```

## @block:hello/tests
```typescript
describe('hello', () => {
  it('returns greeting', () => {
    expect(hello('World')).toBe('Hello, World!');
  });
});
```
```

### Enhancement: Upgrade Existing Specs

For each spec in specs/:
1. Check if `agent_support` is set
2. If `agent_assisted`, consider upgrading to `agent_autonomous`
3. Add missing step-by-step details
4. Ensure all blocks have clear outputs

## Validation

After creating self-specifying specs:

```bash
# Test self-hosting
rm -rf src/
speclang build
bun run tsc --noEmit
bun test

# Should all pass if specs are complete
```

## Output Format
After completing, output:
1. New specs created
2. Existing specs enhanced
3. Self-hosting test results
4. Coverage of all NORTH_STAR principles
