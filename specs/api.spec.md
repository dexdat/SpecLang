# speclang-header lines:11
id: "@speclang/api-spec"
version: 0.1.0
layer: 1
project_level: Alpha
tags: [api, rest, http, integration]
children:
    - "@ref:specs/api.spec.dir/openapi"
agent_support: agent_autonomous
short: SpecLang API - REST endpoints for external integration
---
# SpecLang API

REST API endpoints for integrating SpecLang with external tools, services, and workflows.

## Overview

The SpecLang API provides programmatic access to all core functionality for IDEs, CI/CD systems, monitoring tools, and external applications.

```speclang
# @block:api/overview @kind:note
API provides:
- Spec Management: CRUD operations on specs
- Cascade Control: Start, stop, monitor reactive loops
- Validation: Validate specs and get detailed results
- Code Generation: Trigger generation to target languages
- Search: Full-text and semantic search across specs
- Messages: MCP message inbox for human-AI communication
- Monitoring: System health and performance metrics
```

## Design Principles

```speclang
# @block:api/principles @kind:note
- RESTful: Resources are specs, cascades, messages
- Stateless: Each request contains all needed information
- Consistent: Same patterns across all endpoints
- Versioned: URL versioning (/api/v1/)
- Documented: OpenAPI 3.1 specification generated from specs
- Secure: Bearer token or API key authentication
```

## Authentication

```speclang
# @block:api/auth @kind:entity
Authentication:
  bearer_token:
    header: "Authorization: Bearer <token>"
    scopes: [read, write, admin]
    
  api_key:
    header: "X-API-Key: <key>"
    scopes: [read, write]
```

## Rate Limiting

```speclang
# @block:api/rate-limits @kind:entity
RateLimits:
  default:
    requests_per_minute: 60
    burst: 10
    
  by_endpoint:
    /search: 30
    /generate: 10
    /validate: 30
    
  headers:
    - X-RateLimit-Limit
    - X-RateLimit-Remaining
    - X-RateLimit-Reset
```

## Error Handling

```speclang
# @block:api/errors @kind:entity
ErrorResponse:
  code: String
  message: String
  details: Object?
  request_id: UUID
  
StatusCodes:
  400: Bad Request
  401: Unauthorized
  403: Forbidden
  404: Not Found
  429: Rate Limited
  500: Internal Error
```

## Pagination

```speclang
# @block:api/pagination @kind:entity
Pagination:
  type: cursor_based
  parameters:
    limit: Integer (default: 20, max: 100)
    cursor: String (opaque)
  response:
    items: Array
    cursor: String?
    total: Integer
```

## Endpoints Summary

```speclang
# @block:api/endpoints @kind:table
| Endpoint | Method | Description |
|----------|--------|-------------|
| /specs | GET | List all specs |
| /specs | POST | Create spec |
| /specs/{id} | GET | Get spec by ID |
| /specs/{id} | PUT | Update spec |
| /specs/{id} | DELETE | Delete spec |
| /cascade | GET | Get cascade status |
| /cascade | POST | Control cascade |
| /cascade/trigger | POST | Trigger cascade |
| /validate | POST | Validate specs |
| /messages | GET | List messages |
| /messages/{id} | GET | Get message |
| /messages/{id} | POST | Respond to message |
| /search | GET | Search specs |
| /health | GET | Health check |
| /metrics | GET | System metrics |
| /generate | POST | Generate code |
```

## Children

- "@ref:specs/api.spec.dir/openapi - OpenAPI specification requirements

## References

- "@ref:specs/cli - CLI commands (mirrors API)
- @ref:specs/mcp - MCP server
- @ref:specs/cascade - Cascade system
- @ref:specs/validation - Validation rules