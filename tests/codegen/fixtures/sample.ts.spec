# speclang-header lines:12
id: @specs/sample.ts
version: 1.0.0
target: typescript
depends_on:
  - @ref:specs/auth/entities
---

## @block:sample/user @kind:interface
```typescript
export interface User {
  id: string;
  email: string;
  createdAt: Date;
}
```

## @block:sample/login @kind:function @ref:specs/auth/operations#login
```typescript
export async function login(
  email: string,
  password: string
): Promise<User> {
  // SPECLANG-IMPLEMENT: @ref:specs/auth/operations#login
}
```
