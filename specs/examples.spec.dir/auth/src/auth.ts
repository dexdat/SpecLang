/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/examples.spec.dir/auth/auth.spec.md
 * Generated: 2026-03-31T13:51:00.000Z
 * 
 * Edit the spec, not this file.
 */

import crypto from 'crypto';

/**
 * User entity with authentication data.
 */
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

/**
 * Result type for login operations.
 */
export type LoginResult = 
  | { success: true; token: string }
  | { success: false; error: string };

/**
 * Simple JWT-like token (base64 encoded JSON with timestamp)
 * In production, use jsonwebtoken library
 */
function createToken(userId: string, username: string, secret: string): string {
  const payload = JSON.stringify({
    userId,
    username,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  });
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const signature = hmac.digest('base64url');
  return Buffer.from(payload).toString('base64url') + '.' + signature;
}

/**
 * Verify and decode token
 */
function verifyToken(token: string, secret: string): { userId: string; username: string } | null {
  try {
    const [payloadB64, signature] = token.split('.');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadB64);
    const expectedSig = hmac.digest('base64url');
    
    if (signature !== expectedSig) return null;
    
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    
    return { userId: payload.userId, username: payload.username };
  } catch {
    return null;
  }
}

/**
 * Authentication service handling login and token generation.
 */
export class AuthService {
  private secret: string;
  private users: Map<string, User> = new Map();
  
  constructor(secret: string) {
    this.secret = secret;
  }
  
  async login(username: string, password: string): Promise<LoginResult> {
    const user = this.users.get(username);
    if (!user) {
      return { success: false, error: "Invalid credentials" };
    }
    
    const valid = await this.verifyPassword(password, user.passwordHash);
    if (!valid) {
      return { success: false, error: "Invalid credentials" };
    }
    
    const token = createToken(user.id, user.username, this.secret);
    return { success: true, token };
  }
  
  async register(username: string, email: string, password: string): Promise<User> {
    const passwordHash = await this.hashPassword(password);
    const user: User = {
      id: crypto.randomUUID(),
      username,
      email,
      passwordHash,
      createdAt: new Date()
    };
    this.users.set(username, user);
    return user;
  }
  
  private async hashPassword(password: string): Promise<string> {
    // Simplified for example - use bcrypt in production
    return Buffer.from(password).toString('base64');
  }
  
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return Buffer.from(password).toString('base64') === hash;
  }
  
  verifyToken(token: string): { userId: string; username: string } | null {
    return verifyToken(token, this.secret);
  }
}

/**
 * Express middleware for JWT authentication.
 */
export function authMiddleware(secret: string) {
  return (req: any, res: any, next: any): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    
    const token = authHeader.substring(7);
    const payload = verifyToken(token, secret);
    
    if (!payload) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    req.user = payload;
    next();
  };
}
