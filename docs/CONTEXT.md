# SpecLang Session Context

**Purpose:** Help the next agent quickly understand recent changes and key conventions.

## Recent Session Summary (Feb 23, 2026)

### What Was Done

1. **Adversarial Review** - Ran @adversary to identify architectural gaps
2. **Git Memory System** - Changed from UUIDs to git commit hashes for causality tracking
3. **Enhanced Validators** - Added production-ready requirements for logging, auth, API blocks
4. **Error Handling** - Created comprehensive cascade error handling with retry, fallback, rollback
5. **CLI Commands** - Added 10 new commands (cascade, errors, rollback, etc.)
6. **API Specification** - Created OpenAPI spec for REST API
7. **Fixed Directory Structure** - Renamed `*.dir` to `*.spec.dir`
8. **Implementation Path** - Created step-by-step bootstrap guide (NEW)
9. **Hello World Cascade** - Created complete end-to-end example (NEW)
10. **Testing Strategy** - Created comprehensive testing approach (NEW)

### Key Conventions Learned

```
DIRECTORY NAMING:
  CORRECT: foo.spec.dir/
  WRONG:   foo.spec.dir/

SPEC IDS:
  CORRECT: @speclang/foo.spec
  CORRECT: @speclang/foo.spec.dir/bar
  WRONG:   @speclang/foo
  WRONG:   @speclang/foo.spec.dir/bar

GENERATION FLOW:
  bar.spec.md (intent) → bar.go.spec (code) → bar.go (symlink)
```

### Files Created/Modified

**Created:**
- `specs/implementation-path.spec.md` - **CRITICAL: Step-by-step build guide**
- `specs/examples.spec.dir/hello-world-cascade.spec.md` - **CRITICAL: End-to-end demo**
- `specs/testing-strategy.spec.md` - Comprehensive testing approach
- `specs/cascade.spec.dir/error-handling.spec.md` - Comprehensive error handling
- `specs/api.spec.md` - API overview
- `specs/api.spec.dir/openapi.spec.md` - OpenAPI requirements
- `specs/api.spec.dir/_index.md` - API directory index

**Modified:**
- `specs/git-history.spec.md` - Changed UUID to commit hash
- `specs/git-history.spec.dir/commits.spec.md` - Updated causality tracking
- `specs/headers.spec.md` - Changed @change to @commit
- `specs/mcp.spec.dir/messages.spec.md` - Added SLA and confidence calculation
- `specs/validation.spec.dir/language-blocks.spec.md` - Enhanced validators
- `specs/cli.spec.dir/commands.spec.md` - Added 10 new commands
- `specs/cli.spec.md` - Renamed to cli.spec
- `GETTING-STARTED.md` - Added naming conventions section

## New Critical Files

### implementation-path.spec.md
**Purpose:** Step-by-step guide to build SpecLang from scratch

**Contents:**
- Phase 1-5 implementation sequence
- MVP definition and success criteria
- Existing code mapping to specs
- Build order dependency graph
- For AI agents: how to build

**Location:** `specs/implementation-path.spec.md`

### hello-world-cascade.spec.md
**Purpose:** Complete end-to-end demonstration of the system

**Shows:**
- Step 1-9: User creates spec → Cascade → Code generation → Tests → Pipeline
- Complete timeline with timestamps
- Expected files and commits
- Mermaid diagram of flow

**Location:** `specs/examples.spec.dir/hello-world-cascade.spec.md`

### testing-strategy.spec.md
**Purpose:** Comprehensive testing approach

**Contents:**
- Test categories (unit, integration, cascade, agent, e2e)
- Coverage requirements by maturity level
- Cascade testing strategy with mocks
- Agent testing with golden files
- Quality gates and execution strategy

**Location:** `specs/testing-strategy.spec.md`

## Architecture Decisions

### 1. Git Commit Hashes for Causality (NOT UUIDs)

```bash
# OLD (fragile)
git commit -m "speclang: summary [change_id:uuid parent:uuid]"

# NEW (robust)
git commit -m "speclang: summary [parent:abc123def]"
# Current commit hash is the change_id
```

**Why:** Git provides the hash automatically. No need to generate UUIDs. Hashes are native to git and can be queried with git tools.

### 2. Error Handling Strategy

```
Error Categories:
  - Transient → Retry with exponential backoff
  - Permanent → Report to agent, require fix
  - Resource → Cleanup, notify, pause
  - Logical → Rollback, analysis, human intervention
```

### 3. Rollback Triggers

- Test failures in generated code
- Validation failures after cascade
- Performance regression > 20%
- Security violations (immediate rollback)

### 4. MCP Message SLAs

| Priority | Max Response | Auto-escalate |
|----------|-------------|---------------|
| Blocking | 15 minutes | 30 minutes |
| High | 60 minutes | 2 hours |
| Medium | 4 hours | 8 hours |
| Low | 24 hours | 48 hours |
| Info | None | None |

## Implementation Phases

| Phase | Focus | Duration | Key Deliverables |
|-------|-------|----------|------------------|
| 1 | Foundation | 1-2 weeks | Parser, Validator, Index |
| 2 | Daemon | 2 weeks | File Watcher, Event Router, Convergence |
| 3 | Agents | 2 weeks | Session Manager, Guard, Cascade Executor |
| 4 | CodeGen | 2 weeks | TypeScript/Go generators, Templates |
| 5 | Pipeline | 2 weeks | Build, Test, Rollback, Notify |

## Common Mistakes to Avoid

1. **Don't use `*.dir`** - Always use `*.spec.dir`
2. **Don't forget `.spec` in IDs** - Use `@speclang/foo.spec`
3. **Don't mix YAML in markdown** - Intent specs use `# @block:` syntax
4. **Don't create UUIDs** - Use git commit hashes instead
5. **Don't skip the adversarial review** - Always run @adversary on significant changes
6. **Don't skip phases** - Build Phase 1 before Phase 2
7. **Don't code without reading specs** - Read first, code second

## Quick Reference

### Run Indexer
```bash
python3 generate_index.py
```

### Check for Missing Refs
```bash
python3 generate_index.py --validate
```

### View Dependency Tree
```bash
python3 generate_index.py --tree "@speclang/cascade"
```

### Commit Pattern
```bash
git add <file>
git commit --only <file> -m "speclang: <role> <summary> [parent:<hash>]"
```

## Next Steps (If Any)

- [ ] **Start with Phase 1** - Build the foundation (parser, validator, index)
- [ ] Run hello-world-cascade example manually to verify understanding
- [ ] Create test fixtures for agent testing
- [ ] Build the MVP and verify success criteria
- [ ] Fix remaining `*.dir` directories to `*.spec.dir` (20 directories)
- [ ] Update all spec IDs to include `.spec`
- [ ] Run full validation on all specs
- [ ] Generate actual openapi.yaml from openapi.spec.md

## Directories Needing Rename

Currently these directories use old `*.dir` naming:
- `specs/ui.dir`
- `specs/opencode.dir`
- `specs/executor.dir`
- `specs/ipc.dir`
- `specs/ralph-loop.dir`
- `specs/safety-nets.dir`
- `specs/cascade-protocol.dir`
- `specs/validation.dir`
- `specs/file-naming.dir`
- `specs/workflow.dir`
- `specs/skills.dir`
- `specs/directory-structure.dir`
- `specs/sqlite.dir`
- `specs/compiler.dir`
- `specs/core.dir`
- `specs/deployment.dir`
- `specs/mcp-ui-tools.dir`
- `specs/validation-tool.dir`
- `specs/mcp.dir`
- `specs/cascade.dir`

---

*This file helps the next agent understand what was done and avoid repeating mistakes.*
