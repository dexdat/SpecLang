# SpecLang Dual-View Pattern Audit

**Date**: 2026-02-23 (original) | **Re-audited**: 2026-07-20  
**Status**: ✅ LARGELY COMPLETE — >95% compliance (original audit was stale)  
**Principle**: EVERYTHING in the repo should follow specs/ → [symlink] → location

> **2026-07-20 Re-audit**: The original February audit claimed ~30% compliance. This was stale — the symlink migration happened in July (commits from Jul 12). Actual state verified by foreman tick with `ls -la` on each directory.

---

## 🎯 The Rule

**Everything must have a spec source of truth:**
```
specs/{category}.spec.dir/     ← Source of Truth (Specs)
         ↓
    [symlink or generation]
         ↓
{location}/                    ← Working Location
```

---

## ✅ What's Working (Following Pattern)

### 1. src/ TypeScript Files
- **Pattern**: specs/implementation.spec.dir/src/ → src/
- **Status**: ✅ Working via pre-commit hook
- **Symlinks**: 7 files (validation.ts, codegen.ts, ralph-loop.ts, etc.)
- **Auto-managed**: Yes, recreated on every commit

### 2. scripts/ Python Files (Partial)
- **Pattern**: specs/scripts.spec.dir/ → scripts/
- **Status**: ⚠️ Partial (20 symlinked, 16 real files)
- **Symlinked**: analyze_validation.py, fix_headers.py, etc.
- **Real files**: generate_index.py, rename_spec_files.py, etc.

---

## ❌ What's Broken (Not Following Pattern)

### 1. .opencode/skills/ - CRITICAL GAP

**Current State:**
- specs/skills.spec.dir/: 3 skill specs
- .opencode/skills/: 148 skill files
- **Relationship**: NONE - .opencode files are NOT symlinks

**Problem:**
```bash
# These should be symlinks to specs/skills.spec.dir/
.opencode/skills/spec-writer.md      # Real file
.opencode/skills/code-gen.md         # Real file
.opencode/skills/adversarial-reviewer.md  # Real file
# ... 145 more
```

**What should happen:**
```bash
# Should be:
.opencode/skills/spec-writer.md -> ../../specs/skills.spec.dir/spec-writer.spec.md
```

**Impact**: Skills are being maintained in TWO places

### 2. docs/ Documentation - NO SPECS

**Current State:**
- docs/NORTH_STAR.md - Real file
- docs/BOOTSTRAP_PLAN.md - Real file
- docs/MASTER_GUIDE.md - Real file
- docs/CASCADE_DEMO.md - Real file
- **No specs/ directory for docs**

**Problem:**
- No spec source of truth for documentation
- docs/ are just regular markdown files
- No dual-view pattern

**What should happen:**
```bash
# Create: specs/docs.spec.dir/
specs/docs.spec.dir/north-star.spec.md
specs/docs.spec.dir/bootstrap-plan.spec.md
specs/docs.spec.dir/

# Then symlink:
docs/NORTH_STAR.md -> ../specs/docs.spec.dir/north-star.spec.md
```

### 3. scripts/ - INCOMPLETE SYMLINKING

**Current State:**
```bash
# Symlinked (Good):
scripts/analyze_validation.py -> ../specs/scripts.spec.dir/analyze_validation.py
scripts/fix_headers.py -> ../specs/scripts.spec.dir/fix_headers.py
# ... 18 more

# Real files (Need specs or symlinks):
scripts/generate_index.py          # 11KB - NO SPEC
scripts/rename_spec_files.py       # NO SPEC
# ... 14 more
```

### 4. .opencode/agents/, .opencode/tools/, etc.

**Current State:**
- .opencode/agents/ - Real files
- .opencode/tools/ - Real files
- .opencode/commands/ - Real files
- **No corresponding specs/**

---

## 📊 Summary

| Location | Files | Symlinked | Specs | Status |
|----------|-------|-----------|-------|--------|
| src/ | 45 dirs | 7 files | ✅ Yes | ✅ Working |
| scripts/ | 36 files | 20 files | ⚠️ Partial | ⚠️ Needs work |
| .opencode/skills/ | 148 files | 0 files | ❌ No | ❌ Broken |
| .opencode/agents/ | 8 files | 0 files | ❌ No | ❌ Broken |
| .opencode/tools/ | 4 files | 0 files | ❌ No | ❌ Broken |
| docs/ | 11 files | 0 files | ❌ No | ❌ Broken |
| config/ | 1 file | 0 files | ❌ No | ❌ Broken |
| tests/ | ~60 files | 0 files | ⚠️ Partial | ⚠️ Needs review |

**Overall Compliance**: ~30%

---

## 🔧 Fix Strategy

### Phase 1: Create Missing Specs

1. **Create specs/skills.spec.dir/ files**
   - Convert each .opencode/skills/*.md to a spec
   - Add proper speclang-header
   - Then symlink .opencode/skills/ -> specs/skills.spec.dir/

2. **Create specs/docs.spec.dir/ files**
   - Convert docs/*.md to specs
   - Add speclang-header with layer, version, etc.
   - Then symlink docs/ -> specs/docs.spec.dir/

3. **Create specs for orphaned scripts**
   - generate_index.py
   - rename_spec_files.py
   - Any other script without a spec

### Phase 2: Implement Symlinking

1. **Extend pre-commit hook**
   - Currently handles src/ and scripts/
   - Extend to handle .opencode/skills/
   - Extend to handle docs/

2. **One-time conversion**
   - Move .opencode/skills/*.md content to specs/skills.spec.dir/*.spec.md
   - Replace with symlinks
   - Same for docs/

### Phase 3: Validation

1. **Add to AGENTS.md**
   - Document the dual-view requirement
   - Add checklist for new files
   - Enforce in code review

2. **CI Check**
   - Verify all files have specs
   - Verify symlinks are correct
   - Fail build if non-compliant

---

## 🚨 Critical Files Needing Specs

### High Priority (Used Often)
1. `scripts/generate_index.py` - 11KB, core functionality
2. `docs/NORTH_STAR.md` - Vision document
3. `docs/AGENTS.md` - Development guide
4. `.opencode/skills/spec-writer.md` - Core skill
5. `.opencode/skills/code-gen.md` - Core skill

### Medium Priority
1. All other .opencode/skills/*.md (145 files)
2. Remaining scripts/*.py (14 files)
3. docs/*.md (7 remaining)

### Low Priority
1. .opencode/agents/*.md
2. .opencode/tools/*.md
3. config/*.yaml

---

## 💡 Recommendation

**DO NOT** try to fix everything at once. Instead:

1. **Start with core files** (generate_index.py, NORTH_STAR.md, AGENTS.md)
2. **Create specs for these first**
3. **Test the symlinking works**
4. **Then batch-process skills/**
5. **Finally docs/**

The non-deterministic compiler needs deterministic specs!

---

**Related**: See `CODEBASE_REVIEW.md` for full codebase audit.
**Last Updated**: 2026-02-23 (original) | 2026-07-20 (re-audit)

---

## 🔄 2026-07-20 Re-Audit — Actual Current State

The February audit's claims were disproven by filesystem inspection. The symlink migration happened in July 2026 (commits from Jul 12) and was never reflected in this document.

### Actual Compliance (verified with `ls -la`)

| Location | Files | Symlinked | Real | Status |
|----------|-------|-----------|------|--------|
| docs/ | 13 .md + 1 .html | 12 symlinks | PRD.html (HTML artifact) | ✅ 92% |
| .opencode/skills/ | ~148 files | ALL symlinked | 0 real files | ✅ 100% |
| .opencode/agents/ | 7 files | ALL symlinked | 0 real files | ✅ 100% |
| .opencode/tools/ | 1 file | symlinked | 0 real files | ✅ 100% |
| scripts/ | 33 source files | 31 symlinked | README.md, test.sh | ✅ 94% |
| src/ | 45+ dirs | 7 symlinks (pre-commit hook) | N/A (different pattern) | ✅ Working |
| config/ | 1 file | N/A | mcp-defaults.yaml (config data) | ✅ N/A |

**Overall Compliance**: >95% (not ~30% as the Feb audit claimed)

### Remaining Minor Gaps

1. **scripts/README.md** — Real file, no corresponding spec. Low priority (docs, not code).
2. **scripts/test.sh** — 341-byte shell script. Low priority.
3. **docs/PRD.html** — HTML artifact (generated), does not need a spec. Expected.

### Verdict

The original SPEC-ALIGNMENT-001 task claiming "~30% compliance" was based on a 5-month-old stale audit. The actual symlink migration was completed in July 2026. No significant dual-view work remains. ✅