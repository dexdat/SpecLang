# SpecLang Examples

This directory contains working examples demonstrating how SpecLang works.

## Structure

```
examples/
├── hello-world/       # Minimal example (recommended start)
├── auth/               # Authentication with JWT
└── crud-app/           # REST API with CRUD operations
```

Each example follows the dual-view pattern:
- **specs/** - Source of truth (edit here)
- **examples/** - Symlinks to generated code

## Quick Start

```bash
# Run hello-world
node examples/hello-world/index.ts
# Output: Hello, World!
```

## Examples

### 1. Hello World (Minimal)

The simplest possible example showing the spec-to-code pipeline.

- **Spec**: `specs/examples.spec.dir/hello-world/hello-world.spec.md`
- **Code**: `examples/hello-world/index.ts` (symlink)

**Key concepts:**
- `@block:` sections with `@kind:function` markers
- TypeScript code generation
- Dual-view pattern

**Run:**
```bash
npx ts-node examples/hello-world/index.ts
```

### 2. Authentication

JWT-based authentication service with middleware.

- **Spec**: `specs/examples.spec.dir/auth/auth.spec.md`
- **Code**: `examples/auth/index.ts` (symlink)

**Key concepts:**
- Interface definitions (`@kind:interface`)
- Class implementations (`@kind:class`)
- Custom type unions (`@kind:type`)
- Middleware pattern

**Run:**
```bash
# Test the auth service
node -e "
const { AuthService } = require('./examples/auth/index.ts');
const auth = new AuthService('secret');
auth.register('user', 'user@example.com', 'password').then(u => {
  console.log('Registered:', u.username);
  auth.login('user', 'password').then(r => {
    console.log('Login:', r);
  });
});
"
```

### 3. CRUD Application

Full REST API with entity management using repository pattern.

- **Spec**: `specs/examples.spec.dir/crud-app/crud-app.spec.md`
- **Code**: `examples/crud-app/index.ts` (symlink)

**Key concepts:**
- Entity modeling
- Repository pattern
- REST controller
- Input type definitions

**Run:**
```bash
# Test the CRUD operations
node -e "
const { TodoRepository } = require('./examples/crud-app/index.ts');
const repo = new TodoRepository();
repo.create({ title: 'Learn SpecLang', description: 'Read the docs' }).then(t => {
  console.log('Created:', t);
  repo.findAll().then(all => console.log('All:', all));
});
"
```

## How It Works

1. **Write specs** in `specs/examples.spec.dir/{example}/`
2. **SpecLang extracts** code blocks marked with `@kind:`
3. **Code is generated** to `src/{example}.ts`
4. **Dual-view pattern**: `examples/` symlinks to `specs/` source
5. **Regenerate**: Edit spec → rebuild → code updates

## Learning Path

1. Start with **hello-world** to understand the format
2. Move to **auth** to see interfaces and classes
3. Study **crud-app** for full application patterns

## More Information

- [docs/NORTH_STAR.md](../docs/NORTH_STAR.md) - Vision and principles
- [specs/core.spec.md](../specs/core.spec.md) - Core architecture
- [specs/speclang.spec.md](../specs/speclang.spec.md) - Spec format reference
- [specs/headers.spec.md](../specs/headers.spec.md) - Header format
