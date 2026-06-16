# Bootstrap Phase 7.3: Auth Example

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 7.3 of the bootstrap process.

**Prerequisites**: Phase 7.1-7.2 (Examples Overview, Hello World) complete.

## Your Task
Create a complete authentication example that demonstrates entity definitions, operations, security patterns, and the full workflow from spec to generated code.

## Read These Specs First
1. `specs/examples.spec.md` - Examples overview
2. `specs/examples.spec.dir/auth.spec.md` - Auth example spec
3. `specs/examples.spec.dir/hello-world.spec.md` - Hello world example (reference)
4. `specs/core.spec.md` - Core spec patterns

## What to Build

### Files to Create
```
src/examples/
├── auth/
│   ├── index.ts                 # Main exports
│   ├── entities/
│   │   ├── user.ts              # User entity
│   │   ├── login-request.ts      # Login request
│   │   ├── login-response.ts     # Login response
│   │   └── token.ts              # Token entity
│   ├── operations/
│   │   ├── login.ts              # Login operation
│   │   ├── logout.ts             # Logout operation
│   │   ├── register.ts           # Register operation
│   │   └── refresh-token.ts      # Token refresh
│   ├── security/
│   │   ├── rate-limiter.ts       # Rate limiting
│   │   ├── password-hasher.ts    # Password hashing
│   │   └── jwt.ts                # JWT utilities
│   ├── auth-service.ts          # Main service
│   └── auth.test.ts              # Tests
└── auth.spec.scl                 # Copied spec

tests/examples/
└── auth.test.ts                  # Integration tests

examples/
└── auth/
    ├── README.md                 # Example documentation
    ├── package.json              # Example package
    └── run.sh                    # Run script
```

### Entity Definitions

```typescript
// src/examples/auth/entities/user.ts

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  isEmailVerified: boolean;
  roles: UserRole[];
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export interface CreateUserInput {
  email: string;
  password: string;
  roles?: UserRole[];
}

export interface UpdateUserInput {
  email?: string;
  roles?: UserRole[];
}

export function createUser(input: CreateUserInput, passwordHash: string): User {
  const now = new Date();
  return {
    id: generateId(),
    email: input.email,
    passwordHash,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
    isEmailVerified: false,
    roles: input.roles || [UserRole.USER],
    failedLoginAttempts: 0,
    lockedUntil: null,
  };
}

export function isUserLocked(user: User): boolean {
  if (!user.lockedUntil) return false;
  return new Date() < user.lockedUntil;
}

export function lockUser(user: User, durationMinutes: number): User {
  return {
    ...user,
    lockedUntil: new Date(Date.now() + durationMinutes * 60 * 1000),
  };
}

export function incrementFailedLogin(user: User): User {
  const newAttempts = user.failedLoginAttempts + 1;
  
  if (newAttempts >= 5) {
    return lockUser(user, 60); // Lock for 1 hour
  }
  
  return {
    ...user,
    failedLoginAttempts: newAttempts,
  };
}

export function resetFailedLogin(user: User): User {
  return {
    ...user,
    failedLoginAttempts: 0,
    lockedUntil: null,
  };
}

function generateId(): string {
  return `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

```typescript
// src/examples/auth/entities/login-request.ts

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginRequestValidation {
  email: ValidationResult;
  password: ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateLoginRequest(request: LoginRequest): LoginRequestValidation {
  const email = validateEmail(request.email);
  const password = validatePassword(request.password);
  
  return {
    email,
    password,
  };
}

function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true };
}

function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  
  return { valid: true };
}

export function isLoginRequestValid(request: LoginRequest): boolean {
  const validation = validateLoginRequest(request);
  return validation.email.valid && validation.password.valid;
}
```

```typescript
// src/examples/auth/entities/login-response.ts

export interface LoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
  error?: LoginError;
}

export enum LoginError {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_NOT_VERIFIED = 'ACCOUNT_NOT_VERIFIED',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVER_ERROR = 'SERVER_ERROR',
}

export function successResponse(
  token: string,
  refreshToken: string,
  expiresAt: Date,
  user: { id: string; email: string; roles: string[] }
): LoginResponse {
  return {
    success: true,
    token,
    refreshToken,
    expiresAt,
    user,
  };
}

export function errorResponse(error: LoginError): LoginResponse {
  const errorMessages: Record<LoginError, string> = {
    [LoginError.INVALID_CREDENTIALS]: 'Invalid email or password',
    [LoginError.ACCOUNT_LOCKED]: 'Account is temporarily locked',
    [LoginError.ACCOUNT_NOT_VERIFIED]: 'Please verify your email',
    [LoginError.RATE_LIMITED]: 'Too many attempts, please try again later',
    [LoginError.SERVER_ERROR]: 'An error occurred, please try again',
  };
  
  return {
    success: false,
    error,
    errorMessage: errorMessages[error],
  };
}
```

### Operations

```typescript
// src/examples/auth/operations/login.ts

import { User, isUserLocked, incrementFailedLogin, resetFailedLogin } from '../entities/user';
import { LoginRequest, validateLoginRequest, isLoginRequestValid } from '../entities/login-request';
import { LoginResponse, LoginError, successResponse, errorResponse } from '../entities/login-response';
import { verifyPassword } from '../security/password-hasher';
import { generateToken, generateRefreshToken, verifyToken } from '../security/jwt';
import { checkRateLimit, recordAttempt } from '../security/rate-limiter';
import { UserRepository } from './user-repository';

export interface LoginDeps {
  userRepository: UserRepository;
  rateLimiter: RateLimiter;
  passwordHasher: PasswordHasher;
  jwtService: JWTService;
}

export class LoginOperation {
  private userRepo: UserRepository;
  private rateLimiter: RateLimiter;
  private jwtService: JWTService;
  
  constructor(deps: LoginDeps) {
    this.userRepo = deps.userRepository;
    this.rateLimiter = deps.rateLimiter;
    this.jwtService = deps.jwtService;
  }
  
  async execute(request: LoginRequest, clientIp: string): Promise<LoginResponse> {
    // Step 1: Validate input
    if (!isLoginRequestValid(request)) {
      const validation = validateLoginRequest(request);
      return errorResponse(LoginError.INVALID_CREDENTIALS);
    }
    
    // Step 2: Check rate limit
    const rateLimitKey = `login:${clientIp}`;
    if (!await this.rateLimiter.check(rateLimitKey, 5, 60)) {
      return errorResponse(LoginError.RATE_LIMITED);
    }
    
    // Step 3: Find user by email
    const user = await this.userRepo.findByEmail(request.email);
    if (!user) {
      await recordAttempt(rateLimitKey);
      return errorResponse(LoginError.INVALID_CREDENTIALS);
    }
    
    // Step 4: Check if account is locked
    if (isUserLocked(user)) {
      return errorResponse(LoginError.ACCOUNT_LOCKED);
    }
    
    // Step 5: Verify password
    const passwordValid = await verifyPassword(request.password, user.passwordHash);
    if (!passwordValid) {
      // Increment failed attempts
      const updatedUser = await this.userRepo.update(
        user.id,
        incrementFailedLogin(user)
      );
      await recordAttempt(rateLimitKey);
      
      return errorResponse(LoginError.INVALID_CREDENTIALS);
    }
    
    // Step 6: Reset failed attempts on success
    await this.userRepo.update(user.id, resetFailedLogin(user));
    
    // Step 7: Generate tokens
    const tokenExpiry = request.rememberMe ? '7d' : '24h';
    const token = await this.jwtService.generate(
      { userId: user.id, email: user.email, roles: user.roles },
      tokenExpiry
    );
    
    const refreshToken = await this.jwtService.generateRefresh(user.id);
    
    // Step 8: Update last login
    await this.userRepo.update(user.id, {
      lastLoginAt: new Date(),
    });
    
    // Step 9: Return success
    return successResponse(
      token,
      refreshToken,
      new Date(Date.now() + (request.rememberMe ? 7 : 1) * 24 * 60 * 60 * 1000),
      {
        id: user.id,
        email: user.email,
        roles: user.roles,
      }
    );
  }
}
```

### Security Patterns

```typescript
// src/examples/auth/security/rate-limiter.ts

export interface RateLimiter {
  check(key: string, limit: number, windowSeconds: number): Promise<boolean>;
  reset(key: string): Promise<void>;
  getRemaining(key: string): Promise<number>;
}

export class InMemoryRateLimiter implements RateLimiter {
  private store: Map<string, { count: number; resetAt: number }> = new Map();
  
  async check(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const now = Date.now();
    const entry = this.store.get(key);
    
    if (!entry || entry.resetAt < now) {
      // New window
      this.store.set(key, {
        count: 1,
        resetAt: now + windowSeconds * 1000,
      });
      return true;
    }
    
    if (entry.count >= limit) {
      // Limit exceeded
      return false;
    }
    
    // Increment
    entry.count++;
    return true;
  }
  
  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }
  
  async getRemaining(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 5; // Default limit
    
    const now = Date.now();
    if (entry.resetAt < now) return 5;
    
    return Math.max(0, 5 - entry.count);
  }
}

export async function checkRateLimit(
  key: string,
  limit: number = 5,
  windowSeconds: number = 3600
): Promise<boolean> {
  const limiter = new InMemoryRateLimiter();
  return limiter.check(key, limit, windowSeconds);
}

export async function recordAttempt(key: string): Promise<void> {
  // In production, this would persist to Redis/database
}
```

```typescript
// src/examples/auth/security/password-hasher.ts

import { createHash, randomBytes } from 'crypto';

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export class PBKDF2PasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(32).toString('hex');
    
    return new Promise((resolve, reject) => {
      createHash(DIGEST)
        .update(password + salt)
        .digest('hex');
      
      // Simplified - in production use crypto.pbkdf2
      const hash = createHash(DIGEST)
        .update(password + salt)
        .digest('hex');
      
      resolve(`${salt}:${hash}`);
    });
  }
  
  async verify(password: string, storedHash: string): Promise<boolean> {
    const [salt, hash] = storedHash.split(':');
    
    const verifyHash = createHash(DIGEST)
      .update(password + salt)
      .digest('hex');
    
    return hash === verifyHash;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const hasher = new PBKDF2PasswordHasher();
  return hasher.hash(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hasher = new PBKDF2PasswordHasher();
  return hasher.verify(password, hash);
}
```

```typescript
// src/examples/auth/security/jwt.ts

import { createHmac, randomBytes } from 'crypto';

export interface JWTService {
  generate(payload: object, expiresIn: string): Promise<string>;
  generateRefresh(userId: string): Promise<string>;
  verify(token: string): Promise<JWTPayload>;
  refresh(token: string): Promise<string>;
}

export interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_ALGORITHM = 'HS256';

export class HMACJWTService implements JWTService {
  async generate(payload: object, expiresIn: string): Promise<string> {
    const expiresAt = this.parseExpiresIn(expiresIn);
    const now = Math.floor(Date.now() / 1000);
    
    const header = {
      alg: JWT_ALGORITHM,
      typ: 'JWT',
    };
    
    const payloadWithExp = {
      ...payload,
      iat: now,
      exp: expiresAt,
    };
    
    const headerB64 = this.base64UrlEncode(JSON.stringify(header));
    const payloadB64 = this.base64UrlEncode(JSON.stringify(payloadWithExp));
    
    const signature = this.sign(`${headerB64}.${payloadB64}`);
    
    return `${headerB64}.${payloadB64}.${signature}`;
  }
  
  async generateRefresh(userId: string): Promise<string> {
    const payload = {
      userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    };
    
    const header = {
      alg: JWT_ALGORITHM,
      typ: 'JWT',
    };
    
    const headerB64 = this.base64UrlEncode(JSON.stringify(header));
    const payloadB64 = this.base64UrlEncode(JSON.stringify(payload));
    
    const signature = this.sign(`${headerB64}.${payloadB64}`);
    
    return `${headerB64}.${payloadB64}.${signature}`;
  }
  
  async verify(token: string): Promise<JWTPayload> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    const [headerB64, payloadB64, signature] = parts;
    const expectedSignature = this.sign(`${headerB64}.${payloadB64}`);
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }
    
    const payload = JSON.parse(this.base64UrlDecode(payloadB64));
    
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }
    
    return payload;
  }
  
  async refresh(token: string): Promise<string> {
    const payload = await this.verify(token);
    
    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type for refresh');
    }
    
    return this.generate(
      { userId: payload.userId, email: payload.email, roles: payload.roles },
      '24h'
    );
  }
  
  private sign(data: string): string {
    return createHmac('sha256', JWT_SECRET)
      .update(data)
      .digest('base64url');
  }
  
  private base64UrlEncode(str: string): string {
    return Buffer.from(str).toString('base64url');
  }
  
  private base64UrlDecode(str: string): string {
    return Buffer.from(str, 'base64url').toString();
  }
  
  private parseExpiresIn(expiresIn: string): number {
    const now = Math.floor(Date.now() / 1000);
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    
    if (!match) return now + 86400; // Default 24h
    
    const value = parseInt(match[1], 10);
    const unit = match[2];
    
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    
    return now + value * multipliers[unit];
  }
}

export const jwtService = new HMACJWTService();

export async function generateToken(payload: object, expiresIn: string): Promise<string> {
  return jwtService.generate(payload, expiresIn);
}

export async function generateRefreshToken(userId: string): Promise<string> {
  return jwtService.generateRefresh(userId);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  return jwtService.verify(token);
}
```

### Main Service

```typescript
// src/examples/auth/auth-service.ts

import { User, CreateUserInput, UserRole } from './entities/user';
import { LoginRequest, LoginResponse } from './entities/login-response';
import { LoginOperation } from './operations/login';
import { RegisterOperation } from './operations/register';
import { LogoutOperation } from './operations/logout';
import { RefreshTokenOperation } from './operations/refresh-token';
import { UserRepository } from './operations/user-repository';
import { InMemoryRateLimiter } from './security/rate-limiter';
import { hashPassword } from './security/password-hasher';
import { HMACJWTService } from './security/jwt';

export interface AuthServiceDeps {
  userRepository: UserRepository;
}

export class AuthService {
  private loginOp: LoginOperation;
  private registerOp: RegisterOperation;
  private logoutOp: LogoutOperation;
  private refreshOp: RefreshTokenOperation;
  
  constructor(deps: AuthServiceDeps) {
    const rateLimiter = new InMemoryRateLimiter();
    const jwtService = new HMACJWTService();
    
    this.loginOp = new LoginOperation({
      userRepository: deps.userRepository,
      rateLimiter,
      passwordHasher: { hash: hashPassword },
      jwtService,
    });
    
    this.registerOp = new RegisterOperation({
      userRepository: deps.userRepository,
      passwordHasher: { hash: hashPassword },
    });
    
    this.logoutOp = new LogoutOperation({
      userRepository: deps.userRepository,
      jwtService,
    });
    
    this.refreshOp = new RefreshTokenOperation({
      userRepository: deps.userRepository,
      jwtService,
    });
  }
  
  async login(request: LoginRequest, clientIp: string): Promise<LoginResponse> {
    return this.loginOp.execute(request, clientIp);
  }
  
  async register(input: CreateUserInput): Promise<{ success: boolean; user?: User; error?: string }> {
    return this.registerOp.execute(input);
  }
  
  async logout(token: string): Promise<{ success: boolean }> {
    return this.logoutOp.execute(token);
  }
  
  async refreshToken(token: string): Promise<{ token?: string; error?: string }> {
    return this.refreshOp.execute(token);
  }
}
```

### Tests

```typescript
// src/examples/auth/auth.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth-service';
import { InMemoryUserRepository } from './operations/user-repository';
import { User, UserRole } from './entities/user';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepo: InMemoryUserRepository;
  
  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    authService = new AuthService({ userRepository: userRepo });
  });
  
  describe('register', () => {
    it('creates a new user with hashed password', async () => {
      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
      });
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('test@example.com');
      expect(result.user?.passwordHash).not.toBe('password123');
      expect(result.user?.roles).toContain(UserRole.USER);
    });
    
    it('rejects duplicate email', async () => {
      await authService.register({
        email: 'test@example.com',
        password: 'password123',
      });
      
      const result = await authService.register({
        email: 'test@example.com',
        password: 'password456',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('email');
    });
    
    it('validates password length', async () => {
      const result = await authService.register({
        email: 'test@example.com',
        password: 'short',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Password');
    });
  });
  
  describe('login', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'test@example.com',
        password: 'password123',
      });
    });
    
    it('returns token on valid credentials', async () => {
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      }, '127.0.0.1');
      
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user?.email).toBe('test@example.com');
    });
    
    it('rejects invalid password', async () => {
      const result = await authService.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      }, '127.0.0.1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_CREDENTIALS');
    });
    
    it('rejects unknown email', async () => {
      const result = await authService.login({
        email: 'unknown@example.com',
        password: 'password123',
      }, '127.0.0.1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_CREDENTIALS');
    });
    
    it('rate limits repeated attempts', async () => {
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        }, '127.0.0.1');
      }
      
      // 6th should be rate limited
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      }, '127.0.0.1');
      
      expect(result.error).toBe('RATE_LIMITED');
    });
    
    it('locks account after 5 failed attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        }, '127.0.0.1');
      }
      
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      }, '127.0.0.1');
      
      expect(result.error).toBe('ACCOUNT_LOCKED');
    });
  });
});
```

### Example README

```markdown
# Authentication Example

This example demonstrates a complete authentication system built with SpecLang.

## Features

- User registration with email/password
- Login with JWT tokens
- Token refresh
- Rate limiting
- Account locking after failed attempts
- Role-based access control

## Usage

```bash
# Run the example
bun run src/examples/auth/index.ts

# Run tests
bun test src/examples/auth/auth.test.ts
```

## Architecture

```
src/examples/auth/
├── entities/         # Data models
│   ├── user.ts
│   ├── login-request.ts
│   └── login-response.ts
├── operations/       # Business logic
│   ├── login.ts
│   ├── register.ts
│   └── logout.ts
├── security/         # Security utilities
│   ├── rate-limiter.ts
│   ├── password-hasher.ts
│   └── jwt.ts
└── auth-service.ts   # Main service
```

## API

### POST /auth/register
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### POST /auth/login
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "rememberMe": true
}
```

### POST /auth/refresh
```json
{
  "refreshToken": "..."
}
```

## Security

- Passwords hashed with PBKDF2
- JWT tokens with HMAC-SHA256
- Rate limited: 5 attempts per hour
- Account locks for 1 hour after 5 failures

## Testing

Run all tests:
```bash
bun test src/examples/auth/
```

Run with coverage:
```bash
bun test src/examples/auth/ --coverage
```
```

## Test Cases
1. User registration creates user
2. Duplicate email rejected
3. Password validation works
4. Login with valid credentials returns token
5. Login with wrong password fails
6. Rate limiting activates after 5 attempts
7. Account locking works
8. Token refresh works
9. Logout invalidates tokens
10. All operations have tests

## Validation
```bash
# Run tests
bun test src/examples/auth/

# Run the example
bun run src/examples/auth/index.ts
```

## Output Format
After completing, output:
1. Entity implementations
2. Operation implementations
3. Security implementations
4. Main service
5. Unit tests
6. Example README
7. Test results
