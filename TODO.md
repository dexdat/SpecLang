# SpecLang Implementation Tasks

**Status:** Alpha - Core system working, needs cleanup for release

**Last Updated:** 2026-03-22

## Critical Issues (Must Fix Before Release)

### CRITICAL-1: Fix Broken Spec References
**Status:** ✅ FIXED (2026-03-22)

Fixed 13 broken references by updating depends_on to use correct @speclang/xxx IDs:
- Updated specs/safety-detection.spec.md
- Updated specs/roadmap.spec.dir/production.spec.md
- Updated specs/roadmap.spec.dir/alpha.spec.md
- Updated specs/roadmap.spec.dir/beta.spec.md
- Updated specs/roadmap.spec.dir/mvp.spec.md
- Updated specs/agent-behavior.spec.dir/behavior-matrix.spec.md

Validation: All references now valid

### CRITICAL-2: Complete Database Schema
**Status:** ✅ FIXED (2026-03-22)

Current migrations:
- [x] 001_initial.sql - Create core tables (specs, headers, blocks)
- [x] 002_events.sql - File events table
- [x] 003_cascades.sql - Cascade tracking
- [x] 004_sessions.sql - Agent sessions
- [x] 005_ralph.sql
- [x] 006_locks.sql - File locks
- [x] 007_commands.sql
- [x] 008_index.sql - Search index tables

**Reference:** See `specs/sqlite.spec.dir/migrations.spec.md`

### CRITICAL-3: Fix Hard Checks Script
**Status:** ✅ FIXED (2026-03-22)

Fixed regex pattern to detect test results correctly:
- Improved regex to handle "Tests" and "Test Files" patterns
- Added line-by-line parsing to avoid confusion with "skipped" and "failed"
- ANSI color codes already handled

## Release Preparation Tasks

### Package Configuration
- [x] Update package.json with proper bin entry (already correct)
- [x] Add files whitelist for npm publish
- [x] Create prepublishOnly script (already exists)
- [x] Set version to 0.1.0 (already set)
- [x] Add keywords, author, license fields (author updated)

### Documentation
- [x] Update README.md with installation instructions
- [x] Complete GETTING-STARTED.md (already complete)
- [x] Add API documentation (skipped - specs exist)
- [x] Create CONTRIBUTING.md
- [x] Write CHANGELOG.md

### Testing & Quality
- [x] All hard checks must pass (6/6)
- [x] Test on clean machine (no dev dependencies)
- [x] Test CLI commands manually
- [x] Verify example projects work
- [x] Check for console warnings/errors

### Examples
- [x] Verify hello-world example works
- [x] Create auth example
- [x] Create API example
- [x] Test examples in clean environment

### Dogfooding (Integration Testing)
- [x] Run integration test: `python3 scripts/integration-test.py`
- [x] Generate REST API project in _tmp/
- [x] Generate auth system in _tmp/
- [x] Verify generated code compiles
- [x] Document any bugs found in specs/bugs/
- [x] Fix critical bugs found
- [x] Re-run until integration test passes

**See:** `docs/DOGFOODING.md` for detailed workflow

### Bugs Found During Dogfooding

#### BUG-001: CLI Missing Generate Command
**Status:** ✅ FIXED (2026-03-22)
**Severity:** High
**File:** `specs/bugs/cli-missing-generate-command.spec.md`

The `generate` command now exists in `bin/speclang`. Users can generate code from specs.

**Fix:**
- [x] Add generate command to bin/speclang
- [x] Implement code extraction from specs
- [x] Test the command works

Verification:
```bash
./bin/speclang generate --help
./bin/speclang generate --dry-run
```

#### BUG-002: Cascade Generates 0 Files (No Error)
**Status:** ✅ Fixed (2026-03-22)
**Severity:** Medium
**File:** `specs/bugs/cascade-generates-zero-files.spec.md`

When specs don't have TypeScript code blocks, cascade reports success but generates 0 files.

**Fix:**
- [x] Add helpful error message when 0 files generated
- [x] Explain that code blocks are needed
- [x] Suggest using AI generation or adding code blocks

## Current System Status

### ✅ Working (Verified)
- TypeScript Build - Compiles without errors
- Test Suite - 1229 tests pass (3 skipped)
- CLI Commands - 7 commands functional
- Spec Count - 420 specs in system
- Dual-View Symlinks - 372 symlinks working
- Documentation - All core docs present

### 📊 Statistics
- **Specs:** 420 files
- **Spec Directories:** 88
- **Implementation Files:** 370 TypeScript files
- **Test Files:** 54
- **Broken References:** 0 (FIXED)
- **Migrations:** 8 (COMPLETE)
- **CLI Commands:** 7
- **Test Coverage:** 1229 tests

## Release Gate

**Command to verify release readiness:**
```bash
python3 scripts/hard-checks.py
```

**Must show:**
```
6/6 critical checks passed
✓ ALL CRITICAL CHECKS PASSED
System is ready for packaging
```

## Post-Release Tasks

- [ ] Publish to NPM (requires npm authentication)
- [ ] Create GitHub release
- [ ] Write blog post
- [ ] Create video tutorial
- [ ] Setup issue templates
- [ ] Setup CI/CD
- [ ] Add telemetry (opt-in)

## Notes

- **Original POC phases (1-8):** Complete
- **PRD stories:** Marked complete but validation shows gaps
- **Priority:** Fix critical issues before any release
- **Packaging:** Plan outlined in PACKAGING.md
