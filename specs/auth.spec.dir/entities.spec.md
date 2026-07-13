# speclang-header lines:10
id: "@speclang/auth/entities"
version: 0.1.0
layer: 2
project_level: "Alpha"
agent_support: "agent_autonomous"
tags: [auth, entities, mcp, typescript]
short: "Authentication entities: MCPAuth class and configuration"
parent: "@ref:speclang/authpart: "1/2""
---
# Authentication Entities

Core authentication entities for the MCP server.

## MCPAuthConfig

### @block::auth/mcp-auth-config @kind:entity
```typescript
export interface MCPAuthConfig {
  enabled: boolean;
  type: 'none' | 'basic' | 'token';
  apiKeys?: string[];
  user?: string;
  pass?: string;
  token?: string;
}
```

**Description**: Configuration for MCP authentication middleware.

**Fields**:
- `enabled`: Whether authentication is enabled
- `type`: Authentication type (`none`, `basic`, or `token`)
- `apiKeys`: Optional list of API keys for token authentication
- `user`: Username for basic authentication
- `pass`: Password for basic authentication
- `token`: Default token for token authentication

## MCPAuth

### @block::auth/mcp-auth @kind:entity
```typescript
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
  
  middleware(): (req: Request, res: Response, next: NextFunction) => void;
  private basicAuthMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
  private tokenAuthMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
  validateApiKey(key: string): boolean;
  isEnabled(): boolean;
  getType(): string;
}
```

**Description**: Authentication middleware class for MCP server.

**Methods**:
- `middleware()`: Returns Express middleware based on config type
- `basicAuthMiddleware()`: Basic authentication middleware
- `tokenAuthMiddleware()`: Token/Bearer authentication middleware
- `validateApiKey(key)`: Validate API key for MCP protocol
- `isEnabled()`: Check if auth is enabled
- `getType()`: Get auth type

## Related Entities

See also:
- @ref:speclang/mcp.authentication for MCP authentication methods
- @ref:speclang/examples/auth for example authentication entities