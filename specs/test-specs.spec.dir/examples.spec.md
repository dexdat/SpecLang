# speclang-header lines:10
id: "@speclang/test-specs/examples"
version: 0.1.0
layer: 2
tags: [tests, bdd, natural-language, examples]
imports: ["@speclang/core"]
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Test Spec Examples
---
# Test Spec Examples

Part 2 of 2: Concrete test examples. See also @ref:speclang/test-specs/format for format definitions.

## Example Test Spec

### @tests/example

```speclang
# @block:tests/example @kind:test
# speclang-header
id: "@tests/auth".login
version: 1.0
refs: ["@ref:specs/auth#login", "@ref:northstar#auth"]

---

# @block:tests/login-success @kind:test
Test: User can log in with valid credentials

Given: user exists with email "test@example.com"
And: password is "secret123"
And: user is verified
When: login is called with (email, password)
Then: returns Ok with valid JWT token
And: token expires in 1 hour
And: session is created in database
And: audit log records login event

# @block:tests/login-wrong-password @kind:test
Test: Login fails with wrong password

Given: user exists with email "test@example.com"
And: password is "secret123"
When: login is called with (email, "wrongpassword")
Then: returns Err(AuthError.InvalidCredentials)
And: no session is created
And: audit log records failed attempt
And: failure count incremented

# @block:tests/login-unverified @kind:test
Test: Login fails for unverified user

Given: user exists with email "test@example.com"
And: user is NOT verified
When: login is called with (email, password)
Then: returns Err(AuthError.EmailNotVerified)
And: verification email is resent
```

---

## Table Test Example

### @tests/table-test

```speclang
# @block:tests/table-test @kind:test
# @block:tests/password-validation @kind:test
Test: Password validation rules

Where:
  | password  | valid | reason           |
  | "abc123"  | false | too short        |
  | "abcdefg" | false | no numbers       |
  | "1234567" | false | no letters       |
  | "abc123!" | true  | meets all rules  |
  | "a1!"     | false | under 6 chars    |

When: validatePassword called with password
Then: returns valid as specified
```

---

## Generated Code Examples

### @tests/go-output

```speclang
# @block:tests/go-output @kind:code
```go
// SPECLANG-ID: @ref:tests/auth#login-success
// SPECLANG-GENERATED: DO NOT EDIT

package tests

import "testing"

func TestLoginSuccess(t *testing.T) {
    // Given
    user := createUser(t, "test@example.com", "secret123")
    verifyUser(t, user)
    
    // When
    result, err := Login(user.Email, "secret123")
    
    // Then
    if err != nil {
        t.Fatalf("expected success, got error: %v", err)
    }
    if !isValidJWT(result.Token) {
        t.Error("token is not valid")
    }
    // ... additional assertions
}
```
```

### @tests/ts-output

```speclang
# @block:tests/ts-output @kind:code
```typescript
// SPECLANG-ID: @ref:tests/auth#login-success
// SPECLANG-GENERATED: DO NOT EDIT

import { describe, it, expect, beforeEach } from 'vitest';

describe('login', () => {
  it('user can log in with valid credentials', async () => {
    // Given
    const user = await createUser('test@example.com', 'secret123');
    await verifyUser(user);
    
    // When
    const result = await login(user.email, 'secret123');
    
    // Then
    expect(result.ok).toBe(true);
    expect(isValidJWT(result.value.token)).toBe(true);
    // ... additional assertions
  });
});
```
```

---

## Result Annotation Example

### @tests/result-annotation

```speclang
# @block:tests/result-annotation @kind:test
# @block:tests/login-success @kind:test @status:passed @duration:23ms
Test: User can log in with valid credentials

Given: user exists...
When: login...
Then: returns Ok...

# @block:tests/login-timeout @kind:test @status:failed @error:timeout @duration:5000ms
Test: Login handles slow database

Given: database is slow (500ms latency)
When: login is called
Then: returns result within 2 seconds

# Error: Timed out after 5000ms
```

---

## Unit Test Example

### @tests/unit-example

```speclang
# @block:tests/unit-example @kind:test
# speclang-header
id: "@tests/hash".bcrypt
category: unit
refs: ["@ref:specs/hash#bcrypt"]

---

# @block:tests/bcrypt-hash @kind:test
Test: bcrypt hash is verifiable

Given: password "secret"
When: hash(password) called
Then: returns bcrypt hash string
And: hash starts with "$2b$"
And: verify(hash, password) returns true
And: verify(hash, "wrong") returns false
```

---

## Integration Test Example

### @tests/integration-example

```speclang
# @block:tests/integration-example @kind:test
# speclang-header
id: "@tests/auth".full-flow
category: integration
refs: ["@ref:specs/auth"]

---

# @block:tests/full-auth-flow @kind:test
Test: Complete authentication flow

Given: clean database
When:
  1. register("test@example.com", "secret")
  2. verify email with token
  3. login("test@example.com", "secret")
  4. access protected endpoint with token
  5. logout
Then: all steps succeed
And: user state is correct at each step
```

---

## Mock Example

### @tests/mock-example

```speclang
# @block:tests/mock-example @kind:test
# @block:tests/register-sends-email @kind:test
Test: Registration sends verification email

Given: EmailService is mocked
And: mock captures sent emails
When: register("test@example.com", "secret")
Then: user is created
And: mock received one send() call
And: email contains verification link
And: email is addressed to "test@example.com"
```