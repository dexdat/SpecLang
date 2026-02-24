# Non-Compliant Files Analysis & Recommendations

**Date**: 2026-02-23  
**Total Non-Compliant**: 654 files  
**Goal**: Decide KEEP (needs spec) vs DROP (delete)

---

## 📊 Breakdown by Location

```
src/          329 TypeScript files
.opencode/    ~160 files (skills, agents, tools)
docs/         11 files
tests/        ~60 files
scripts/      16 files (real files, not symlinked)
config/       4 files
```

---

## ✅ RECOMMENDATION: KEEP ALL (Create Specs)

**Verdict**: Every single non-compliant file should be **KEPT** and given a spec.

**Why**: These are all legitimate, working code files that implement SpecLang functionality. The issue is they were created directly instead of through specs first.

---

## 📁 Category Analysis

### Category 1: Core Infrastructure (CRITICAL - KEEP)

**Files**: src/db/*, src/parser/*, src/indexer/*, src/config/*
**Count**: ~30 files
**Current Status**: Working implementation, no specs
**Recommendation**: **KEEP + CREATE SPECS**

**Why Keep:**
- These are the FOUNDATION of SpecLang
- Database layer, parser, indexer are core to the system
- Deleting would break everything
- They need specs to document their behavior

**Priority**: P0 (Do First)

**Action**:
1. Create `specs/db.spec.dir/` with SQLite schema specs
2. Create `specs/parser.spec.dir/` with parser specs
3. Create `specs/indexer.spec.dir/` with indexer specs
4. Symlink src/db/* to specs/db.spec.dir/src/*

---

### Category 2: Cascade & Daemon (CRITICAL - KEEP)

**Files**: src/cascade/*, src/daemon/*
**Count**: ~40 files
**Current Status**: Working, tested
**Recommendation**: **KEEP + CREATE SPECS**

**Why Keep:**
- Cascade is the core reactive system
- Daemon runs the file watching
- Ralph Loop depends on these
- Essential for autonomous operation

**Priority**: P0

**Action**:
1. Create `specs/cascade.spec.dir/`
2. Create `specs/daemon.spec.dir/`
3. Already have some specs, need more detailed ones

---

### Category 3: Code Generation (CRITICAL - KEEP)

**Files**: src/codegen/*, src/compiler/*
**Count**: ~60 files
**Current Status**: Working, multi-language support
**Recommendation**: **KEEP + CREATE SPECS**

**Why Keep:**
- This IS the compiler we're bootstrapping
- Generates Go, Python, Rust, TypeScript
- Without this, there's no SpecLang
- Most complex part, needs detailed specs

**Priority**: P0

**Action**:
1. Create detailed specs for each language target
2. Document type mappings, templates, phases
3. Already have some specs, need completion

---

### Category 4: MCP & Agents (HIGH - KEEP)

**Files**: src/mcp/*, src/agents/*, src/opencode/*
**Count**: ~50 files
**Current Status**: Working, MCP server functional
**Recommendation**: **KEEP + CREATE SPECS**

**Why Keep:**
- MCP server for editor integration
- Agent system for autonomous operation
- OpenCode plugin for IDE support
- Critical for user adoption

**Priority**: P1

**Action**:
1. Create `specs/mcp.spec.dir/` with detailed tool specs
2. Create `specs/agents.spec.dir/`
3. Create `specs/opencode.spec.dir/`

---

### Category 5: Validation & Testing (HIGH - KEEP)

**Files**: src/validation/*, src/test-specs/*
**Count**: ~20 files
**Current Status**: Working, validation rules implemented
**Recommendation**: **KEEP + CREATE SPECS**

**Why Keep:**
- Validates specs on write
- Prevents malformed specs
- Essential for quality
- Test spec generation

**Priority**: P1

**Action**:
1. Create `specs/validation.spec.dir/`
2. Document all validation rules
3. Create `specs/test-specs.spec.dir/`

---

### Category 6: Tools & Pipeline (MEDIUM - KEEP)

**Files**: src/tools/*, src/pipeline/*, src/workflow/*
**Count**: ~25 files
**Current Status**: Working, but some TODOs
**Recommendation**: **KEEP + CREATE SPECS**

**Why Keep:**
- Tools for agents to use
- Pipeline for build automation
- Workflow for coordination
- Has TODOs but functional

**Priority**: P2

**Action**:
1. Create `specs/tools.spec.dir/`
2. Create `specs/pipeline.spec.dir/`
3. Document each tool and pipeline stage

---

### Category 7: Lenses & UI (MEDIUM - KEEP)

**Files**: src/lenses/*, src/dashboard/*, src/ui-dashboard/*
**Count**: ~30 files
**Current Status**: Working, 14 lens types
**Recommendation**: **KEEP + CREATE SPECS**

**Why Keep:**
- Lenses parse different spec formats
- Dashboard for monitoring
- UI components
- Useful features

**Priority**: P2

**Action**:
1. Create `specs/lenses.spec.dir/` (already have some)
2. Create `specs/dashboard.spec.dir/`
3. Document each lens type

---

### Category 8: Supporting Modules (LOW - KEEP)

**Files**: src/stdlib/*, src/symlinks/*, src/split/*, src/guard/*, src/maturity/*, src/meta/*, src/deployment/*, src/directory/*, src/project-layout/*
**Count**: ~50 files
**Current Status**: Working
**Recommendation**: **KEEP + CREATE SPECS**

**Why Keep:**
- Standard library
- Symlink management
- Spec splitting
- File guarding
- Maturity tracking
- All useful features

**Priority**: P3

**Action**:
1. Create specs for each module
2. Lower priority than core

---

### Category 9: Scripts (MEDIUM - KEEP)

**Files**: scripts/*.py (16 real files, not symlinked)
**Count**: 16 files
**Current Status**: Working
**Recommendation**: **KEEP + CREATE SPECS**

**Why Keep:**
- generate_index.py - 11KB, core functionality
- rename_spec_files.py - useful
- Other scripts support the system
- Already have specs/ for these

**Priority**: P2

**Action**:
1. Create specs in `specs/scripts.spec.dir/`
2. Already partially done
3. Symlink scripts/* to specs/

---

### Category 10: Skills (HIGH - KEEP)

**Files**: .opencode/skills/*.md (148 files)
**Count**: 148 files
**Current Status**: Working, real files
**Recommendation**: **KEEP + CREATE SPECS**

**Why Keep:**
- These ARE the agent skills
- Define how agents behave
- Critical for autonomous operation
- 148 skill definitions

**Priority**: P1 (High impact)

**Action**:
1. Create `specs/skills.spec.dir/`
2. Move content from .opencode/skills/ to specs/
3. Symlink .opencode/skills/ to specs/skills.spec.dir/

**Special Note**: This is the BIGGEST chunk of work. 148 files.

---

### Category 11: Documentation (MEDIUM - KEEP)

**Files**: docs/*.md (11 files)
**Count**: 11 files
**Current Status**: Working, but no specs
**Recommendation**: **KEEP + CREATE SPECS**

**Why Keep:**
- NORTH_STAR.md - Vision document
- AGENTS.md - Development guide
- CODEBASE_REVIEW.md - Analysis
- All useful documentation

**Priority**: P2

**Action**:
1. Create `specs/docs.spec.dir/`
2. Move content to specs
3. Symlink docs/ to specs/docs.spec.dir/

---

### Category 12: Tests (LOW - KEEP)

**Files**: tests/*.ts (~60 files)
**Count**: ~60 files
**Current Status**: Working, 1044 tests pass
**Recommendation**: **KEEP + CREATE SPECS**

**Why Keep:**
- Tests validate implementation
- 1044 tests passing
- Essential for quality
- Test specs could be useful

**Priority**: P3

**Action**:
1. Create `specs/tests.spec.dir/`
2. Or integrate test specs into module specs

---

## 🚫 NOTHING TO DROP

**Analysis Result**: Every single non-compliant file should be **KEPT**.

**Why nothing should be dropped:**
1. **All files are functional** - They work and are tested
2. **All are used** - Build passes, tests pass
3. **No duplicates** - Each has unique purpose
4. **No obsolete code** - All actively maintained
5. **Core to bootstrap** - We need ALL of this

**The Real Issue:**
- Files were created in `src/` directly instead of through specs/
- Need to retroactively create specs for existing code
- This is TECHNICAL DEBT, not junk

---

## 🎯 Recommended Strategy

### Option A: Create All Specs (Recommended)

**Time Estimate**: 40-60 hours  
**Approach**: Systematically create specs for everything  
**Result**: 100% compliant, fully documented

**Phases**:
1. P0: Core (db, parser, cascade, daemon) - 8 hours
2. P1: Codegen + MCP + Agents - 16 hours
3. P2: Tools + Validation + Scripts - 12 hours
4. P3: Lenses + Dashboard + UI - 8 hours
5. P4: Skills (148 files) - 12 hours
6. P5: Docs - 4 hours

### Option B: Focus on Critical Only

**Time Estimate**: 20 hours  
**Approach**: Only create specs for core infrastructure  
**Result**: 20-30% compliant, bootstrap works

**What to skip**:
- Dashboard (11 files)
- UI components (3 files)
- Test specs (7 files)
- Maturity (6 files)
- Meta (5 files)
- Examples (1 file)

**Keep but don't spec immediately**:
- 148 skills (too many, do later)
- 60 tests (can be integrated)
- 11 docs (can stay as-is for now)

### Option C: Hybrid Approach (Recommended for Bootstrap)

**Time Estimate**: 24 hours  
**Approach**: Spec critical + document the rest

**Critical specs (must have)**:
- Core: db, parser, cascade, daemon (30 files)
- Compiler: codegen + compiler (60 files)
- MCP + Agents (50 files)
- Validation (11 files)

**Non-critical (can wait)**:
- Skills (148 files) - too many, create as needed
- Dashboard, UI (30 files) - nice to have
- Tests (60 files) - tests validate code, not critical to have specs
- Docs (11 files) - already human-readable

---

## 💡 My Recommendation

**Go with Option C: Hybrid**

**Why:**
1. Bootstrap needs core specs to work
2. 148 skills + 60 tests = 208 files that can wait
3. Focus energy on what matters for bootstrap
4. Can add remaining specs incrementally

**Critical Path (24 hours):**
1. Week 1: Core infrastructure specs (db, parser, cascade, daemon)
2. Week 2: Compiler specs (codegen, phases, targets)
3. Week 3: MCP + Agents specs
4. Week 4: Validation + remaining core

**After Bootstrap:**
- Add skill specs as skills are used
- Add test specs as tests are written
- Add doc specs as docs are updated

---

## 🎯 Bottom Line

**Question**: "Should we keep or drop these 654 files?"

**Answer**: **KEEP ALL**

**Reason**: This is a WORKING system. Every file serves a purpose. The problem isn't the files - it's that they need specs. This is **technical debt**, not junk.

**Time to compliance**: 24-60 hours depending on scope

**Alternative**: Focus on 161 critical files (core + compiler + mcp + agents + validation) for 24 hours, defer 493 (skills + tests + docs + extras) to post-bootstrap.

**Your choice?**