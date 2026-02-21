# speclang-header lines:9
id: "@speclang/test-specs"
version: 0.1.0
layer: 0
tags: [tests, bdd, natural-language]
imports: ["@speclang/core"]
status: draft

---

# Test Specs

Tests written as specs in natural language. First-class citizens.

## Philosophy

```speclang
# @block:tests/philosophy @kind:note
Tests are specs. Specs are tests.

- Test specs describe expected behavior
- TestWriter agent converts to executable tests
- Results flow back to test specs
- Tests and code stay in sync automatically
```

---

## Test Spec Format

### @tests/format

```speclang
# @block:tests/format @kind:entity
TestSpec:
  file: tests/{feature}.test.spec.scl
  header: standard speclang header
  
  blocks:
    - Test: name/description
    - Given: preconditions
    - When: action
    - Then: expected outcome
    - And: additional conditions/assertions
    - Refs: what code this tests
```

### @tests/example

```speclang
# @block:tests/example @kind:test
# speclang-header
id: @tests/auth.login
version: 1.0
refs: [@ref:specs/auth#login, @ref:northstar#auth]

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

## Block Types

### @tests/block-types

```speclang
# @block:tests/block-types @kind:entity
TestBlockKinds:
  @kind:test: main test definition
  
  Within a test block:
  Test:    what we're testing (required, first)
  Given:   setup/preconditions
  When:    action being tested
  Then:    expected result
  And:     additional conditions (follows Given/When/Then)
  But:     negative conditions
  Where:   parameterized test data (table)
```

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

## Test Targets

### @tests/targets

```speclang
# @block:tests/targets @kind:entity
TestTargets:
  generated alongside code, matching language
  
  Go:
    tests/auth_test.go
    uses: testing package
    
  TypeScript:
    tests/auth.test.ts
    uses: jest or vitest
    
  Python:
    tests/test_auth.py
    uses: pytest
    
  Rust:
    tests/auth.rs
    uses: built-in #[test]
```

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

## Test Results

### @tests/results

```speclang
# @block:tests/results @kind:entity
TestResults:
  written_to: reports/tests/
  format: JSON + HTML
  
  status:
    - pending: not yet run
    - passed: all assertions passed
    - failed: one or more failures
    - skipped: intentionally skipped
    
  location:
    - reports/tests/{test-id}.json
    - reports/tests/index.html
    - reports/tests/summary.json
    
  no_cascade:
    - reports/ is in .gitignore + watcher ignore
    - test results never trigger new cascades
    - prevents infinite loop: test → result → test → result
    
  view_results:
    - speclang test --report  # Show last results
    - speclang test --watch   # Watch mode (separate)
```

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

## Test Categories

### @tests/categories

```speclang
# @block:tests/categories @kind:entity
TestCategories:
  unit: single function/component
  integration: multiple components
  e2e: full system flow
  performance: speed/throughput
  security: auth/injection/etc
  
  declared via header:
  # speclang-header
  id: @tests/auth.login
  category: unit
```

### @tests/unit-example

```speclang
# @block:tests/unit-example @kind:test
# speclang-header
id: @tests/hash.bcrypt
category: unit
refs: [@ref:specs/hash#bcrypt]

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

### @tests/integration-example

```speclang
# @block:tests/integration-example @kind:test
# speclang-header
id: @tests/auth.full-flow
category: integration
refs: [@ref:specs/auth]

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

## Mocking

### @tests/mocking

```speclang
# @block:tests/mocking @kind:entity
Mocking:
  external dependencies declared in test
  
  Mock blocks:
  # @block:tests/mock-email @kind:mock
  Mock: EmailService
  Returns:
    - send(): always succeeds
    - lastSent: captures last email
  
  Usage:
  Given: EmailService is mocked with @ref:tests/mock-email
```

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

---

## Test Agent Behavior

### @tests/agent

```speclang
# @block:tests/agent @kind:entity
TestAgent:
  on test spec change:
    1. parse test blocks
    2. generate test code
    3. run tests
    4. annotate spec with results
    
  on code change:
    1. find affected tests (via refs)
    2. re-run those tests
    3. update results
    
  failure handling:
    - if test fails, mark in spec
    - don't block other tests
    - collect all failures
    - report summary to user
```

---

## Test Discovery

### @tests/discovery

```speclang
# @block:tests/discovery @kind:operation
discover_tests(code_file: Path) -> TestSpec[]:
  1. parse code file for SPECLANG-ID markers
  2. extract @ref:tests/... references
  3. load those test specs
  4. return list
  
Used when:
  - code changes, need to re-run tests
  - showing test coverage
  - finding orphaned code
```

---

## Coverage

### @tests/coverage

```speclang
# @block:tests/coverage @kind:entity
Coverage:
  tracked at spec level
  
  metrics:
    - blocks_with_tests: blocks that have test refs
    - blocks_without_tests: need tests
    - coverage_percent: with/total
    
  report:
    speclang coverage
    
    specs/auth.scl:
      entity User: covered (3 tests)
      operation login: covered (4 tests)
      operation register: NOT COVERED
      policy AuthPolicy: covered (2 tests)
    
    Coverage: 75% (3/4 blocks)
```
