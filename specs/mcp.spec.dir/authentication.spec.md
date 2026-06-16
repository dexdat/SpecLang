# speclang-header lines:12
id: "@speclang/mcp.authentication"
parent: "@ref:speclang/mcp"
siblings:
  next: "@ref:specs/mcp.spec.dir/error-handling"
short: "Authentication methods for remote and server modes"
project_level: Alpha
agent_support: agent_assisted
tags: [mcp, speclang]
version: 0.1.0
layer: 3
---
# MCP Authentication

### @mcp/auth

```speclang
# @block:mcp/auth @kind:entity
Authentication:
  editor_initiated:
    method: None (trusted local process)
    note: Editor spawns server, inherits trust
    
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
        
  server_mode:
    methods:
      config_file:
        location: /etc/speclang/mcp-auth.json
        format: { users: [{ user, hash, permissions }] }
        
      tls_client_cert:
        method: Mutual TLS
        use_case: Enterprise
```

### @mcp/auth-impl

```speclang
# @block:mcp/auth-impl @kind:code
```typescript
class AuthMiddleware {
  private users: Map<string, string> = new Map();
  private tokens: Set<string> = new Set();
  
  basicAuth(args: string[]): (req, res, next) => void {
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
  
  tokenAuth(args: string[]): (req, res, next) => void {
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
}
```
```
