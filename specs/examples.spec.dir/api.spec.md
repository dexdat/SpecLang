---
id: "@speclang/examples/api"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [examples, api, design, endpoints]
short: API design example spec
parent: @ref:speclang/examples
part: 3/3
target: src/examples/api.ts
---
# API Design Example

Example API specification demonstrating endpoint definitions, request/response schemas, and error handling.

## Endpoints

### @block::api/users-list @kind:endpoint
**Method**: `GET`
**Path**: `/api/users`
**Description**: List users with pagination.

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `sort`: string (optional)

**Response**:
```typescript
interface UsersListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}
```

### @block::api/user-create @kind:endpoint
**Method**: `POST`
**Path**: `/api/users`
**Description**: Create a new user.

**Request Body**:
```typescript
interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
}
```

**Response**:
```typescript
interface CreateUserResponse {
  id: string;
  email: string;
  createdAt: Date;
}
```

**Status Codes**:
- `201 Created`: User created successfully
- `400 Bad Request`: Validation error
- `409 Conflict`: Email already exists

## Schemas

### @block::api/user-schema @kind:schema
```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### @block::api/error-schema @kind:schema
```typescript
interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
}
```

## Error Handling

### @block::api/error-codes @kind:pattern
Standard error codes:
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `INTERNAL_ERROR`: Server error

## References

- Parent: `@ref:speclang/examples`
- Related: `@ref:specs/examples.spec.dir/auth` (authentication example)
- Core: `@ref:speclang/core`