# Bootstrap Phase 5.2: Autonomous Agent Test

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 5.2 - the FINAL phase of the bootstrap process.

**Prerequisites**: 
- All phases 0-5.1 complete
- Self-specifying specs in place

## Your Task
Run the full autonomous agent test to verify that SpecLang can build SpecLang. This is the ultimate validation.

## Read These Specs First
1. `specs/bootstrap.spec.md` - Bootstrap process
2. `specs/autonomous-validation.spec.md` - Validation requirements
3. `.ralph/prd.json` - All stories should be complete

## What to Test

### The Ultimate Test

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  A developer takes ONLY the specs/ folder to a new machine,     │
│  runs 'speclang build', and gets working code.                  │
│                                                                 │
│  No dependencies. No lock files. No node_modules. No venv.      │
│                                                                 │
│  Just specs. And from specs, everything else flows.             │
│                                                                 │
│  THIS IS THE TEST.                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Test Suite

```bash
# Create test directory
mkdir -p /tmp/speclang-test
cd /tmp/speclang-test

# Copy ONLY specs
cp -r /path/to/speclang/specs ./
cp /path/to/speclang/docs/NORTH_STAR.md ./docs/
cp /path/to/speclang/.ralph/prd.json ./.ralph/

# Run bootstrap
speclang bootstrap

# Validate
bun run tsc --noEmit
bun test
speclang validate

# Clean up
rm -rf /tmp/speclang-test
```

### Test Cases

#### Test 1: Cold Boot
```yaml
test: cold_boot
description: Bootstrap from specs only

steps:
  1:
    action: "Copy specs/ to empty directory"
    
  2:
    action: "Run speclang bootstrap"
    expect: "All phases complete without errors"
    
  3:
    action: "Check generated files"
    expect:
      - src/db/index.ts exists
      - src/parser/header.ts exists
      - src/mcp/server.ts exists
      - src/codegen/index.ts exists
      
  4:
    action: "Run TypeScript compilation"
    expect: "No errors"
    
  5:
    action: "Run tests"
    expect: "All tests pass"
```

#### Test 2: Incremental Update
```yaml
test: incremental_update
description: Modify spec, verify cascade

steps:
  1:
    action: "Add new block to specs/auth.spec.md"
    content: |
      ## @block:auth/new-feature
      ```typescript
      export function newFeature(): void;
      ```
      
  2:
    action: "Wait for cascade"
    expect: "src/auth/new-feature.ts created"
    
  3:
    action: "Check commit"
    expect: "Commit with 'speclang: code-gen' message"
```

#### Test 3: Error Recovery
```yaml
test: error_recovery
description: Invalid spec should trigger recovery

steps:
  1:
    action: "Add invalid spec"
    content: |
      # speclang-header lines:INVALID
      (broken yaml)
      
  2:
    action: "Wait for cascade"
    expect:
      - "Error detected"
      - "Rollback triggered"
      - "Notification sent"
```

#### Test 4: Concurrency
```yaml
test: concurrency
description: Multiple cascades don't conflict

steps:
  1:
    action: "Modify specs/auth.spec.md"
    
  2:
    action: "Simultaneously modify specs/users.spec.md"
    
  3:
    action: "Wait for convergence"
    expect:
      - "Both cascades complete"
      - "No file conflicts"
      - "Commits are atomic"
```

#### Test 5: Self-Hosting
```yaml
test: self_hosting
description: SpecLang builds itself

steps:
  1:
    action: "Clean all generated code"
    command: "rm -rf src/ tests/*.test.ts"
    
  2:
    action: "Run speclang build"
    command: "speclang build"
    
  3:
    action: "Compare generated to original"
    expect: "Functionally identical"
    
  4:
    action: "Run generated system"
    expect: "Works identically to original"
```

### Validation Checklist

Run through this checklist after all tests:

```yaml
checklist:
  
  specs:
    - [ ] All specs have valid headers
    - [ ] All @ref: references resolve
    - [ ] No circular dependencies
    - [ ] All specs have agent_support defined
    
  generated_code:
    - [ ] TypeScript compiles without errors
    - [ ] All files have SPECLANG-GENERATED header
    - [ ] All SPECLANG-IMPLEMENT markers are filled or intentional
    - [ ] Types match spec definitions
    
  tests:
    - [ ] All unit tests pass
    - [ ] All integration tests pass
    - [ ] Test coverage > 80%
    
  cascade:
    - [ ] File changes trigger cascade
    - [ ] Cascade reaches convergence
    - [ ] Depth stays under 100
    - [ ] No infinite loops
    
  git:
    - [ ] All commits have speclang: prefix
    - [ ] One file per commit
    - [ ] Commit messages describe action
    - [ ] History is traceable
    
  agents:
    - [ ] Agent ownership enforced
    - [ ] Violations logged
    - [ ] Recovery works on failure
    
  mcp:
    - [ ] Server starts
    - [ ] Tools respond correctly
    - [ ] SSE streams events
    
  pipeline:
    - [ ] Runs after convergence
    - [ ] Stages execute in order
    - [ ] Recovery handles failures
```

### Success Criteria

The bootstrap is COMPLETE when:

```bash
# All stories passed
cat .ralph/prd.json | jq '[.phases[].stories[] | select(.passes == false)] | length'
# Output: 0

# TypeScript compiles
bun run tsc --noEmit
# Output: No errors

# Tests pass
bun test
# Output: All tests passed

# Self-hosting works
rm -rf src/ && speclang build
bun run tsc --noEmit && bun test
# Output: All tests passed

# MCP server works
bun run src/mcp/server.ts &
curl http://localhost:3000/health
# Output: {"status":"ok"}

# Cascade works
echo "# test" >> specs/test.spec.md
sleep 30
# Output: Cascade detected, converged, pipeline ran
```

### Final Output

When ALL tests pass, output:

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║              🎉 SPECLANG BOOTSTRAP COMPLETE! 🎉                  ║
║                                                                  ║
║  SpecLang has successfully built itself from specifications.     ║
║                                                                  ║
║  Components Built:                                               ║
║    ✅ src/db/          - SQLite database layer                   ║
║    ✅ src/parser/      - Spec header parser                      ║
║    ✅ src/indexer/     - Spec index generator                    ║
║    ✅ src/daemon/      - File watcher daemon (Rust)              ║
║    ✅ src/agents/      - Agent session manager                   ║
║    ✅ src/mcp/         - MCP server                              ║
║    ✅ src/codegen/     - Code generator                          ║
║    ✅ src/pipeline/    - Build pipeline                          ║
║    ✅ src/guard/       - File ownership guard                    ║
║                                                                  ║
║  Tests: All passing                                             ║
║  Commits: All with speclang: prefix                             ║
║  Self-hosting: Verified                                         ║
║                                                                  ║
║  The specs are the source of truth.                             ║
║  The code is generated.                                         ║
║  And from specs, everything flows.                              ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

SPECLANG-BOOTSTRAP-COMPLETE
```

## Output Format
After completing all tests, output:
1. Test results for each test case
2. Checklist completion status
3. Final success/failure determination
4. Any remaining issues or recommendations
