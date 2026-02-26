# speclang-header lines:15
id: "@speclang/roadmap/poc/installation"
parent: "@ref:specs/roadmap/poc"
version: 0.1.0
layer: 2
short: "Installation and setup guide for POC"
tags: [poc, installation, setup, getting-started]
---

# POC: Installation & Setup

Complete guide for installing and setting up SpecLang POC.

## Prerequisites

### @poc/installation/prerequisites

**Required:**
- Node.js 18+ (LTS recommended)
- npm 9+ or yarn/pnpm
- Git (for cloning)

**Check versions:**
```bash
node --version    # Should be v18.x.x or higher
npm --version     # Should be 9.x.x or higher
```

**Install Node.js:**
- **macOS**: `brew install node`
- **Ubuntu/Debian**: `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs`
- **Windows**: Download from [nodejs.org](https://nodejs.org)

## Installation

### @poc/installation/install

**Step 1: Clone Repository**
```bash
git clone https://github.com/your-org/speclang.git
cd speclang
```

**Step 2: Install Dependencies**
```bash
npm install
```

This installs:
- `chokidar` (file watching)
- `better-sqlite3` (database)
- `typescript` (compilation)
- `vitest` (testing)

**Step 3: Build Project**
```bash
npm run build
```

Expected output:
```
> speclang@0.1.0 build
> tsc

✅ Build successful
```

**Step 4: Verify Installation**
```bash
./bin/speclangd --version
```

Expected:
```
SpecLang POC Daemon v0.1.0
```

## Quick Start

### @poc/installation/quick-start

**5-Minute Quick Start:**

```bash
# 1. Install (see above)
npm install
npm run build

# 2. Create directory structure
mkdir -p specs src

# 3. Create your first spec
cat > specs/hello.spec.md << 'SPEC'
# speclang-header lines:8
id: "@demo/hello"
version: 1.0.0
layer: 5
---

### @block:greet @kind:function
Greet someone.

**Parameters:**
- name: string - Person's name

**Returns:** string - Greeting message
SPEC

# 4. Start the daemon
./bin/speclangd

# 5. See the magic happen! ✨
# The daemon will detect the spec and generate code

# 6. Check generated code
ls -la src/hello/
cat src/hello/greet.ts

# 7. Build to verify
npm run build
```

**Expected Output:**
```
[speclangd] Starting SpecLang POC daemon v0.1.0
[speclangd] Watching: ./specs
[speclangd] 
[speclangd] ✅ Ready. Watching for changes...
[speclangd] 
[speclangd] [14:32:05] Change detected: specs/hello.spec.md
[speclangd] [14:32:05] ✅ Generated: src/hello/greet.ts
[speclangd] [14:32:10] ✅ Convergence detected
```

## Project Structure

### @poc/installation/structure

**After Setup:**
```
my-project/
├── specs/                  # Your specs go here
│   └── hello.spec.md       # Example spec
├── src/                    # Generated code appears here
│   └── hello/              # Symlink to generated code
│       └── greet.ts        # Generated file
├── specs/hello.spec.dir/   # Generated code storage
│   └── src/
│       └── greet.ts
├── .speclang/              # Daemon state
│   └── poc.db              # SQLite database
├── bin/
│   └── speclangd           # CLI executable
├── package.json
└── README.md
```

**Key Points:**
- Edit files in `specs/` only
- Never edit files in `src/` (they're generated)
- `src/` contains symlinks to `specs/*.spec.dir/src/`

## Configuration

### @poc/installation/config

**Configuration File**: `.speclang/config.yaml` (optional)

**Create config:**
```bash
mkdir -p .speclang
cat > .speclang/config.yaml << 'CONFIG'
# SpecLang POC Configuration

# Directory to watch for specs
watch:
  directory: ./specs
  recursive: true
  debounce: 300  # milliseconds

# Code generation settings
generation:
  output_directory: ./src
  use_symlinks: true
  header_comment: true

# Convergence settings
cascade:
  quiet_period: 5000  # 5 seconds
  max_depth: 10

# Logging
logging:
  level: info  # debug, info, warn, error
  timestamps: true
  colors: true
CONFIG
```

**Config Locations (in order of priority):**
1. `./.speclang/config.yaml` (project-specific)
2. `~/.speclang/config.yaml` (user-wide)
3. Defaults (built-in)

**Environment Variables:**
```bash
export SPECLANG_WATCH=./my-specs
export SPECLANG_OUTPUT=./generated
export SPECLANG_VERBOSE=1
```

## Verification

### @poc/installation/verify

**Test Installation:**

```bash
# Run tests
npm test

# Expected output:
# ✓ FileWatcher (8 tests)
# ✓ BlockParser (12 tests)
# ✓ Templates (6 tests)
# ✓ SimpleAgent (5 tests)
# ✓ Integration (4 tests)
#
# Test Files  5 passed (5)
#     Tests  35 passed (35)
```

**Test End-to-End:**
```bash
# Create test spec
cat > specs/test.spec.md << 'SPEC'
# speclang-header lines:5
id: "@test/verify"
version: 1.0.0
---

### @block:test @kind:function
Test function.
SPEC

# Run daemon for 5 seconds
timeout 5 ./bin/speclangd || true

# Check output
ls src/test/  # Should show test.ts
```

## Troubleshooting

### @poc/installation/troubleshooting

**Issue: "command not found: speclangd"**
```bash
# Solution: Use relative path
./bin/speclangd

# Or install globally
npm link
speclangd  # Now available globally
```

**Issue: "Cannot find module 'chokidar'"**
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Issue: "EACCES: permission denied"**
```bash
# Solution: Fix permissions
chmod +x bin/speclangd

# Or on macOS/Linux:
sudo chown -R $(whoami) .
```

**Issue: "Port already in use" (future)**
```bash
# Find process using port
lsof -i :8080

# Kill it
kill -9 <PID>

# Or use different port
speclangd --port 8081
```

**Issue: "Build fails with TypeScript errors"**
```bash
# Clean build
npm run clean
npm run build

# If still failing, check TypeScript version
npx tsc --version

# Should be 5.0+
```

## Uninstallation

### @poc/installation/uninstall

**Remove SpecLang:**
```bash
# If installed globally
npm unlink speclangd

# Remove project
cd ..
rm -rf speclang

# Remove config (optional)
rm -rf ~/.speclang
```

## System Requirements

### @poc/installation/requirements

**Minimum:**
- Node.js 18+
- 100MB free disk space
- 512MB RAM

**Recommended:**
- Node.js 20 LTS
- 500MB free disk space
- 2GB RAM
- SSD storage (for faster file watching)

**Supported Platforms:**
- ✅ macOS 12+ (Intel & Apple Silicon)
- ✅ Ubuntu 20.04+ / Debian 11+
- ✅ Windows 10+ (WSL2 recommended)
- ⚠️ Windows native (limited testing)

## Next Steps

### @poc/installation/next-steps

After installation:
1. Read [@ref:specs/roadmap.spec.dir/poc.spec.dir/demo-workflow] - Complete walkthrough
2. Try [@ref:specs/roadmap.spec.dir/poc.spec.dir/cli] - CLI reference
3. Check [@ref:specs/roadmap.spec.dir/poc.spec.dir/troubleshooting] - If issues arise

**Start Building:**
```bash
# Create your first spec
mkdir -p specs
cat > specs/my-feature.spec.md << 'SPEC'
# speclang-header lines:5
id: "@myproject/feature"
version: 1.0.0
---

### @block:myFunction @kind:function
Your function description.

**Parameters:**
- param: string - Parameter description
SPEC

# Start daemon
./bin/speclangd

# Edit specs and watch code generate! 🚀
```
