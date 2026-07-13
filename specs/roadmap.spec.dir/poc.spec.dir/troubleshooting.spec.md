# speclang-header lines:7
id: "@speclang/roadmap/poc/troubleshooting"
parent: "@ref:specs/roadmap/pocversion: 0.1.0
layer: 2
short: "Troubleshooting guide for common issues"
tags: [poc, troubleshooting, errors, debugging, help]
---

# POC: Troubleshooting Guide

Common issues and their solutions.

## Quick Diagnostic

### @poc/troubleshooting/diagnostic

Run this checklist first:

```bash
# 1. Check versions
node --version  # Should be v18+
npm --version   # Should be 9+

# 2. Check installation
ls bin/speclangd  # Should exist

# 3. Check dependencies
ls node_modules/chokidar  # Should exist

# 4. Check build
ls dist/  # Should have compiled .js files

# 5. Test basic functionality
./bin/speclangd --version  # Should show version
```

## Common Issues

### @poc/troubleshooting/issues

---

**🔴 Issue: "command not found: speclangd"**

**Symptoms:**
```bash
$ speclangd
zsh: command not found: speclangd
```

**Cause:** Not in PATH or not installed

**Solutions:**

```bash
# Option 1: Use relative path
$ ./bin/speclangd

# Option 2: Add to PATH
$ export PATH="$PATH:$(pwd)/bin"
$ speclangd

# Option 3: Install globally
$ npm link
$ speclangd

# Option 4: Use npx
$ npx speclangd
```

---

**🔴 Issue: "Cannot find module 'chokidar'"**

**Symptoms:**
```
Error: Cannot find module 'chokidar'
Require stack:
- /path/to/speclang/dist/daemon/file-watcher.js
```

**Cause:** Dependencies not installed

**Solutions:**

```bash
# Option 1: Install dependencies
$ npm install

# Option 2: Clean install
$ rm -rf node_modules package-lock.json
$ npm install

# Option 3: Check npm version
$ npm --version  # Should be 9+
$ npm install -g npm@latest
$ npm install
```

---

**🔴 Issue: "EACCES: permission denied"**

**Symptoms:**
```
Error: EACCES: permission denied, open 'specs/test.spec.md'
```

**Cause:** File permissions incorrect

**Solutions:**

```bash
# Option 1: Fix file permissions
$ chmod 644 specs/*.spec.md
$ chmod 755 specs/

# Option 2: Fix ownership (macOS/Linux)
$ sudo chown -R $(whoami) .

# Option 3: Check directory permissions
$ ls -la
# Make sure user has read/write access
```

---

**🟡 Issue: "Watch directory not found"**

**Symptoms:**
```
[speclangd] ⚠️  Watch directory not found: ./specs
```

**Cause:** Directory doesn't exist

**Solutions:**

```bash
# Create the directory
$ mkdir specs

# Or use different directory
$ ./bin/speclangd --watch ./my-specs
```

---

**🟡 Issue: "No spec files found"**

**Symptoms:**
```
[speclangd] ⚠️  No spec files found
```

**Cause:** Empty specs directory

**Solutions:**

```bash
# Create first spec
$ cat > specs/hello.spec.md << 'SPEC'
# speclang-header lines:5
id: "@demo/hello"
version: 1.0.0
---

### @block::greet @kind:function
Say hello.
SPEC

# Or copy example
$ cp examples/hello.spec.md specs/
```

---

**🟡 Issue: "Parse error in spec"**

**Symptoms:**
```
[speclangd] ⚠️  Parse error in specs/test.spec.md
[speclangd]   Error: Missing speclang-header
```

**Cause:** Invalid spec format

**Solutions:**

```bash
# Check spec format
$ head -5 specs/test.spec.md

# Should start with:
# # speclang-header lines:N

# Fix by adding header
$ cat > specs/test.spec.md << 'SPEC'
# speclang-header lines:5
id: "@test/fixed"
version: 1.0.0
---

### @block::test @kind:function
Test function.
SPEC
```

**Common parse errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| "Missing speclang-header" | No header line | Add `# speclang-header lines:N` |
| "Invalid header format" | Wrong header syntax | Use `# speclang-header lines:5` |
| "Missing id field" | No id in header | Add `id: "@scope/name"` |
| "No blocks found" | No @block: definitions | Add `### @block::name @kind:type` |

---

**🟡 Issue: "Code not generating"**

**Symptoms:**
- Spec edited
- Daemon running
- No output in src/

**Diagnosis:**

```bash
# 1. Check daemon is running
$ ps aux | grep speclangd

# 2. Check for errors
$ ./bin/speclangd --verbose

# 3. Check file was detected
# Look for "Change detected" in output

# 4. Check spec is valid
$ cat specs/test.spec.md
# Ensure it has proper header and blocks
```

**Common causes:**

1. **Wrong file extension**
   - Specs must end in `.spec.md`
   - Wrong: `test.md`, `test.spec`
   - Right: `test.spec.md`

2. **Daemon not watching**
   ```bash
   # Restart daemon
   $ pkill speclangd
   $ ./bin/speclangd --verbose
   ```

3. **Spec in wrong directory**
   ```bash
   # Check watch directory
   $ ./bin/speclangd --watch ./specs
   # Make sure spec is in ./specs/
   ```

---

**🟡 Issue: "Build fails after generation"**

**Symptoms:**
```
$ npm run build
error TS2345: Argument of type 'string' is not assignable...
```

**Cause:** Generated code has type errors

**Solutions:**

```bash
# 1. Check generated code
$ cat src/hello/greet.ts

# 2. Look for issues:
# - Invalid type names
# - Syntax errors
# - Missing imports

# 3. Fix the spec (not the generated code!)
$ vim specs/hello.spec.md

# 4. Save to regenerate

# 5. Rebuild
$ npm run build
```

**Example fixes:**

| Issue in Generated Code | Fix in Spec |
|------------------------|-------------|
| `type: 'sting'` | Change to `type: 'string'` |
| Missing return type | Add `**Returns:** type` |
| Invalid syntax | Check markdown formatting |

---

**🟡 Issue: "Symlink not working on Windows"**

**Symptoms:**
- Code generates but src/ is empty
- Or src/ shows broken symlink

**Cause:** Windows requires admin for symlinks

**Solutions:**

```bash
# Option 1: Run as Administrator
# Right-click terminal → Run as Administrator

# Option 2: Use copy mode instead
$ ./bin/speclangd --no-symlinks

# Option 3: Enable Developer Mode (Windows 10+)
# Settings → Update & Security → For developers → Developer Mode
```

---

## Debug Mode

### @poc/troubleshooting/debug

**Enable Verbose Logging:**
```bash
$ ./bin/speclangd --verbose
```

**What to look for:**
```
[speclangd] DEBUG: Starting file watcher
[speclangd] DEBUG: Watching patterns: **/*.spec.md
[speclangd] DEBUG: Ignore patterns: *.tmp, *~, .git/**
[speclangd] DEBUG: Found 5 spec files
[speclangd] DEBUG: Processing: specs/test.spec.md
[speclangd] DEBUG:   Header: id="@test/hello"
[speclangd] DEBUG:   Blocks: 2
[speclangd] DEBUG:   Generated: src/test/hello.ts
[speclangd] DEBUG:   Generated: src/test/world.ts
```

**Debug Specific Component:**
```typescript
// Add to your code
import { logger } from './utils/logger';

logger.debug('Processing file:', filePath);
logger.debug('Parsed blocks:', blocks.length);
logger.debug('Generated content:', content.substring(0, 100));
```

## Performance Issues

### @poc/troubleshooting/performance

**Slow Cascade (> 10s):**

```bash
# Check for:
# 1. Too many files
$ find specs -name "*.spec.md" | wc -l
# If > 100, consider splitting into subdirectories

# 2. Large files
$ ls -lh specs/
# If files > 1MB, consider splitting

# 3. Slow disk
$ dd if=/dev/zero of=test-write bs=1M count=10
# Should complete in < 1s
```

**High CPU Usage:**
```bash
# Check what's using CPU
$ top -p $(pgrep -d',' speclangd)

# If chokidar using high CPU:
# 1. Reduce watch scope
$ ./bin/speclangd --watch ./specs/core

# 2. Increase debounce
$ ./bin/speclangd --debounce 1000
```

**Memory Leaks:**
```bash
# Monitor memory usage
$ watch -n 1 'ps -o pid,rss,comm -p $(pgrep speclangd)'

# If memory keeps growing:
# 1. Restart daemon periodically
# 2. Check for event listener leaks
# 3. Limit concurrent operations
```

## Getting Help

### @poc/troubleshooting/help

**Before Asking for Help:**
1. ✅ Run diagnostic checklist
2. ✅ Check this troubleshooting guide
3. ✅ Try verbose mode (`--verbose`)
4. ✅ Search existing issues

**Information to Provide:**
```bash
# Run diagnostic and paste output:
$ node --version
$ npm --version
$ ./bin/speclangd --version
$ ls -la specs/ 2>/dev/null | head -10
$ cat specs/*.spec.md 2>/dev/null | head -20
```

**Create Minimal Reproduction:**
```bash
# 1. Create minimal test case
mkdir test-case
cd test-case

# 2. Install speclang
npm install speclang

# 3. Create minimal spec
mkdir specs
cat > specs/test.spec.md << 'SPEC'
# speclang-header lines:5
id: "@test/minimal"
version: 1.0.0
---

### @block::test @kind:function
Test.
SPEC

# 4. Run daemon with verbose
./bin/speclangd --verbose

# 5. Document exact steps to reproduce issue
```

## Emergency Recovery

### @poc/troubleshooting/emergency

**Nuclear Option - Start Fresh:**
```bash
# 1. Stop daemon
$ pkill speclangd

# 2. Clean generated files
$ rm -rf specs/*.spec.dir
$ rm -rf src/*

# 3. Clean database
$ rm -f .speclang/poc.db

# 4. Rebuild
$ npm run clean
$ npm run build

# 5. Restart
$ ./bin/speclangd
```

**Regenerate Everything:**
```bash
# Force regeneration of all specs
$ touch specs/*.spec.md
# Daemon will see all as "modified" and regenerate
```

## Known Limitations

### @poc/troubleshooting/limitations

**POC Limitations (by design):**
- Single daemon instance only
- No hot reload of daemon itself
- No remote file watching
- No team collaboration features
- No advanced error recovery

**Platform Limitations:**
- Windows: Requires admin/Developer Mode for symlinks
- Network drives: File watching may be unreliable
- Very large projects (>1000 specs): May be slow

## Error Code Reference

### @poc/troubleshooting/codes

| Code | Meaning | Solution |
|------|---------|----------|
| E001 | Watch dir not found | `mkdir specs` |
| E002 | Permission denied | `chmod` or `chown` |
| E003 | Parse error | Fix spec header |
| E004 | Module not found | `npm install` |
| E005 | Build failed | Fix spec types |
| E006 | Convergence timeout | Check for infinite loops |
| E007 | Port in use | Kill other process or use different port |
| E008 | Out of memory | Reduce file count or restart |
