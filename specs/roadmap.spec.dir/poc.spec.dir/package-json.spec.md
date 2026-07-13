# speclang-header lines:8
id: "@speclang/roadmap/poc/package-json"
parent: "@ref:specs/roadmap/poc"
version: 0.1.0
layer: 2
short: "Package.json specification for POC"
tags: [poc, package, dependencies, npm]
---

# POC: Package.json

Complete package.json specification for the POC implementation.

## Dependencies

### @poc/package/dependencies

```json
{
  "name": "speclang-poc",
  "version": "0.1.0",
  "description": "SpecLang Proof of Concept - Reactive spec-driven code generation",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "speclangd-poc": "./bin/speclangd-poc"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "start": "node dist/daemon/poc-daemon.js"
  },
  "dependencies": {
    "chokidar": "^3.5.3",
    "sqlite3": "^5.1.6",
    "commander": "^11.0.0",
    "glob": "^10.3.0",
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.5.0",
    "@types/jest": "^29.5.4",
    "typescript": "^5.1.6",
    "jest": "^29.6.2",
    "ts-jest": "^29.1.1",
    "eslint": "^8.47.0",
    "@typescript-eslint/eslint-plugin": "^6.4.0",
    "@typescript-eslint/parser": "^6.4.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Required Dependencies:**

| Package | Version | Purpose |
|---------|---------|---------|
| chokidar | ^3.5.3 | File system watching |
| sqlite3 | ^5.1.6 | Database storage |
| commander | ^11.0.0 | CLI argument parsing |

**Dev Dependencies:**

| Package | Version | Purpose |
|---------|---------|---------|
| @types/node | ^20.5.0 | Node.js type definitions |
| @types/jest | ^29.5.4 | Jest type definitions |
| typescript | ^5.1.6 | TypeScript compiler |
| jest | ^29.6.2 | Testing framework |
| ts-jest | ^29.1.1 | TypeScript Jest transformer |
| eslint | ^8.47.0 | Linting |

## Package Details

### @poc/package/description

**Name:** `speclang-poc`
- Scoped: No (POC is standalone)
- Semantic versioning: 0.1.0

**Entry Points:**
- `main`: Compiled JavaScript entry point
- `types`: TypeScript declarations
- `bin`: CLI executable (`speclangd-poc`)

**Scripts:**
- `build`: Compile TypeScript to `dist/`
- `dev`: Watch mode compilation
- `clean`: Remove compiled output
- `test`: Run Jest tests
- `test:watch`: Watch mode testing
- `lint`: ESLint validation
- `start`: Run the daemon directly

### @poc/package/engines

**Node.js:** >= 18.0.0
- Required for modern features
- Native fetch API
- File watcher improvements

## Installation

### @poc/package/install

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Start daemon
npm start
```

**Development Workflow:**
```bash
# Terminal 1: Watch mode
npm run dev

# Terminal 2: Run tests
npm run test:watch

# Terminal 3: Daemon
npm start
```

## Peer Dependencies

### @poc/package/peer

**None required for POC**

Future versions may require:
- Node.js >= 20 (for native features)
- Git (for repository integration)

## Optional Dependencies

### @poc/package/optional

**None required for POC**

Potential additions:
- `winston` (structured logging)
- `chalk` (terminal colors)
- `ora` (spinners/progress)

## Lock File

### @poc/package/lock

**Commit `package-lock.json` to version control:**
- Ensures reproducible builds
- Pins exact dependency versions
- Enables `npm ci` for CI/CD

```bash
# After updating dependencies
npm install
npm install --package-lock-only  # Update lock file only
```

## Dependency Security

### @poc/package/security

**Audit regularly:**
```bash
npm audit
npm audit fix
```

**Update strategy:**
- Monthly security updates
- Quarterly minor version updates
- Manual review for major versions
