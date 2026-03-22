# SpecLang Packaging Strategy

## Overview

This document outlines how SpecLang will be distributed to users.

## Recommended Approach: NPM Package + Binary

### Primary Distribution: NPM Package

```bash
npm install -g speclang
```

**Why NPM?**
- Node.js ecosystem already has CLI tools (like TypeScript, Vite, etc.)
- Easy to install globally or locally per project
- Automatic dependency management (chokidar, sqlite3, etc.)
- Version management with npm
- Cross-platform (Windows, macOS, Linux)

**Package Structure:**
```
speclang/
├── bin/
│   ├── speclang          # Unix executable
│   └── speclang.cmd      # Windows executable
├── dist/                 # Compiled TypeScript
├── specs/                # Default specs/templates
├── package.json
└── README.md
```

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

1. **Prepare package.json**
   - Add `bin` field
   - Add `files` whitelist
   - Set proper version

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

**What's Working:**
- ✅ TypeScript builds successfully
- ✅ 1229 tests pass
- ✅ CLI has 7 functional commands
- ✅ 419 specs in system
- ✅ 370 symlinks (dual-view pattern)

**What Needs Fixing Before Release:**
- 🔴 13 broken spec references
- 🟡 2 database migrations (need more complete schema)
- 🟡 Hard checks script has parsing bug

## Immediate Action Items

### 1. Fix Broken References (Critical)

Run validation and fix each error:
```bash
python3 scripts/validate_refs.py
```

### 2. Complete Database Schema

Need migrations for all tables mentioned in specs:
- specs, headers, blocks
- file_events, cascades
- commands, sessions
- locks, etc.

### 3. Update package.json

Add proper packaging configuration:
```json
{
  "name": "speclang",
  "version": "0.1.0",
  "bin": {
    "speclang": "./bin/speclang"
  },
  "files": [
    "bin/",
    "dist/",
    "specs/",
    "README.md"
  ],
  "scripts": {
    "prepublishOnly": "npm run build"
  }
}
```

### 4. Create Release Checklist

Use hard-checks.py as the gate:
```bash
python3 scripts/hard-checks.py
# Must pass all 6 critical checks
```

## Release Criteria

Before publishing to NPM:

- [ ] All 6 critical hard checks pass
- [ ] 13 broken references fixed
- [ ] Database schema complete (8+ migrations)
- [ ] Documentation updated
- [ ] Example projects working
- [ ] Version tagged in git

## User Installation (Future State)

```bash
# Global install
npm install -g speclang

# Initialize project
mkdir my-project && cd my-project
speclang init

# Start daemon
speclang start

# Or run single commands
speclang validate
speclang cascade specs/my-feature.spec.md
```

## Recommendation

**Start with NPM package** - it's the standard for Node.js CLI tools and gives you:
- Easiest distribution
- Built-in versioning
- Dependency management
- Largest user base

Add standalone binaries later as a "nice to have" for users who can't install Node.js.
