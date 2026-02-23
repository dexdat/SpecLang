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

### Key Conventions Learned

```
DIRECTORY NAMING:
  CORRECT: foo.spec.dir/
  WRONG:   foo.dir/

SPEC IDS:
  CORRECT: @speclang/foo.spec
  CORRECT: @speclang/foo.spec.dir/bar
  WRONG:   @speclang/foo
  WRONG:   @speclang/foo.dir/bar

GENERATION FLOW:
  bar.spec.md (intent) → bar.go.spec (code) → bar.go (symlink)
```

### Files Created/Modified

**Created:**
- `specs/cascade.dir/error-handling.spec.md` - Comprehensive error handling
- `specs/api.spec.md` - API overview
- `specs/api.spec.dir/openapi.spec.md` - OpenAPI requirements
- `specs/api.spec.dir/_index.md` - API directory index

**Modified:**
- `specs/git-history.spec.md` - Changed UUID to commit hash
- `specs/git-history.dir/commits.spec.md` - Updated causality tracking
- `specs/headers.spec.md` - Changed @change to @commit
- `specs/mcp.dir/messages.spec.md` - Added SLA and confidence calculation
- `specs/validation.dir/language-blocks.spec.md` - Enhanced validators
- `specs/cli.dir/commands.spec.md` - Added 10 new commands
- `specs/cli.spec.md` - Renamed to cli.spec
- `GETTING-STARTED.md` - Added naming conventions section

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

## Common Mistakes to Avoid

1. **Don't use `*.dir`** - Always use `*.spec.dir`
2. **Don't forget `.spec` in IDs** - Use `@speclang/foo.spec`
3. **Don't mix YAML in markdown** - Intent specs use `# @block:` syntax
4. **Don't create UUIDs** - Use git commit hashes instead
5. **Don't skip the adversarial review** - Always run @adversary on significant changes

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

- [ ] Fix remaining `*.dir` directories to `*.spec.dir`
- [ ] Update all spec IDs to include `.spec`
- [ ] Run full validation on all specs
- [ ] Generate actual openapi.yaml from openapi.spec.md

---

*This file helps the next agent understand what was done and avoid repeating mistakes.*
