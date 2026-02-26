---
name: sip-108-examples-auth-speclang-v0
title: "SIP 108: Authentication Example"
version: 0.1.0
description: Complete authentication example demonstrating SpecLang features
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 108: Authentication Example

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP provides a complete authentication example demonstrating SpecLang features including entities, operations, references, and code generation.

### Quick Start

1. **Spec**: auth.spec.md defines authentication
2. **Generate**: speclang generate auth
3. **Implement**: Complete generated code
4. **Test**: Run authentication tests

### Example Components

- **Entities**: User, Session, Token
- **Operations**: login, logout, refresh, validate
- **References**: References user service

### When to Read This

- **Learning**: Complete working example
- **Templates**: Starting point for auth
- **Reference**: Auth patterns

### Related SIPs

- SIP 63: Hello World Example
- SIP 41: Examples System
- SIP 78: Security Model

## Abstract

This SIP provides a comprehensive authentication example demonstrating the complete SpecLang workflow from specification to working code. It covers user authentication, session management, and token-based authorization.

## Motivation

Users need:
- **Complete example**: Full working authentication
- **Pattern reference**: Common patterns demonstrated
- **Best practices**: Security-aware implementation
- **Integration**: Multiple feature showcase

## Rationale

**Authentication as Example:**

1. Common requirement in most applications
2. Demonstrates entities, operations, validation
3. Shows security best practices
4. Tests multiple generation targets

## Specification

### Example Spec Structure

```yaml
ExampleSpec:
  header:
    id: "@examples/auth"
    version: 1.0.0
    layer: 10
    tags: [example, authentication, security]
    status: draft
    project_level: POC
    agent_support: agent_autonomous
    short: Authentication Example
  
  structure:
    - entities
    - operations
    - validation
    - integration
```

### Authentication Entities

```speclang
# speclang-header lines:20
id: "@examples/auth"
version: 1.0.0
layer: 10
tags: [example, auth, tutorial]
status: draft
project_level: POC
agent_support: agent_autonomous
short: Authentication Example
---

# Authentication Example

Complete authentication system example.

## Entities

### @block:user-entity @kind:entity
```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  roles: string[];
}
```

### @block:session-entity @kind:entity
```typescript
interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress: string;
  userAgent: string;
}
```

### @block:token-entity @kind:entity
```typescript
interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}
```
```

### Authentication Operations

```speclang
## Operations

### @block:login-operation @kind:operation
```typescript
async function login(
  email: string,
  password: string,
  ipAddress: string,
  userAgent: string
): Promise<AuthToken | AuthError> {
  // Validate input
  if (!email || !password) {
    return { error: "email and password required" };
  }
  
  // Find user
  const user = await userRepository.findByEmail(email);
  if (!user) {
    return { error: "invalid credentials" };
  }
  
  // Verify password
  const valid = await verifyPassword(password, user.salt, user.passwordHash);
  if (!valid) {
    return { error: "invalid credentials" };
  }
  
  // Check active status
  if (!user.isActive) {
    return { error: "account disabled" };
  }
  
  // Generate tokens
  const tokens = await generateTokens(user);
  
  // Create session
  await sessionRepository.create({
    userId: user.id,
    ...tokens,
    ipAddress,
    userAgent,
    expiresAt: addDays(new Date(), 7)
  });
  
  // Update last login
  await userRepository.update(user.id, { lastLoginAt: new Date() });
  
  return tokens;
}
```

### @block:logout-operation @kind:operation
```typescript
async function logout(token: string): Promise<void> {
  await sessionRepository.deleteByToken(token);
}
```

### @block:refresh-operation @kind:operation
```typescript
async function refreshToken(
  refreshToken: string
): Promise<AuthToken | AuthError> {
  const session = await sessionRepository.findByRefreshToken(refreshToken);
  
  if (!session) {
    return { error: "invalid refresh token" };
  }
  
  if (new Date() > session.expiresAt) {
    return { error: "refresh token expired" };
  }
  
  const user = await userRepository.findById(session.userId);
  if (!user || !user.isActive) {
    return { error: "user not found or inactive" };
  }
  
  // Generate new tokens
  const tokens = await generateTokens(user);
  
  // Update session
  await sessionRepository.update(session.id, tokens);
  
  return tokens;
}
```

### @block:validate-operation @kind:operation
```typescript
async function validateToken(token: string): Promise<User | null> {
  const session = await sessionRepository.findByToken(token);
  
  if (!session) {
    return null;
  }
  
  if (new Date() > session.expiresAt) {
    return null;
  }
  
  return userRepository.findById(session.userId);
}
```
```

### Validation Rules

```speclang
## Validation

### @block:email-validation @kind:validation
```typescript
const emailValidator = {
  validate: (email: string): boolean => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  },
  message: "Invalid email format"
};
```

### @block:password-validation @kind:validation
```typescript
const passwordValidator = {
  validate: (password: string): ValidationResult => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain number");
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
};
```
```

### Security Utilities

```speclang
## Security

### @block:password-hashing @kind:utility
```typescript
import crypto from "crypto";

const SALT_LENGTH = 32;
const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

async function hashPassword(password: string): Promise<{
  hash: string;
  salt: string;
}> {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  
  const hash = await new Promise<string>((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      ITERATIONS,
      KEY_LENGTH,
      DIGEST,
      (err, derived) => {
        if (err) reject(err);
        else resolve(derived.toString("hex"));
      }
    );
  });
  
  return { hash, salt };
}

async function verifyPassword(
  password: string,
  salt: string,
  hash: string
): Promise<boolean> {
  const { hash: computed } = await hashPassword(password);
  return crypto.timingSafeEqual(
    Buffer.from(computed, "hex"),
    Buffer.from(hash, "hex")
  );
}
```

### @block:token-generation @kind:utility
```typescript
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
}

async function generateTokens(user: User): Promise<AuthToken> {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    roles: user.roles
  };
  
  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY
  });
  
  const refreshToken = jwt.sign(
    { userId: user.id },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  
  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
    tokenType: "Bearer"
  };
}
```
```

### Test Specifications

```speclang
## Tests

### @block:auth-tests @kind:test
```typescript
describe("Authentication", () => {
  describe("login", () => {
    it("should return tokens for valid credentials", async () => {
      const result = await login(
        "test@example.com",
        "Password123",
        "127.0.0.1",
        "test-agent"
      );
      
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
    
    it("should return error for invalid email", async () => {
      const result = await login(
        "invalid",
        "Password123",
        "127.0.0.1",
        "test-agent"
      );
      
      expect(result.error).toBe("invalid credentials");
    });
    
    it("should return error for wrong password", async () => {
      const result = await login(
        "test@example.com",
        "WrongPassword",
        "127.0.0.1",
        "test-agent"
      );
      
      expect(result.error).toBe("invalid credentials");
    });
  });
  
  describe("validateToken", () => {
    it("should return user for valid token", async () => {
      const loginResult = await login(
        "test@example.com",
        "Password123",
        "127.0.0.1",
        "test-agent"
      );
      
      const user = await validateToken(loginResult.accessToken!);
      
      expect(user?.email).toBe("test@example.com");
    });
    
    it("should return null for invalid token", async () => {
      const user = await validateToken("invalid.token.here");
      
      expect(user).toBeNull();
    });
  });
});
```
```

## Generated Code Structure

```yaml
GeneratedStructure:
  output_dir: "generated/auth/"
  
  files:
    - "entities.ts"         # User, Session, Token interfaces
    - "operations.ts"      # login, logout, refresh, validate
    - "validators.ts"      # email, password validators
    - "security.ts"        # password hashing, token generation
    - "repository.ts"      # Data access layer
    - "index.ts"           # Exports
    - "auth.test.ts"       # Tests
```

## Implementation Checklist

```yaml
ImplementationSteps:
  - step: generate
    command: "speclang generate auth"
    expected: "Generated TypeScript files"
    
  - step: install_deps
    command: "npm install jsonwebtoken bcrypt"
    expected: "Dependencies installed"
    
  - step: implement_repository
    description: "Implement data access layer"
    files: ["repository.ts"]
    
  - step: configure_secrets
    description: "Set ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET"
    env_vars:
      - ACCESS_TOKEN_SECRET
      - REFRESH_TOKEN_SECRET
      
  - step: run_tests
    command: "npm test"
    expected: "All tests pass"
    
  - step: verify
    description: "Test login flow end-to-end"
    manual: true
```

## Security Considerations

```yaml
SecurityFeatures:
  password_storage:
    - pbkdf2 with 100k iterations
    - unique salt per password
    - timing-safe comparison
    
  token_security:
    - short-lived access tokens (15 min)
    - longer refresh tokens (7 days)
    - separate secrets for each
    
  rate_limiting:
    - limit login attempts
    - exponential backoff
    - account lockout
    
  logging:
    - log failed login attempts
    - alert on suspicious activity
    - audit token refresh
```

## Backwards Compatibility

- Generated code can be extended
- Repository interface allows different backends
- Validator functions can be customized

## References

- @ref:speclang/examples
- @ref:speclang/hello-world
- @ref:speclang/security
- SIP 63: Hello World Example
- SIP 41: Examples System
- SIP 78: Security Model

## Copyright

This document is in the public domain.
