---
name: sip-078-security-speclang-v0
title: "SIP 78: Security Model"
version: 0.1.0
description: Security model and requirements for SpecLang
category: standard
---

# SIP 78: Security Model

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the security model for SpecLang, including authentication, authorization, data protection, and security best practices.

### Quick Start

Security features:
1. **Authentication**: API keys, tokens
2. **Authorization**: Role-based access control
3. **Input validation**: Sanitization, escaping
4. **Data protection**: Encryption at rest and in transit

### When to Read This

- **Configuring security**: Setting up auth/auth
- **Code generation**: Security-aware code generation
- **Deployment**: Security hardening

### Related SIPs

- SIP 11: MCP Tools
- SIP 10: Daemon
- SIP 08: Configuration

## Abstract

This SIP defines the security model for SpecLang, establishing authentication mechanisms, authorization rules, data protection requirements, and security practices for the system and generated code.

## Motivation

Security is essential because:
- Specs may contain sensitive information
- Generated code must be secure by default
- System access needs to be controlled
- Data protection is often required

## Rationale

**Defense in Depth:**

1. **Input validation**: Validate all inputs at boundaries
2. **Authorization**: Verify permissions for operations
3. **Least privilege**: Grant minimum necessary access
4. **Audit logging**: Record security-relevant events

Following OWASP and industry best practices.

## Specification

### Authentication

```yaml
Authentication:
  mechanisms:
    api_key:
      description: "API key authentication"
      header: "X-SpecLang-API-Key"
      format: "sl_<random_32_chars>"
      rotation_days: 90
      storage: "hashed"
    
    bearer_token:
      description: "JWT bearer tokens"
      header: "Authorization"
      format: "Bearer <jwt>"
      algorithm: "RS256"
      expiry_hours: 24
      refresh_hours: 168
    
    session_cookie:
      description: "Web UI session cookies"
      name: "speclang_session"
      attributes:
        - HttpOnly
        - Secure
        - SameSite=Strict
      expiry_hours: 8

  configuration:
    enabled_mechanisms:
      - api_key
      - bearer_token
    
    rate_limiting:
      attempts_per_minute: 10
      lockout_duration_minutes: 15
    
    password_policy:
      min_length: 12
      require_uppercase: true
      require_lowercase: true
      require_numbers: true
      require_special: true
```

### Authorization

```yaml
Authorization:
  model: "Role-Based Access Control (RBAC)"
  
  roles:
    admin:
      description: "Full system access"
      permissions:
        - "*"
    
    maintainer:
      description: "Project maintenance access"
      permissions:
        - specs:read
        - specs:write
        - specs:delete
        - code:generate
        - pipeline:run
        - index:rebuild
    
    developer:
      description: "Development access"
      permissions:
        - specs:read
        - specs:write
        - code:generate
        - pipeline:run
    
    viewer:
      description: "Read-only access"
      permissions:
        - specs:read
        - code:read
  
  resource_permissions:
    specs:
      actions: [read, write, delete]
      scope: [project, spec, block]
    
    code:
      actions: [read, generate]
      scope: [project, target]
    
    pipeline:
      actions: [read, run, configure]
      scope: [project]
    
    settings:
      actions: [read, write]
      scope: [project, system]
  
  access_rules:
    - resource: "specs/*"
      roles: [admin, maintainer, developer, viewer]
      action: read
    
    - resource: "specs/*"
      roles: [admin, maintainer, developer]
      action: write
    
    - resource: "specs/sensitive/*"
      roles: [admin]
      action: "*"
    
    - resource: "settings/security"
      roles: [admin]
      action: "*"
```

### Input Validation

```yaml
InputValidation:
  spec_content:
    max_size_bytes: 1048576  # 1MB
    allowed_chars: "UTF-8 printable"
    sanitization:
      - remove_null_bytes
      - normalize_unicode
      - strip_control_chars
    
    validation:
      - valid_yaml_syntax
      - valid_header_format
      - no_script_injection
      - no_sql_injection
  
  file_paths:
    max_length: 255
    allowed_chars: "[a-zA-Z0-9_\\-./]"
    restrictions:
      - no_path_traversal
      - no_symlink_escape
      - no_hidden_files
  
  identifiers:
    id_format: "@[a-z0-9_\\-]+/[a-z0-9_\\-/]+"
    max_length: 128
    block_id_format: "[a-z0-9_\\-]+"
  
  references:
    ref_format: "@ref:[a-z0-9_\\-/]+(#[a-z0-9_\\-]+)?"
    max_depth: 10
    circular_detection: true
```

### Data Protection

```yaml
DataProtection:
  at_rest:
    sensitive_fields:
      - api_keys
      - secrets
      - credentials
      - tokens
    
    encryption:
      algorithm: "AES-256-GCM"
      key_derivation: "PBKDF2"
      key_rotation_days: 90
    
    storage:
      - encrypt_database_fields
      - encrypt_file_storage
      - secure_key_management
  
  in_transit:
    protocol: "TLS 1.3"
    cipher_suites:
      - TLS_AES_256_GCM_SHA384
      - TLS_CHACHA20_POLY1305_SHA256
    certificate_validation: strict
    hsts: true
  
  secrets_management:
    storage: "environment_variables | vault | aws_secrets"
    rotation:
      automatic: true
      interval_days: 30
    
    injection:
      - never_log_secrets
      - never_echo_secrets
      - mask_in_errors
  
  pii_handling:
    identification:
      - email_addresses
      - phone_numbers
      - names
      - addresses
    
    protection:
      - minimize_collection
      - anonymize_in_logs
      - encrypt_at_rest
      - audit_access
```

### Security Headers

```yaml
SecurityHeaders:
  http_responses:
    Content-Security-Policy:
      value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
      description: "Prevent XSS attacks"
    
    X-Content-Type-Options:
      value: "nosniff"
      description: "Prevent MIME sniffing"
    
    X-Frame-Options:
      value: "DENY"
      description: "Prevent clickjacking"
    
    Strict-Transport-Security:
      value: "max-age=31536000; includeSubDomains"
      description: "Force HTTPS"
    
    X-XSS-Protection:
      value: "1; mode=block"
      description: "Enable XSS filter"
    
    Referrer-Policy:
      value: "strict-origin-when-cross-origin"
      description: "Control referrer information"
    
    Permissions-Policy:
      value: "geolocation=(), microphone=(), camera=()"
      description: "Restrict browser features"
```

### Audit Logging

```yaml
AuditLogging:
  events:
    authentication:
      - login_success
      - login_failure
      - logout
      - token_refresh
      - api_key_used
    
    authorization:
      - permission_granted
      - permission_denied
      - role_change
    
    data_access:
      - spec_read
      - spec_write
      - spec_delete
      - code_generate
      - settings_change
    
    administrative:
      - user_created
      - user_deleted
      - config_change
      - security_setting_change
  
  log_format:
    timestamp: ISO8601
    event_type: string
    user_id: string
    ip_address: string
    resource: string
    action: string
    outcome: success | failure
    details: object
  
  retention:
    security_events: 365 days
    access_events: 90 days
    debug_events: 7 days
  
  protection:
    - immutable_storage
    - tamper_detection
    - access_restricted
```

## Examples

### Example 1: Authentication Middleware

```python
from functools import wraps
from typing import Callable, Optional
import hashlib
import hmac
import time
import jwt

class AuthenticationError(Exception):
    pass

class Authenticator:
    """Handle authentication for SpecLang."""
    
    def __init__(self, config: dict):
        self.config = config
        self.api_keys = {}  # key_hash -> user_id
        self.rate_limiter = RateLimiter(
            max_attempts=10,
            window_seconds=60
        )
    
    def validate_api_key(self, api_key: str) -> Optional[str]:
        """Validate API key and return user_id."""
        if not api_key.startswith("sl_"):
            raise AuthenticationError("Invalid API key format")
        
        key_hash = self._hash_key(api_key)
        
        if key_hash not in self.api_keys:
            raise AuthenticationError("Invalid API key")
        
        return self.api_keys[key_hash]
    
    def validate_token(self, token: str) -> Optional[dict]:
        """Validate JWT token and return claims."""
        try:
            claims = jwt.decode(
                token,
                self.config["jwt_secret"],
                algorithms=["RS256"]
            )
            
            if claims["exp"] < time.time():
                raise AuthenticationError("Token expired")
            
            return claims
            
        except jwt.InvalidTokenError as e:
            raise AuthenticationError(f"Invalid token: {e}")
    
    def _hash_key(self, api_key: str) -> str:
        """Hash API key for storage."""
        return hashlib.sha256(api_key.encode()).hexdigest()

def require_auth(func: Callable) -> Callable:
    """Decorator to require authentication."""
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        auth_header = request.headers.get("Authorization")
        api_key = request.headers.get("X-SpecLang-API-Key")
        
        authenticator = get_authenticator()
        
        if api_key:
            user_id = authenticator.validate_api_key(api_key)
            request.user_id = user_id
        elif auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
            claims = authenticator.validate_token(token)
            request.user_id = claims["sub"]
        else:
            raise AuthenticationError("Authentication required")
        
        return func(request, *args, **kwargs)
    
    return wrapper
```

### Example 2: Authorization Checker

```python
from typing import Set, Dict, Optional
from dataclasses import dataclass

@dataclass
class Permission:
    resource: str
    action: str
    
    def matches(self, other: "Permission") -> bool:
        if self.resource == "*":
            return True
        if self.action == "*":
            return self.resource == other.resource
        return self.resource == other.resource and self.action == other.action

class Authorizer:
    """Handle authorization for SpecLang."""
    
    ROLE_PERMISSIONS: Dict[str, Set[Permission]] = {
        "admin": {Permission("*", "*")},
        "maintainer": {
            Permission("specs", "read"),
            Permission("specs", "write"),
            Permission("specs", "delete"),
            Permission("code", "generate"),
            Permission("pipeline", "run"),
        },
        "developer": {
            Permission("specs", "read"),
            Permission("specs", "write"),
            Permission("code", "generate"),
        },
        "viewer": {
            Permission("specs", "read"),
            Permission("code", "read"),
        },
    }
    
    def __init__(self):
        self.user_roles: Dict[str, Set[str]] = {}
    
    def check_permission(
        self,
        user_id: str,
        resource: str,
        action: str
    ) -> bool:
        """Check if user has permission for action on resource."""
        roles = self.user_roles.get(user_id, set())
        
        required = Permission(resource, action)
        
        for role in roles:
            permissions = self.ROLE_PERMISSIONS.get(role, set())
            for permission in permissions:
                if permission.matches(required):
                    self._log_access(user_id, resource, action, True)
                    return True
        
        self._log_access(user_id, resource, action, False)
        return False
    
    def _log_access(
        self,
        user_id: str,
        resource: str,
        action: str,
        granted: bool
    ):
        """Log access attempt for audit."""
        audit_log.record({
            "event_type": "permission_check",
            "user_id": user_id,
            "resource": resource,
            "action": action,
            "outcome": "granted" if granted else "denied",
            "timestamp": time.time()
        })

def require_permission(resource: str, action: str):
    """Decorator to require specific permission."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            authorizer = get_authorizer()
            
            if not authorizer.check_permission(
                request.user_id,
                resource,
                action
            ):
                raise AuthorizationError(
                    f"Permission denied: {action} on {resource}"
                )
            
            return func(request, *args, **kwargs)
        
        return wrapper
    return decorator
```

### Example 3: Input Sanitization

```python
import re
import html
from typing import Optional
from pathlib import Path

class InputSanitizer:
    """Sanitize user input for security."""
    
    # Patterns for dangerous content
    SCRIPT_PATTERN = re.compile(
        r'<script[^>]*>.*?</script>',
        re.IGNORECASE | re.DOTALL
    )
    SQL_INJECTION_PATTERN = re.compile(
        r"('|(--)|(;)|(\b(SELECT|INSERT|UPDATE|DELETE|DROP)\b))",
        re.IGNORECASE
    )
    PATH_TRAVERSAL_PATTERN = re.compile(r'\.\.')
    
    @classmethod
    def sanitize_spec_content(cls, content: str) -> str:
        """Sanitize spec file content."""
        if len(content) > 1048576:  # 1MB
            raise ValueError("Spec content exceeds maximum size")
        
        # Remove null bytes
        content = content.replace('\x00', '')
        
        # Normalize unicode
        content = content.normalize('NFKC')
        
        # Check for script injection
        if cls.SCRIPT_PATTERN.search(content):
            raise ValueError("Script injection detected in spec content")
        
        return content
    
    @classmethod
    def sanitize_file_path(cls, path: str, base_dir: Path) -> Path:
        """Sanitize and validate file path."""
        # Check for path traversal
        if cls.PATH_TRAVERSAL_PATTERN.search(path):
            raise ValueError("Path traversal detected")
        
        # Check for hidden files
        if path.startswith('.') or '/.' in path:
            raise ValueError("Hidden files not allowed")
        
        # Validate characters
        if not re.match(r'^[a-zA-Z0-9_\-./]+$', path):
            raise ValueError("Invalid characters in path")
        
        # Resolve and verify within base
        full_path = (base_dir / path).resolve()
        
        try:
            full_path.relative_to(base_dir.resolve())
        except ValueError:
            raise ValueError("Path escapes base directory")
        
        return full_path
    
    @classmethod
    def sanitize_identifier(cls, identifier: str) -> str:
        """Sanitize spec identifier."""
        if len(identifier) > 128:
            raise ValueError("Identifier exceeds maximum length")
        
        if not re.match(r'^@[a-z0-9_\-]+/[a-z0-9_\-/]+$', identifier):
            raise ValueError(f"Invalid identifier format: {identifier}")
        
        return identifier
    
    @classmethod
    def escape_output(cls, content: str, context: str = "html") -> str:
        """Escape content for safe output."""
        if context == "html":
            return html.escape(content)
        elif context == "json":
            return json.dumps(content)[1:-1]
        elif context == "shell":
            return shlex.quote(content)
        else:
            return content
```

### Example 4: Secrets Management

```python
import os
import json
from typing import Optional
from abc import ABC, abstractmethod

class SecretsProvider(ABC):
    """Abstract secrets provider."""
    
    @abstractmethod
    def get_secret(self, key: str) -> Optional[str]:
        pass
    
    @abstractmethod
    def set_secret(self, key: str, value: str) -> None:
        pass

class EnvironmentSecretsProvider(SecretsProvider):
    """Store secrets in environment variables."""
    
    def get_secret(self, key: str) -> Optional[str]:
        return os.environ.get(key)
    
    def set_secret(self, key: str, value: str) -> None:
        os.environ[key] = value

class VaultSecretsProvider(SecretsProvider):
    """Store secrets in HashiCorp Vault."""
    
    def __init__(self, vault_url: str, token: str):
        self.vault_url = vault_url
        self.token = token
    
    def get_secret(self, key: str) -> Optional[str]:
        import requests
        
        response = requests.get(
            f"{self.vault_url}/v1/secret/data/{key}",
            headers={"X-Vault-Token": self.token}
        )
        
        if response.status_code == 200:
            return response.json()["data"]["data"]["value"]
        return None
    
    def set_secret(self, key: str, value: str) -> None:
        import requests
        
        requests.post(
            f"{self.vault_url}/v1/secret/data/{key}",
            headers={"X-Vault-Token": self.token},
            json={"data": {"value": value}}
        )

class SecretsManager:
    """Manage secrets with masking and audit."""
    
    MASK = "********"
    SENSITIVE_KEYS = [
        "password", "secret", "token", "api_key",
        "credential", "private_key"
    ]
    
    def __init__(self, provider: SecretsProvider):
        self.provider = provider
        self.audit_log = []
    
    def get(self, key: str) -> Optional[str]:
        """Get secret with audit logging."""
        value = self.provider.get_secret(key)
        
        self._audit("get", key, value is not None)
        
        return value
    
    def set(self, key: str, value: str) -> None:
        """Set secret with audit logging."""
        self.provider.set_secret(key, value)
        
        self._audit("set", key, True)
    
    def mask_if_sensitive(self, key: str, value: str) -> str:
        """Mask value if key is sensitive."""
        if any(s in key.lower() for s in self.SENSITIVE_KEYS):
            return self.MASK
        return value
    
    def _audit(self, action: str, key: str, success: bool):
        """Log secret access."""
        audit_log.record({
            "event_type": f"secret_{action}",
            "key": key,
            "outcome": "success" if success else "failure",
            "timestamp": time.time()
        })
        # Never log the actual secret value
```

### Example 5: Security Config for Generated Code

```yaml
GeneratedCodeSecurity:
  python:
    input_validation:
      - use_parameterized_queries
      - validate_all_inputs
      - escape_html_output
    
    authentication:
      - use_secure_password_hashing
      - implement_rate_limiting
      - use_secure_session_management
    
    headers:
      - set_security_headers
      - enable_cors_with_care
  
  typescript:
    input_validation:
      - sanitize_user_input
      - validate_api_requests
      - escape_dangerous_chars
    
    authentication:
      - store_tokens_securely
      - implement_csrf_protection
      - use_secure_cookies
    
    headers:
      - configure_csp
      - enable_hsts
  
  go:
    input_validation:
      - validate_all_inputs
      - use_context_for_timeouts
      - sanitize_file_paths
    
    authentication:
      - use_secure_comparison
      - implement_proper_jwt_handling
      - enable_rate_limiting
    
    headers:
      - set_security_headers
      - configure_cors_properly
```

## Security Checklist

```yaml
SecurityChecklist:
  development:
    - [ ] No hardcoded secrets in code
    - [ ] Input validation on all endpoints
    - [ ] Authentication required for sensitive operations
    - [ ] Authorization checked for each resource
    - [ ] Error messages don't leak sensitive info
    - [ ] Logging doesn't include secrets
  
  deployment:
    - [ ] TLS enabled for all connections
    - [ ] Secrets stored in secure vault
    - [ ] Security headers configured
    - [ ] Rate limiting enabled
    - [ ] Audit logging enabled
    - [ ] Regular security updates
  
  code_generation:
    - [ ] Generated code uses parameterized queries
    - [ ] Generated code validates inputs
    - [ ] Generated code escapes outputs
    - [ ] Generated code uses secure defaults
    - [ ] Generated code handles errors safely
```

## References

- @ref:speclang/security
- SIP 11: MCP Tools
- SIP 08: Configuration
- OWASP Top 10
- CWE/SANS Top 25

## Copyright

This document is in the public domain.
