# Bootstrap Phase 2.7: MCP Authentication

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 2.7 of the bootstrap process.

**Prerequisites**: Phase 2.1 (MCP Server), Phase 2.2 (MCP CLI) complete.

## Your Task
Implement authentication for MCP server in remote and server modes.

## Read These Specs First
1. `specs/mcp.spec.dir/authentication.spec.md` - Authentication methods
2. `specs/mcp.spec.dir/configuration.spec.md` - Configuration schema

## Authentication Modes

### 1. Editor-Initiated (Local)
```yaml
editor_initiated:
  method: None (trusted local process)
  note: Editor spawns server, inherits trust
```

No authentication needed - the editor is a trusted local process.

### 2. Remote Mode
```yaml
remote_mode:
  methods:
    basic:
      header: Authorization: Basic base64(user:pass)
      setup: --auth=basic --user=admin --pass=secret
      
    bearer:
      header: Authorization: Bearer <token>
      setup: --auth=token --token=xyz123
      
    none:
      warning: Only for local development
```

### 3. Server Mode
```yaml
server_mode:
  methods:
    config_file:
      location: /etc/speclang/mcp-auth.json
      format: { users: [{ user, hash, permissions }] }
      
    tls_client_cert:
      method: Mutual TLS
      use_case: Enterprise
```

## Implementation

### 1. Auth Middleware (`mcp/auth.ts`)

```typescript
import crypto from 'crypto';

interface User {
  user: string;
  hash: string;
  permissions: string[];
}

export class AuthMiddleware {
  private users: Map<string, User> = new Map();
  private tokens: Set<string> = new Set();
  
  loadFromConfig(configPath: string) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    for (const user of config.users || []) {
      this.users.set(user.user, user);
    }
  }
  
  basicAuth(args: string[]): (req: any, res: any, next: () => void) => void {
    const user = this.getArg(args, '--user');
    const pass = this.getArg(args, '--pass');
    const expected = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
    
    return (req, res, next) => {
      const auth = req.headers.authorization;
      if (auth !== expected) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      next();
    };
  }
  
  tokenAuth(args: string[]): (req: any, res: any, next: () => void) => void {
    const token = this.getArg(args, '--token');
    this.tokens.add(token);
    
    return (req, res, next) => {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const provided = auth.slice(7);
      if (!this.tokens.has(provided)) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
      
      next();
    };
  }
  
  configAuth(): (req: any, res: any, next: () => void) => void {
    return (req, res, next) => {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Basic ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const [user, pass] = Buffer.from(auth.slice(6), 'base64')
        .toString()
        .split(':');
      
      const stored = this.users.get(user);
      if (!stored) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }
      
      const hash = this.hashPassword(pass);
      if (hash !== stored.hash) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }
      
      req.user = { name: user, permissions: stored.permissions };
      next();
    };
  }
  
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  
  hashPassword(password: string, salt?: string): string {
    const s = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, s, 100000, 64, 'sha512');
    return `${s}:${hash.toString('hex')}`;
  }
  
  verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(':');
    const verify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
    return hash === verify.toString('hex');
  }
  
  private getArg(args: string[], flag: string): string {
    const idx = args.indexOf(flag);
    return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : '';
  }
}
```

### 2. CLI Integration

```bash
# Start with basic auth
speclang mcp --mode=http --auth=basic --user=admin --pass=secret

# Start with token auth
speclang mcp --mode=http --auth=token --token=xyz123

# Start with config file auth
speclang mcp --mode=server --auth=config --config=/etc/speclang/mcp-auth.json

# Generate a new token
speclang mcp token generate
```

### 3. Config File Schema (`/etc/speclang/mcp-auth.json`)

```json
{
  "users": [
    {
      "user": "admin",
      "hash": "salt:hash...",
      "permissions": ["read", "write", "admin"]
    },
    {
      "user": "readonly",
      "hash": "salt:hash...",
      "permissions": ["read"]
    }
  ],
  "tokens": [
    {
      "token": "dev-token-123",
      "permissions": ["read", "write"],
      "expires": "2025-12-31"
    }
  ]
}
```

### 4. Permission Middleware

```typescript
export function requirePermission(permission: string) {
  return (req: any, res: any, next: () => void) => {
    if (!req.user?.permissions?.includes(permission)) {
      res.status(403).json({ error: 'Forbidden', required: permission });
      return;
    }
    next();
  };
}

// Usage
app.use('/tools/write', requirePermission('write'));
app.use('/admin', requirePermission('admin'));
```

### 5. Session Management

```typescript
interface Session {
  id: string;
  user: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private ttlMs = 3600000; // 1 hour
  
  create(user: string): string {
    const id = crypto.randomBytes(16).toString('hex');
    const now = new Date();
    
    this.sessions.set(id, {
      id,
      user,
      createdAt: now,
      lastActivity: now,
      expiresAt: new Date(now.getTime() + this.ttlMs)
    });
    
    return id;
  }
  
  validate(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }
    
    session.lastActivity = new Date();
    return session;
  }
  
  destroy(sessionId: string) {
    this.sessions.delete(sessionId);
  }
  
  cleanup() {
    const now = new Date();
    for (const [id, session] of this.sessions) {
      if (now > session.expiresAt) {
        this.sessions.delete(id);
      }
    }
  }
}
```

## Test Cases
1. Basic auth accepts valid credentials
2. Basic auth rejects invalid credentials
3. Token auth accepts valid token
4. Token auth rejects invalid token
5. Config auth loads users from file
6. Password hashing works correctly
7. Permissions restrict access
8. Sessions expire after TTL
9. Session cleanup removes expired
10. No auth for editor-initiated mode

## Output
1. AuthMiddleware class
2. SessionManager class
3. Permission middleware
4. CLI flags for auth
5. Config file schema
6. Integration tests
