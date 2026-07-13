# speclang-header lines:9
id: "@speclang/api-spec-dir/openapi"
version: 0.1.0
layer: 2
tags: [api, openapi, rest, http, specification]
project_level: Alpha
agent_support: agent_autonomous
short: OpenAPI specification requirements - generates openapi.yaml
---

# OpenAPI Specification Requirements

This spec defines what the SpecLang REST API OpenAPI specification should contain. The code generator will produce `openapi.yaml.spec` from this spec, which is symlinked to `openapi.yaml`.

## Generation Target

```
This spec → openapi.yaml.spec → openapi.yaml (symlink)
```

## Overview

SpecLang provides a REST API for external integration with IDEs, CI/CD systems, monitoring tools, and other external applications.

```speclang
# @block:openapi/overview @kind:note
OpenAPI 3.1 specification covering:
- Spec Management: CRUD operations on specs
- Cascade Control: Start, stop, monitor cascades
- Validation: Validate specs and get results
- Code Generation: Trigger code generation
- Search: Full-text search across specs
- Messages: MCP message inbox
- Monitoring: System health and metrics
```

## OpenAPI Version

```speclang
# @block:openapi/version @kind:entity
OpenAPIVersion:
  version: "3.1.0"
  reason: "Latest stable version with full JSON Schema support"
```

## Server Configuration

```speclang
# @block:openapi/servers @kind:entity
Servers:
  development:
    url: "http://localhost:3000/api/v1"
    description: "Local development server"
    
  production:
    url: "https://api.speclang.dev/v1"
    description: "Production server"
```

## API Information

```speclang
# @block:openapi/info @kind:entity
APIInfo:
  title: "SpecLang API"
  version: "1.0.0"
  description: |
    REST API for SpecLang specification-driven development system.
    
    ## Authentication
    Most endpoints require authentication via Bearer token or API key.
    
    ## Rate Limiting
    Rate limits are applied per endpoint. Check X-RateLimit-* headers.
    
    ## Pagination
    List endpoints support cursor-based pagination.
    
  contact:
    name: "SpecLang Support"
    email: "support@speclang.dev"
    
  license:
    name: "MIT"
    url: "https://opensource.org/licenses/MIT"
```

## Authentication Schemes

```speclang
# @block:openapi/security @kind:entity
SecuritySchemes:
  bearerAuth:
    type: "http"
    scheme: "bearer"
    bearerFormat: "JWT"
    description: "JWT token from authentication endpoint"
    scopes: [read, write, admin]
    
  apiKey:
    type: "apiKey"
    in: "header"
    name: "X-API-Key"
    description: "API key from user settings"
    scopes: [read, write]

DefaultSecurity:
  - bearerAuth: []
  - apiKey: []
```

## Common Schemas

### @openapi/schema-spec

```speclang
# @block:openapi/schema-spec @kind:entity
SpecSchema:
  type: "object"
  required: [id, version, layer, content]
  properties:
    id:
      type: "string"
      pattern: "^@[a-z0-9-]+/[a-z0-9-/]+"
      example: "@specs/auth/login"
      description: "Unique spec identifier"
    version:
      type: "string"
      pattern: "^\\d+\\.\\d+\\.\\d+$"
      example: "1.0.0"
      description: "Semantic version"
    layer:
      type: "integer"
      minimum: 0
      maximum: 10
      description: "Depth in dependency tree"
    project_level:
      type: "string"
      enum: [POC, MVP, Alpha, Beta, Production, Startup, SMB, MSB, Enterprise]
    agent_support:
      type: "string"
      enum: [human_only, agent_assisted, agent_autonomous]
    tags:
      type: "array"
      items:
        type: "string"
    short:
      type: "string"
      maxLength: 100
    content:
      type: "string"
    created_at:
      type: "string"
      format: "date-time"
    updated_at:
      type: "string"
      format: "date-time"
```

### @openapi/schema-error

```speclang
# @block:openapi/schema-error @kind:entity
ErrorSchema:
  type: "object"
  required: [code, message]
  properties:
    code:
      type: "string"
      enum: [VALIDATION_ERROR, NOT_FOUND, UNAUTHORIZED, FORBIDDEN, RATE_LIMITED, INTERNAL_ERROR]
      description: "Error code"
    message:
      type: "string"
      description: "Human-readable error message"
    details:
      type: "object"
      additionalProperties: true
      description: "Additional error context"
    request_id:
      type: "string"
      format: "uuid"
      description: "Request ID for debugging"
```

### @openapi/schema-cascade

```speclang
# @block:openapi/schema-cascade @kind:entity
CascadeSchema:
  type: "object"
  required: [id, status, started_at]
  properties:
    id:
      type: "string"
      format: "uuid"
    status:
      type: "string"
      enum: [running, paused, completed, failed]
    started_at:
      type: "string"
      format: "date-time"
    completed_at:
      type: "string"
      format: "date-time"
    depth:
      type: "integer"
    files_changed:
      type: "integer"
    errors:
      type: "array"
      items:
        $ref: "#/components/schemas/Error"
```

### @openapi/schema-validation

```speclang
# @block:openapi/schema-validation @kind:entity
ValidationSchema:
  type: "object"
  required: [valid, errors]
  properties:
    valid:
      type: "boolean"
    errors:
      type: "array"
      items:
        type: "object"
        properties:
          location:
            type: "string"
            description: "file:line:column"
          message:
            type: "string"
          severity:
            type: "string"
            enum: [error, warning, info]
          suggestion:
            type: "string"
```

### @openapi/schema-message

```speclang
# @block:openapi/schema-message @kind:entity
MessageSchema:
  type: "object"
  required: [id, type, priority, title, status]
  properties:
    id:
      type: "string"
    type:
      type: "string"
      enum: [ambiguity, incompleteness, validation_failure, question, suggestion]
    priority:
      type: "string"
      enum: [blocking, high, medium, low, informational]
    title:
      type: "string"
    description:
      type: "string"
    status:
      type: "string"
      enum: [new, in_progress, resolved, dismissed]
    created_at:
      type: "string"
      format: "date-time"
    resolved_at:
      type: "string"
      format: "date-time"
```

## Endpoints

### @openapi/endpoint-specs

```speclang
# @block:openapi/endpoint-specs @kind:entity
SpecsEndpoints:
  
  list_specs:
    method: GET
    path: /specs
    summary: "List all specs"
    tags: [Specs]
    parameters:
      - name: limit
        in: query
        type: integer
        default: 20
        maximum: 100
      - name: cursor
        in: query
        type: string
      - name: tag
        in: query
        type: string
      - name: layer
        in: query
        type: integer
      - name: search
        in: query
        type: string
    response:
      200:
        type: object
        properties:
          specs:
            type: array
            items: Spec
          cursor:
            type: string
          total:
            type: integer
            
  create_spec:
    method: POST
    path: /specs
    summary: "Create a new spec"
    tags: [Specs]
    request:
      body: Spec
    response:
      201: Spec
      400: Error
      
  get_spec:
    method: GET
    path: /specs/{id}
    summary: "Get spec by ID"
    tags: [Specs]
    parameters:
      - name: id
        in: path
        required: true
        type: string
    response:
      200: Spec
      404: Error
      
  update_spec:
    method: PUT
    path: /specs/{id}
    summary: "Update spec"
    tags: [Specs]
    parameters:
      - name: id
        in: path
        required: true
        type: string
    request:
      body: Spec
    response:
      200: Spec
      404: Error
      
  delete_spec:
    method: DELETE
    path: /specs/{id}
    summary: "Delete spec"
    tags: [Specs]
    parameters:
      - name: id
        in: path
        required: true
        type: string
    response:
      204: null
      404: Error
```

### @openapi/endpoint-cascade

```speclang
# @block:openapi/endpoint-cascade @kind:entity
CascadeEndpoints:
  
  get_status:
    method: GET
    path: /cascade
    summary: "Get cascade status"
    tags: [Cascade]
    response:
      200: Cascade
      
  control:
    method: POST
    path: /cascade
    summary: "Control cascade"
    tags: [Cascade]
    request:
      body:
        type: object
        required: [action]
        properties:
          action:
            type: string
            enum: [start, stop, pause, resume]
          options:
            type: object
            properties:
              max_depth:
                type: integer
              quiet_period:
                type: integer
    response:
      200:
        type: object
        properties:
          status:
            type: string
            
  trigger:
    method: POST
    path: /cascade/trigger
    summary: "Manually trigger cascade"
    tags: [Cascade]
    request:
      body:
        type: object
        required: [file]
        properties:
          file:
            type: string
            description: "File path to trigger"
    response:
      202:
        type: object
        properties:
          cascade_id:
            type: string
```

### @openapi/endpoint-validation

```speclang
# @block:openapi/endpoint-validation @kind:entity
ValidationEndpoints:
  
  validate:
    method: POST
    path: /validate
    summary: "Validate specs"
    tags: [Validation]
    request:
      body:
        type: object
        properties:
          specs:
            type: array
            items: string
            description: "Spec IDs to validate (empty = all)"
          type:
            type: string
            enum: [basic, language-blocks, autonomous, all]
            default: all
          fix:
            type: boolean
            default: false
    response:
      200: Validation
```

### @openapi/endpoint-messages

```speclang
# @block:openapi/endpoint-messages @kind:entity
MessagesEndpoints:
  
  list:
    method: GET
    path: /messages
    summary: "List messages"
    tags: [Messages]
    parameters:
      - name: status
        in: query
        type: string
        enum: [new, in_progress, resolved, dismissed]
      - name: priority
        in: query
        type: string
        enum: [blocking, high, medium, low, informational]
      - name: limit
        in: query
        type: integer
        default: 20
    response:
      200:
        type: object
        properties:
          messages:
            type: array
            items: Message
          total:
            type: integer
            
  get:
    method: GET
    path: /messages/{id}
    summary: "Get message details"
    tags: [Messages]
    parameters:
      - name: id
        in: path
        required: true
        type: string
    response:
      200: Message
      
  respond:
    method: POST
    path: /messages/{id}
    summary: "Respond to message"
    tags: [Messages]
    parameters:
      - name: id
        in: path
        required: true
        type: string
    request:
      body:
        type: object
        required: [action]
        properties:
          action:
            type: string
            enum: [resolve, dismiss, respond, escalate]
          content:
            type: string
    response:
      200:
        type: object
        properties:
          status:
            type: string
```

### @openapi/endpoint-search

```speclang
# @block:openapi/endpoint-search @kind:entity
SearchEndpoints:
  
  search:
    method: GET
    path: /search
    summary: "Search across specs"
    tags: [Search]
    parameters:
      - name: q
        in: query
        required: true
        type: string
      - name: kind
        in: query
        type: string
        enum: [entity, operation, test, note, code, table, diagram]
      - name: tag
        in: query
        type: string
      - name: limit
        in: query
        type: integer
        default: 20
    response:
      200:
        type: object
        properties:
          results:
            type: array
            items:
              type: object
              properties:
                spec_id:
                  type: string
                block_id:
                  type: string
                snippet:
                  type: string
                score:
                  type: number
          total:
            type: integer
```

### @openapi/endpoint-monitoring

```speclang
# @block:openapi/endpoint-monitoring @kind:entity
MonitoringEndpoints:
  
  health:
    method: GET
    path: /health
    summary: "System health check"
    tags: [Monitoring]
    security: []  # No auth required
    response:
      200:
        type: object
        properties:
          status:
            type: string
            enum: [healthy, degraded, unhealthy]
          version:
            type: string
          uptime:
            type: integer
          components:
            type: object
            properties:
              database:
                type: string
                enum: [ok, error]
              git:
                type: string
                enum: [ok, error]
              cascade:
                type: string
                enum: [running, paused, stopped]
                
  metrics:
    method: GET
    path: /metrics
    summary: "System metrics"
    tags: [Monitoring]
    response:
      200:
        type: object
        properties:
          cascade:
            type: object
            properties:
              depth: integer
              files_changed: integer
              commits: integer
          specs:
            type: object
            properties:
              total: integer
              by_layer:
                type: object
                additionalProperties: integer
          messages:
            type: object
            properties:
              unread: integer
              by_priority:
                type: object
                additionalProperties: integer
```

### @openapi/endpoint-generate

```speclang
# @block:openapi/endpoint-generate @kind:entity
GenerateEndpoints:
  
  generate:
    method: POST
    path: /generate
    summary: "Generate code from specs"
    tags: [Generation]
    request:
      body:
        type: object
        properties:
          specs:
            type: array
            items: string
            description: "Spec IDs to generate (empty = all)"
          target:
            type: string
            enum: [typescript, go, rust, python]
          watch:
            type: boolean
            default: false
    response:
      202:
        type: object
        properties:
          job_id:
            type: string
          status:
            type: string
            enum: [queued, running, completed, failed]
```

## Error Responses

```speclang
# @block:openapi/error-responses @kind:entity
ErrorResponses:
  400:
    description: "Bad Request"
    schema: Error
  401:
    description: "Unauthorized"
    schema: Error
  403:
    description: "Forbidden"
    schema: Error
  404:
    description: "Not Found"
    schema: Error
  429:
    description: "Rate Limited"
    headers:
      X-RateLimit-Limit: integer
      X-RateLimit-Remaining: integer
      X-RateLimit-Reset: integer
      Retry-After: integer
    schema: Error
  500:
    description: "Internal Server Error"
    schema: Error
```

## Rate Limiting Configuration

```speclang
# @block:openapi/rate-limits @kind:entity
RateLimitConfig:
  default:
    requests_per_minute: 60
    burst: 10
  endpoints:
    /search:
      requests_per_minute: 30
      reason: "Expensive full-text search"
    /generate:
      requests_per_minute: 10
      reason: "Resource-intensive code generation"
    /validate:
      requests_per_minute: 30
      reason: "Moderate CPU usage"
```

## CORS Configuration

```speclang
# @block:openapi/cors @kind:entity
CORSConfig:
  allowed_origins:
    - "http://localhost:*"
    - "https://*.speclang.dev"
  allowed_methods:
    - GET
    - POST
    - PUT
    - DELETE
    - PATCH
  allowed_headers:
    - Authorization
    - X-API-Key
    - Content-Type
    - X-Request-ID
```

## Content Types

```speclang
# @block:openapi/content-types @kind:entity
ContentTypes:
  request: "application/json"
  response: "application/json"
  error: "application/json"
```

## References

- "@ref:specs/api.spec - API overview
- @ref:specs/mcp - MCP server specification
- @ref:specs/validation/rules - Validation rules
- @ref:specs/cascade - Cascade system
- @ref:specs/cascade/error-handling - Error handling