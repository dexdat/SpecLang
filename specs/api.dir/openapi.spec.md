# speclang-header lines:15
id: "@speclang/api/openapi"
version: 0.1.0
layer: 2
tags: [api, openapi, rest, http, specification]
parent: "@ref:specs/api"
project_level: Alpha
agent_support: agent_autonomous
short: OpenAPI specification for SpecLang REST API
---
# OpenAPI Specification

REST API definitions for SpecLang system integration with external tools and services.

## Overview

```speclang
# @block:api/openapi/overview @kind:note
SpecLang provides a REST API for external integration:

- **Spec Management**: Create, read, update, delete specs
- **Cascade Control**: Start, stop, monitor cascades
- **Validation**: Validate specs and get results
- **Code Generation**: Trigger code generation
- **Search**: Full-text search across specs
- **Monitoring**: System metrics and health

All endpoints return JSON and follow OpenAPI 3.1 specification.
```

## API Information

### @api/openapi/info

```yaml
openapi: 3.1.0
info:
  title: SpecLang API
  version: 1.0.0
  description: |
    REST API for SpecLang specification-driven development system.
    
    ## Authentication
    Most endpoints require authentication via Bearer token or API key.
    
    ## Rate Limiting
    Rate limits are applied per endpoint. Check X-RateLimit-* headers.
    
    ## Pagination
    List endpoints support cursor-based pagination with `limit` and `cursor` parameters.
    
  contact:
    name: SpecLang Support
    email: support@speclang.dev
    
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT
    
servers:
  - url: http://localhost:3000/api/v1
    description: Local development
  - url: https://api.speclang.dev/v1
    description: Production
```

## Authentication

### @api/openapi/auth

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT token from authentication endpoint
      
    apiKey:
      type: apiKey
      in: header
      name: X-API-Key
      description: API key from user settings
      
security:
  - bearerAuth: []
  - apiKey: []
```

## Common Schemas

### @api/openapi/schemas

```yaml
components:
  schemas:
    Spec:
      type: object
      required:
        - id
        - version
        - layer
        - content
      properties:
        id:
          type: string
          pattern: '^@[a-z0-9-]+/[a-z0-9-/]+'
          example: '@specs/auth/login'
        version:
          type: string
          pattern: '^\d+\.\d+\.\d+$'
          example: '1.0.0'
        layer:
          type: integer
          minimum: 0
          maximum: 10
        project_level:
          type: string
          enum: [POC, MVP, Alpha, Beta, Production, Startup, SMB, MSB, Enterprise]
        agent_support:
          type: string
          enum: [human_only, agent_assisted, agent_autonomous]
        tags:
          type: array
          items:
            type: string
        short:
          type: string
          maxLength: 100
        content:
          type: string
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time
          
    Error:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: string
          enum:
            - VALIDATION_ERROR
            - NOT_FOUND
            - UNAUTHORIZED
            - FORBIDDEN
            - RATE_LIMITED
            - INTERNAL_ERROR
        message:
          type: string
        details:
          type: object
          additionalProperties: true
        request_id:
          type: string
          format: uuid
          
    Cascade:
      type: object
      required:
        - id
        - status
        - started_at
      properties:
        id:
          type: string
          format: uuid
        status:
          type: string
          enum: [running, paused, completed, failed]
        started_at:
          type: string
          format: date-time
        completed_at:
          type: string
          format: date-time
        depth:
          type: integer
        files_changed:
          type: integer
        errors:
          type: array
          items:
            $ref: '#/components/schemas/Error'
            
    Validation:
      type: object
      required:
        - valid
        - errors
      properties:
        valid:
          type: boolean
        errors:
          type: array
          items:
            type: object
            properties:
              location:
                type: string
                description: "file:line:column"
              message:
                type: string
              severity:
                type: string
                enum: [error, warning, info]
              suggestion:
                type: string
                
    Message:
      type: object
      required:
        - id
        - type
        - priority
        - title
        - status
      properties:
        id:
          type: string
        type:
          type: string
          enum: [ambiguity, incompleteness, validation_failure, question, suggestion]
        priority:
          type: string
          enum: [blocking, high, medium, low, informational]
        title:
          type: string
        description:
          type: string
        status:
          type: string
          enum: [new, in_progress, resolved, dismissed]
        created_at:
          type: string
          format: date-time
        resolved_at:
          type: string
          format: date-time
```

## Spec Endpoints

### @api/openapi/specs

```yaml
paths:
  /specs:
    get:
      summary: List all specs
      tags: [Specs]
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
        - name: cursor
          in: query
          schema:
            type: string
        - name: tag
          in: query
          schema:
            type: string
        - name: layer
          in: query
          schema:
            type: integer
        - name: search
          in: query
          schema:
            type: string
      responses:
        '200':
          description: List of specs
          content:
            application/json:
              schema:
                type: object
                properties:
                  specs:
                    type: array
                    items:
                      $ref: '#/components/schemas/Spec'
                  cursor:
                    type: string
                  total:
                    type: integer
                    
    post:
      summary: Create a new spec
      tags: [Specs]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Spec'
      responses:
        '201':
          description: Spec created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Spec'
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
                
  /specs/{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
        description: Spec ID (URL encoded)
        
    get:
      summary: Get spec by ID
      tags: [Specs]
      responses:
        '200':
          description: Spec details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Spec'
        '404':
          description: Spec not found
          
    put:
      summary: Update spec
      tags: [Specs]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Spec'
      responses:
        '200':
          description: Spec updated
        '404':
          description: Spec not found
          
    delete:
      summary: Delete spec
      tags: [Specs]
      responses:
        '204':
          description: Spec deleted
        '404':
          description: Spec not found
```

## Cascade Endpoints

### @api/openapi/cascade

```yaml
paths:
  /cascade:
    get:
      summary: Get cascade status
      tags: [Cascade]
      responses:
        '200':
          description: Current cascade status
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Cascade'
                
    post:
      summary: Control cascade
      tags: [Cascade]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - action
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
      responses:
        '200':
          description: Action completed
          
  /cascade/trigger:
    post:
      summary: Manually trigger cascade
      tags: [Cascade]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - file
              properties:
                file:
                  type: string
                  description: File path to trigger cascade
      responses:
        '202':
          description: Cascade triggered
```

## Validation Endpoints

### @api/openapi/validation

```yaml
paths:
  /validate:
    post:
      summary: Validate specs
      tags: [Validation]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                specs:
                  type: array
                  items:
                    type: string
                  description: List of spec IDs to validate (empty = all)
                type:
                  type: string
                  enum: [basic, language-blocks, autonomous, all]
                  default: all
                fix:
                  type: boolean
                  default: false
      responses:
        '200':
          description: Validation results
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Validation'
```

## Messages Endpoints

### @api/openapi/messages

```yaml
paths:
  /messages:
    get:
      summary: List messages
      tags: [Messages]
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [new, in_progress, resolved, dismissed]
        - name: priority
          in: query
          schema:
            type: string
            enum: [blocking, high, medium, low, informational]
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: List of messages
          content:
            application/json:
              schema:
                type: object
                properties:
                  messages:
                    type: array
                    items:
                      $ref: '#/components/schemas/Message'
                  total:
                    type: integer
                    
  /messages/{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
          
    get:
      summary: Get message details
      tags: [Messages]
      responses:
        '200':
          description: Message details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Message'
                
    post:
      summary: Respond to message
      tags: [Messages]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - action
              properties:
                action:
                  type: string
                  enum: [resolve, dismiss, respond, escalate]
                content:
                  type: string
      responses:
        '200':
          description: Action completed
```

## Search Endpoints

### @api/openapi/search

```yaml
paths:
  /search:
    get:
      summary: Search across specs
      tags: [Search]
      parameters:
        - name: q
          in: query
          required: true
          schema:
            type: string
        - name: kind
          in: query
          schema:
            type: string
            enum: [entity, operation, test, note, code, table, diagram]
        - name: tag
          in: query
          schema:
            type: string
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Search results
          content:
            application/json:
              schema:
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

## Monitoring Endpoints

### @api/openapi/monitoring

```yaml
paths:
  /health:
    get:
      summary: System health check
      tags: [Monitoring]
      security: []
      responses:
        '200':
          description: System is healthy
          content:
            application/json:
              schema:
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
                      
  /metrics:
    get:
      summary: System metrics
      tags: [Monitoring]
      responses:
        '200':
          description: System metrics
          content:
            application/json:
              schema:
                type: object
                properties:
                  cascade:
                    type: object
                    properties:
                      depth:
                        type: integer
                      files_changed:
                        type: integer
                      commits:
                        type: integer
                  specs:
                    type: object
                    properties:
                      total:
                        type: integer
                      by_layer:
                        type: object
                        additionalProperties:
                          type: integer
                  messages:
                    type: object
                    properties:
                      unread:
                        type: integer
                      by_priority:
                        type: object
                        additionalProperties:
                          type: integer
```

## Generation Endpoints

### @api/openapi/generate

```yaml
paths:
  /generate:
    post:
      summary: Generate code from specs
      tags: [Generation]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                specs:
                  type: array
                  items:
                    type: string
                  description: Spec IDs to generate (empty = all)
                target:
                  type: string
                  enum: [typescript, go, rust, python]
                watch:
                  type: boolean
                  default: false
      responses:
        '202':
          description: Generation started
          content:
            application/json:
              schema:
                type: object
                properties:
                  job_id:
                    type: string
                  status:
                    type: string
                    enum: [queued, running, completed, failed]
```

## Error Handling

### @api/openapi/errors

```yaml
responses:
  '400':
    description: Bad Request
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
          
  '401':
    description: Unauthorized
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
          
  '403':
    description: Forbidden
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
          
  '404':
    description: Not Found
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
          
  '429':
    description: Rate Limited
    headers:
      X-RateLimit-Limit:
        schema:
          type: integer
      X-RateLimit-Remaining:
        schema:
          type: integer
      X-RateLimit-Reset:
        schema:
          type: integer
      Retry-After:
        schema:
          type: integer
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
          
  '500':
    description: Internal Server Error
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
```

## Rate Limiting

### @api/openapi/rate-limits

```yaml
x-rate-limiting:
  default:
    requests_per_minute: 60
    burst: 10
  endpoints:
    /search:
      requests_per_minute: 30
    /generate:
      requests_per_minute: 10
    /validate:
      requests_per_minute: 30
```

## References

- @ref:specs/api - API overview
- @ref:specs/mcp - MCP server specification
- @ref:specs/validation/rules - Validation rules
- @ref:specs/cascade - Cascade system