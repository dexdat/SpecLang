# speclang-header lines:7
id: "@speclang/roadmap/poc/tsconfig-json"
parent: ""@ref:specs/roadmap/poc"version: 0.1.0
layer: 2
short: "TypeScript configuration for POC"
tags: [poc, typescript, config, compiler]
---

# POC: tsconfig.json

Complete TypeScript compiler configuration for the POC implementation.

## Configuration

### @poc/tsconfig/base

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": false
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

## Compiler Options

### @poc/tsconfig/target

**Target: ES2022**
- Modern JavaScript features
- Native top-level await
- WeakRef support
- Error cause

**Module: NodeNext**
- ES modules with Node.js resolution
- Supports `import`/`export` syntax
- Handles `.js` extensions in imports

### @poc/tsconfig/output

**Output Settings:**
- `outDir`: `./dist` - Compiled output directory
- `rootDir`: `./src` - Source directory
- `declaration`: true - Generate `.d.ts` files
- `sourceMap`: true - Generate source maps for debugging

**Benefits:**
- Clean separation of source and compiled code
- Type declarations for library consumers
- Debuggable with original source maps

### @poc/tsconfig/strictness

**Strict Mode Settings:**
- `strict`: true - Enable all strict type checking
- `noImplicitAny`: true - No implicit any types
- `noImplicitReturns`: true - All code paths must return
- `exactOptionalPropertyTypes`: true - Distinguish `undefined` from missing

**Additional Checks:**
- `noFallthroughCasesInSwitch`: true - Require break/return in switch
- `noImplicitOverride`: true - Require `override` keyword
- `noUncheckedIndexedAccess`: true - Index access may be undefined

## File Organization

### @poc/tsconfig/files

**Include Pattern:**
```
src/**/*    # All TypeScript files in src/
```

**Exclude Pattern:**
```
node_modules      # Dependencies
dist              # Compiled output
**/*.test.ts      # Test files
**/*.spec.ts      # Spec files
```

**Project Structure:**
```
project/
├── src/                    # Source (included)
│   ├── index.ts
│   ├── daemon/
│   │   └── poc-daemon.ts
│   └── types/
│       └── index.ts
├── dist/                   # Output (excluded)
├── tests/                  # Tests (excluded)
├── node_modules/           # Dependencies (excluded)
├── tsconfig.json
└── package.json
```

## Module Resolution

### @poc/tsconfig/modules

**Module Strategy:**
- `module`: NodeNext - Modern ES modules
- `moduleResolution`: NodeNext - Node.js algorithm

**Import Requirements:**
```typescript
// Must use .js extension for local imports
import { foo } from './utils.js';

// External packages work normally
import chokidar from 'chokidar';

// JSON imports
import config from './config.json';
```

## Development vs Production

### @poc/tsconfig/environments

**Development (tsconfig.dev.json):**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "sourceMap": true,
    "declaration": false
  },
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

**Production:**
- Use base `tsconfig.json`
- Full declarations and source maps
- Optimized for distribution

## Type Checking

### @poc/tsconfig/checking

**Incremental Type Checking:**
```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".speclang/.tsbuildinfo"
  }
}
```

**Watch Mode:**
```bash
tsc --watch        # Rebuild on changes
tsc --noEmit       # Type check only
```

## Common Issues

### @poc/tsconfig/troubleshooting

**Issue: Cannot find module**
- Ensure `.js` extension in imports
- Check `moduleResolution` is NodeNext

**Issue: Decorator errors**
- Enable `experimentalDecorators`
- Enable `emitDecoratorMetadata` for reflect-metadata

**Issue: JSON imports**
- Enable `resolveJsonModule`
- Enable `allowSyntheticDefaultImports`

**Issue: Node.js built-ins**
- Add `@types/node` to devDependencies
- Import with `node:` prefix: `import fs from 'node:fs'`

## Validation

### @poc/tsconfig/validation

**Check configuration:**
```bash
tsc --noEmit              # Validate without output
tsc --showConfig          # Show effective config
```

**Build verification:**
```bash
npm run build
# Should produce:
#   dist/
#   ├── index.js
#   ├── index.d.ts
#   └── index.js.map
```
