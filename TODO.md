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
- [ ] Complete GETTING-STARTED.md
- [ ] Add API documentation
- [ ] Create CONTRIBUTING.md
- [ ] Write CHANGELOG.md

### Testing & Quality
- [x] All hard checks must pass (6/6)
- [ ] Test on clean machine (no dev dependencies)
- [ ] Test CLI commands manually
- [ ] Verify example projects work
- [ ] Check for console warnings/errors

### Examples
- [ ] Verify hello-world example works
- [ ] Create auth example
- [ ] Create API example
- [ ] Test examples in clean environment

## Current System Status

### ✅ Working (Verified)
- TypeScript Build - Compiles without errors
- Test Suite - 1229 tests pass (3 skipped)
- CLI Commands - 7 commands functional
- Spec Count - 419 specs in system
- Dual-View Symlinks - 370 symlinks working
- Documentation - All core docs present

### 📊 Statistics
- **Specs:** 419 files
- **Spec Directories:** 88
- **Implementation Files:** 370 TypeScript files
- **Test Files:** 54
- **Broken References:** 13
- **Migrations:** 2 (need 8+)
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

- [ ] Publish to NPM
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
