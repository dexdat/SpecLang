# speclang-header lines:8
id: "@speclang/tutorial"
version: 0.1.0
layer: "0"
project_level: Alpha
agent_support: agent_autonomous
tags: [tutorial, getting-started]
short: Step-by-step SpecLang tutorial
---

# SpecLang Tutorial

Step-by-step guide to building a feature with SpecLang.

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
      - "@ref:speclang/auth
```

### Step 2: Create Feature Spec
Create `specs/auth.spec.md` with:
- Entities (User, Session, Token)
- Operations (login, logout, register)
- Validation rules

Example:
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
  id: UUID;
  email: string;
  createdAt: DateTime;
}
```

## @block:auth/operations
```typescript
export async function login(email: string, password: string): Promise<User>;
export async function register(email: string, password: string): Promise<User>;
export async function logout(): Promise<void>;
```
```

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
Fill in `SPECLANG-IMPLEMENT` markers.

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

## @tutorial/troubleshooting

### Issue: Code not generating
- Check spec header format
- Verify `agent_support` level
- Ensure no syntax errors in spec

### Issue: Tests failing
- Review generated code for missing implementations
- Check spec for ambiguous requirements
- Run `speclang validate` to identify spec issues

## @tutorial/next-steps

- Explore `specs/examples/` for more patterns
- Read `specs/core.spec.md` for architecture details
- Contribute to SpecLang by editing specs

## @tutorial/references

- "@ref:specs/speclang - Usage specification
- @ref:specs/bootstrap - Bootstrap process
- @ref:specs/examples/auth - Complete auth example