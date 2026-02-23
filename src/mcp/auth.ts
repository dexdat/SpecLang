/**
 * SPECLANG-GENERATED: MCP Server Authentication
 * Source: @speclang/mcp
 */

import type { MCPAuthConfig, MCPAuthUsersConfig } from './types.js';
import type { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as crypto from 'crypto';

/**
 * Authentication middleware for MCP server
 */
export class MCPAuth {
  private config: MCPAuthConfig;
  private apiKeys: Set<string>;
  
  constructor(config: MCPAuthConfig) {
    this.config = config;
    this.apiKeys = new Set(config.apiKeys || []);
    if (config.token) {
      this.apiKeys.add(config.token);
    }
  }
  
  /**
   * Create Express middleware for authentication
   */
  middleware(): (req: Request, res: Response, next: NextFunction) => void {
    if (!this.config.enabled) {
      return (_req, _res, next) => next();
    }
    
    switch (this.config.type) {
      case 'basic':
        return this.basicAuthMiddleware();
      case 'token':
        return this.tokenAuthMiddleware();
      case 'config_file':
        return this.configFileAuthMiddleware();
      case 'tls_client_cert':
        return this.tlsClientCertAuthMiddleware();
      default:
        return (_req, _res, next) => next();
    }
  }
  
  /**
   * Basic authentication middleware
   */
  private basicAuthMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
    const expected = 'Basic ' + Buffer.from(`${this.config.user}:${this.config.pass}`).toString('base64');
    
    return (req: Request, res: Response, next: NextFunction) => {
      const auth = req.headers.authorization;
      if (auth !== expected) {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
        return;
      }
      next();
    };
  }
  
  /**
   * Token/Bearer authentication middleware
   */
  private tokenAuthMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      const auth = req.headers.authorization;
      
      if (!auth) {
        res.status(401).json({ error: 'Unauthorized', message: 'Missing authorization header' });
        return;
      }
      
      if (!auth.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid authorization format' });
        return;
      }
      
      const token = auth.slice(7);
      if (!this.apiKeys.has(token)) {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
        return;
      }
      
      next();
    };
  }

  /**
   * Config file based authentication middleware
   */
  private configFileAuthMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
    const configPath = this.config.configPath || '/etc/speclang/mcp-auth.json';
    let usersConfig: MCPAuthUsersConfig | null = null;
    
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        usersConfig = JSON.parse(content);
      }
    } catch (error) {
      console.error(`Failed to load auth config from ${configPath}:`, error);
    }
    
    const users = new Map<string, { hash: string; permissions: string[] }>();
    if (usersConfig?.users) {
      for (const user of usersConfig.users) {
        users.set(user.user, { hash: user.hash, permissions: user.permissions });
      }
    }
    
    return (req: Request, res: Response, next: NextFunction) => {
      const auth = req.headers.authorization;
      
      if (!auth) {
        res.status(401).json({ error: 'Unauthorized', message: 'Missing authorization header' });
        return;
      }
      
      if (!auth.startsWith('Basic ')) {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid authorization format' });
        return;
      }
      
      const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf-8');
      const [user, pass] = decoded.split(':');
      
      const userData = users.get(user);
      if (!userData) {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
        return;
      }
      
      const hash = crypto.createHash('sha256').update(pass).digest('hex');
      if (hash !== userData.hash) {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
        return;
      }
      
      (req as Request & { authUser?: string; authPermissions?: string[] }).authUser = user;
      (req as Request & { authUser?: string; authPermissions?: string[] }).authPermissions = userData.permissions;
      next();
    };
  }

  /**
   * TLS client certificate authentication middleware
   */
  private tlsClientCertAuthMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      const cert = (req as Request & { socket?: { getPeerCertificate?: () => unknown } }).socket?.getPeerCertificate();
      
      if (!cert || typeof cert !== 'object' || !('subject' in cert)) {
        res.status(401).json({ error: 'Unauthorized', message: 'Client certificate required' });
        return;
      }
      
      const cn = (cert.subject as Record<string, string[]>).CN?.[0];
      if (!cn) {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid certificate subject' });
        return;
      }
      
      (req as Request & { authUser?: string }).authUser = cn;
      next();
    };
  }
  
  /**
   * Validate API key (for MCP protocol)
   */
  validateApiKey(key: string): boolean {
    if (!this.config.enabled) {
      return true;
    }
    return this.apiKeys.has(key);
  }
  
  /**
   * Check if auth is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
  
  /**
   * Get auth type
   */
  getType(): string {
    return this.config.type;
  }
}

/**
 * Create auth instance from config
 */
export function createAuth(config: MCPAuthConfig): MCPAuth {
  return new MCPAuth(config);
}
