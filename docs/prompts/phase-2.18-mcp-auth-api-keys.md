# Bootstrap Phase 2.18: MCP API Key Authentication

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 2.18 of the bootstrap process.

**Prerequisites**: Phase 2.17 (Token Auth) complete.

## Your Task
Implement API key authentication for MCP server. API keys are simpler than tokens, suitable for service-to-service communication, and can be easily rotated.

## Read These Specs First
1. `specs/mcp.spec.dir/authentication.spec.md` - Auth methods
2. `specs/mcp.spec.dir/configuration.spec.md` - Configuration

## API Key Authentication Overview

### Key Types
```typescript
interface APIKeyTypes {
  user_key: {
    prefix: 'sk-user-';
    description: 'User-specific API key';
    permissions: 'Per-key configuration';
  };
  
  service_key: {
    prefix: 'sk-service-';
    description: 'Service account key';
    permissions: 'Broader access';
  };
  
  project_key: {
    prefix: 'sk-proj-';
    description: 'Project-scoped key';
    permissions: 'Project-specific';
  };
}
```

## Implementation

### 1. API Key Manager
```typescript
// src/mcp/auth/api-key-manager.ts
import crypto from 'crypto';
import fs from 'fs/promises';

interface APIKey {
  id: string;                    // Public identifier (sk-user-xxx)
  keyHash: string;               // Hash of the actual key
  keyPrefix: string;             // First few chars for identification
  userId: string;               // Associated user/service
  permissions: string[];        // Granted permissions
  name: string;                 // Human-readable name
  createdAt: number;
  expiresAt?: number;           // Optional expiration
  lastUsedAt?: number;
  rateLimit?: number;           // Requests per minute
  revoked: boolean;
}

interface APIKeyStore {
  keys: APIKey[];
  version: number;
}

export class APIKeyManager {
  private keys: Map<string, APIKey> = new Map();
  private keyHashes: Map<string, string> = new Map();  // hash -> key id
  private storePath: string;
  
  constructor(storePath: string) {
    this.storePath = storePath;
  }
  
  // Generate new API key
  generateKey(
    userId: string,
    permissions: string[] = [],
    options: {
      name?: string;
      prefix?: string;
      expiresIn?: number;  // seconds
      rateLimit?: number;
    } = {}
  ): { id: string; key: string } {
    // Generate random key
    const keyBytes = crypto.randomBytes(32);
    const key = `sk-${options.prefix || 'user'}-${keyBytes.toString('base64url')}`;
    
    // Hash the key for storage
    const keyHash = this.hashKey(key);
    const keyPrefix = key.slice(0, 12) + '...';
    
    const apiKey: APIKey = {
      id: `key_${crypto.randomUUID()}`,
      keyHash,
      keyPrefix,
      userId,
      permissions,
      name: options.name || `${userId} API Key`,
      createdAt: Date.now(),
      expiresAt: options.expiresIn 
        ? Date.now() + options.expiresIn * 1000 
        : undefined,
      rateLimit: options.rateLimit,
      revoked: false
    };
    
    // Store mapping
    this.keys.set(apiKey.id, apiKey);
    this.keyHashes.set(keyHash, apiKey.id);
    
    // Return full key (only time available)
    return {
      id: apiKey.id,
      key
    };
  }
  
  // Validate API key
  validateKey(key: string): {
    valid: boolean;
    keyId?: string;
    userId?: string;
    permissions?: string[];
    reason?: string;
  } {
    // Check prefix
    if (!key.startsWith('sk-')) {
      return { valid: false, reason: 'Invalid key format' };
    }
    
    // Hash the provided key
    const keyHash = this.hashKey(key);
    
    // Look up key
    const keyId = this.keyHashes.get(keyHash);
    if (!keyId) {
      return { valid: false, reason: 'Unknown key' };
    }
    
    const apiKey = this.keys.get(keyId);
    if (!apiKey) {
      return { valid: false, reason: 'Key not found' };
    }
    
    // Check if revoked
    if (apiKey.revoked) {
      return { valid: false, reason: 'Key revoked' };
    }
    
    // Check expiration
    if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) {
      return { valid: false, reason: 'Key expired' };
    }
    
    // Update last used
    apiKey.lastUsedAt = Date.now();
    
    return {
      valid: true,
      keyId: apiKey.id,
      userId: apiKey.userId,
      permissions: apiKey.permissions
    };
  }
  
  // Get key by ID (for admin operations)
  getKey(keyId: string): APIKey | undefined {
    const key = this.keys.get(keyId);
    if (!key) return undefined;
    
    // Return without sensitive data
    return {
      ...key,
      keyHash: '[hidden]',
      keyPrefix: key.keyPrefix
    };
  }
  
  // List keys for user
  listKeys(userId: string): APIKey[] {
    return Array.from(this.keys.values())
      .filter(k => k.userId === userId && !k.revoked)
      .map(k => ({
        ...k,
        keyHash: '[hidden]',
        keyPrefix: k.keyPrefix
      }));
  }
  
  // Revoke key
  revokeKey(keyId: string, reason?: string): boolean {
    const key = this.keys.get(keyId);
    if (!key) return false;
    
    key.revoked = true;
    return true;
  }
  
  // Update key permissions
  updateKey(keyId: string, updates: Partial<Pick<APIKey, 'permissions' | 'rateLimit' | 'expiresAt'>>): boolean {
    const key = this.keys.get(keyId);
    if (!key || key.revoked) return false;
    
    if (updates.permissions) key.permissions = updates.permissions;
    if (updates.rateLimit) key.rateLimit = updates.rateLimit;
    if (updates.expiresAt) key.expiresAt = updates.expiresAt;
    
    return true;
  }
  
  // Check rate limit
  checkRateLimit(keyId: string): { allowed: boolean; remaining: number; resetAt: number } {
    const key = this.keys.get(keyId);
    if (!key || !key.rateLimit) {
      return { allowed: true, remaining: -1, resetAt: 0 };
    }
    
    // Simple in-memory rate limiting
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    
    // This would be more sophisticated with actual tracking
    return {
      allowed: true,
      remaining: key.rateLimit - 1,
      resetAt: now + windowMs
    };
  }
  
  // Load from storage
  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.storePath, 'utf-8');
      const store: APIKeyStore = JSON.parse(data);
      
      for (const key of store.keys) {
        this.keys.set(key.id, key);
        this.keyHashes.set(key.keyHash, key.id);
      }
    } catch {
      // No keys stored yet
    }
  }
  
  // Save to storage
  async save(): Promise<void> {
    const store: APIKeyStore = {
      keys: Array.from(this.keys.values()),
      version: 1
    };
    
    await fs.writeFile(this.storePath, JSON.stringify(store, null, 2));
  }
  
  private hashKey(key: string): string {
    return crypto
      .createHash('sha256')
      .update(key)
      .digest('hex');
  }
}
```

### 2. API Key Middleware
```typescript
// src/mcp/auth/api-key-middleware.ts
import { Request, Response, NextFunction } from 'express';
import { APIKeyManager } from './api-key-manager';

interface RateLimitStore {
  [keyId: string]: {
    count: number;
    windowStart: number;
  };
}

export function createAPIKeyMiddleware(
  keyManager: APIKeyManager,
  options: {
    headerName?: string;
    queryParam?: string;
    requiredPermissions?: string[];
    rateLimitEnabled?: boolean;
  } = {}
): (req: Request, res: Response, next: NextFunction) => void {
  const headerName = options.headerName || 'x-api-key';
  const queryParam = options.queryParam || 'api_key';
  const rateLimitStore: RateLimitStore = {};
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Try header first, then query param
    let apiKey = req.headers[headerName] as string;
    if (!apiKey && req.query[queryParam]) {
      apiKey = String(req.query[queryParam]);
    }
    
    if (!apiKey) {
      res.status(401).json({
        error: 'Unauthorized',
        message: `Missing API key. Provide in ${headerName} header or ${queryParam} query parameter`
      });
      return;
    }
    
    // Validate key
    const result = keyManager.validateKey(apiKey);
    
    if (!result.valid) {
      res.status(401).json({
        error: 'Unauthorized',
        message: result.reason
      });
      return;
    }
    
    // Check rate limit
    if (options.rateLimitEnabled) {
      const rateLimit = checkRateLimit(result.keyId!, rateLimitStore);
      
      if (!rateLimit.allowed) {
        res.status(429).json({
          error: 'Rate Limited',
          message: 'Too many requests',
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
        });
        return;
      }
      
      res.set('X-RateLimit-Limit', String(rateLimit.remaining + 1));
      res.set('X-RateLimit-Remaining', String(rateLimit.remaining));
      res.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetAt / 1000)));
    }
    
    // Check permissions
    if (options.requiredPermissions?.length) {
      const hasPermission = options.requiredPermissions.every(
        perm => result.permissions!.includes(perm)
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
    
    // Attach to request
    req.user = {
      id: result.userId!,
      keyId: result.keyId!,
      permissions: result.permissions!
    };
    
    next();
  };
}

function checkRateLimit(keyId: string, store: RateLimitStore): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const windowMs = 60000;
  
  let entry = store[keyId];
  
  if (!entry || now - entry.windowStart > windowMs) {
    entry = { count: 0, windowStart: now };
    store[keyId] = entry;
  }
  
  const limit = 100; // Default rate limit
  const remaining = limit - entry.count;
  
  if (remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.windowStart + windowMs
    };
  }
  
  entry.count++;
  
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.windowStart + windowMs
  };
}
```

### 3. CLI API Key Commands
```bash
# Generate API key
speclang mcp apikey generate --user service-account --permissions read,write

# Generate with custom name and expiration
speclang mcp apikey generate --user ci-bot --name "CI Pipeline" --expires-in 2592000

# List API keys
speclang mcp apikey list --user service-account

# Show API key details
speclang mcp apikey get key_123456

# Revoke API key
speclang mcp apikey revoke key_123456

# Update API key
speclang mcp apikey update key_123456 --add-permissions admin

# Rotate API key (revoke old, create new)
speclang mcp apikey rotate key_123456
```

### 4. CLI Implementation
```typescript
// src/mcp/cli/api-key.ts
import { APIKeyManager } from '../auth/api-key-manager';

export async function handleAPIKeyCommand(args: string[]): Promise<void> {
  const subcommand = args[0];
  const storePath = process.env.SPECLANG_KEYS_PATH || './api-keys.json';
  const manager = new APIKeyManager(storePath);
  await manager.load();
  
  switch (subcommand) {
    case 'generate':
      await generateKey(manager, args);
      break;
    case 'list':
      await listKeys(manager, args);
      break;
    case 'get':
      await getKey(manager, args);
      break;
    case 'revoke':
      await revokeKey(manager, args);
      break;
    case 'update':
      await updateKey(manager, args);
      break;
    case 'rotate':
      await rotateKey(manager, args);
      break;
    default:
      console.error(`Unknown command: ${subcommand}`);
      process.exit(1);
  }
  
  await manager.save();
}

async function generateKey(manager: APIKeyManager, args: string[]): Promise<void> {
  const userId = getArgValue(args, '--user');
  const permissions = getArgValue(args, '--permissions')?.split(',') || ['read'];
  const name = getArgValue(args, '--name');
  const expiresIn = getArgValue(args, '--expires-in');
  const rateLimit = getArgValue(args, '--rate-limit');
  const prefix = getArgValue(args, '--prefix') || 'user';
  
  if (!userId) {
    console.error('--user is required');
    process.exit(1);
  }
  
  const result = manager.generateKey(userId, permissions, {
    name,
    prefix,
    expiresIn: expiresIn ? parseInt(expiresIn) : undefined,
    rateLimit: rateLimit ? parseInt(rateLimit) : undefined
  });
  
  console.log('API Key (copy this, it will not be shown again):');
  console.log(result.key);
  console.log(`\nKey ID: ${result.id}`);
}

async function listKeys(manager: APIKeyManager, args: string[]): Promise<void> {
  const userId = getArgValue(args, '--user');
  
  if (userId) {
    const keys = manager.listKeys(userId);
    console.log(`API keys for ${userId}:`);
    for (const key of keys) {
      console.log(`  ${key.id}: ${key.name} (${key.keyPrefix})`);
      console.log(`    Permissions: ${key.permissions.join(', ')}`);
      if (key.expiresAt) {
        console.log(`    Expires: ${new Date(key.expiresAt).toISOString()}`);
      }
    }
  } else {
    console.log('Listing all keys requires --user flag');
  }
}

async function getKey(manager: APIKeyManager, args: string[]): Promise<void> {
  const keyId = args[1];
  const key = manager.getKey(keyId);
  
  if (!key) {
    console.error(`Key not found: ${keyId}`);
    process.exit(1);
  }
  
  console.log(`Key: ${key.name}`);
  console.log(`  ID: ${key.id}`);
  console.log(`  User: ${key.userId}`);
  console.log(`  Prefix: ${key.keyPrefix}`);
  console.log(`  Permissions: ${key.permissions.join(', ')}`);
  console.log(`  Created: ${new Date(key.createdAt).toISOString()}`);
  if (key.expiresAt) {
    console.log(`  Expires: ${new Date(key.expiresAt).toISOString()}`);
  }
  if (key.lastUsedAt) {
    console.log(`  Last Used: ${new Date(key.lastUsedAt).toISOString()}`);
  }
  console.log(`  Revoked: ${key.revoked}`);
}

async function revokeKey(manager: APIKeyManager, args: string[]): Promise<void> {
  const keyId = args[1];
  const revoked = manager.revokeKey(keyId);
  
  if (revoked) {
    console.log(`Revoked key: ${keyId}`);
  } else {
    console.error(`Failed to revoke key: ${keyId}`);
    process.exit(1);
  }
}

async function updateKey(manager: APIKeyManager, args: string[]): Promise<void> {
  const keyId = args[1];
  const addPerms = getArgValue(args, '--add-permissions')?.split(',');
  const removePerms = getArgValue(args, '--remove-permissions')?.split(',');
  const rateLimit = getArgValue(args, '--rate-limit');
  
  const current = manager.getKey(keyId);
  if (!current) {
    console.error(`Key not found: ${keyId}`);
    process.exit(1);
  }
  
  const updates: any = {};
  
  if (addPerms) {
    updates.permissions = [...new Set([...current.permissions, ...addPerms])];
  }
  if (removePerms) {
    updates.permissions = current.permissions.filter(p => !removePerms.includes(p));
  }
  if (rateLimit) {
    updates.rateLimit = parseInt(rateLimit);
  }
  
  manager.updateKey(keyId, updates);
  console.log(`Updated key: ${keyId}`);
}

async function rotateKey(manager: APIKeyManager, args: string[]): Promise<void> {
  const keyId = args[1];
  const current = manager.getKey(keyId);
  
  if (!current) {
    console.error(`Key not found: ${keyId}`);
    process.exit(1);
  }
  
  // Revoke old key
  manager.revokeKey(keyId);
  
  // Generate new key with same permissions
  const result = manager.generateKey(current.userId, current.permissions, {
    name: current.name + ' (rotated)',
    prefix: keyId.includes('service') ? 'service' : 'user'
  });
  
  console.log('New API Key (copy this, it will not be shown again):');
  console.log(result.key);
  console.log(`\nOld key revoked: ${keyId}`);
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
    "type": "api-key",
    "apiKey": {
      "storage_path": "./api-keys.json",
      "rate_limit": 100,
      "header_name": "x-api-key",
      "query_param": "api_key"
    }
  }
}
```

## Test Cases
1. Generate valid API key
2. Validate API key returns correct data
3. Reject invalid key format
4. Reject revoked key
5. Reject expired key
6. Rate limiting blocks excess requests
7. Permission checking works correctly
8. Key rotation creates new key and revokes old
9. Keys persist across restarts

## Output
1. APIKeyManager class
2. API key middleware
3. CLI commands
4. Configuration schema
5. Integration tests
