---
id: "@speclang/cascade-protocol/events"
version: 1.0.0
layer: 2
tags: [cascade, protocol, events, definitions]
status: draft
project_level: Alpha
agent_support: agent_autonomous
short: Cascade Protocol Events and Definitions
parent: @ref:specs/cascade-protocol
part: 1/2
---

# Cascade Protocol Events and Definitions

Part 1 of 2: Events, definitions, and static components of the cascade protocol.

**Parent**: @ref:specs/cascade-protocol

## Cascade State

Tracked in `.speclang/cascade_state.json`:

```json
{
  "cascade_id": "cascade-20260222-001",
  "depth": 0,
  "max_depth": 5,
  "status": "running|paused|completed|failed",
  "trigger_file": "specs/auth.spec.md",
  "current_agent": "speclang-code-gen",
  "agents_invoked": [
    {
      "agent": "speclang-spec-writer",
      "timestamp": "2026-02-22T10:00:00Z",
      "result": "success",
      "files_modified": ["specs/auth.spec.md"]
    }
  ],
  "verification_results": [
    {
      "step": 1,
      "timestamp": "2026-02-22T10:05:00Z",
      "checks": {
        "compilation": {"status": "passed", "files_checked": 0},
        "references": {"status": "passed", "broken_refs": 0},
        "tests": {"status": "passed", "passed": 0, "failed": 0}
      }
    }
  ]
}
```

## Agent Roles

### @speclang-coordinator
- **Purpose**: Orchestrates the cascade
- **Actions**: Invokes subagents, tracks state, runs verification
- **Does NOT**: Write specs or code directly

### @speclang-spec-writer
- **Purpose**: Creates/updates specification files
- **Input**: Spec file path + content requirements
- **Output**: Valid spec file with proper headers
- **Verification**: Must pass `validate_refs.py`

### @speclang-code-gen
- **Purpose**: Generates implementation code from specs
- **Input**: Spec file path + target output path
- **Output**: Working code that compiles
- **Verification**: Must pass `npx tsc --noEmit` or equivalent

### @speclang-test-writer
- **Purpose**: Creates test specifications
- **Input**: Implementation file + requirements
- **Output**: Test specs and test code
- **Verification**: Tests must pass

### @speclang-verifier
- **Purpose**: Validates cascade output
- **Input**: Files to verify
- **Output**: Verification report + steering packet
- **Verification**: Ground truth checking

## Verification Gates

### Gate 1: Reference Validation
```bash
python3 scripts/validate_refs.py
```
**Purpose**: Ensure all @ref: point to existing IDs
**Pass**: All references valid
**Fail**: Report broken references

### Gate 2: Spec Autonomous Readiness
```bash
python3 scripts/validate_autonomous.py --project --format human
```
**Purpose**: Check spec completeness for autonomous agents
**Pass**: All checks pass (refs, steps, metadata)
**Fail**: Report missing fields or low coverage

### Gate 3: Code Compilation
```bash
# TypeScript
npx tsc --noEmit --skipLibCheck <file.ts>

# Go
go build <file.go>

# Python
python3 -m py_compile <file.py>
```
**Purpose**: Verify generated code compiles
**Pass**: Zero compilation errors
**Fail**: Report compilation errors with line numbers

### Gate 4: Test Execution
```bash
python3 -m pytest tests/ -v
```
**Purpose**: Run test suite
**Pass**: All tests pass
**Fail**: Report failed tests

## Error Handling

### Compilation Failure
```
Step 2 FAILED: Code compilation

Error:
src/auth/handler.ts(15,23): error TS2304: Cannot find name 'bcrypt'

Fix options:
1. Install dependency: npm install bcrypt
2. Update spec to remove bcrypt usage
3. Fix import statement

Retry with fix? (1 / 2 / 3 / abort)
```

### Broken References
```
Step 1 FAILED: Reference validation

Broken references:
- specs/auth.spec.md: @ref:specs/users#profile (not found)

Fix options:
1. Create specs/users.spec.md
2. Remove reference
3. Update reference to existing ID

Choose: (1 / 2 / 3 / abort)
```

### Test Failure
```
Step 3 FAILED: Test execution

Test results:
- test_auth.py::test_login: PASSED
- test_auth.py::test_logout: FAILED
  AssertionError: expected 200, got 401

Fix required: Update logout logic

Retry step 2 (code-gen) with fixes? (yes / no)
```

## Cascade Termination

### Successful Completion
```json
{
  "cascade_id": "cascade-20260222-001",
  "status": "completed",
  "steps_completed": 4,
  "agents_invoked": [
    "speclang-spec-writer",
    "speclang-code-gen",
    "speclang-test-writer",
    "speclang-verifier"
  ],
  "verification_summary": {
    "compilation": "passed",
    "references": "passed",
    "tests": "passed"
  }
}
```

### Depth Limit Reached
```
WARNING: Cascade depth limit reached (5)

Agents invoked:
1. spec-writer (auth.spec.md)
2. code-gen (handler.ts)
3. test-writer (auth tests)
4. spec-writer (fix test requirements)
5. code-gen (regenerate handler)

Step 6 would exceed max_depth.

CASCADE PAUSED

Options:
- Force continue (risk infinite loop)
- Review and restart
- Manual intervention
```

### User Abort
```
CASCADE ABORTED BY USER

Completed steps: 2
Current step: test generation

Reason: Code needs manual review

To resume:
@speclang-coordinator continue
```

## Comparison: Fantasy vs Reality

| Feature | Original Vision | Single-Agent Reality | This Protocol |
|---------|----------------|------------------|---------------|
| File watching | inotify daemon | ❌ Not available | Manual trigger |
| Agent triggering | Automatic | ❌ Not available | Explicit Task invocation |
| Convergence | Auto-detected | ❌ Not available | User decision |
| Multi-agent | Parallel | ✅ Task tool | Sequential with verification |
| Code verification | Assumed | ❌ Often broken | Mandatory gates |
| Steering packets | Auto-generated | ❌ Inaccurate | Verified by @speclang-verifier |

## Success Criteria

A cascade is successful when:
1. ✅ Coordinator explicitly invokes each agent
2. ✅ Each agent completes its specific task
3. ✅ Verification gates pass after each step
4. ✅ Steering packets reflect actual (not claimed) status
5. ✅ User controls continuation at each step
6. ✅ Depth limit prevents infinite loops
7. ✅ Error handling provides clear next steps

## Implementation Notes

### Why Explicit Coordination?

**Automatic cascade was fantasy.** Single-agent setup doesn't support:
- Background file watching
- Automatic agent spawning
- Event-driven reactivity

**Explicit coordination is reliable.** Explicit tool invocation supports:
- Task tool for agent invocation
- Bash for verification
- Structured state tracking
- Clear error reporting

### Trade-offs

**Lost:**
- Fully autonomous operation
- Automatic convergence
- True reactive cascade

**Gained:**
- Reliable verification
- Clear error handling
- User control
- Debuggable process
- Accurate steering packets

---
**Next**: @ref:specs/cascade-protocol/flow for cascade flow and multi‑tree generation.