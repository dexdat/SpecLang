# speclang-header lines:9
id: "@specs/mcp/auth"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
target: src/mcp/auth.ts
tags: [mcp, auth, security]
short: Authentication middleware
---

# MCP Server Authentication

Auth middleware supporting multiple auth types.

## Class: MCPAuth

### Methods

- `middleware()` - Returns Express middleware
- `validateApiKey(key)` - Validate API key
- `isEnabled()` - Check if auth enabled
- `getType()` - Get auth type

## Auth Types

- `none` - No auth
- `basic` - HTTP Basic
- `token` - Bearer token
- `config_file` - JSON file users
- `tls_client_cert` - TLS cert
