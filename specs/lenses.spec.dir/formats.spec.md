# speclang-header lines:11
id: "@speclang/lenses/formats"
version: 0.1.0
layer: 2
parent: "@ref:specs/lenses"
part: 1/2
tags: [lenses, formats, built-in]
project_level: Alpha
agent_support: agent_assisted
short: Built-in Lens Formats
---

# Built-in Lens Formats

## Built-in Lenses

### @lens/prose

```speclang
# @block:lens/prose @kind:entity
ProseLens:
  format: plain text
  use: explanations, notes, questions
  
Example:
  # @block:feature/overview @kind:note
  This feature allows users to log in with magic links.
  The flow sends an email with a one-time token.
```

### @lens/entity

```speclang
# @block:lens/entity @kind:entity
EntityLens:
  format: structured data definition
  use: defining types, models, schemas
  
Example:
  # @block:user/entity @kind:entity
  User:
    id: UUID
    email: String @unique
    name: String @min(2)
    roles: Role[]
    
  # or inline:
  # @block:status @kind:entity
  enum Status { active, inactive, pending }
```

### @lens/operation

```speclang
# @block:lens/operation @kind:entity
OperationLens:
  format: function signature + behavior
  use: defining actions, endpoints, use cases
  
Example:
  # @block:auth/login @kind:operation
  login(email: String, password: String) -> Result<Token, AuthError>:
    requires: email is valid
    ensures: token is fresh
    
    steps:
      - find user by email
      - verify password
      - generate token
      - log audit event
    
    acceptance:
      - GIVEN valid creds WHEN login THEN Ok(token)
      - GIVEN bad creds WHEN login THEN Err(AuthError)
```

### @lens/pseudocode

```speclang
# @block:lens/pseudocode @kind:entity
PseudocodeLens:
  format: informal algorithm description
  use: implementation hints for AI
  
Example:
  # @block:sort/quick @kind:pseudocode
  ```
  if list is empty or single element: return it
  pick pivot from middle
  partition into less, equal, greater
  recursively sort less and greater
  return less + equal + greater
  ```
```

### @lens/diagram

```speclang
# @block:lens/diagram @kind:entity
DiagramLens:
  format: mermaid, plantuml, graphviz
  use: visualizing flows, relationships
  
Example:
  # @block:auth/flow @kind:diagram
  ```mermaid
  sequenceDiagram
    U->>API: login
    API->>DB: find user
    DB-->>API: user
    API->>Auth: verify
    Auth-->>API: token
    API-->>U: success
  ```
```

### @lens/math

```speclang
# @block:lens/math @kind:entity
MathLens:
  format: LaTeX
  use: formulas, proofs, complexity
  
Example:
  # @block:sort/complexity @kind:math
  ```
  T(n) = 2T(n/2) + O(n)
  T(n) = O(n log n)
  
  S(n) = O(log n) stack depth
  ```
```

### @lense/code

```speclang
# @block:lens/code @kind:entity
CodeLens:
  format: any programming language
  use: reference impl, examples, snippets
  
Example:
  # @block:hash/bcrypt @kind:code
  ```typescript
  import bcrypt from 'bcrypt';
  
  export async function hash(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
  ```
```

### @lens/table

```speclang
# @block:lens/table @kind:entity
TableLens:
  format: markdown table
  use: structured reference data
  
Example:
  # @block:http/codes @kind:table
  | Code | Meaning |
  |------|---------|
  | 200 | OK |
  | 201 | Created |
  | 400 | Bad Request |
  | 401 | Unauthorized |
```

### @lens/acceptance

```speclang
# @block:lens/acceptance @kind:entity
AcceptanceLens:
  format: Gherkin-style criteria
  use: test specifications
  
Example:
  # @block:auth/acceptance @kind:acceptance
  GIVEN user exists with email "test@example.com"
  AND password is "secret"
  WHEN login called
  THEN returns Ok with valid token
  
  GIVEN no user with email
  WHEN login called
  THEN returns Err(AuthError.NotFound)
```

### @lens/policy

```speclang
# @block:lens/policy @kind:entity
PolicyLens:
  format: rule definitions
  use: access control, validation rules
  
Example:
  # @block:auth/policy @kind:policy
  policy AuthPolicy:
    - only owner can update own profile
    - admin can update any profile
    - password change requires current password
    - email change requires verification
```

### @lens/question

```speclang
# @block:lens/question @kind:entity
QuestionLens:
  format: open question
  use: unresolved decisions
  
Example:
  # @block:cache/question @kind:question
  Should we use Redis or in-memory cache?
  
  Options:
  - Redis: distributed, persistent
  - In-memory: fast, simple, single-node
  
  Impact: @block:session/storage
```

### @lens/decision

```speclang
# @block:lens/decision @kind:entity
DecisionLens:
  format: ADR (Architecture Decision Record)
  use: documenting choices
  
Example:
  # @block:auth/decision @kind:decision
  Decision: Use JWT for authentication
  
  Context:
    Need stateless auth for microservices
  
  Options:
  - JWT: stateless, scalable
  - Session: stateful, revocable
  
  Decision: JWT
  - fits microservices
  - can include claims
  - tradeoff: harder to revoke
```