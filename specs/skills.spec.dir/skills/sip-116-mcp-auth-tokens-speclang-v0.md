---
name: sip-116-mcp-auth-tokens-speclang-v0
title: "SIP 116: MCP Token Authentication"
version: 0.1.0
description: Specification for token-based authentication in MCP
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 116: MCP Token Authentication

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP specifies the token-based authentication system for MCP including JWT tokens, refresh tokens, and session management.

### Quick Start

```yaml
# Token auth configuration
mcp:
  security:
    auth:
      type: "token"
      token:
        algorithm: "HS256"
        expiry: 3600  # seconds
        refresh_expiry: 86400
        
  jwt:
    secret: "${JWT_SECRET}"  # Environment variable
    issuer: "speclang"
    audience: "mcp"
```

### When to Read This

- **Authentication**: Setting up token auth
- **Security**: Understanding token flows
- **Integration**: Connecting to auth systems

### Related SIPs

- SIP 114: MCP Architecture
- SIP 117: API Key Authentication
- SIP 118: Error Codes

## Abstract

This SIP defines the complete token-based authentication system for MCP, including JWT access tokens, refresh tokens, token validation, and session lifecycle management.

## Motivation

Users need:
- **Stateless auth**: JWT for scalability
- **Session management**: Refresh token flow
- **Security**: Token expiration and revocation
- **Integration**: External identity provider support

## Rationale

**Token-Based Auth:**

1. Stateless, scales horizontally
2. Standard JWT is widely supported
3. Refresh tokens enable long sessions
4. Easy integration with OAuth providers

## Specification

### Token Types

```yaml
TokenTypes:
  access_token:
    description: "Short-lived token for API access"
    lifetime: 3600 seconds (1 hour)
    claims:
      - sub: "user identifier"
      - exp: "expiration time"
      - iat: "issued at"
      - iss: "issuer"
      - aud: "audience"
      - roles: "user roles"
      - scopes: "permission scopes"
      
  refresh_token:
    description: "Long-lived token for obtaining new access tokens"
    lifetime: 86400 seconds (24 hours)
    claims:
      - sub: "user identifier"
      - jti: "unique token ID"
      - exp: "expiration time"
      - type: "refresh"
      
  id_token:
    description: "User identity information (OIDC)"
    lifetime: 3600 seconds
    claims:
      - sub: "user identifier"
      - email: "user email"
      - name: "full name"
      - picture: "avatar URL"
```

### JWT Structure

```yaml
JWTFormat:
  header:
    alg: "HS256" | "RS256" | "ES256"
    typ: "JWT"
    
  payload:
    access_token:
      ```json
      {
        "sub": "user-123",
        "exp": 1699900000,
        "iat": 1699896400,
        "iss": "speclang",
        "aud": "mcp",
        "roles": ["admin", "developer"],
        "scopes": ["read", "write", "execute"]
      }
      ```
      
    refresh_token:
      ```json
      {
        "sub": "user-123",
        "jti": "token-uuid-456",
        "exp": 1699986400,
        "type": "refresh"
      }
      ```
```

### Authentication Flow

```yaml
AuthFlow:
  initial_login:
    steps:
      - step: 1
        action: "Client sends credentials"
        request:
          ```json
          {
            "method": "authenticate",
            "params": {
              "username": "user@example.com",
              "password": "secret"
            }
          }
          ```
          
      - step: 2
        action: "Server validates credentials"
        checks:
          - Password verification
          - Account status
          - Rate limiting
          
      - step: 3
        action: "Server generates tokens"
        response:
          ```json
          {
            "access_token": "eyJ...",
            "refresh_token": "eyJ...",
            "expires_in": 3600,
            "token_type": "Bearer"
          }
          ```
          
  token_refresh:
    steps:
      - step: 1
        action: "Client sends refresh token"
        request:
          ```json
          {
            "method": "refresh",
            "params": {
              "refresh_token": "eyJ..."
            }
          }
          ```
          
      - step: 2
        action: "Server validates refresh token"
        checks:
          - Token signature
          - Token expiration
          - Token not revoked
          - User still active
          
      - step: 3
        action: "Server issues new access token"
        response:
          ```json
          {
            "access_token": "eyJ...",
            "expires_in": 3600,
            "token_type": "Bearer"
          }
          ```
```

### Token Validation

```yaml
Validation:
  access_token:
    checks:
      - signature: "Verify JWT signature"
      - expiration: "Check exp claim"
      - issuer: "Verify iss matches config"
      - audience: "Verify aud matches config"
      - revocation: "Check token not revoked"
      
  refresh_token:
    checks:
      - signature: "Verify JWT signature"
      - expiration: "Check exp claim"
      - type: "Verify type=refresh"
      - revocation: "Check not in revocation list"
      - user_status: "Verify user still active"
```

### Configuration

```yaml
TokenConfig:
  algorithm: "HS256"  # HS256, RS256, ES256
  secret: "${JWT_SECRET}"  # Required for HS256
  
  # For RS256/ES256
  private_key_path: "/path/to/private.key"
  public_key_path: "/path/to/public.key"
  
  access_token:
    expiry: 3600  # seconds
    issuer: "speclang"
    audience: "mcp"
    
  refresh_token:
    enable: true
    expiry: 86400  # seconds
    reuse_policy: "none"  # none | rotate
    
  token_endpoint:
    path: "/auth/token"
    method: "POST"
    
  refresh_endpoint:
    path: "/auth/refresh"
    method: "POST"
```

### Token Storage

```yaml
Storage:
  access_token:
    location: "Client memory only"
    never_persisted: true
    
  refresh_token:
    location: "Client secure storage"
    options:
      - encrypted_cookie
      - secure_storage (keychain)
      - httpOnly cookie
      
  revocation_list:
    type: "Redis or database"
    ttl: "token expiry + 1 hour"
```

### Security Considerations

```yaml
Security:
  token_generation:
    - Use cryptographically secure random
    - Include unique jti for tracking
    
  token_transmission:
    - Always use TLS
    - Send in Authorization header
    - Don't log tokens
    
  token_storage:
    - Access: memory only
    - Refresh: encrypted storage
    
  token_revocation:
    - Support immediate revocation
    - Revocation list check
    - User-initiated logout
    
  brute_force_protection:
    - Rate limit login attempts
    - Account lockout after failures
    - CAPTCHA for repeated failures
```

### Error Responses

```yaml
AuthErrors:
  invalid_credentials:
    code: -32001
    message: "Invalid username or password"
    http_status: 401
    
  token_expired:
    code: -32002
    message: "Access token has expired"
    http_status: 401
    
  token_revoked:
    code: -32003
    message: "Token has been revoked"
    http_status: 401
    
  refresh_token_expired:
    code: -32004
    message: "Refresh token has expired"
    http_status: 401
    
  insufficient_scope:
    code: -32005
    message: "Insufficient permissions"
    http_status: 403
```

### Integration with External IDPs

```yaml
ExternalIDP:
  OIDC:
    provider: "Auth0, Okta, Keycloak, etc."
    config:
      issuer: "${IDP_ISSUER_URL}"
      client_id: "${IDP_CLIENT_ID}"
      client_secret: "${IDP_CLIENT_SECRET}"
      
    flow:
      - "Authorization Code Flow"
      - "Device Code Flow"
      
  OAuth2:
    providers:
      - "GitHub"
      - "Google"
      - "Microsoft"
      
    scopes:
      - openid
      - profile
      - email
```

## Backwards Compatibility

- JWT format stable across versions
- Graceful token expiry handling
- Migration path for algorithm changes

## References

- "@ref:specs/mcp
- SIP 114: MCP Architecture
- SIP 117: API Key Authentication
- SIP 118: Error Codes

## Copyright

This document is in the public domain.
