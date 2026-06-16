# Hello World Example

A minimal SpecLang example demonstrating the cascade from specs to working code.

## Structure

```
hello-world/
├── spec/              # Spec source (SOURCE OF TRUTH)
│   └── hello-world.spec.md
└── src/               # Generated code (symlinked)
    └── hello-world.ts
```

## Running

```bash
# Run the example
node examples/hello-world/index.ts

# Or with npx ts-node
npx ts-node examples/hello-world/index.ts
```

## Output

```
Hello, World!
```

## How It Works

1. **Write specs** in `specs/hello-world.spec.md`
2. **SpecLang extracts** code blocks marked with `@kind:function`
3. **Code is generated** to `src/hello-world.ts`
4. **Dual-view pattern**: `examples/` symlinks to `specs/` source

## Spec Details

The spec contains:
- `@block:hello-world-function` - Main greeting function
- `@block:main-function` - Entry point
- `@block:test-cases` - Test definitions

Each block is marked with `@kind:` to indicate its purpose (function, test, interface, etc.).

## Learn More

- [docs/NORTH_STAR.md](../docs/NORTH_STAR.md) - Vision and principles
- [specs/core.spec.md](../specs/core.spec.md) - Core architecture
- [specs/speclang.spec.md](../specs/speclang.spec.md) - Spec format
