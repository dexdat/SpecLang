---
id: "@speclang/yaml-schema"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [yaml, schema, codegen, contracts, boilerplate]
short: "YAML Schema for Final Specs Before Code Generation"
status: draft
---

# YAML Schema for Final Specs

Defines the structured YAML format for `{name}.{ext}.spec` files - the final spec layer before code generation.

## Purpose

Final specs (`{name}.{ext}.spec`) are **always YAML format** to:
- Provide structured validation for models
- Define contracts (APIs, databases, external services)
- Generate boilerplate code templates
- Reduce errors with schema validation
- Enable precise code generation

## Tree Position

These specs are **leaf nodes** in the SpecLang spanning tree:
- **Root**: `project.scl` or `project.yaml` (North Star intent)
- **Branches**: `.spec.md` and `.spec.yaml` files (expanding design)
- **Leaves**: `.{ext}.spec` files (final YAML specs that generate code)

**No fixed layers**: The tree expands to whatever depth the system requires. Leaf specs generate code, branch specs define design, root defines intent.

## Schema Overview

```yaml
# speclang-header lines:25
id: "@generated/{domain}/{name}"
version: "1.0.0"
layer: 0
produces: "generated/{lang}/{path}/{name}.{ext}"
agent_support: "agent_autonomous"
tree_position: "leaf"
---
# Required sections for final specs
contracts:
  # External APIs and services
  apis: []
  databases: []
  external_services: []
  
entities:
  # Data structures
  - name: ""
    fields: []
    
operations:
  # Functions and methods
  - name: ""
    signature: ""
    steps: []
    
templates:
  # Code templates for target language
  go: ""
  typescript: ""
  python: ""
  
validation:
  # Input/output validation rules
  input: []
  output: []
  
references:
  # Dependencies
  depends_on: []
  imports: []
```

## Schema Details

### Contracts Section
Defines external dependencies and interfaces:

```yaml
contracts:
  apis:
    - name: "auth-api"
      url: "https://api.example.com/auth"
      methods: ["POST", "GET"]
      authentication: "bearer-token"
      rate_limit: "100/hour"
      
  databases:
    - name: "users-db"
      type: "postgresql"
      schema: "public"
      tables: ["users", "sessions"]
      
  external_services:
    - name: "email-service"
      provider: "sendgrid"
      api_key_env: "SENDGRID_API_KEY"
```

### Entities Section
Defines data structures with types:

```yaml
entities:
  - name: "User"
    description: "User account entity"
    fields:
      - name: "id"
        type: "UUID"
        required: true
        primary_key: true
        
      - name: "email"
        type: "string"
        required: true
        unique: true
        validation: "email"
        
      - name: "created_at"
        type: "datetime"
        default: "now()"
```

### Operations Section
Defines functions with signatures and steps:

```yaml
operations:
  - name: "login"
    signature: "(email: string, password: string) => Promise<Token>"
    description: "Authenticate user and return token"
    
    steps:
      - action: "validate_input"
        parameters:
          email: "required|email"
          password: "required|min:8"
          
      - action: "call_api"
        target: "auth-api"
        method: "POST"
        path: "/login"
        body: "{email, password}"
        
      - action: "handle_response"
        success: "return token"
        error: "throw AuthError"
```

### Templates Section
Language-specific code templates:

```yaml
templates:
  go: |
    package {{.Package}}
    
    // {{.Description}}
    func {{.Name}}({{.Parameters}}) {{.ReturnType}} {
      {{.Body}}
    }
    
  typescript: |
    export const {{.Name}} = ({{.Parameters}}): {{.ReturnType}} => {
      {{.Body}}
    }
    
  python: |
    def {{.name}}({{.parameters}}) -> {{.return_type}}:
        {{.body}}
```

### Validation Section
Input/output validation rules:

```yaml
validation:
  input:
    - field: "email"
      rules: ["required", "email", "max:255"]
      
    - field: "password"
      rules: ["required", "min:8", "max:100"]
      
  output:
    - field: "token"
      type: "JWT"
      expires_in: "24h"
      
    - field: "user"
      type: "User"
      required: true
```

## Usage in Cascade

### 1. Creation by Spec-Writer Agent
When a spec reaches layer 9 (detailed design), the spec-writer agent creates a `{name}.{ext}.spec` file with YAML schema.

### 2. Processing by Code-Gen Agent
The code-gen agent reads the YAML schema and:
- Validates against schema
- Generates boilerplate code from templates
- Fills in implementation details
- Produces final `{name}.{ext}` file

### 3. Benefits for AI Models
- **Structured guidance**: Clear schema reduces ambiguity
- **Validation**: Schema validation catches errors early
- **Boilerplate**: Templates provide starting point
- **Contracts**: External dependencies explicitly defined

## Example: Complete Auth Handler

```yaml
# speclang-header lines:30
id: "@generated/auth/handler-go"
version: "1.0.0"
layer: 0
produces: "generated/go/auth/handler.go"
agent_support: "agent_autonomous"
tree_position: "leaf"
---
contracts:
  apis:
    - name: "auth-api"
      url: "https://api.example.com/auth"
      methods: ["POST"]
      
entities:
  - name: "User"
    fields:
      - name: "ID"
        type: "string"
        
      - name: "Email"
        type: "string"
        
operations:
  - name: "Login"
    signature: "(email string, password string) (*Token, error)"
    steps:
      - validate_input
      - call_auth_api
      - generate_token
      
templates:
  go: |
    package auth
    
    // {{.Description}}
    func {{.Name}}({{.Parameters}}) {{.ReturnType}} {
      {{.Body}}
    }
```

## Integration with File Naming

This schema applies specifically to `{name}.{ext}.spec` files:
- `handler.go.spec` → YAML schema → `handler.go`
- `auth.ts.spec` → YAML schema → `auth.ts`
- `models.py.spec` → YAML schema → `models.py`

## References

- "@ref:speclang/file-naming - File naming conventions
- @ref:speclang/compiler - Code generation pipeline
- @ref:speclang/headers - Universal header format