# speclang-header lines:9
id: "@speclang/speclang"
version: 0.1.0
layer: "0"
project_level: Alpha
agent_support: agent_autonomous
tags: [meta, self-specifying, tutorial]
short: How to use SpecLang - the spec that defines using specs
---

# SpecLang Usage Specification

This spec defines how to use SpecLang - the specification-driven programming language where specs self-assemble into code.

## @speclang/overview

SpecLang is a specification-driven programming language where:
- Specs are the source of truth
- Code is generated from specs
- AI agents read specs and produce code
- The system is reactive: file changes trigger cascading updates
- Context never gets lost: every file knows its dependencies

## @speclang/quick-start

### Step 1: Initialize Project
```bash
speclang init my-project
cd my-project
```

Creates:
- `specs/project.scl` (north star)
- `specs/` (spec directory)
- `src/` (generated code)
- `.speclang/` (configuration)

### Step 2: Write Spec
Create `specs/auth.spec.md`:
```yaml
# speclang-header lines:12
id: "@specs/auth"
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
- `src/auth/entities.ts`
- `src/auth/operations.ts`

### Step 4: Implement Details
Fill in `SPECLANG-IMPLEMENT` markers with actual logic.

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

## @speclang/references

- "@ref:specs/core - Core architecture"
- @ref:specs/bootstrap - Bootstrap process
- @ref:specs/tutorial - Step-by-step tutorial
- @ref:specs/examples/hello-world - Minimal example