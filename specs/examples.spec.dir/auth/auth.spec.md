# speclang-header lines:15
id: @specs/examples/auth
version: 1.0.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [example, auth, jwt, security]
short: Authentication example with JWT tokens
depends_on:
  - "@ref:specs/core"
  - "@ref:specs/examples/hello-world"
---

# Authentication Example

A more complex example demonstrating authentication with JWT tokens.

### @block:user-entity @kind:interface
User entity with authentication data.

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}
```

### @block:auth-service @kind:class
Authentication service handling login and token generation.

```typescript
class AuthService {
  private secret: string;
  
  constructor(secret: string) {
    this.secret = secret;
  }
  
  async login(username: string, password: string): Promise<LoginResult> {
    const user = await this.findUser(username);
    if (!user) {
      return { success: false, error: "Invalid credentials" };
    }
    
    const valid = await this.verifyPassword(password, user.passwordHash);
    if (!valid) {
      return { success: false, error: "Invalid credentials" };
    }
    
    const token = this.generateToken(user);
    return { success: true, token };
  }
  
  private generateToken(user: User): string {
    const payload = { userId: user.id, username: user.username };
    return jwt.sign(payload, this.secret, { expiresIn: '24h' });
  }
}
```

### @block:login-result @kind:type
Result type for login operations.

```typescript
type LoginResult = 
  | { success: true; token: string }
  | { success: false; error: string };
```

### @block:auth-middleware @kind:function
Express middleware for JWT authentication.

```typescript
function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  
  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, secret);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```
