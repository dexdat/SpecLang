/**
 * SPECLANG-GENERATED: MCP Server Authentication
 * Source: @speclang/mcp
 */

import type { MCPAuthConfig } from './types.js';
import type { Request, Response, NextFunction } from 'express';

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
