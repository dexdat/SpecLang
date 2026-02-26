---
name: sip-117-mcp-auth-apikeys-speclang-v0
title: "SIP 117: MCP API Key Authentication"
version: 0.1.0
description: Specification for API key-based authentication in MCP
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 117: MCP API Key Authentication

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP specifies the API key-based authentication system for MCP including key generation, validation, and management.

### Quick Start

```yaml
# API key auth configuration
mcp:
  security:
    auth:
      type: "api_key"
      api_key:
        header: "X-API-Key"
        prefix: "sk_mcp_"
        length: 32
        
  keys:
    storage: "database"  # database | hash
    rotation_required: true
    rotation_period: 90  # days
```

### When to Read This

- **Authentication**: Setting up API key auth
- **Security**: Understanding key management
- **Integration**: Service-to-service auth

### Related SIPs

- SIP 114: MCP Architecture
- SIP 116: Token Authentication
- SIP 118: Error Codes

## Abstract

This SIP defines the complete API key-based authentication system for MCP, including key generation, storage, validation, rotation, and lifecycle management.

## Motivation

Users need:
- **Service auth**: Machine-to-machine authentication
- **Simple integration**: Easy key-based access
- **Key management**: Generation, rotation, revocation
- **Audit trail**: Track key usage

## Rationale

**API Key Auth:**

1. Simple to implement and use
2. No token refresh complexity
3. Ideal for service-to-service
4. Easy to revoke and audit

## Specification

### API Key Types

```yaml
APIKeyTypes:
  service_key:
    description: "Long-lived key for services"
    lifetime: 1 year
    use_cases:
      - CI/CD pipelines
      - Webhooks
      - Background jobs
      
  user_key:
    description: "User-specific key for personal access"
    lifetime: 90 days
    use_cases:
      - Developer tools
      - CLI access
      - Script automation
      
  temporary_key:
    description: "Short-lived key for testing"
    lifetime: 1 hour
    use_cases:
      - Demo environments
      - Testing
      - Emergency access
```

### Key Structure

```yaml
KeyStructure:
  format:
    prefix: "sk_mcp_"  # Identifies key type
    random: 32 chars of random data
    checksum: 8 chars (optional)
    
  full_format:
    "sk_mcp_abc123...xyz789"
    
  components:
    - prefix: "sk_mcp_" (6 chars)
    - random: "abc123def456..." (32 chars)
    - checksum: "xyz78901" (8 chars, optional)
```

### Key Generation

```yaml
Generation:
  algorithm: "HMAC-SHA256 based"
  
  process:
    - step: 1
      action: "Generate 32 bytes of cryptographically secure random"
      
    - step: 2
      action: "Encode as URL-safe base64"
      
    - step: 3
      action: "Add prefix"
      
    - step: 4
      action: "Hash for storage (never store raw)"
      
  code_example:
    ```typescript
    function generateAPIKey(): string {
      const random = crypto.randomBytes(32).toString("base64url");
      return `sk_mcp_${random}`;
    }
    
    function hashKeyForStorage(key: string): string {
      return crypto
        .createHash("sha256")
        .update(key)
        .digest("hex");
    }
    ```
```

### Key Storage

```yaml
Storage:
  database_schema:
    ```sql
    CREATE TABLE api_keys (
      id UUID PRIMARY KEY,
      key_hash VARCHAR(64) NOT NULL,
      key_prefix VARCHAR(10) NOT NULL,
(255) NOT      name VARCHAR NULL,
      user_id UUID REFERENCES users(id),
      key_type VARCHAR(20) NOT NULL,
      expires_at TIMESTAMP,
      last_used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      revoked_at TIMESTAMP,
      
      INDEX idx_key_hash (key_hash),
      INDEX idx_user_id (user_id)
    );
    ```
    
  secure_storage:
    - Hash using SHA-256
    - Salt per-key (optional)
    - Never log full key
    - Show once on creation
    
  rotation:
    - Support key rotation
    - Grace period for old key
    - Track rotation history
```

### Authentication Flow

```yaml
AuthFlow:
  request_validation:
    steps:
      - step: 1
        action: "Extract API key from header"
        header: "X-API-Key"
        example: "sk_mcp_abc123..."
        
      - step: 2
        action: "Hash the key for lookup"
        hash: "sha256(key)"
        
      - step: 3
        action: "Query database for key hash"
        
      - step: 4
        action: "Validate key properties"
        checks:
          - Key not expired
          - Key not revoked
          - User still active
          - Rate limits OK
          
      - step: 5
        action: "Update last_used_at"
        
      - step: 6
        action: "Return authenticated context"
        
  response_success:
    ```json
    {
      "authenticated": true,
      "user_id": "user-123",
      "key_name": "Production Service",
      "scopes": ["read", "write"],
      "expires_in": 86400
    }
    ```
```

### Configuration

```yaml
Config:
  header_name: "X-API-Key"
  
  key_format:
    prefix: "sk_mcp_"
    random_length: 32
    include_checksum: false
    
  validation:
    check_expiry: true
    check_revocation: true
    check_user_status: true
    rate_limit_by_key: true
    
  defaults:
    user_key_expiry: 7776000  # 90 days
    service_key_expiry: 31536000  # 1 year
    temporary_key_expiry: 3600  # 1 hour
    
  rate_limits:
    default: 1000 requests/hour
    by_key: true
```

### Key Management API

```yaml
ManagementAPI:
  create_key:
    endpoint: "POST /api/keys"
    params:
      name: string (required)
      type: "service" | "user" | "temporary"
      user_id: string (required)
      expires_in: number (optional, seconds)
      scopes: string[] (optional)
      
    response:
      ```json
      {
        "id": "key-uuid",
        "key": "sk_mcp_abc123...",  // Only shown once!
        "name": "My Service Key",
        "type": "service",
        "expires_at": "2025-01-01T00:00:00Z",
        "created_at": "2024-10-01T00:00:00Z"
      }
      ```
      
  list_keys:
    endpoint: "GET /api/keys"
    params:
      user_id: string (optional filter)
      include_revoked: boolean
      
    response:
      ```json
      {
        "keys": [
          {
            "id": "key-uuid",
            "name": "My Service Key",
            "type": "service",
            "last_used_at": "2024-10-15T00:00:00Z",
            "expires_at": "2025-01-01T00:00:00Z",
            "created_at": "2024-10-01T00:00:00Z"
          }
        ]
      }
      ```
      
  revoke_key:
    endpoint: "DELETE /api/keys/{key_id}"
    response:
      ```json
      {
        "success": true,
        "revoked_at": "2024-10-15T00:00:00Z"
      }
      ```
      
  rotate_key:
    endpoint: "POST /api/keys/{key_id}/rotate"
    response:
      ```json
      {
        "new_key": "sk_mcp_xyz789..."
      }
      ```
```

### Security Considerations

```yaml
Security:
  key_handling:
    - Show key only once on creation
    - Hash key for storage
    - Support key prefixes for identification
    
  access_control:
    - Scopes per key
    - IP allowlist (optional)
    - Rate limits per key
    
  monitoring:
    - Log key usage
    - Track failed attempts
    - Alert on unusual activity
    
  revocation:
    - Immediate revocation
    - Revocation reason tracking
    - Audit trail
```

### Error Responses

```yaml
AuthErrors:
  missing_key:
    code: -32010
    message: "API key is required"
    http_status: 401
    header: "X-API-Key"
    
  invalid_key:
    code: -32011
    message: "Invalid API key"
    http_status: 401
    
  key_expired:
    code: -32012
    message: "API key has expired"
    http_status: 401
    
  key_revoked:
    code: -32013
    message: "API key has been revoked"
    http_status: 401
    
  insufficient_scope:
    code: -32014
    message: "API key lacks required scope"
    http_status: 403
    
  rate_limit_exceeded:
    code: -32015
    message: "API key rate limit exceeded"
    http_status: 429
```

### Comparison with Token Auth

```yaml
Comparison:
  use_cases:
    - API Key: Service-to-service, CLI, scripts
    - Token: User sessions, web apps, SSO
    
  complexity:
    - API Key: Simple, no refresh needed
    - Token: More complex, refresh flow
    
  security:
    - API Key: Long-lived, revoke when compromised
    - Token: Short-lived, automatic refresh
    
  rotation:
    - API Key: Manual rotation
    - Token: Automatic refresh
    
  auditing:
    - API Key: Per-key usage tracking
    - Token: Per-session activity
```

## Backwards Compatibility

- Header name configurable
- Support both API key and token auth
- Migration from legacy key formats

## References

- @ref:specs/mcp
- SIP 114: MCP Architecture
- SIP 116: Token Authentication
- SIP 118: Error Codes

## Copyright

This document is in the public domain.
