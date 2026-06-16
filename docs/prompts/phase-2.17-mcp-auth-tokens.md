# Bootstrap Phase 2.17: MCP Token Authentication

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 2.17 of the bootstrap process.

**Prerequisites**: Phase 2.7 (MCP Auth), Phase 2.16 (Run Modes) complete.

## Your Task
Implement token-based authentication for MCP server remote and server modes. This includes token generation, validation, expiration, and refresh mechanisms.

## Read These Specs First
1. `specs/mcp.spec.dir/authentication.spec.md` - Auth methods
2. `specs/mcp.spec.dir/run-modes.spec.md` - Run modes

## Token Authentication Overview

### Token Types
```typescript
interface TokenTypes {
  static: {
    description: 'Long-lived tokens for service accounts';
    lifetime: 'Indefinite or configured expiration';
    useCase: 'CI/CD, webhooks, automation';
  };
  
  ephemeral: {
    description: 'Short-lived tokens for sessions';
    lifetime: '1 hour to 24 hours';
    useCase: 'User sessions, temporary access';
  };
  
  refresh: {
    description: 'Used to obtain new access tokens';
    lifetime: '7-30 days';
    useCase: 'OAuth2-style token refresh';
  };
}
```

## Implementation

### 1. Token Manager
```typescript
// src/mcp/auth/token-manager.ts
import crypto from 'crypto';
import fs from 'fs/promises';

interface TokenConfig {
  issuer: string;
  secretKey: string;
  algorithms: ['HS256', 'HS384', 'HS512'];
  accessTokenTTL: number;      // seconds
  refreshTokenTTL: number;     // seconds
}

interface TokenPayload {
  sub: string;                  // Subject (user/agent ID)
  iat: number;                  // Issued at
  exp: number;                 // Expiration
  iss: string;                  // Issuer
  permissions: string[];       // granted permissions
  tokenType: 'access' | 'refresh';
  jti?: string;                 // JWT ID for revocation
}

interface StoredToken {
  jti: string;
  sub: string;
  exp: number;
  revoked: boolean;
}

export class TokenManager {
  private config: TokenConfig;
  private revokedTokens: Map<string, StoredToken> = new Map();
  private refreshTokens: Map<string, { sub: string; exp: number; permissions: string[] }> = new Map();
  
  constructor(config: TokenConfig) {
    this.config = config;
  }
  
  // Generate access token
  generateAccessToken(
    subject: string,
    permissions: string[] = []
  ): string {
    const payload: TokenPayload = {
      sub: subject,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.config.accessTokenTTL,
      iss: this.config.issuer,
      permissions,
      tokenType: 'access',
      jti: crypto.randomUUID()
    };
    
    return this.signToken(payload);
  }
  
  // Generate refresh token
  generateRefreshToken(
    subject: string,
    permissions: string[] = []
  ): string {
    const jti = crypto.randomUUID();
    const exp = Math.floor(Date.now() / 1000) + this.config.refreshTokenTTL;
    
    // Store refresh token for later validation
    this.refreshTokens.set(jti, {
      sub: subject,
      exp,
      permissions
    });
    
    const payload: TokenPayload = {
      sub: subject,
      iat: Math.floor(Date.now() / 1000),
      exp,
      iss: this.config.issuer,
      permissions,
      tokenType: 'refresh',
      jti
    };
    
    return this.signToken(payload);
  }
  
  // Validate access token
  validateAccessToken(token: string): TokenPayload | null {
    try {
      const payload = this.verifyToken(token);
      
      if (payload.tokenType !== 'access') {
        return null;
      }
      
      if (this.isTokenRevoked(payload.jti)) {
        return null;
      }
      
      return payload;
    } catch (error) {
      return null;
    }
  }
  
  // Refresh access token using refresh token
  refreshAccessToken(refreshToken: string): { accessToken: string; refreshToken?: string } | null {
    try {
      const payload = this.verifyToken(refreshToken);
      
      if (payload.tokenType !== 'refresh') {
        return null;
      }
      
      const stored = this.refreshTokens.get(payload.jti!);
      if (!stored || stored.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      
      // Generate new access token with same permissions
      const newAccessToken = this.generateAccessToken(
        payload.sub,
        stored.permissions
      );
      
      // Optionally rotate refresh token
      this.revokeRefreshToken(payload.jti!);
      const newRefreshToken = this.generateRefreshToken(
        payload.sub,
        stored.permissions
      );
      
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch {
      return null;
    }
  }
  
  // Revoke token (logout)
  revokeToken(token: string): boolean {
    try {
      const payload = this.verifyToken(token);
      
      if (payload.tokenType === 'refresh') {
        return this.revokeRefreshToken(payload.jti!);
      }
      
      // Add to revoked list
      this.revokedTokens.set(payload.jti!, {
        jti: payload.jti!,
        sub: payload.sub,
        exp: payload.exp,
        revoked: true
      });
      
      return true;
    } catch {
      return false;
    }
  }
  
  // Revoke all tokens for a subject
  revokeAllSubjectTokens(subject: string): number {
    let count = 0;
    
    for (const [jti, token] of this.refreshTokens) {
      if (token.sub === subject) {
        this.refreshTokens.delete(jti);
        count++;
      }
    }
    
    for (const [jti, token] of this.revokedTokens) {
      if (token.sub === subject) {
        count++;
      }
    }
    
    return count;
  }
  
  private signToken(payload: TokenPayload): string {
    const header = Buffer.from(JSON.stringify({
      alg: this.config.algorithms[0],
      typ: 'JWT'
    })).toString('base64url');
    
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const signature = crypto
      .createHmac(this.config.algorithms[0].slice(2), this.config.secretKey)
      .update(`${header}.${body}`)
      .digest('base64url');
    
    return `${header}.${body}.${signature}`;
  }
  
  private verifyToken(token: string): TokenPayload {
    const [header, body, signature] = token.split('.');
    
    const expectedSignature = crypto
      .createHmac(header.includes('384') ? 'sha384' : 'sha256', this.config.secretKey)
      .update(`${header}.${body}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }
    
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }
    
    return payload;
  }
  
  private isTokenRevoked(jti: string): boolean {
    const token = this.revokedTokens.get(jti);
    return token?.revoked ?? false;
  }
  
  private revokeRefreshToken(jti: string): boolean {
    return this.refreshTokens.delete(jti);
  }
  
  // Load tokens from storage
  async loadFromStorage(path: string): Promise<void> {
    try {
      const data = await fs.readFile(path, 'utf-8');
      const stored = JSON.parse(data);
      
      if (stored.revokedTokens) {
        for (const token of stored.revokedTokens) {
          this.revokedTokens.set(token.jti, token);
        }
      }
      
      if (stored.refreshTokens) {
        for (const [jti, token] of Object.entries(stored.refreshTokens)) {
          this.refreshTokens.set(jti, token as any);
        }
      }
    } catch {
      // File doesn't exist yet
    }
  }
  
  // Persist tokens to storage
  async saveToStorage(path: string): Promise<void> {
    const data = {
      revokedTokens: Array.from(this.revokedTokens.values()),
      refreshTokens: Object.fromEntries(this.refreshTokens)
    };
    
    await fs.writeFile(path, JSON.stringify(data, null, 2));
  }
}
```

### 2. Token Auth Middleware
```typescript
// src/mcp/auth/token-middleware.ts
import { Request, Response, NextFunction } from 'express';
import { TokenManager } from './token-manager';

export function createTokenAuthMiddleware(
  tokenManager: TokenManager,
  options: {
    requiredPermissions?: string[];
    allowRefreshToken?: boolean;
  } = {}
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Missing authorization header'
      });
      return;
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid authorization scheme. Use: Bearer <token>'
      });
      return;
    }
    
    const token = authHeader.slice(7);
    
    // Try access token first
    let payload = tokenManager.validateAccessToken(token);
    
    // Allow refresh token if enabled
    if (!payload && options.allowRefreshToken) {
      const refreshed = tokenManager.refreshAccessToken(token);
      if (refreshed) {
        // Return new tokens in response headers
        res.set('X-Access-Token', refreshed.accessToken);
        if (refreshed.refreshToken) {
          res.set('X-Refresh-Token', refreshed.refreshToken);
        }
        
        payload = tokenManager.validateAccessToken(refreshed.accessToken);
      }
    }
    
    if (!payload) {
      res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
      return;
    }
    
    // Check permissions
    if (options.requiredPermissions?.length) {
      const hasPermission = options.requiredPermissions.every(
        perm => payload!.permissions.includes(perm)
      );
      
      if (!hasPermission) {
        res.status(403).json({ 
          error: 'Forbidden',
          message: 'Insufficient permissions',
          required: options.requiredPermissions
        });
        return;
      }
    }
    
    // Attach user info to request
    req.user = {
      id: payload.sub,
      permissions: payload.permissions,
      tokenId: payload.jti
    };
    
    next();
  };
}
```

### 3. CLI Token Commands
```bash
# Generate a static token
speclang mcp token generate --permissions read,write

# Generate token with expiration (24 hours)
speclang mcp token generate --ttl 86400 --permissions read,write

# List active tokens
speclang mcp token list

# Revoke a token
speclang mcp token revoke <token-id>

# Revoke all tokens for user
speclang mcp token revoke --user <user-id>

# Validate a token
speclang mcp token validate <token>
```

### 4. Token CLI Implementation
```typescript
// src/mcp/cli/token.ts
import crypto from 'crypto';

export async function handleTokenCommand(args: string[]): Promise<void> {
  const subcommand = args[0];
  
  switch (subcommand) {
    case 'generate':
      await generateToken(args);
      break;
    case 'list':
      await listTokens(args);
      break;
    case 'revoke':
      await revokeToken(args);
      break;
    case 'validate':
      await validateToken(args);
      break;
    default:
      console.error(`Unknown token command: ${subcommand}`);
      process.exit(1);
  }
}

async function generateToken(args: string[]): Promise<void> {
  const ttl = getArgValue(args, '--ttl');
  const permissions = getArgValue(args, '--permissions')?.split(',') || ['read'];
  const user = getArgValue(args, '--user') || 'cli-user';
  
  const secretKey = process.env.SPECLANG_TOKEN_SECRET || crypto.randomBytes(32).toString('hex');
  const tokenManager = new TokenManager({
    issuer: 'speclang-mcp',
    secretKey,
    algorithms: ['HS256'],
    accessTokenTTL: ttl ? parseInt(ttl) : 86400,
    refreshTokenTTL: 604800
  });
  
  const accessToken = tokenManager.generateAccessToken(user, permissions);
  const refreshToken = tokenManager.generateRefreshToken(user, permissions);
  
  console.log('Access Token:');
  console.log(accessToken);
  console.log('\nRefresh Token:');
  console.log(refreshToken);
  console.log('\nSecret (save this!):');
  console.log(secretKey);
}

async function listTokens(args: string[]): Promise<void> {
  // Load tokens from storage and list
  console.log('Active tokens:');
  // Implementation...
}

async function revokeToken(args: string[]): Promise<void> {
  const token = args[1];
  const userId = getArgValue(args, '--user');
  
  if (token) {
    // Revoke specific token
    console.log(`Revoked token: ${token}`);
  } else if (userId) {
    // Revoke all for user
    console.log(`Revoked all tokens for user: ${userId}`);
  }
}

async function validateToken(args: string[]): Promise<void> {
  const token = args[1];
  // Validate and show payload
  console.log('Token is valid');
}

function getArgValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : undefined;
}
```

### 5. Configuration
```json
{
  "auth": {
    "type": "token",
    "token": {
      "issuer": "speclang-mcp",
      "secret_key_env": "SPECLANG_TOKEN_SECRET",
      "access_token_ttl": 3600,
      "refresh_token_ttl": 604800,
      "allow_refresh": true,
      "storage_path": "./tokens.json"
    }
  }
}
```

## Test Cases
1. Generate valid access token
2. Validate access token returns payload
3. Reject expired token
4. Reject invalid signature
5. Refresh token generates new access token
6. Revoked token is rejected
7. Permission checking works correctly
8. Token rotation on refresh works
9. Token storage persists across restarts

## Output
1. TokenManager class
2. Token auth middleware
3. CLI token commands
4. Token configuration
5. Integration tests
