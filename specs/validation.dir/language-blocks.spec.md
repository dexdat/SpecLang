# speclang-header lines:15
id: "@speclang/validation/language-blocks"
version: 0.1.0
layer: 2
parent: "@ref:speclang/validation"
part: 1/1
tags: [validation, language-blocks, logging, auth, api]
status: draft
project_level: Alpha
agent_support: agent_autonomous
short: Language block validation rules for common block types
---
# Language Block Validation

Validation rules for common language block types (logging, auth, API).

## Overview

```speclang
# @block:validation/language-blocks/overview @kind:note
Language block validation ensures that blocks defining common language constructs
contain all required fields for proper code generation.

These validators run after basic block validation and before autonomous validation.
Failures block cascade and suggest fixes to the agent.
```

## Logging Block Validation

### @validation/language-blocks/logging

```speclang
# @block:validation/language-blocks/logging @kind:entity
LoggingBlockValidation:
  
  applies_to:
    - Blocks with id matching "@block:logging/*"
    - Blocks with kind "logging"
    - Any block containing "logging" in its content
    
  required_fields:
    level:
      description: "Log level"
      type: Enum
      values: [debug, info, warn, error, fatal]
      default: info
      
    format:
      description: "Log format pattern"
      type: String
      default: "[{level}] {message}"
      
    output:
      description: "Output destination"
      type: Enum
      values: [console, file, syslog, elasticsearch]
      default: console
      
    timestamp:
      description: "Include timestamp"
      type: Boolean
      default: true
      
  validation_rules:
    - "If output is 'file', must specify 'file_path' field"
    - "If output is 'syslog', must specify 'syslog_host' and 'syslog_port'"
    - "Format string must contain '{level}' and '{message}' placeholders"
    
  examples:
    valid: |
      # @block:logging/app @kind:logging
      level: info
      format: "[{level}] {timestamp} {message}"
      output: console
      timestamp: true
      
    invalid: |
      # @block:logging/app @kind:logging
      level: info
      # missing format field
```

## Authentication Block Validation

### @validation/language-blocks/auth

```speclang
# @block:validation/language-blocks/auth @kind:entity
AuthBlockValidation:
  
  applies_to:
    - Blocks with id matching "@block:auth/*"
    - Blocks with kind "auth"
    - Any block containing "authentication" or "auth" in its content
    
  required_fields:
    password:
      description: "Password requirements"
      type: Object
      fields:
        min_length: Integer
        require_uppercase: Boolean
        require_numbers: Boolean
        require_special: Boolean
      default:
        min_length: 8
        require_uppercase: true
        require_numbers: true
        require_special: false
        
    validation:
      description: "Validation rules"
      type: Object
      fields:
        max_attempts: Integer
        lockout_duration: Integer
        require_email_verification: Boolean
      default:
        max_attempts: 5
        lockout_duration: 300
        require_email_verification: false
        
    providers:
      description: "Supported auth providers"
      type: Array
      items: Enum [local, oauth2, ldap, saml]
      default: [local]
      
  validation_rules:
    - "If providers includes 'oauth2', must specify 'oauth2_clients' field"
    - "If providers includes 'ldap', must specify 'ldap_server' field"
    - "Password min_length must be at least 6"
    
  examples:
    valid: |
      # @block:auth/web @kind:auth
      password:
        min_length: 10
        require_uppercase: true
        require_numbers: true
      validation:
        max_attempts: 3
      providers: [local, oauth2]
      oauth2_clients:
        google:
          client_id: "..."
          
    invalid: |
      # @block:auth/web @kind:auth
      password:
        min_length: 4  # too short
      # missing validation field
```

## API Block Validation

### @validation/language-blocks/api

```speclang
# @block:validation/language-blocks/api @kind:entity
ApiBlockValidation:
  
  applies_to:
    - Blocks with id matching "@block:api/*"
    - Blocks with kind "api"
    - Any block containing "API" or "endpoint" in its content
    
  required_fields:
    endpoints:
      description: "API endpoints"
      type: Array
      items: Object
      fields:
        path: String
        method: Enum [GET, POST, PUT, DELETE, PATCH]
        description: String
        request: Object?
        response: Object?
        
    version:
      description: "API version"
      type: String
      default: "v1"
      
    base_path:
      description: "Base path for all endpoints"
      type: String
      default: "/api"
      
    authentication:
      description: "Authentication required"
      type: Boolean
      default: true
      
  validation_rules:
    - "Each endpoint must have unique (path, method) combination"
    - "If authentication is true, must specify 'auth_scheme' field"
    - "Request and response objects must have 'schema' field if present"
    
  examples:
    valid: |
      # @block:api/users @kind:api
      version: v1
      base_path: /api
      authentication: true
      auth_scheme: bearer
      endpoints:
        - path: /users
          method: GET
          description: "List users"
          response:
            schema: UserList
        - path: /users/{id}
          method: GET
          description: "Get user by ID"
          
    invalid: |
      # @block:api/users @kind:api
      endpoints:
        - path: /users
          method: GET
        - path: /users  # duplicate path without method uniqueness
```

## Integration with Validation Flow

### @validation/language-blocks/integration

```speclang
# @block:validation/language-blocks/integration @kind:note
Language block validation integrates into the main validation flow:

1. Basic validation (header, ID, refs, blocks)
2. Language block validation (this spec)
3. Autonomous validation (if agent_support: agent_autonomous)

Validation failures generate specific error messages with suggestions.
Agents can auto-fix common validation issues based on these rules.
```

## References

- @ref:specs/validation/rules - Core validation rules
- @ref:specs/validation/tool - Validation tool and flow
- @ref:specs/config/schema - Configuration schema for validation settings