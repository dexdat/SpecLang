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
      values: [debug, info, warn, error, fatal, trace]
      default: info
      
    format:
      description: "Log format pattern or structured format"
      type: Enum
      values: [text, json, structured]
      default: text
      
    format_pattern:
      description: "Format pattern for text format"
      type: String
      default: "[{level}] {timestamp} {message}"
      condition: "format == 'text'"
      
    output:
      description: "Output destination"
      type: Enum
      values: [console, file, syslog, elasticsearch, loki, datadog, cloudwatch]
      default: console
      
    timestamp:
      description: "Include timestamp"
      type: Boolean
      default: true
      
    timestamp_format:
      description: "Timestamp format (ISO8601, RFC3339, etc.)"
      type: String
      default: "ISO8601"
      condition: "timestamp == true"
      
    encoding:
      description: "Character encoding"
      type: Enum
      values: [utf-8, ascii, latin1]
      default: utf-8
      
    async:
      description: "Asynchronous logging (non-blocking)"
      type: Boolean
      default: true
      
    buffer_size:
      description: "Buffer size for async logging"
      type: Integer
      default: 1000
      condition: "async == true"
      
  file_specific_fields:
    file_path:
      description: "Log file path"
      type: String
      condition: "output == 'file'"
      
    rotation:
      description: "Log rotation settings"
      type: Object
      fields:
        max_size_mb: Integer
        max_files: Integer
        compress: Boolean
        retention_days: Integer
      default:
        max_size_mb: 100
        max_files: 10
        compress: true
        retention_days: 30
      condition: "output == 'file'"
      
    permissions:
      description: "File permissions"
      type: String
      default: "0644"
      condition: "output == 'file'"
      
  syslog_specific_fields:
    syslog_host:
      description: "Syslog host"
      type: String
      condition: "output == 'syslog'"
      
    syslog_port:
      description: "Syslog port"
      type: Integer
      default: 514
      condition: "output == 'syslog'"
      
    syslog_facility:
      description: "Syslog facility"
      type: Enum
      values: [user, local0, local1, local2, local3, local4, local5, local6, local7]
      default: user
      condition: "output == 'syslog'"
      
  structured_logging_fields:
    context_fields:
      description: "Additional context fields to include"
      type: Array
      items: String
      default: []
      condition: "format == 'structured' or format == 'json'"
      
    sampling:
      description: "Log sampling for high-volume logs"
      type: Object
      fields:
        enabled: Boolean
        rate: Float  # 0.0 to 1.0
        sample_debug: Boolean
      default:
        enabled: false
        rate: 0.1
        sample_debug: false
      
  validation_rules:
    - "If output is 'file', must specify 'file_path' field"
    - "If output is 'syslog', must specify 'syslog_host' and 'syslog_port'"
    - "If format is 'text', must specify 'format_pattern'"
    - "If timestamp is true, must specify 'timestamp_format'"
    - "If async is true, must specify 'buffer_size'"
    - "Format pattern must contain '{level}' and '{message}' placeholders if text format"
    - "Rotation max_size_mb must be > 0 if rotation specified"
    
  examples:
    valid_production: |
      # @block:logging/app @kind:logging
      level: info
      format: json
      output: file
      timestamp: true
      timestamp_format: RFC3339
      encoding: utf-8
      async: true
      buffer_size: 5000
      file_path: /var/log/app.log
      rotation:
        max_size_mb: 100
        max_files: 10
        compress: true
        retention_days: 30
      permissions: "0644"
      context_fields: [request_id, user_id, session_id]
      sampling:
        enabled: true
        rate: 0.2
        sample_debug: true
        
    valid_basic: |
      # @block:logging/app @kind:logging
      level: info
      format: text
      format_pattern: "[{level}] {timestamp} {message}"
      output: console
      timestamp: true
      
    invalid: |
      # @block:logging/app @kind:logging
      level: info
      output: file
      # missing file_path field
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
    
  core_fields:
    password:
      description: "Password requirements"
      type: Object
      fields:
        min_length: Integer
        require_uppercase: Boolean
        require_numbers: Boolean
        require_special: Boolean
        max_age_days: Integer  # password expiration
        history_size: Integer   # prevent reuse of last N passwords
      default:
        min_length: 12
        require_uppercase: true
        require_numbers: true
        require_special: true
        max_age_days: 90
        history_size: 5
        
    password_hashing:
      description: "Password hashing algorithm and parameters"
      type: Object
      fields:
        algorithm: Enum [bcrypt, argon2id, scrypt, pbkdf2]
        cost_factor: Integer  # bcrypt cost, argon2 iterations, etc.
        salt_length: Integer
      default:
        algorithm: argon2id
        cost_factor: 3
        salt_length: 16
        
    validation:
      description: "Validation and security rules"
      type: Object
      fields:
        max_attempts: Integer
        lockout_duration: Integer
        require_email_verification: Boolean
        require_phone_verification: Boolean
        captcha_threshold: Integer  # failed attempts before CAPTCHA
      default:
        max_attempts: 5
        lockout_duration: 900  # 15 minutes
        require_email_verification: true
        require_phone_verification: false
        captcha_threshold: 3
        
    mfa:
      description: "Multi-factor authentication settings"
      type: Object
      fields:
        enabled: Boolean
        methods: Array [Enum [totp, sms, email, webauthn, backup_codes]]
        required_for: Array [Enum [admin, sensitive_operations, all_users]]
      default:
        enabled: false
        methods: [totp]
        required_for: [admin]
        
    session:
      description: "Session management"
      type: Object
      fields:
        type: Enum [jwt, session_cookie, opaque_token]
        expiration_hours: Integer
        refresh_token: Boolean
        refresh_token_expiration_days: Integer
        sliding_expiration: Boolean
      default:
        type: jwt
        expiration_hours: 24
        refresh_token: true
        refresh_token_expiration_days: 30
        sliding_expiration: true
        
    token_refresh:
      description: "Token refresh mechanism"
      type: Object
      fields:
        enabled: Boolean
        method: Enum [rotation, reuse, hybrid]
        rotation_grace_period_minutes: Integer
        revoke_previous: Boolean
      default:
        enabled: true
        method: rotation
        rotation_grace_period_minutes: 5
        revoke_previous: true
        
    providers:
      description: "Supported authentication providers"
      type: Array
      items: Enum [local, oauth2, ldap, saml, openid, azure_ad, google, github]
      default: [local]
      
  oauth2_specific_fields:
    oauth2_clients:
      description: "OAuth2 client configurations"
      type: Map<String, Object>
      fields:
        client_id: String
        client_secret: String?
        scopes: Array<String>
        redirect_uris: Array<String>
        pkce: Boolean
      condition: "providers includes 'oauth2'"
      
    oauth2_flows:
      description: "Supported OAuth2 flows"
      type: Array
      items: Enum [authorization_code, implicit, client_credentials, password]
      default: [authorization_code]
      condition: "providers includes 'oauth2'"
      
  ldap_specific_fields:
    ldap_server:
      description: "LDAP server configuration"
      type: Object
      fields:
        host: String
        port: Integer
        base_dn: String
        bind_dn: String?
        bind_password: String?
        use_tls: Boolean
      condition: "providers includes 'ldap'"
      
  saml_specific_fields:
    saml_config:
      description: "SAML configuration"
      type: Object
      fields:
        idp_metadata_url: String
        sp_entity_id: String
        assertion_consumer_service_url: String
        want_assertions_signed: Boolean
        want_authn_requests_signed: Boolean
      condition: "providers includes 'saml'"
      
  password_reset:
    description: "Password reset flow"
    type: Object
    fields:
      token_expiration_minutes: Integer
      require_old_password: Boolean
      rate_limit_per_hour: Integer
      notification_method: Enum [email, sms, both]
    default:
      token_expiration_minutes: 60
      require_old_password: false
      rate_limit_per_hour: 3
      notification_method: email
      
  account_recovery:
    description: "Account recovery options"
    type: Object
    fields:
      backup_codes: Boolean
      security_questions: Boolean
      trusted_devices: Boolean
      recovery_email: Boolean
    default:
      backup_codes: true
      security_questions: false
      trusted_devices: true
      recovery_email: true
      
  validation_rules:
    - "If providers includes 'oauth2', must specify 'oauth2_clients' field"
    - "If providers includes 'ldap', must specify 'ldap_server' field"
    - "If providers includes 'saml', must specify 'saml_config' field"
    - "Password min_length must be at least 8"
    - "If mfa.enabled is true, must specify mfa.methods"
    - "If session.refresh_token is true, must specify refresh_token_expiration_days"
    - "If token_refresh.enabled is true, must specify token_refresh.method"
    - "Password hashing algorithm must be secure (not md5, sha1, etc.)"
    
  examples:
    valid_production: |
      # @block:auth/web @kind:auth
      password:
        min_length: 14
        require_uppercase: true
        require_numbers: true
        require_special: true
        max_age_days: 90
        history_size: 10
      password_hashing:
        algorithm: argon2id
        cost_factor: 4
        salt_length: 16
      validation:
        max_attempts: 5
        lockout_duration: 1800
        require_email_verification: true
        captcha_threshold: 3
      mfa:
        enabled: true
        methods: [totp, webauthn]
        required_for: [admin, sensitive_operations]
      session:
        type: jwt
        expiration_hours: 12
        refresh_token: true
        refresh_token_expiration_days: 30
      token_refresh:
        enabled: true
        method: rotation
      providers: [local, oauth2]
      oauth2_clients:
        google:
          client_id: "..."
          scopes: [email, profile]
          redirect_uris: ["https://app.example.com/auth/callback"]
          pkce: true
      password_reset:
        token_expiration_minutes: 30
        rate_limit_per_hour: 5
        
    valid_basic: |
      # @block:auth/web @kind:auth
      password:
        min_length: 10
        require_uppercase: true
        require_numbers: true
      validation:
        max_attempts: 5
      providers: [local]
      session:
        type: session_cookie
        expiration_hours: 24
        
    invalid: |
      # @block:auth/web @kind:auth
      password:
        min_length: 4  # too short
      # missing validation field
      providers: [oauth2]
      # missing oauth2_clients field
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
    
  api_metadata:
    version:
      description: "API version"
      type: String
      default: "v1"
      
    base_path:
      description: "Base path for all endpoints"
      type: String
      default: "/api"
      
    title:
      description: "API title"
      type: String
      required: true
      
    description:
      description: "API description"
      type: String
      required: true
      
    versioning_strategy:
      description: "API versioning strategy"
      type: Enum [url, header, parameter, media_type]
      default: url
      
    documentation:
      description: "API documentation settings"
      type: Object
      fields:
        openapi_version: String
        generate_openapi: Boolean
        generate_postman: Boolean
        generate_insomnia: Boolean
      default:
        openapi_version: "3.0.0"
        generate_openapi: true
        generate_postman: false
        generate_insomnia: false
        
  security:
    authentication:
      description: "Authentication required"
      type: Boolean
      default: true
      
    auth_scheme:
      description: "Authentication scheme"
      type: Enum [bearer, basic, api_key, oauth2, jwt, session]
      default: bearer
      condition: "authentication == true"
      
    rate_limiting:
      description: "Rate limiting configuration"
      type: Object
      fields:
        enabled: Boolean
        requests_per_minute: Integer
        burst_size: Integer
        by: Enum [ip, user, api_key]
      default:
        enabled: true
        requests_per_minute: 60
        burst_size: 10
        by: ip
        
    cors:
      description: "CORS configuration"
      type: Object
      fields:
        enabled: Boolean
        allowed_origins: Array<String>
        allowed_methods: Array<String>
        allowed_headers: Array<String>
      default:
        enabled: true
        allowed_origins: ["*"]
        allowed_methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
        allowed_headers: ["Content-Type", "Authorization"]
        
  endpoints:
    description: "API endpoints"
    type: Array
    items: Object
    fields:
      path: String
      method: Enum [GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS]
      operation_id: String
      description: String
      summary: String
      
      request:
        description: "Request specification"
        type: Object
        fields:
          content_type: Enum [application/json, application/xml, multipart/form-data, application/x-www-form-urlencoded]
          schema: String  # reference to schema block
          validation: Object
            fields:
              required: Boolean
              max_size_bytes: Integer
              validate_schema: Boolean
          
      response:
        description: "Response specification"
        type: Object
        fields:
          status_code: Integer
          content_type: String
          schema: String  # reference to schema block
          examples: Array<Object>
            fields:
              name: String
              value: Object
              
      pagination:
        description: "Pagination settings"
        type: Object
        fields:
          type: Enum [offset, cursor, keyset]
          default_page_size: Integer
          max_page_size: Integer
          enabled: Boolean
        default:
          type: offset
          default_page_size: 20
          max_page_size: 100
          enabled: true
          
      filtering:
        description: "Filtering capabilities"
        type: Object
        fields:
          enabled: Boolean
          fields: Array<String>
          operators: Array<Enum [eq, ne, gt, lt, gte, lte, like, in, contains]>
        default:
          enabled: false
          fields: []
          operators: [eq]
          
      sorting:
        description: "Sorting capabilities"
        type: Object
        fields:
          enabled: Boolean
          fields: Array<String>
          default_sort: String
        default:
          enabled: false
          fields: []
          default_sort: ""
          
      caching:
        description: "Caching configuration"
        type: Object
        fields:
          enabled: Boolean
          max_age_seconds: Integer
          stale_while_revalidate_seconds: Integer
          vary_by: Array<String>
        default:
          enabled: false
          max_age_seconds: 300
          stale_while_revalidate_seconds: 60
          vary_by: []
          
      webhooks:
        description: "Webhooks for this endpoint"
        type: Array<Object>
        fields:
          event: String
          url: String
          retry_policy: Object
            fields:
              max_attempts: Integer
              backoff_factor: Float
              
  error_handling:
    description: "Error response formats"
    type: Object
    fields:
      format:
        description: "Error response format"
        type: Enum [rfc7807, custom, simple]
        default: rfc7807
        
      default_error_codes:
        description: "Default HTTP error codes to handle"
        type: Array<Integer>
        default: [400, 401, 403, 404, 409, 422, 429, 500]
        
      validation_error_format:
        description: "Validation error format"
        type: Object
        fields:
          field_errors: Boolean
          global_errors: Boolean
          error_code_prefix: String
          
  global_settings:
    request_id_header:
      description: "Request ID header name"
      type: String
      default: "X-Request-ID"
      
    compression:
      description: "Response compression"
      type: Object
      fields:
        enabled: Boolean
        algorithms: Array<Enum [gzip, deflate, br]>
      default:
        enabled: true
        algorithms: [gzip]
        
    timeout:
      description: "Request timeout settings"
      type: Object
      fields:
        global_timeout_ms: Integer
        per_endpoint_overrides: Map<String, Integer>
      default:
        global_timeout_ms: 30000
        
  validation_rules:
    - "Each endpoint must have unique (path, method) combination"
    - "If authentication is true, must specify 'auth_scheme' field"
    - "Request and response objects must have 'schema' field if present"
    - "If pagination.enabled is true, must specify pagination.type"
    - "If filtering.enabled is true, must specify filtering.fields"
    - "If caching.enabled is true, must specify caching.max_age_seconds"
    - "If rate_limiting.enabled is true, must specify rate_limiting.requests_per_minute"
    - "Endpoint paths must follow RESTful conventions (plural nouns, no verbs)"
    
  examples:
    valid_production: |
      # @block:api/users @kind:api
      title: "User Management API"
      description: "API for managing users and profiles"
      version: v1
      base_path: /api
      versioning_strategy: url
      documentation:
        generate_openapi: true
        openapi_version: "3.1.0"
      authentication: true
      auth_scheme: bearer
      rate_limiting:
        enabled: true
        requests_per_minute: 100
        burst_size: 20
        by: user
      cors:
        enabled: true
        allowed_origins: ["https://app.example.com"]
      endpoints:
        - path: /users
          method: GET
          operation_id: listUsers
          description: "List users with pagination and filtering"
          summary: "List users"
          pagination:
            enabled: true
            type: cursor
            default_page_size: 25
            max_page_size: 100
          filtering:
            enabled: true
            fields: [status, role, created_at]
            operators: [eq, ne, gt, lt, in]
          sorting:
            enabled: true
            fields: [created_at, updated_at, name]
            default_sort: "-created_at"
          caching:
            enabled: true
            max_age_seconds: 60
            vary_by: ["Authorization"]
          response:
            status_code: 200
            content_type: application/json
            schema: UserList
        - path: /users/{id}
          method: GET
          operation_id: getUser
          description: "Get user by ID"
          response:
            status_code: 200
            content_type: application/json
            schema: User
      error_handling:
        format: rfc7807
        default_error_codes: [400, 401, 403, 404, 422, 429, 500]
      global_settings:
        request_id_header: "X-Request-ID"
        compression:
          enabled: true
          algorithms: [gzip, br]
          
    valid_basic: |
      # @block:api/users @kind:api
      title: "Users API"
      description: "Basic user API"
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
      # missing title and description
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