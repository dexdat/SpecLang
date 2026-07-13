# speclang-header lines:11
id: "@speclang/lenses/operation"
version: 0.1.0
layer: 4
project_level: Alpha
agent_support: agent_autonomous
tags: [lenses, api, operations, documentation]
short: "API operation documentation lens"
target: src/lenses/operation-lens.ts
status: draft
---

# Operation Lens

Documents API operations from spec blocks.

## Input Format (Spec Blocks)

### @lenses/operation/input-format

Operation lens accepts spec blocks with `@kind:operation` marker. The operation definition can be in various formats:

**Function signature format:**
```speclang
### @block::login-operation @kind:operation

login(email: String, password: String) -> Result<Token, Error>
1. Validate email format
2. Look up user by email
3. Verify password hash
4. Generate JWT token
5. Return token
```

**HTTP endpoint format:**
```speclang
### @block::create-user @kind:operation

POST /users
Content-Type: application/json

Request:
{
  "email": "string",
  "name": "string",
  "password": "string"
}

Response: 201 Created
{
  "id": "uuid",
  "email": "string",
  "name": "string"
}
```

**gRPC service format:**
```speclang
### @block::user-service @kind:operation

service UserService {
  rpc CreateUser(CreateUserRequest) returns (UserResponse);
  rpc GetUser(GetUserRequest) returns (UserResponse);
}
```

**GraphQL operation format:**
```speclang
### @block::graphql-mutation @kind:operation

mutation CreateUser($input: UserInput!) {
  createUser(input: $input) {
    id
    email
    name
  }
}
```

## Output Format (API Documentation)

### @lenses/operation/output-format

Generates API documentation in multiple formats:

**OpenAPI/Swagger specification:**
```yaml
paths:
  /users:
    post:
      summary: Create user
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                name:
                  type: string
      responses:
        '201':
          description: User created
```

**Interactive API documentation:** ReDoc, Swagger UI, or custom UI with try-it functionality.

**Code examples:** Client SDKs in multiple languages (TypeScript, Python, Go, etc.).

**Sequence diagrams:** Mermaid sequence diagrams showing API flow.

## Supported Operation Types

### @lenses/operation/types

**Operation categories:**
- **HTTP operations:** GET, POST, PUT, DELETE, PATCH, etc.
- **gRPC operations:** Unary, server streaming, client streaming, bidirectional
- **GraphQL operations:** Queries, mutations, subscriptions
- **Function operations:** Pure function signatures with input/output
- **Batch operations:** Bulk operations, batch processing
- **Async operations:** Background jobs, event handlers

**Parameter types:**
- **Path parameters:** `/users/{id}`
- **Query parameters:** `?page=1&limit=10`
- **Request body:** JSON, XML, form data, binary
- **Headers:** Authentication, content type, custom headers
- **Cookies:** Session management

## Operation Extraction

### @lenses/operation/extraction

Extracts operation definitions from spec blocks with accurate parameter and response detection.

**Extraction process:**
1. Detect operation format (function, HTTP, gRPC, GraphQL)
2. Parse operation name and signature
3. Extract parameters (name, type, location, required, default)
4. Extract request/response schemas
5. Parse step-by-step descriptions
6. Build operation metadata

**Parameter parsing:**
- **Type inference:** `String`, `Int`, `Float`, `Boolean`, `UUID`, `Date`, `Object`
- **Location detection:** `path`, `query`, `header`, `body`, `cookie`
- **Validation rules:** `required`, `pattern`, `min`, `max`, `enum`
- **Documentation:** Descriptions, examples, constraints

## OpenAPI Generation

### @lenses/operation/openapi-generation

Generates OpenAPI 3.0 specifications from extracted operations.

**Path generation:**
- Convert operation signatures to RESTful paths
- Map HTTP methods based on operation semantics (CRUD mapping)
- Generate parameter objects with schemas

**Schema generation:**
- Convert TypeScript interfaces to JSON Schema
- Generate request/response schemas
- Handle nested objects, arrays, unions, enums
- Add validation constraints

**Security scheme generation:**
- API key, Bearer token, OAuth2, OpenID Connect
- Scope definitions
- Security requirements per operation

**Example generation:**
- Generate example requests/responses
- Include realistic data based on schema
- Support multiple media types

## API Documentation Generation

### @lenses/operation/documentation-generation

Generates human-readable API documentation.

**Documentation formats:**
- **Markdown:** Clean, version-controlled docs
- **HTML:** Styled, interactive documentation
- **PDF:** Printable reference manuals
- **Interactive:** Live API console with try-it functionality

**Content sections:**
- Overview and authentication
- Endpoint reference with examples
- Request/response schemas
- Error handling
- Rate limiting and quotas
- SDK installation and usage

**Code examples:**
- **cURL:** Command-line examples
- **JavaScript/TypeScript:** Fetch, Axios examples
- **Python:** Requests, httpx examples
- **Go:** net/http examples
- **Java:** OkHttp, Spring examples

## Validation Rules

### @lenses/operation/validation

Validates operation definitions for consistency and correctness.

**Syntax validation:**
- Valid parameter types and locations
- Consistent naming conventions
- Proper HTTP method usage
- Valid GraphQL syntax

**Semantic validation:**
- Required parameters have types
- Response types match operation intent
- Authentication requirements specified
- Error responses defined for expected failures

**Completeness validation:**
- All operations have at least one example
- All parameters have descriptions
- All error codes documented
- Rate limits specified where applicable

## Examples

### @lenses/operation/examples

**Example 1: HTTP REST operation**

```speclang
### @block::create-user-api @kind:operation

POST /users
Content-Type: application/json
Authorization: Bearer {token}

Request:
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "secret123"
}

Response: 201 Created
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-03-31T14:20:00Z"
}

Steps:
1. Validate request body
2. Hash password
3. Create user record
4. Send welcome email
5. Return user data
```

**Example 2: GraphQL mutation**

```speclang
### @block::update-user-graphql @kind:operation

mutation UpdateUser($id: ID!, $input: UserUpdateInput!) {
  updateUser(id: $id, input: $input) {
    id
    email
    name
    updatedAt
  }
}

Input schema:
type UserUpdateInput {
  email: String
  name: String
  password: String
}
```

**Example 3: Function signature with steps**

```speclang
### @block::calculate-tax @kind:operation

calculateTax(amount: Float, country: String) -> Float
1. Look up tax rate for country
2. Apply tax rate to amount
3. Round to 2 decimal places
4. Return calculated tax
```

## Implementation Notes

### @lenses/operation/implementation

The operation lens implementation should:

1. **Detection:** Identify `@kind:operation` blocks and parse various formats
2. **Parsing:** Extract operations, parameters, request/response schemas, steps
3. **OpenAPI generation:** Convert to OpenAPI 3.0 specification
4. **Documentation generation:** Create human-readable docs with examples
5. **Validation:** Check consistency and completeness

**Integration:** The lens integrates with the existing lens registry and supports all standard lens operations (parse, render, validate).

**Testing:** Each operation format should have test coverage for extraction, OpenAPI generation, and documentation.

**Performance:** Operation lens should handle large API specifications efficiently (100+ endpoints).
