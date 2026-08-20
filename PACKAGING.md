# SpecLang Packaging Strategy

## Overview

This document outlines how SpecLang will be distributed to users. All numbers
and commands below were verified live on 2026-08-19 (CLI output, test suite,
and scripts).

## Recommended Approach: NPM Package + Binary

### Primary Distribution: NPM Package

```bash
npm install -g speclang
```

**Why NPM?**
- Node.js ecosystem already has CLI tools (like TypeScript, Vite, etc.)
- Easy to install globally or locally per project
- Automatic dependency management (chokidar, better-sqlite3, etc.)
- Version management with npm
- Cross-platform (Windows, macOS, Linux)

**Package Structure** (matches `files` whitelist in package.json v1.0.0):
```
speclang/
├── bin/
│   ├── speclang          # Main CLI entry (Node shebang)
│   ├── speclangd         # Daemon entry point
│   └── speclangd-poc     # Daemon POC entry point
│   (speclang.cmd — Windows shim is planned, not yet shipped)
├── dist/                 # Compiled TypeScript (+ bundled default specs/templates)
├── README.md
├── CHANGELOG.md
├── LICENSE
└── package.json
```

`npm pack --dry-run` succeeds against the current package: `speclang-1.0.0.tgz`,
1747 files, 991.9 kB packed / 5.2 MB unpacked.

### Secondary: Standalone Binary (Optional)

For users who don't want Node.js:

```bash
# Using pkg or nexe to bundle into single executable
speclang --version
```

**Pros:**
- No Node.js installation required
- Single file distribution
- Better for enterprise environments

**Cons:**
- Larger file size (~50MB vs ~5MB)
- Platform-specific builds needed
- Harder to extend/debug

## Implementation Plan

### Phase 1: NPM Package (Priority)

1. **Prepare package.json** — DONE (v1.0.0)
   - ✅ `bin` field present (`"speclang": "./bin/speclang"`)
   - ✅ `files` whitelist present (`dist`, `bin`, `README.md`, `CHANGELOG.md`, `LICENSE`)
   - ✅ Version set (1.0.0) and tagged in git (`v1.0.0`)

2. **Build process**
   ```bash
   npm run build      # Compile TypeScript
   npm pack           # Create tarball
   npm publish        # Publish to registry
   ```

3. **Installation**
   ```bash
   npm install -g speclang
   speclang --version
   ```

### Phase 2: Pre-built Binary (Future)

1. **Use `pkg` to bundle**
   ```bash
   npm install -g pkg
   pkg . --targets node18-linux-x64,node18-macos-x64,node18-win-x64
   ```

2. **Distribute via GitHub Releases**
   - Attach binaries to releases
   - Users download and add to PATH

## Current Status

**What's Working (verified 2026-08-19):**
- ✅ TypeScript builds successfully (`npx tsc --noEmit` clean, exit 0)
- ✅ 1826 tests pass (58 skipped) — `npm test` / vitest steady state
- ✅ CLI has 20 functional commands (per `./bin/speclang --help`; hard-checks counts 17 distinct)
- ✅ 449 specs in system (447 `.spec.md` + 2 `.scl`) — `./bin/speclang status`
- ✅ 649 symlinks (dual-view pattern)
- ✅ Reference validation clean — `scripts/validate_refs.py`: "All references valid" (0 broken)
- ✅ Database schema complete — 8 migrations: initial, events, cascades, sessions, ralph, locks, commands, index
- ✅ All 6 critical hard checks pass — `scripts/hard-checks.py`: 6/6 (build, 1826 tests, refs, spec-impl sync, CLI, schema)

**Previously listed release blockers are resolved:**
- ~~13 broken spec references~~ → 0 (validation clean)
- ~~2 database migrations~~ → 8 migration files
- ~~Hard checks script parsing bug~~ → hard-checks.py passes 6/6

## Remaining Pre-Release Items

### 1. Publish to NPM

`npm pack` is verified; the remaining step is pushing to the registry:

```bash
npm publish
```

### 2. Windows `speclang.cmd` Shim

A `.cmd` shim for Windows users is planned but not yet shipped — `bin/`
currently contains only `speclang`, `speclangd`, `speclangd-poc`.

### 3. Release Checklist (per-publish gate)

Use hard-checks.py as the gate:

```bash
python3 scripts/hard-checks.py
# Must pass all 6 critical checks
```

Reference validation (kept as a pre-publish sanity check):

```bash
python3 scripts/validate_refs.py
```

## Release Criteria

Before publishing to NPM:

- [x] All 6 critical hard checks pass (verified 2026-08-19)
- [x] Broken references fixed (0 remaining; validate_refs.py clean)
- [x] Database schema complete (8 migrations)
- [x] Version tagged in git (v1.0.0)
- [x] Example projects present (`examples/`: hello-world, auth, crud-app)
- [ ] Published to npm registry (`npm publish` not yet run)
- [ ] Windows `speclang.cmd` shim shipped
- [ ] Standalone binary builds (pkg/nexe)

## User Installation

In the repo today the CLI runs via `./bin/speclang`; once published to npm it
is available globally:

```bash
# Global install (after npm publish)
npm install -g speclang

# Create a new project
speclang new my-project
cd my-project

# Or add spec scaffolding inside an existing project (name required)
speclang init my-feature     # writes specs/my-feature/my-feature.spec.md

# Start daemon
speclang start

# Or run single commands
speclang validate
speclang cascade specs/my-feature.spec.md
```

All commands above verified live: `new <name>` (exit 0), `init <name>` (exit 0),
`validate <file>` (exit 0), `status` (exit 0).

## Recommendation

**Start with NPM package** - it's the standard for Node.js CLI tools and gives you:
- Easiest distribution
- Built-in versioning
- Dependency management
- Largest user base

Add standalone binaries later as a "nice to have" for users who can't install Node.js.
