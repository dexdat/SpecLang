---
name: sip-118-mcp-errorcodes-speclang-v0
title: "SIP 118: MCP Error Codes"
version: 0.1.0
description: Complete specification of MCP error codes and error handling
category: standard
---

# SIP 118: MCP Error Codes

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP provides the complete specification of MCP error codes including JSON-RPC errors, authentication errors, and custom application errors.

### Quick Start

```yaml
# Error response format
{
  "jsonrpc": "2.0",
  "id": "request-123",
  "error": {
    "code": -32001,
    "message": "Authentication failed",
    "data": {
      "reason": "invalid_token",
      "details": "Token has expired"
    }
  }
}
```

### When to Read This

- **Error handling**: Implementing robust error handling
- **Debugging**: Understanding error codes
- **API design**: Consistent error responses

### Related SIPs

- SIP 114: MCP Architecture
- SIP 116: Token Authentication
- SIP 117: API Key Authentication

## Abstract

This SIP defines the complete error code system for MCP, including JSON-RPC standard errors, authentication errors, authorization errors, rate limiting, and tool-specific errors.

## Motivation

Users need:
- **Standard errors**: JSON-RPC compliance
- **Detailed errors**: Meaningful error messages
- **Debugging**: Error context and details
- **Recovery**: Error-specific handling

## Rationale

**Error Code System:**

1. JSON-RPC 2.0 compliance
2. Extended for auth and application
3. Rich error details for debugging
4. Consistent error handling patterns

## Specification

### JSON-RPC Standard Errors

```yaml
StandardErrors:
  - code: -32700
    name: "Parse error"
    message: "Invalid JSON was received"
    http_status: 400
    description: "The JSON sent is not a valid JSON-RPC 2.0 message"
    
  - code: -32600
    name: "Invalid request"
    message: "The JSON sent is not a valid Request object"
    http_status: 400
    description: "The request does not match JSON-RPC 2.0 specification"
    
  - code: -32601
    name: "Method not found"
    message: "The method does not exist or is not available"
    http_status: 404
    description: "The requested method is not implemented"
    
  - code: -32602
    name: "Invalid params"
    message: "Invalid method parameters"
    http_status: 400
    description: "The parameters provided are invalid"
    
  - code: -32603
    name: "Internal error"
    message: "Internal JSON-RPC error"
    http_status: 500
    description: "An unexpected error occurred on the server"
```

### Authentication Errors

```yaml
AuthErrors:
  - code: -32000
    name: "Auth required"
    message: "Authentication is required"
    http_status: 401
    description: "No authentication credentials provided"
    data:
      - auth_methods: ["bearer", "api_key"]
      
  - code: -32001
    name: "Auth failed"
    message: "Authentication failed"
    http_status: 401
    description: "Invalid or malformed credentials"
    data:
      - reason: "invalid_token" | "invalid_credentials" | "malformed_header"
      
  - code: -32002
    name: "Token expired"
    message: "Access token has expired"
    http_status: 401
    description: "The access token is no longer valid"
    data:
      - expired_at: "ISO8601 timestamp"
      - refresh_endpoint: "/auth/refresh"
      
  - code: -32003
    name: "Token revoked"
    message: "Token has been revoked"
    http_status: 401
    description: "The token was explicitly revoked"
    data:
      - revoked_at: "ISO8601 timestamp"
      - reason: "user_request" | "security" | "expired"
```

### Authorization Errors

```yaml
AuthzErrors:
  - code: -32010
    name: "Permission denied"
    message: "Insufficient permissions"
    http_status: 403
    description: "User lacks required permissions"
    data:
      - required_scopes: ["read", "write"]
      - current_scopes: ["read"]
      
  - code: -32011
    name: "Scope insufficient"
    message: "Insufficient scope for this operation"
    http_status: 403
    description: "Token scopes don't cover required permission"
    data:
      - required: "execute:tools"
      - available: "read:specs"
      
  - code: -32012
    name: "Resource forbidden"
    message: "Access to this resource is forbidden"
    http_status: 403
    description: "User cannot access the specific resource"
    data:
      - resource_type: "spec"
      - resource_id: "@specs/admin"
```

### Rate Limiting Errors

```yaml
RateLimitErrors:
  - code: -32020
    name: "Rate limited"
    message: "Rate limit exceeded"
    http_status: 429
    description: "Too many requests in time window"
    data:
      - limit: 100
      - window: "hour"
      - remaining: 0
      - reset_at: "ISO8601 timestamp"
      
  - code: -32021
    name: "Rate limit exceeded"
    message: "Rate limit exceeded, request blocked"
    http_status: 429
    description: "Repeated rate limit violations"
    data:
      - retry_after: 3600
      - blocked_until: "ISO8601 timestamp"
```

### Resource Errors

```yaml
ResourceErrors:
  - code: -32030
    name: "Resource not found"
    message: "The requested resource does not exist"
    http_status: 404
    description: "Resource with given ID not found"
    data:
      - resource_type: "spec"
      - resource_id: "@specs/missing"
      
  - code: -32031
    name: "Resource conflict"
    message: "Resource already exists"
    http_status: 409
    description: "Cannot create duplicate resource"
    data:
      - resource_type: "spec"
      - resource_id: "@specs/existing"
      
  - code: -32032
    name: "Resource locked"
    message: "Resource is locked by another session"
    http_status: 423
    description: "Cannot modify locked resource"
    data:
      - resource_type: "spec"
      - resource_id: "@specs/auth"
      - locked_by: "session-123"
      - locked_at: "ISO8601 timestamp"
```

### Tool Errors

```yaml
ToolErrors:
  - code: -32040
    name: "Tool not found"
    message: "The requested tool does not exist"
    http_status: 404
    description: "Tool name not registered"
    data:
      - tool_name: "speclang_nonexistent"
      - available_tools: ["speclang_search", "speclang_get_spec"]
      
  - code: -32041
    name: "Tool execution failed"
    message: "Tool execution failed"
    http_status: 500
    description: "Error during tool execution"
    data:
      - tool_name: "speclang_search"
      - error_type: "DatabaseError"
      - details: "Connection timeout"
      
  - code: -32042
    name: "Tool timeout"
    message: "Tool execution timed out"
    http_status: 504
    description: "Tool took too long to complete"
    data:
      - tool_name: "speclang_semantic_search"
      - timeout_ms: 30000
      - elapsed_ms: 30001
```

### Validation Errors

```yaml
ValidationErrors:
  - code: -32050
    name: "Invalid parameters"
    message: "Method parameters are invalid"
    http_status: 400
    description: "Parameter validation failed"
    data:
      - param: "query"
      - error: "required"
      - message: "Query parameter is required"
      
  - code: -32051
    name: "Parameter type error"
    message: "Parameter has wrong type"
    http_status: 400
    description: "Parameter type mismatch"
    data:
      - param: "limit"
      - expected: "integer"
      - received: "string"
      
  - code: -32052
    name: "Parameter constraint"
    message: "Parameter violates constraint"
    http_status: 400
    description: "Value outside allowed range"
    data:
      - param: "limit"
      - constraint: "minimum: 1, maximum: 100"
      - value: 0
```

### Server Errors

```yaml
ServerErrors:
  - code: -32000
    name: "Internal error"
    message: "An internal error occurred"
    http_status: 500
    description: "Unexpected server error"
    data:
      - error_id: "err-abc123"
      - type: "UnexpectedError"
      
  - code: -32001
    name: "Service unavailable"
    message: "Service is temporarily unavailable"
    http_status: 503
    description: "Server maintenance or overload"
    data:
      - retry_after: 60
      - reason: "maintenance" | "overload"
      
  - code: -32002
    name: "Database error"
    message: "Database operation failed"
    http_status: 500
    description: "Database connection or query error"
    data:
      - operation: "SELECT"
      - table: "specs"
      - error: "connection_timeout"
```

### Error Response Format

```yaml
ResponseFormat:
  jsonrpc: "2.0"
  id: string | number | null
  error:
    code: integer
    message: string
    data: object (optional)
    
  # Full example
  {
    "jsonrpc": "2.0",
    "id": "req-123",
    "error": {
      "code": -32041,
      "message": "Tool execution failed",
      "data": {
        "tool_name": "speclang_search",
        "error_type": "DatabaseError",
        "details": "Connection timeout after 30s",
        "error_id": "err-db-456"
      }
    }
  }
```

### Error Handling Best Practices

```yaml
BestPractices:
  client:
    - Always check for error in response
    - Log error codes for debugging
    - Implement retry with backoff
    - Show meaningful messages to users
    
  server:
    - Include error_id for tracking
    - Log full error details server-side
    - Sanitize error messages
    - Return appropriate HTTP status
```

## Backwards Compatibility

- Error codes stable across versions
- New errors added with new codes
- Error messages may change

## References

- @ref:specs/mcp
- SIP 114: MCP Architecture
- SIP 116: Token Authentication
- SIP 117: API Key Authentication
- JSON-RPC 2.0 Specification

## Copyright

This document is in the public domain.
