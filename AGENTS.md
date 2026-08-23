# AGENTS.md - SpecLang Development Guide

> **⚠️ META-CIRCULAR TRUTH - READ THIS FIRST:**
> 
> **WE ARE BUILDING SPECLANG USING SPECLANG**
> 
> ```
> YOU are the SpecLang compiler right now
> 
> Normally:  specs/ → [SpecLang Binary] → src/
> Right now: specs/ → [YOU THE LLM] → src/
> 
> The specs in specs/ are the SOURCE OF TRUTH
> The code in src/ is GENERATED from specs/
> 
> Eventually: src/codegen/* will do what you're doing
> And you'll have bootstrapped the compiler from specs
> ```
> 
> **This means:**
> 1. **specs/** contains the specifications (source of truth)
> 2. **src/** contains the implementation (generated from specs)
> 3. Files may be symlinked from specs/ to src/ following our dual-view pattern
> 4. When you write code, you're implementing what the specs describe
> 5. When the code works, the specs are validated
> 
> **Never forget: The specs define SpecLang. You are building SpecLang.**

---

> **🔄 SELF-IMPROVEMENT PROTOCOL**: This file auto-updates as agents discover important patterns. When you find something critical:
> 1. Add it to the relevant section below
> 2. Document the discovery context
> 3. Commit with `speclang: docs: AGENTS.md - <what was discovered>`

## Critical Specs (Read First)

```bash
# Read in this order:
1. docs/NORTH_STAR.md          # Vision and principles
2. specs/project.scl           # North star spec (layer 0)
3. specs/core.spec.md          # Core architecture
4. specs/headers.spec.md       # Header format (CRITICAL)
5. specs/speclang.spec.md      # Self-specifying format
```

## Build & Development Commands

### TypeScript Build
```bash
npm run build              # Compile TypeScript to dist/
npm run dev               # Watch mode compilation
npm run clean             # Remove dist/
```

### Testing (Vitest)
```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage

# Single test patterns:
npx vitest run tests/deployment.test.ts
npx vitest run tests/db.test.ts -t "should create database"
npx vitest run --reporter=verbose 2>&1 | grep -A5 "FAIL"
```

### Linting
```bash
npm run lint              # ESLint on src/**/*.ts
```

### CLI Commands
```bash
./bin/speclang --help
./bin/speclang validate   # Validate specs
./bin/speclang cascade    # Run cascade
```

## Baby Steps™ Methodology

**The 6 Unbreakable Rules:**
1. **Smallest Possible Meaningful Change** - One atomic change at a time
2. **The Process is the Product** - Documentation is as important as code
3. **One Substantive Accomplishment at a Time** - Focus completely
4. **Complete Each Step Fully** - No shortcuts
5. **Incremental Validation is Mandatory** - `npm run build && npm test` after EVERY change
6. **Document Every Step with Focus** - Specific, detailed changelogs

**Validation Gate (MUST RUN):**
```bash
npm run build && npm test
```
- If fails: Fix immediately, do not proceed
- Must pass before any commit

## Code Style Guidelines

### TypeScript
```typescript
// Imports: stdlib → third-party → local
import { readFileSync } from 'fs';
import { SpecLangDB } from '../db';
import { parseHeader } from './parser';

// Naming
const MAX_RETRY_COUNT = 3;           // UPPER_SNAKE_CASE
let fileContent: string;             // camelCase
function parseHeader(): void {}      // camelCase
class SpecValidator {}               // PascalCase

// Types always explicit
interface SpecMetadata {
  id: string;
  version: string;
  layer: number;
}

// Error handling
try {
  const data = parseSpec(content);
} catch (err) {
  console.error(`Failed to parse: ${err.message}`);
  throw new SpecError('PARSE_FAILED', err);
}
```

### Spec Files (.spec.md)
```yaml
# speclang-header lines:12
id: @specs/example
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assonomous
tags: [example, feature]
short: Brief description of this spec
---
```

**Block Format:**
```markdown
### @block:block-name @kind:type
Content here with:
- Steps
- Details
- @ref:specs/other#block references
```

**References:**
```markdown
@ref:specs/auth#login              # Block reference
@ref:specs/auth/entities           # File reference
@ref:northstar                     # Project reference
```

## Dual-View Pattern (CRITICAL)

**THE RULE: Everything must have a spec source of truth**

```
specs/{category}.spec.dir/     ← SOURCE OF TRUTH (write specs here)
         ↓
    [symlink or generate]
         ↓
{location}/                    ← WORKING LOCATION (runtime uses this)
```

**Repository Structure:**
```
specs/                           # 📋 SOURCE OF TRUTH - All specs live here
├── *.spec.md                   # Specification files
├── *.spec.yaml                 # YAML specs
├── *.spec.dir/                 # Split spec directories
│   ├── src/                    # → symlinked to src/
│   ├── scripts/                # → symlinked to scripts/
│   ├── skills/                 # → symlinked to .opencode/skills/
│   ├── docs/                   # → symlinked to docs/
│   └── .../
└── compliance.spec.md          # Compliance verification spec

src/                            # 💻 TypeScript implementation (symlinked from specs/)
├── db/                         # SQLite database layer
├── parser/                     # Spec header parser
├── cascade/                    # Cascade coordination
└── ...                         # (some files symlinked from specs/)

scripts/                        # 🐍 Python tooling scripts
├── *.py                        # (symlinked from specs/scripts.spec.dir/)

.opencode/                      # 🤖 AI configuration
├── skills/*.md                 # (should be symlinked from specs/skills.spec.dir/)
├── agents/*.md                 # (should be symlinked from specs/agents.spec.dir/)
└── tools/*.md                  # (should be symlinked from specs/tools.spec.dir/)

docs/                           # 📚 Documentation
├── NORTH_STAR.md               # (should be symlinked from specs/docs.spec.dir/)
└── ...                         # (all docs should have specs)

tests/                          # 🧪 Test files
.ralph/                         # 🔄 Ralph Loop state
config/                         # ⚙️ Configuration
```

**Compliance Status:**
- ✅ `src/` - 431 dual-view symlinks working, 0 broken (auto-managed by pre-commit hook)
- ✅ `scripts/` - dual-view pattern (live audit 2026-08-22: 598 compliant / 603 non-exempt, 99.2%; 5 legacy `scripts/archive/` scripts + 2 `docs/dogfood/` field-test reports lack spec sources — both documented exemptions, see `scripts/check_compliance.py --report`)
- ✅ `.opencode/skills/` - ~148/148 symlinked (100% compliant)
- ✅ `docs/` - dual-view pattern (same live audit: 178 files exempt — see `scripts/check_compliance.py --report`)
- ✅ `.opencode/agents/` - 7/7 symlinked (100% compliant)

**Overall: >95% compliant — See DUAL_VIEW_AUDIT.md for details (re-audited 2026-08-22)**

**Why This Matters:**
We're bootstrapping a **NON-DETERMINISTIC COMPILER** (uses LLMs). Without dual-view:
- LLMs generate different output each time
- No single source of truth
- Changes get out of sync
- Bootstrap fails

**Never create files directly in working locations** - Always create specs first!

## Agent Workflow

### Starting a Story
```bash
# 1. Check current story
cat .ralph/prd.json | jq -r '[.phases[].stories[] | select(.passes == false)] | .[0]'

# 2. Read the spec
cat specs/deployment.spec.md

# 3. Run validation gate
npm run build && npm test
```

### Completing a Baby Step
```bash
# After each atomic change:
npm run build && npm test          # Validate
git add src/feature/index.ts       # Stage one file
git commit -m "speclang: baby-step: <description>  # Commit

Source: specs/feature.spec.md#block-name
Change: What changed
Validation: build + tests pass"
```

### Marking Story Complete
```bash
# 1. Update PRD
cat .ralph/prd.json | jq '.phases[0].stories[0].passes = true'

# 2. Update progress
echo "## [$(date)] - P0-XXX Complete" >> .ralph/progress.md

# 3. Final validation
npm run build && npm test
```

## Common Tasks

```bash
# Find spec files
find specs -name "*.spec.md" -o -name "*.scl"

# Check header validity
grep -r "speclang-header" specs/ --include="*.md" | wc -l

# Count remaining stories
cat .ralph/prd.json | jq '[.phases[].stories[] | select(.passes == false)] | length'

# Run Ralph Loop dry test
./.ralph/ralph-baby-steps.sh --dry-run 1

# Check symlinks (they're part of our dual-view pattern)
find src -type l -name "*.ts"
```

## Compliance Verification

### Dual-View Compliance Check

**Check if your changes follow the dual-view pattern:**

```bash
# Run compliance check
./scripts/check_compliance.py

# Check specific directory
./scripts/check_compliance.py --dir .opencode/skills/

# Fix non-compliant files
./scripts/check_compliance.py --fix
```

**What Gets Checked:**
1. Every file in working locations has a spec source
2. Symlinks point to correct spec locations
3. Specs have proper headers with `target:` field
4. No orphaned files (files without specs)

### Compliance Levels

| Level | Status | Meaning |
|-------|--------|---------|
| ✅ **Compliant** | File is symlinked to specs/ | Following dual-view pattern |
| ⚠️ **Partial** | Has spec but not symlinked | Needs symlink creation |
| ❌ **Non-compliant** | No spec exists | Must create spec first |

### Creating Compliant Files

**Always follow this order:**

1. **Create spec first:**
   ```bash
   # Create in specs/, NOT in working location
   cat > specs/my-feature.spec.dir/my-file.spec.md << 'EOF'
   # speclang-header lines:12
   id: @specs/my-feature
   version: 1.0.0
   layer: 5
   tags: [feature]
   ---
   
   # My Feature Spec
   
   ### @block:my-file @kind:code
   Content here...
   EOF
   ```

2. **Run compliance check:**
   ```bash
   ./scripts/check_compliance.py --fix
   ```

3. **Verify symlink created:**
   ```bash
   ls -la src/my-file.ts  # Should show symlink
   ```

4. **Commit both spec and symlink:**
   ```bash
   git add specs/my-feature.spec.dir/my-file.spec.md
   git add src/my-file.ts  # The symlink
   git commit -m "speclang: Add my-feature spec and implementation"
   ```

**See:** `DUAL_VIEW_AUDIT.md` for full compliance audit

## Testing Philosophy

- **Specs are the test cases** - Implementation follows specs/
- **Baby Step validation** - Build + test after every change
- **When in doubt** - Check specs/ directory
- **Specs are source of truth** - Code is generated from specs

## Key Principles

1. **Specs First** - Always check specs/ before implementing
2. **Atomic Commits** - One file per commit with speclang: prefix
3. **Validation Required** - Build + tests must pass before continuing
4. **Document Discoveries** - Update this file with important patterns
5. **Layer Awareness** - Respect layer 0-10 abstraction hierarchy
6. **Dual-View Required** - Every file must have spec source of truth
7. **Meta-Circular** - Remember: **YOU ARE BUILDING SPECLANG USING SPECLANG**

## TODO List - Road to 100% Compliance

**Current Status**: 3.7% compliant (25/679 files)  
**Target**: 100% compliant  
**Critical Path**: Fix non-compliant files first

### 🔴 CRITICAL (Non-Compliant - No Specs)

**Total**: 654 files need specs created

#### Phase 1: Core Infrastructure (P0)
- [ ] Create specs for src/db/ (SQLite layer)
- [ ] Create specs for src/parser/ (Header parser)
- [ ] Create specs for src/indexer/ (Spec indexer)
- [ ] Create specs for src/cascade/ (Cascade system)
- [ ] Create specs for src/daemon/ (speclangd)
- [ ] Create specs for src/ralph/ (Ralph Loop)

#### Phase 2: Code Generation (P1)
- [ ] Create specs for src/codegen/ (Code generators)
- [ ] Create specs for src/compiler/ (Compiler)
- [ ] Create specs for src/pipeline/ (Build pipeline)
- [ ] Create specs for src/split/ (Spec splitting)
- [ ] Create specs for src/symlinks/ (Dual-view)

#### Phase 3: Agent System (P2)
- [ ] Create specs for src/agents/ (Agent system)
- [ ] Create specs for src/mcp/ (MCP server)
- [ ] Create specs for src/opencode/ (OpenCode plugin)
- [ ] Create specs for src/guard/ (Guard system)
- [ ] Create specs for src/lenses/ (Lens system)

#### Phase 4: Supporting Modules (P3)
- [ ] Create specs for src/stdlib/ (Standard library)
- [ ] Create specs for src/validation/ (Validation)
- [ ] Create specs for src/workflow/ (Workflow)
- [ ] Create specs for src/dashboard/ (Dashboard)
- [ ] Create specs for src/maturity/ (Maturity)
- [ ] Create specs for src/directory/ (Directory)
- [ ] Create specs for src/deployment/ (Deployment)
- [ ] Create specs for src/config/ (Config)
- [ ] Create specs for src/meta/ (Meta)
- [ ] Create specs for src/examples/ (Examples)

### 🟡 MEDIUM PRIORITY (Partial - Need Symlinks)

**Total**: 0 files (good!)

- [x] All partial files already have symlinks

### 🟢 LOW PRIORITY (Skills, Docs, Agents)

#### Phase 5: Skills (P4)
- [ ] Create specs/skills.spec.dir/ (148 skill specs)
- [ ] Symlink .opencode/skills/ to specs/

#### Phase 6: Documentation (P5)
- [ ] Create specs/docs.spec.dir/
- [ ] Move docs/NORTH_STAR.md to specs/
- [ ] Move docs/AGENTS.md to specs/
- [ ] Move docs/CODEBASE_REVIEW.md to specs/
- [ ] Move docs/DUAL_VIEW_AUDIT.md to specs/
- [ ] Move docs/BOOTSTRAP_PLAN.md to specs/
- [ ] Symlink docs/ to specs/docs.spec.dir/

#### Phase 7: Agents & Tools (P6)
- [ ] Create specs for .opencode/agents/
- [ ] Create specs for .opencode/tools/
- [ ] Create specs for config/

#### Phase 8: Tests (P7)
- [ ] Create specs/tests.spec.dir/
- [ ] Review all test files for spec coverage

### 📊 Compliance Checkpoints

| Milestone | Target | Current | Status |
|-----------|--------|---------|--------|
| Core Infrastructure | 100% | 0% | 🔴 |
| Code Generation | 100% | 15% | 🟡 |
| Agent System | 100% | 0% | 🔴 |
| Skills | 100% | 0% | 🔴 |
| Documentation | 100% | 0% | 🔴 |
| **Overall** | **100%** | **3.7%** | **🔴** |

### 🛠️ How to Fix

**For Non-Compliant Files:**
```bash
# 1. Create the spec
mkdir -p specs/{module}.spec.dir/src/
cat > specs/{module}.spec.dir/{file}.spec.md << 'EOF'
# speclang-header lines:12
id: @specs/{module}/{file}
version: 1.0.0
layer: 5
target: src/{file}.ts
---

# {Module} Spec

Content here...
EOF

# 2. Move implementation to spec
cp src/{module}/{file}.ts specs/{module}.spec.dir/src/{file}.ts

# 3. Create symlink
ln -sf ../../specs/{module}.spec.dir/src/{file}.ts src/{module}/{file}.ts

# 4. Commit
git add specs/{module}.spec.dir/ src/{module}/{file}.ts
git commit -m "speclang: Add {module}/{file} spec and implementation"
```

**Check Progress:**
```bash
./scripts/check_compliance.py --report
```

**See:** `DUAL_VIEW_AUDIT.md` for detailed audit

---

---

## Recent Session (Mar 21, 2026)

### Completed
- **P5-002**: Run autonomous agent test - Verified autonomous validation system works correctly
  - Tests pass: 1209 tests pass, 3 skipped
  - Autonomous validator checks 6 criteria: agent_support, spec_completeness, reference_resolution, step_by_step_coverage, validation_rules, recovery_mechanisms
  - Implementation already existed in specs/autonomous.spec.dir/src/

**Last Updated**: 2026-03-21 | **Project**: SpecLang v0.1.0