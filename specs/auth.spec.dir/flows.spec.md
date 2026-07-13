# speclang-header lines:10
id: "@speclang/auth/flows"
version: 0.1.0
layer: 2
project_level: "Alpha"
agent_support: "agent_autonomous"
tags: [auth, flows, mcp, typescript]
short: "Authentication flows: factory function and middleware usage"
parent: "@ref:speclang/authpart: "2/2""
---
# Authentication Flows

Authentication factory function and usage patterns.

## createAuth Factory

### @block::auth/create-auth @kind:code
```typescript
export function createAuth(config: MCPAuthConfig): MCPAuth {
  return new MCPAuth(config);
}
```

**Description**: Factory function to create an MCPAuth instance from configuration.

**Parameters**:
- `config`: MCPAuthConfig object

**Returns**: `MCPAuth` instance

**Usage**:
```typescript
import { createAuth } from './auth.js';

const auth = createAuth({
  enabled: true,
  type: 'token',
  token: 'secret-token'
});
```

## Authentication Middleware Flow

### @block::auth/middleware-flow @kind:flow
**Description**: How authentication middleware integrates into Express server.

**Steps**:
1. Server reads configuration (from env or config file)
2. Calls `createAuth(config)` to instantiate authentication middleware
3. Calls `auth.middleware()` to get Express middleware function
4. Attaches middleware to Express app (global or route-specific)
5. Middleware validates incoming requests based on auth type:
   - `none`: No validation, passes through
   - `basic`: Validates `Authorization: Basic base64(user:pass)` header
   - `token`: Validates `Authorization: Bearer <token>` header
6. If validation fails, returns 401 Unauthorized
7. If validation passes, calls `next()` to continue request processing

**Integration Example**:
```typescript
import express from 'express';
import { createAuth } from './auth.js';

const app = express();
const auth = createAuth(config);
app.use(auth.middleware());
```

## Token Validation Flow

### @block::auth/token-validation-flow @kind:flow
**Description**: Flow for validating API tokens in MCP protocol.

**Steps**:
1. Client includes `Authorization: Bearer <token>` header in request
2. Middleware extracts token from header
3. Calls `auth.validateApiKey(token)` to check against configured API keys
4. Returns `true` if token matches any configured key, `false` otherwise
5. Used for MCP tool calls and SSE connections

## Related Flows

See also:
- @ref:speclang/mcp.authentication for remote/server authentication methods
- @ref:speclang/examples/auth for example login operation flow