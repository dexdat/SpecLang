# speclang-header lines:13
id: @speclang/examples/auth
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [examples, auth, security, entities]
short: Authentication example spec
parent: @ref:speclang/examples
part: 2/3
---
# Authentication Example

Example authentication specification demonstrating entity definitions, operations, and security patterns.

## Entities

### @block:auth/user @kind:entity
```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### @block:auth/login-request @kind:entity
```typescript
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}
```

### @block:auth/login-response @kind:entity
```typescript
interface LoginResponse {
  success: boolean;
  token?: string;
  expiresAt?: Date;
  error?: string;
}
```

## Operations

### @block:auth/login @kind:operation
**Description**: Authenticate a user with email and password.

**Input**: `LoginRequest`
**Output**: `LoginResponse`
**Errors**:
- `InvalidCredentials`: Email or password incorrect
- `AccountLocked`: Too many failed attempts
- `ServerError`: Internal server error

**Steps**:
1. Validate input fields
2. Find user by email
3. Verify password hash
4. Generate JWT token
5. Update last login timestamp
6. Return token and expiry

## Security Patterns

### @block:auth/rate-limiting @kind:pattern
Limit login attempts to 5 per hour per IP address.

### @block:auth/jwt-config @kind:pattern
JWT configuration:
- Algorithm: HS256
- Expiry: 24 hours
- Secret: environment variable

## References

- Parent: `@ref:speclang/examples`
- Related: `@ref:specs/examples.spec.dir/api` (API design example)
- Core: `@ref:speclang/core`