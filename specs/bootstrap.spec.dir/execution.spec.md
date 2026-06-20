# speclang-header lines:11
id: "@speclang/bootstrap/execution"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [bootstrap, execution, validation]
short: Bootstrap execution, validation, and recovery
parent: "@ref:specs/bootstrap"
part: 2/2
---
## @bootstrap/first-run

### Initial Bootstrap Sequence

```bash
# Step 1: Verify minimal specs exist
for spec in specs/project.scl specs/core.spec.md specs/headers.spec.md; do
  [ -f "$spec" ] || { echo "MISSING: $spec"; exit 1; }
done

# Step 2: Generate database layer
# AI reads sqlite.spec.md, generates src/db/
# Validate: bun test tests/db.test.ts

# Step 3: Generate parser layer  
# AI reads headers.spec.md, generates src/parser/
# Validate: bun test tests/parser.test.ts

# Step 4: Generate indexer
# AI reads project-layout.spec.md, generates src/indexer/
# Validate: _index.json exists

# Step 5: Continue through phases...
```

---

## @bootstrap/validation

### Self-Hosting Test

```yaml
SelfHostingTest:
  description: "Verify SpecLang can build itself"
  
  steps:
    1:
      action: "Clean generated code"
      command: "rm -rf src/ generated/"
      
    2:
      action: "Run bootstrap"
      command: "speclang bootstrap --from specs/"
      
    3:
      action: "Verify compilation"
      command: "bun run tsc --noEmit"
      expect: "No errors"
      
    4:
      action: "Verify tests"
      command: "bun test"
      expect: "All tests pass"
      
    5:
      action: "Verify daemon"
      command: "cargo build src/daemon/"
      expect: "Binary compiles"
      
    6:
      action: "Verify MCP server"
      command: "bun run src/mcp/server.ts &"
      expect: "Server starts, responds to ping"
      
    7:
      action: "Full cascade test"
      command: "echo '# test' >> specs/test.spec.md"
      expect: "Cascade triggers, converges"
      
  success_criteria:
    - All generated code compiles
    - All tests pass
    - Daemon runs
    - MCP server responds
    - Cascade works
```

---

## @bootstrap/convergence

### When Is Bootstrap Complete?

```yaml
BootstrapComplete:
  
  required_files:
    generated_code:
      - src/db/index.ts
      - src/parser/header.ts
      - src/indexer/index.ts
      - src/daemon/target/release/speclangd
      - src/agents/session.ts
      - src/mcp/server.ts
      - src/codegen/index.ts
      - src/pipeline/executor.ts
      - src/guard/registry.ts
      
    tests:
      - tests/db.test.ts
      - tests/parser.test.ts
      - tests/agents.test.ts
      - tests/mcp.test.ts
      - tests/codegen.test.ts
      
  required_capabilities:
    - "Parse any spec file"
    - "Index all specs with references"
    - "Generate code from specs"
    - "Run pipeline after convergence"
    - "Recover from failures"
    - "Enforce file ownership"
    
  final_test:
    command: "speclang build"
    expect: "Regenerates all of src/ from specs/"
    validation: "diff -r src/ expected_src/"
```

---

## @bootstrap/agent-roles

### Agent Responsibilities During Bootstrap

```yaml
BootstrapAgents:
  
  north_star:
    owns: [specs/project.scl, docs/NORTH_STAR.md]
    does: "Coordinates overall bootstrap, triggers first cascade"
    
  spec_writer:
    owns: [specs/**/*.spec.md, specs/**/*.scl]
    does: "Expands abstract specs into detailed specs"
    triggered_by: [north_star]
    
  code_gen:
    owns: [src/**/*.ts, src/**/*.rs]
    does: "Generates code from specs"
    triggered_by: [spec_writer]
    
  test_writer:
    owns: [tests/**/*.test.ts]
    does: "Generates tests from specs"
    triggered_by: [code_gen]
    
  adversary:
    owns: []  # Read-only
    does: "Validates work, provides steering feedback"
    triggered_by: [code_gen, test_writer]
```

---

## @bootstrap/rollback

### Recovery from Failed Bootstrap

```yaml
BootstrapRollback:
  
  on_phase_failure:
    1: "Log failure details to .speclang/bootstrap-failures.log"
    2: "Identify which spec caused failure"
    3: "Rollback generated files to last good state"
    4: "Notify north_star agent with error details"
    5: "Wait for spec fix or human intervention"
    
  recovery_commands:
    rollback_last_phase: "speclang bootstrap --rollback"
    retry_current_phase: "speclang bootstrap --retry"
    restart_from_scratch: "rm -rf src/ && speclang bootstrap"
    
  failure_modes:
    spec_ambiguous:
      detection: "Multiple interpretations of spec block"
      fix: "Add more detail to spec, add validation rules"
      
    circular_dependency:
      detection: "Spec A depends on B, B depends on A"
      fix: "Restructure specs, break circular refs"
      
    code_generation_error:
      detection: "Generated code doesn't compile"
      fix: "Fix spec, regenerate, validate"
```

---

## Next Steps

1. Ensure all Tier 0 specs exist
2. Begin Phase 0 with SQLite implementation
3. Follow phase order strictly
4. Run validation after each phase
5. Only proceed if validation passes
6. Mark bootstrap complete when all phases done