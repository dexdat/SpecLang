# speclang-header lines:13
id: @speclang/cascade-protocol/flow
version: 1.0.0
layer: 2
tags: [cascade, protocol, flow, process]
status: draft
project_level: Alpha
agent_support: agent_autonomous
short: Cascade Protocol Flow and Multi‑Tree Generation
parent: @ref:specs/cascade-protocol
part: 2/2
---

# Cascade Protocol Flow and Multi‑Tree Generation

Part 2 of 2: Flow, process, and multi‑tree spanning generation.

**Parent**: @ref:specs/cascade-protocol  
**See also**: @ref:specs/cascade-protocol/events for events, definitions, and static components.

## Reality Check

**SpecLang's original vision:**
- Automatic file watching with inotify
- Agents react automatically to file changes
- Convergence detected automatically
- Fully autonomous cascade

**OpenCode reality:**
- ❌ No file watching
- ❌ No automatic agent triggering
- ❌ No background processes
- ✅ Task tool for explicit invocation
- ✅ Bash for verification

**This protocol:** Explicit coordination using available tools.

## Protocol Overview

The cascade is **manual and explicit**, coordinated by `@speclang-coordinator`:

```
┌─────────────────────────────────────────────────────┐
│  USER triggers cascade with changed file            │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│  COORDINATOR reads cascade_state.json               │
│  Determines which agent to invoke                   │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│  COORDINATOR invokes subagent via Task tool         │
│  Passes full context (file paths, requirements)     │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│  SUBAGENT completes task                            │
│  Returns structured result                          │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│  COORDINATOR runs verification gates                │
│  Compilation, tests, reference checks               │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│  COORDINATOR invokes @speclang-verifier             │
│  Creates accurate steering packet                   │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│  USER decides: continue / stop / retry              │
└─────────────────────────────────────────────────────┘
```

## Cascade Flow

### Step 1: Initiation
**Trigger**: User changes a file

**Coordinator actions**:
1. Identify trigger file type:
   - `project.scl` → North Star change
   - `specs/*.spec.md` → Spec change
   - `specs/*.go.spec` → Code spec change
2. Read file to understand context
3. Initialize `cascade_state.json`
4. Determine first agent

### Step 2: Agent Invocation
**Action**: Invoke subagent with explicit context

```
task:
  description: "Step 1: Update auth spec"
  subagent_type: general
  prompt: |
    You are @speclang-spec-writer.
    
    Task: Update specs/auth.spec.md
    
    Context:
    - Trigger: User updated requirements
    - Parent spec: @ref:specs/core (read for context)
    - Target layer: 2
    - Agent support: agent_autonomous
    
    Requirements:
    1. Read specs/core.spec.md for system context
    2. Update specs/auth.spec.md with new auth flow
    3. Ensure all @ref: resolve (check _index.json)
    4. Add step-by-step descriptions for operations
    5. Run: python3 scripts/validate_refs.py
    6. Run: python3 scripts/validate_autonomous.py --file specs/auth.spec.md
    
    Return structured report:
    {
      "agent": "speclang-spec-writer",
      "status": "success|failure",
      "files_modified": [...],
      "validation": {...},
      "errors": []
    }
```

### Step 3: Verification
**Action**: Run verification gates

```bash
# After spec-writer
echo "=== Gate 1: Reference Validation ==="
python3 scripts/validate_refs.py

# After code-gen
echo "=== Gate 3: Code Compilation ==="
npx tsc --noEmit --skipLibCheck src/auth/handler.ts

# Always
echo "=== Gate 4: Test Execution ==="
python3 -m pytest tests/ -v
```

### Step 4: Steering Packet Creation
**Action**: Invoke verifier to create accurate packet

```
task:
  description: "Create steering packet for step 1"
  subagent_type: general
  prompt: |
    You are @speclang-verifier.
    
    Task: Verify step 1 output and create steering packet
    
    Files to verify:
    - specs/auth.spec.md
    
    Run verification:
    1. python3 scripts/validate_refs.py
    2. python3 scripts/validate_autonomous.py --file specs/auth.spec.md
    
    Create steering packet in .speclang/steering_packets.json:
    - Type: success_confirmation or error_report
    - task_id: cascade-20260222-001-step1
    - verification details with actual command outputs
    - quality_score based on real metrics
    
    Return verification report.
```

### Step 5: User Decision
**Action**: Present results, ask for continuation

```
Cascade Step 1 Complete

Results:
✓ Spec file updated: specs/auth.spec.md
✓ References valid: 12/12
✓ Autonomous validation: PASSED
✓ Quality score: 0.95

Steering packet created: sp-20260222-001-step1

Next step: Generate auth handler code
Agent: @speclang-code-gen

Continue cascade? (yes / no / retry / modify)
```

## Multi-Tree Spanning Generation

This is the **core SpecLang capability**: A change to a high-level spec cascades through the entire dependency tree across multiple output trees.

### The Dependency Trees

```
┌─────────────────────────────────────────────────────────────┐
│                    TRIGGER: project.scl                      │
│                    (Layer 0 - North Star)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ refs: [@speclang/core, @speclang/...]
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  SPEC TREE (Layers 1-5)                                      │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Core, Agent-Protocol, Cascade specs               │
│     ↓ refs                                                   │
│  Layer 2: Auth, Database, API specs                         │
│     ↓ refs                                                   │
│  Layer 3-5: Implementation details                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ (specs generate code)
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  CODE TREE (Layers 6-10)                                     │
├─────────────────────────────────────────────────────────────┤
│  Layer 6-7: Type interfaces, database schemas               │
│     ↓ imports                                                │
│  Layer 8-9: Business logic, handlers                        │
│     ↓ imports                                                │
│  Layer 10: Utilities, helpers                               │
└──────────────────────┬──────────────────────────────────────┘
                       │ (code generates tests)
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  TEST TREE (Layer 10+)                                       │
├─────────────────────────────────────────────────────────────┤
│  Unit tests                                                  │
│  Integration tests                                           │
│  E2E tests                                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │ (everything generates docs)
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  DOCS TREE                                                   │
├─────────────────────────────────────────────────────────────┤
│  API documentation                                           │
│  Architecture diagrams                                       │
│  Usage guides                                                │
└─────────────────────────────────────────────────────────────┘
```

### Coordinator Tree Traversal Algorithm

The coordinator must explicitly traverse this tree:

```python
# Pseudocode for coordinator logic
def cascade_from_trigger(trigger_file):
    # Step 1: Build dependency graph from _index.json
    deps = build_dependency_graph(trigger_file)
    
    # Step 2: Order by layer (0 -> 1 -> 2 -> ... -> 10)
    ordered_specs = sort_by_layer(deps)
    
    # Step 3: Process each layer
    for layer in range(0, 11):
        layer_specs = [s for s in ordered_specs if s.layer == layer]
        
        for spec in layer_specs:
            # Determine which tree this spec targets
            if spec.id.startswith('@specs/'):
                agent = '@speclang-spec-writer'
                action = 'create/update spec'
            elif spec.id.startswith('@codegen/'):
                agent = '@speclang-code-gen'
                action = 'generate code'
            elif spec.id.startswith('@tests/'):
                agent = '@speclang-test-writer'
                action = 'generate tests'
            
            # Invoke agent for this node
            result = invoke_agent(agent, spec, action)
            
            # Verification gate
            if not verify_step(result):
                halt_cascade(spec, result.errors)
                return
            
            # User decision point
            if not user_wants_continue():
                pause_cascade()
                return
    
    # All trees processed
    mark_convergence()
```

### Layer-Ordered Processing

**Critical:** Process by layer, not by file discovery order.

```
Pass 1: Layer 0 (project.scl)
  ↓
Pass 2: Layer 1 (core specs)
  ↓
Pass 3: Layer 2 (feature specs)
  ↓
Pass 4: Layer 3-5 (implementation specs)
  ↓
Pass 5: Layer 6-7 (type/interfaces)
  ↓
Pass 6: Layer 8-9 (logic/handlers)
  ↓
Pass 7: Layer 10 (utilities)
  ↓
Pass 8: Layer 10+ (tests)
```

### Cross-Tree Dependencies

Specs can generate outputs in multiple trees:

```markdown
# specs/auth.spec.md
id: @specs/auth
refs: [@ref:project.scl, @ref:specs/core]
---

## API Specification

### @block:auth/api @kind:code
```yaml
# Generates: specs/auth.api.yaml (spec tree)
openapi: 3.0.0
paths:
  /login:
    post:
      summary: User login
```

### @block:auth/handler @kind:code
```typescript
// Generates: src/auth/handler.ts (code tree)
export async function loginHandler(req: Request) { ... }
```

### @block:auth/tests @kind:code
```typescript
// Generates: tests/auth.test.ts (test tree)
describe('Auth', () => { ... });
```
```

**One spec → Multiple trees.** The coordinator processes each output tree separately.

### Example: Full Tree Cascade

**User changes:** `specs/core.spec.md` (Layer 1)

**Coordinator actions:**

1. **Read dependencies**: Find all specs that reference @specs/core
   - Found: specs/auth.spec.md, specs/database.spec.md (Layer 2)

2. **Layer 2 specs**: Invoke @speclang-spec-writer
   - Update specs/auth.spec.md
   - Update specs/database.spec.md
   - Verify: validate_refs.py

3. **Layer 3-5 specs**: Auth/DB specs generate implementation specs
   - specs/auth/implementation.spec.md
   - specs/database/schema.spec.md
   - Verify: validate_refs.py

4. **Layer 6-7 code**: Generate types/interfaces
   - src/types/auth.ts
   - src/types/database.ts
   - Verify: npx tsc --noEmit

5. **Layer 8-9 code**: Generate handlers
   - src/auth/handler.ts
   - src/database/client.ts
   - Verify: npx tsc --noEmit

6. **Layer 10 code**: Generate utilities
   - src/utils/validation.ts
   - Verify: npx tsc --noEmit

7. **Layer 10+ tests**: Generate test suites
   - tests/auth.test.ts
   - tests/database.test.ts
   - Verify: pytest tests/

8. **Docs**: Generate API docs
   - docs/api/auth.md
   - docs/architecture.md

**Total: 8 passes across 4 trees, 15+ files generated**

### Depth Tracking Per Tree

Track depth separately for each tree:

```json
{
  "cascade_id": "cascade-001",
  "depth_by_tree": {
    "specs": 3,
    "src": 5,
    "tests": 2,
    "docs": 1
  },
  "max_depth": 5,
  "current_pass": "src (layer 8-9)"
}
```

**If any tree exceeds max_depth → halt cascade**

### User Control Points

The user can control cascade at multiple points:

```
[After Layer 2 specs] Continue to implementation specs? (yes/no)
[After Layer 5 specs] Continue to code generation? (yes/no)
[After Layer 9 code] Continue to utilities? (yes/no)
[After Layer 10 code] Continue to tests? (yes/no)
```

**User can skip trees:** "Generate specs and code, skip tests for now"

### Implementation Status

**Current (Working):**
- ✅ Single spec → Single output
- ✅ Verification gates
- ✅ Layer ordering
- ✅ Dependency resolution

**Missing (Need to Build):**
- ❌ Tree traversal automation
- ❌ Multi-output spec handling
- ❌ Cross-tree dependency tracking
- ❌ Partial tree execution

### Future Enhancement

If OpenCode adds file watching:
1. Coordinator monitors file changes
2. Auto-triggers cascade on change
3. Still uses explicit agent invocation
4. Verification gates remain mandatory
5. Tree traversal remains explicit

Until then: **Explicit > Automatic**

---
**Previous**: @ref:specs/cascade-protocol/events for events and definitions.