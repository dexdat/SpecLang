# speclang-header lines:15
id: "@speclang/api"
version: 0.1.0
layer: 1
tags: [api, rest, http, integration]
children:
  - "@ref:specs/api.dir/openapi"
project_level: Alpha
agent_support: agent_autonomous
short: SpecLang API - REST endpoints for external integration
---
# SpecLang API

REST API endpoints for integrating SpecLang with external tools, services, and workflows.

## Overview

```speclang
# @block:api/overview @kind:note
The SpecLang API provides programmatic access to all core functionality:

1. **Spec Management**: CRUD operations on specs
2. **Cascade Control**: Start, stop, monitor reactive loops
3. **Validation**: Validate specs and get detailed results
4. **Code Generation**: Trigger generation to target languages
5. **Search**: Full-text and semantic search across specs
6. **Messages**: MCP message inbox for human-AI communication
7. **Monitoring**: System health and performance metrics

All endpoints use JSON and follow OpenAPI 3.1 specification.
Authentication via Bearer token or API key.
```

## API Philosophy

```speclang
# @block:api/philosophy @kind:note
Design principles:

- **RESTful**: Resources are specs, cascades, messages
- **Stateless**: Each request contains all needed information
- **Consistent**: Same patterns across all endpoints
- **Versioned**: URL versioning (/api/v1/)
- **Documented**: OpenAPI spec for all endpoints
- **Testable**: Every endpoint has examples and tests

The API mirrors the CLI commands - what you can do in CLI, you can do via API.
```

## Authentication

```speclang
# @block:api/auth @kind:entity
AuthenticationMethods:
  
  bearer_token:
    description: "JWT token from login"
    header: "Authorization: Bearer <token>"
    scopes: [read, write, admin]
    
  api_key:
    description: "API key from user settings"
    header: "X-API-Key: <key>"
    scopes: [read, write]  # no admin
    
  oauth2:
    description: "OAuth2 integration"
    flows: [authorization_code, client_credentials]
    scopes: [read, write, admin]
```

## Rate Limiting

```speclang
# @block:api/rate-limits @kind:entity
RateLimits:
  
  default:
    requests_per_minute: 60
    burst: 10
    
  by_endpoint:
    /search: 30  # expensive operation
    /generate: 10  # resource intensive
    /validate: 30  # moderate
    /specs: 100  # cheap
    
  headers:
    - X-RateLimit-Limit
    - X-RateLimit-Remaining
    - X-RateLimit-Reset
    
  on_exceeded:
    status: 429
    headers:
      Retry-After: seconds
```

## Error Handling

```speclang
# @block:api/errors @kind:entity
ErrorHandling:
  
  error_response:
    code: string (VALIDATION_ERROR, NOT_FOUND, etc.)
    message: string (human-readable)
    details: object (additional context)
    request_id: uuid (for debugging)
    
  error_codes:
    VALIDATION_ERROR: 400
    NOT_FOUND: 404
    UNAUTHORIZED: 401
    FORBIDDEN: 403
    RATE_LIMITED: 429
    INTERNAL_ERROR: 500
    
  error_example:
    {
      "code": "VALIDATION_ERROR",
      "message": "Spec header is missing required field 'version'",
      "details": {
        "field": "version",
        "spec_id": "@specs/auth"
      },
      "request_id": "550e8400-e29b-41d4-a716-446655440000"
    }
```

## Pagination

```speclang
# @block:api/pagination @kind:entity
Pagination:
  
  cursor_based:
    description: "Use cursor for consistent pagination"
    parameters:
      limit: integer (default: 20, max: 100)
      cursor: string (opaque cursor from previous response)
      
  response:
    items: array
    cursor: string (for next page, null if last)
    total: integer (total count)
    
  example:
    request: GET /specs?limit=10&cursor=abc123
    response:
      {
        "specs": [...],
        "cursor": "def456",
        "total": 150
      }
```

## Sub-specs

This spec has child specs:

- @ref:specs/api.dir/openapi - Complete OpenAPI 3.1 specification

## Integration Points

```speclang
# @block:api/integration @kind:entity
IntegrationPoints:
  
  with_cli:
    - Every CLI command has equivalent API endpoint
    - API responses match CLI output formats
    - Same configuration applies
    
  with_mcp:
    - MCP server can call API endpoints
    - Webhooks for event notifications
    - Shared authentication
    
  with_external_tools:
    - IDE extensions can use API
    - CI/CD pipelines can validate/generate
    - Monitoring tools can collect metrics
```

## References

- @ref:specs/api.dir/openapi - OpenAPI specification
- @ref:specs/cli - CLI commands
- @ref:specs/mcp - MCP server
- @ref:specs/cascade - Cascade system
- @ref:specs/validation - Validation rules