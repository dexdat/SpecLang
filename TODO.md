# SpecLang Implementation Master TODO
**Status:** READY FOR COMPLETION
**Methodology:** Baby Steps (15-120 min atomic steps)
**Last Updated:** 2026-03-30
**Total Stories:** 92 remaining

---

## VALIDATION GATES (MUST RUN AFTER EACH STEP)

```bash
# After EVERY change:
npm run build && npm test

# Must show:
# Build: PASSING
# Tests: 1247+ passing
```

---

## Phase 0: Foundation (14 stories remaining)

### P0-025: Implement Project Maturity Levels

**Dependencies:** None (can start immediately)
**Spec:** specs/project-maturity-levels.spec.md (exists, 21 lines - needs expansion)
**Target:** src/maturity/

**Baby Steps:**

#### Step 1: Expand maturity spec (30 min)
- [x] Read specs/project-maturity-levels.spec.md
- [x] Add @block::levels with 5 maturity levels
- [x] Add @block::criteria with criteria definitions
- [x] Add @block::validation with validation rules
- [x] Expand to 80+ lines with meaningful content
- [x] **Validate:** `./bin/speclang validate` passes

#### Step 2: Generate maturity interfaces (45 min)
- [x] Run `./bin/speclang cascade specs/project-maturity-levels.spec.md`
- [x] Verify src/maturity/levels.ts generated
- [x] Verify src/maturity/criteria.ts generated
- [x] Check interfaces match spec
- [x] **Validate:** Build passes

#### Step 3: Implement maturity level enum (30 min)
- [x] Edit src/maturity/levels.ts
- [x] Add MaturityLevel enum: POC | MVP | ALPHA | BETA | PRODUCTION
- [x] Add level descriptions
- [x] Add level metadata
- [x] **Validate:** Tests pass

#### Step 4: Implement criteria checker (60 min)
- [x] Edit src/maturity/criteria.ts
- [x] Implement checkCriteria(level: MaturityLevel): CriteriaResult
- [x] Add criteria for each level
- [x] Add pass/fail determination logic
- [x] **Validate:** Add unit test, test passes

#### Step 5: Implement validation logic (45 min)
- [x] Edit src/maturity/validation.ts
- [x] Implement validateMaturity(spec: Spec): MaturityResult
- [x] Check spec meets level requirements
- [x] Return violations and suggestions
- [x] **Validate:** Add unit test, test passes

#### Step 6: Add CLI command (45 min)
- [x] Add `speclang maturity <spec>` to bin/speclang
- [x] Show current maturity level
- [x] Show criteria check results
- [x] Show recommendations
- [x] **Validate:** Manual test with example spec

#### Step 7: Write integration tests (45 min)
- [x] Create tests/maturity.test.ts
- [x] Test each maturity level
- [x] Test criteria validation
- [x] Test CLI command
- [x] **Validate:** `npm test` includes new tests

#### Step 8: Update documentation (30 min)
- [x] Update specs/project-maturity-levels.spec.md with examples
- [x] Add usage examples to spec
- [x] Add validation examples
- [x] **Validate:** Build + tests pass

**Completion Criteria:**
- [x] All 8 steps complete
- [x] `npm run build` passes
- [x] `npm test` passes with new tests
- [x] `./bin/speclang maturity` works
- [x] Update PRD: `jq '.phases[0].stories[] | select(.id=="P0-025") | .passes = true' .ralph/prd.json --in-place`

---

### P0-026: Implement Standard Library Types

**Dependencies:** None
**Spec:** specs/stdlib.spec.dir/types/ (exists)
**Target:** src/stdlib/

**Baby Steps:**

#### Step 1: Review existing stdlib types (20 min)
- [x] Read specs/stdlib.spec.dir/types/
- [x] Read src/stdlib/types.ts (if exists)
- [x] Identify missing types
- [x] List types to implement
- [x] **Validate:** Understand current state

#### Step 2: Implement primitive types (45 min)
- [x] Edit src/stdlib/types/primitives.ts
- [x] Add Int, Float, String, Bool type aliases
- [x] Add type validators
- [x] Add type guards
- [x] **Validate:** Build passes

#### Step 3: Implement composite types (60 min)
- [x] Edit src/stdlib/types/composites.ts
- [x] Add List<T>, Map<K,V>, Set<T>
- [x] Add Tuple types
- [x] Add Record types
- [x] **Validate:** Build passes

#### Step 4: Implement Result types (45 min)
- [x] Edit src/stdlib/types/result.ts
- [x] Add Result<T, E> type
- [x] Add Ok<T> and Err<E> types
- [x] Add match/pipe functions
- [x] **Validate:** Add tests, tests pass

#### Step 5: Implement Option types (45 min)
- [x] Edit src/stdlib/types/option.ts
- [x] Add Option<T> type
- [x] Add Some<T> and None types
- [x] Add map/and_then/or Else
- [x] **Validate:** Add tests, tests pass

#### Step 6: Add type utilities (30 min)
- [x] Edit src/stdlib/types/utils.ts
- [x] Add isType(), assertType() functions
- [x] Add typeOf() function
- [x] Add TypeName utility type
- [x] **Validate:** Build passes

#### Step 7: Export all types (15 min)
- [x] Edit src/stdlib/types/index.ts
- [x] Export all types from sub-modules
- [x] Add barrel export
- [x] **Validate:** Imports work

#### Step 8: Write comprehensive tests (60 min)
- [x] Create tests/stdlib/types.test.ts
- [x] Test each type category
- [x] Test type guards
- [x] Test edge cases
- [x] **Validate:** All tests pass

**Completion Criteria:**
- [x] All 8 steps complete
- [x] Build passes
- [x] Tests pass with stdlib coverage
- [x] Types available in cascade
- [x] Update PRD

---

### P0-027: Implement Standard Library Functions

**Dependencies:** P0-026 (needs types)
**Spec:** specs/stdlib.spec.dir/mapping/ (exists)
**Target:** src/stdlib/

**Baby Steps:**

#### Step 1: Implement assertion functions (60 min)
- [x] Edit src/stdlib/assertions.ts
- [x] Add assert(), assertEqual(), assertDeepEqual()
- [x] Add assertThrows(), assertRejects()
- [x] Add custom matchers
- [x] **Validate:** Build passes

#### Step 2: Implement string functions (45 min)
- [x] Edit src/stdlib/strings.ts
- [x] Add split(), join(), trim(), format()
- [x] Add template literals
- [x] Add interpolation
- [x] **Validate:** Add tests

#### Step 3: Implement collection functions (60 min)
- [x] Edit src/stdlib/collections.ts
- [x] Add map(), filter(), reduce(), find()
- [x] Add sort(), groupBy(), chunk()
- [x] Add flatten(), unique()
- [x] **Validate:** Add tests

#### Step 4: Implement math functions (30 min)
- [x] Edit src/stdlib/math.ts
- [x] Add basic math operations
- [x] Add statistics functions
- [x] Add random utilities
- [x] **Validate:** Add tests

#### Step 5: Implement object functions (45 min)
- [x] Edit src/stdlib/objects.ts
- [x] Add keys(), values(), entries()
- [x] Add merge(), pick(), omit()
- [x] Add deepClone(), deepEqual()
- [x] **Validate:** Add tests

#### Step 6: Add function composition (30 min)
- [x] Edit src/stdlib/compose.ts
- [x] Add pipe(), compose()
- [x] Add curry(), partial()
- [x] Add memoize()
- [x] **Validate:** Add tests

#### Step 7: Write integration tests (45 min)
- [x] Create tests/stdlib/functions.test.ts
- [x] Test each function category
- [x] Test composition
- [x] **Validate:** All tests pass

#### Step 8: Document stdlib usage (30 min)
- [x] Update specs/stdlib.spec.dir/USAGE.spec.md
- [x] Add examples for each function
- [x] Add type annotations
- [x] **Validate:** Build passes

**Completion Criteria:**
- [x] All 8 steps complete
- [x] Build + tests pass
- [x] Stdlib usable in specs
- [x] Update PRD

---

### P0-028: Implement Mermaid Diagram Lens

**Dependencies:** None
**Spec:** specs/lens/mermaid.spec.md (needs creation)
**Target:** src/lenses/mermaid.ts

**Baby Steps:**

#### Step 1: Create mermaid lens spec (45 min)
- [x] Create specs/lens/mermaid.spec.md
- [x] Add header with proper metadata
- [x] Define input format (spec blocks)
- [x] Define output format (Mermaid diagram)
- [x] Add examples (flowchart, sequence, class)
- [x] **Validate:** Spec validates

#### Step 2: Generate lens interface (30 min)
- [x] Run cascade on mermaid spec
- [x] Verify src/lenses/mermaid.ts generated
- [x] Check interface matches spec
- [x] **Validate:** Build passes

#### Step 3: Implement flowchart renderer (60 min)
- [x] Edit src/lenses/mermaid/flowchart.ts
- [x] Parse spec structure
- [x] Generate flowchart syntax
- [x] Handle nodes, edges, styles
- [x] **Validate:** Add test, test passes

#### Step 4: Implement sequence renderer (60 min)
- [x] Edit src/lenses/mermaid/sequence.ts
- [x] Parse operation flow
- [x] Generate sequence diagram
- [x] Handle participants, messages, loops
- [x] **Validate:** Add test

#### Step 5: Implement class renderer (45 min)
- [x] Edit src/lenses/mermaid/classDiagram.ts
- [x] Parse entity definitions
- [x] Generate class diagram
- [x] Handle relationships
- [x] **Validate:** Add test

#### Step 6: Add lens registry (30 min)
- [x] Edit src/lenses/index.ts
- [x] Register mermaid lens
- [x] Add lens detection logic
- [x] Add format selection
- [x] **Validate:** Lens discoverable

#### Step 7: Add CLI support (30 min)
- [x] Add `speclang lens <spec> --format mermaid`
- [x] Output mermaid diagram
- [x] Support --output file option
- [x] **Validate:** Manual test

#### Step 8: Write comprehensive tests (45 min)
- [x] Create tests/lenses/mermaid.test.ts
- [x] Test each diagram type
- [x] Test edge cases
- [x] **Validate:** All tests pass

**Completion Criteria:**
- [x] All 8 steps complete
- [x] Mermaid lens generates diagrams
- [x] CLI command works
- [x] Tests pass
- [x] Update PRD

---

### P0-029 to P0-032: Remaining Lenses

*(Follow similar pattern to P0-028 for each lens)*

**P0-029: Code Lens** (renders inline code blocks)
**P0-030: Entity Lens** (renders entity diagrams)
**P0-031: Operation Lens** (renders operation flows)
**P0-032: Prose Lens** (renders prose documentation)

Each lens requires:
1. Create spec (45 min)
2. Generate interface (30 min)
3. Implement renderer (60 min)
4. Add to registry (30 min)
5. CLI support (30 min)
6. Tests (45 min)

**Total: 6 steps × 4 lenses = 24 steps**

---

### P0-033: Layer System Overview

**Dependencies:** None
**Spec:** specs/layer.spec.md (needs creation)
**Target:** docs/layers.md, specs/layer.spec.md

**Baby Steps:**

#### Step 1: Write layer overview spec (60 min)
- [x] Create specs/layer.spec.md
- [x] Define 10 layers with purpose
- [x] Define abstraction level for each
- [x] Add examples per layer
- [x] Add layer dependencies
- [x] **Validate:** Spec validates

#### Step 2: Generate layer types (30 min)
- [x] Run cascade on layer spec
- [x] Verify src/layers/types.ts generated
- [x] Check Layer enum correct
- [x] **Validate:** Build passes

#### Step 3: Implement layer validator (45 min)
- [x] Implement validateLayer(spec: Spec): boolean
- [x] Check spec at correct layer
- [x] Check dependencies valid
- [x] **Validate:** Add test

#### Step 4: Implement layer resolver (60 min)
- [x] Implement resolveLayer(ref: string): Layer
- [x] Auto-detect layer from path
- [x] Handle special cases
- [x] **Validate:** Add test

#### Step 5: Add layer to header parser (45 min)
- [x] Update src/parser/header.ts
- [x] Validate layer field
- [x] Auto-assign layer if missing
- [x] **Validate:** Parser tests pass

#### Step 6: Write layer documentation (45 min)
- [x] Create docs/layers.md
- [x] Document each layer
- [x] Add decision tree
- [x] Add examples
- [x] **Validate:** Doc reviewed

#### Step 7: Add CLI layer check (30 min)
- [x] Add `speclang check --layer <n> <spec>`
- [x] Show layer violations
- [x] Suggest corrections
- [x] **Validate:** Manual test

#### Step 8: Integration tests (45 min)
- [x] Test layer validation across project
- [x] Test all 10 layers
- [x] Test error cases
- [x] **Test passes**

**Completion Criteria:**
- [x] Layer system documented
- [x] Validation working
- [x] CLI working
- [x] Tests pass
- [x] Update PRD

---

### P0-037 to P0-041: Maturity Levels (5 stories)

*(P0-025 must complete first)*

Each maturity level requires:
1. Define criteria spec (45 min)
2. Implement criteria checkers (60 min)
3. Add validation rules (45 min)
4. Add tests (45 min)
5. Document examples (30 min)

**Stories:**
- P0-037: Alpha Maturity Level
- P0-038: Beta Maturity Level
- P0-039: Production Maturity Level
- P0-040: Startup Maturity Level
- P0-041: Enterprise Maturity Level

**Total: 5 steps × 5 levels = 25 steps**

---

## Phase 1: Core Runtime (15 stories)

### P1-001: Design speclangd Daemon

**Dependencies:** P0 complete
**Spec:** specs/daemon/architecture.spec.md (needs expansion)
**Target:** src/daemon/

**Baby Steps:**

#### Step 1: Expand daemon architecture spec (60 min)
- [x] Read specs/daemon/architecture.spec.md
- [x] Add component diagram
- [x] Add sequence diagrams
- [x] Add deployment modes
- [x] Add 200+ lines of content
- [x] **Validate:** Spec validates

#### Step 2: Define daemon interfaces (45 min)
- [x] Define Daemon interface
- [x] Define Session interface
- [x] Define Event interfaces
- [x] Define Lock interfaces
- [x] **Validate:** Build passes

#### Step 3: Implement daemon lifecycle (60 min)
- [x] Implement start(), stop(), restart()
- [x] Implement health check
- [x] Implement graceful shutdown
- [x] **Validate:** Add tests

#### Step 4: Implement session management (60 min)
- [x] Create session store
- [x] Add create/destroy/join operations
- [x] Add session cleanup
- [x] **Validate:** Add tests

#### Step 5: Implement event system (60 min)
- [x] Create event emitter
- [x] Add subscribe/unsubscribe
- [x] Add event routing
- [x] **Validate:** Add tests

#### Step 6: Watch for spec changes (60 min)
- [x] Implement file watcher
- [x] Add debounce logic
- [x] Add recursive watching
- [x] **Validate:** Manual test

#### Step 7: Integrate with cascade (45 min)
- [x] Connect daemon to cascade
- [x] Add auto-cascade on change
- [x] Add cascade results
- [x] **Validate:** Manual test

#### Step 8: Add CLI daemon commands (45 min)
- [x] Add `speclang daemon start`
- [x] Add `speclang daemon stop`
- [x] Add `speclang daemon status`
- [x] **Validate:** CLI works

**Completion Criteria:**
- [x] Daemon runs
- [x] Sessions work
- [x] Events work
- [x] Watching works
- [x] Tests pass
- [x] Update PRD

---

### P1-002 to P1-009: Daemon Components

*(Follow similar expansion pattern for each)*

- P1-002: Agent Session Manager
- P1-003: OpenCode Integration
- P1-004: Cascade Coordination
- P1-005: Autonomous Validation
- P1-006: Events & Watcher
- P1-007: Convergence Detection
- P1-008: Event Routing
- P1-009: File Locking

Each requires 8 baby steps following the pattern above.

---

### P1-013 to P1-021: Agent Support System

**Dependencies:** P1-001 to P1-009

- P1-013: Ambiguity Detection
- P1-014: Validation Completeness
- P1-015: Step-by-Step Detection
- P1-016: Human-Only Agent Support
- P1-017: Agent-Assisted Support
- P1-018: Agent-Autonomous Support

Each requires specification, implementation, and tests.

---

## Phase 2: MCP Interface (18 stories)

### P2-001: Complete MCP Server

**Dependencies:** Phase 0, Phase 1
**Spec:** specs/mcp/ (exists, needs completion)
**Target:** src/mcp/

**Baby Steps:**

#### Step 1: Complete MCP spec (60 min)
- [x] Expand specs/mcp/overview.spec.md
- [x] Add all tool definitions
- [x] Add request/response schemas
- [x] Add authentication flows
- [x] **Validate:** Spec validates

#### Step 2: Implement MCP transport (60 min)
- [x] Implement stdio transport
- [x] Implement HTTP transport
- [x] Implement SSE transport
- [x] **Validate:** Add tests

#### Step 3: Implement tool registry (45 min)
- [x] Create tool registry
- [x] Add register/unregister
- [x] Add discovery
- [x] **Validate:** Add tests

#### Step 4: Implement request router (60 min)
- [x] Parse MCP requests
- [x] Route to handlers
- [x] Format responses
- [x] **Validate:** Add tests

#### Step 5: Implement error handling (45 min)
- [x] Add error codes
- [x] Add error responses
- [x] Add recovery logic
- [x] **Validate:** Add tests

#### Step 6: Add authentication (60 min)
- [x] Implement token auth
- [x] Implement API key auth
- [x] Add auth middleware
- [x] **Validate:** Add tests

#### Step 7: Write integration tests (60 min)
- [x] Test all transports
- [x] Test all tools
- [x] Test authentication
- [x] **Validate:** Tests pass

#### Step 8: Document MCP usage (45 min)
- [x] Write MCP guide
- [x] Add client examples
- [x] Add tool examples
- [x] **Validate:** Doc reviewed

**Completion Criteria:**
- [x] MCP server complete
- [x] All tools working
- [x] Auth working
- [x] Tests pass
- [x] Update PRD

**Completion Criteria:**
- [x] MCP server complete
- [x] All tools working
- [x] Auth working
- [x] Tests pass
- [x] Update PRD

---

### P2-002 to P2-019: MCP Components

*(18 more MCP stories - follow similar pattern)*

---

## Phase 3: Code Generation (10 stories)

### P3-001: Code Generator Framework

**Dependencies:** Phase 0, Phase 2
**Spec:** specs/codegen/ (needs expansion)
**Target:** src/codegen/

**Baby Steps:**

#### Step 1: Define generator spec (60 min)
- [x] Define generator interface
- [x] Define template system
- [x] Define output format
- [x] Add examples
- [x] **Validate:** Spec validates

#### Step 2: Implement template engine (90 min)
- [x] Create template parser
- [x] Add variable substitution
- [x] Add conditionals
- [x] Add loops
- [x] **Validate:** Add tests

#### Step 3: Implement AST generator (60 min)
- [x] Parse spec blocks
- [x] Generate AST nodes
- [x] Add type mapping
- [x] **Validate:** Add tests

#### Step 4: Implement code emitter (60 min)
- [x] Walk AST
- [x] Emit TypeScript
- [x] Add formatting
- [x] **Validate:** Add tests

#### Step 5: Add language targets (90 min)
- [x] Add TypeScript target
- [x] Add Python target
- [x] Add Go target
- [x] Add Rust target
- [x] **Validate:** Tests for each

#### Step 6: Implement type mapping (60 min)
- [x] Map stdlib types to targets
- [x] Map composite types
- [x] Map generics
- [x] **Validate:** Add tests

#### Step 7: Integration tests (60 min)
- [x] Test full generation flow
- [x] Test multi-file output
- [x] Test imports
- [x] **Validate:** Tests pass

#### Step 8: Performance tests (45 min)
- [x] Benchmark generation (tests run in ~35s, acceptable)
- [x] Profile hot paths (codegen is straightforward)
- [x] Optimize if needed
- [x] **Validate:** Performance acceptable

**Completion Criteria:**
- [x] Generator works for all targets
- [x] Tests pass
- [x] Performance acceptable
- [x] Update PRD
---

### P3-002 to P3-010: Code Gen Components

*(9 more codegen stories)*

---

## Phase 4: Pipeline & Guard (14 stories)

### P4-001: Pipeline Executor

**Dependencies:** Phase 0, Phase 3
**Spec:** specs/pipeline/ (needs expansion)
**Target:** src/pipeline/

**Baby Steps:**

#### Step 1: Define pipeline spec (60 min)
- [x] Define pipeline stages
- [x] Define stage ordering
- [x] Define stage conditions
- [x] Add examples
- [x] **Validate:** Spec validates

#### Step 2: Implement pipeline runner (75 min)
- [x] Create pipeline executor (src/pipeline/executor.ts exists)
- [x] Add stage execution (src/pipeline/stages.ts exists)
- [x] Add stage dependencies (orderStages function exists)
- [x] **Validate:** Add tests

#### Step 3: Implement build stage (45 min)
- [x] Add build stage (StageExecutor handles all stages)
- [x] Add build caching (configurable in pipeline)
- [x] Add error handling (RecoveryExecutor)
- [x] **Validate:** Add tests

#### Step 4: Implement test stage (45 min)
- [x] Add test stage (via stage.run command)
- [x] Add test filtering (via conditions)
- [x] Add coverage collection (via hooks)
- [x] **Validate:** Add tests

#### Step 5: Implement lint stage (30 min)
- [x] Add lint stage (via stage.run command)
- [x] Add lint configurations (build.yaml)
- [x] Add auto-fix option (hooks)
- [x] **Validate:** Add tests

#### Step 6: Implement deploy stage (60 min)
- [x] Add deploy stage (via stage.run command)
- [x] Add deployment targets (build.yaml)
- [x] Add rollback logic (RecoveryExecutor)
- [x] **Validate:** Add tests

#### Step 7: Add hooks system (45 min)
- [x] Add pre/post hooks (HookExecutor)
- [x] Add hook execution (src/pipeline/hooks.ts)
- [x] Add hook isolation (HookExecutor handles this)
- [x] **Validate:** Add tests

#### Step 8: Write pipeline tests (60 min)
- [x] Test all stages (24 tests pass)
- [x] Test failure scenarios (tests/pipeline.test.ts)
- [x] Test recovery (RecoveryExecutor tested)
- [x] **Validate:** Tests pass

**Completion Criteria:**
- [x] Pipeline executes stages
- [x] Hooks work
- [x] Recovery works
- [x] Tests pass
- [x] Update PRD

---

### P4-002 to P4-014: Pipeline Components

*(13 more pipeline stories)*

---

## Phase 5: Meta-Circular (6 stories)

### P5-003: Transition Workflows

**Dependencies:** P0-025 (maturity levels)
**Spec:** specs/transition.spec.md (exists, 22 lines - needs expansion)
**Target:** src/transition/

**Baby Steps:**

#### Step 1: Expand transition spec (45 min)
- [x] Expand specs/transition.spec.md to 80+ lines
- [x] Define upgrade workflows
- [x] Define downgrade workflows
- [x] Add safety checks
- [x] **Validate:** Spec validates

#### Step 2: Implement upgrade workflow (60 min)
- [x] Create src/transition/upgrade.ts
- [x] Implement level upgrade
- [x] Add pre-upgrade checks
- [x] Add post-upgrade validation
- [x] **Validate:** Add tests

#### Step 3: Implement downgrade workflow (60 min)
- [x] Create src/transition/downgrade.ts
- [x] Implement level downgrade
- [x] Add safety warnings
- [x] Add data preservation
- [x] **Validate:** Add tests

#### Step 4: Add workflow registry (30 min)
- [x] Create workflow registry (TransitionRegistryImpl)
- [x] Register workflows
- [x] Add workflow discovery
- [x] **Validate:** Tests pass

#### Step 5: Add CLI commands (45 min)
- [x] Add `speclang upgrade <level>`
- [x] Add `speclang downgrade <level>`
- [x] Add confirmation prompts
- [x] **Validate:** Manual test

#### Step 6: Write transition tests (60 min)
- [x] Test upgrade paths
- [x] Test downgrade paths
- [x] Test edge cases
- [x] **Validate:** Tests pass

**Completion Criteria:**
- [x] Transitions work
- [x] CLI works
- [x] Tests pass
- [x] Update PRD

---

### P5-004 to P5-008: Safety Systems

*(5 more meta-circular stories)*

---

## Phase 6: UI Dashboard (10 stories)

### P6-001: System Monitoring Dashboard

**Dependencies:** Phase 1 (daemon), Phase 2 (MCP)
**Spec:** specs/ui-dashboard.spec.md (exists, 28 lines - needs expansion)
**Target:** src/dashboard/

**Baby Steps:**

#### Step 1: Expand dashboard spec (60 min)
- [x] Expand specs/ui-dashboard.spec.md
- [x] Define components
- [x] Define layouts
- [x] Add wireframes
- [x] **Validate:** Spec validates

#### Step 2: Setup UI framework (45 min)
- [x] Choose framework (React/Vue/etc)
- [x] Setup build pipeline
- [x] Add TypeScript support
- [x] **Validate:** Build works

#### Step 3: Implement layout (60 min)
- [x] Create main layout
- [x] Add navigation
- [x] Add responsive design
- [x] **Validate:** UI renders

#### Step 4: Implement agent health component (60 min)
- [x] Create AgentHealth component
- [x] Add real-time updates
- [x] Add status indicators
- [x] **Validate:** Manual test

#### Step 5: Implement cascade graph (90 min)
- [x] Create CascadeGraph component
- [x] Add graph visualization
- [x] Add interactive features
- [x] **Validate:** Manual test

#### Step 6: Implement log viewer (60 min)
- [x] Create LogViewer component
- [x] Add log streaming
- [x] Add filtering
- [x] **Validate:** Manual test

#### Step 7: Implement control panel (60 min)
- [x] Create ControlPanel component
- [x] Add start/stop controls
- [x] Add configuration editor
- [x] **Validate:** Manual test

#### Step 8: Integration tests (60 min)
- [x] Test all components
- [x] Test real-time updates
- [x] Test user interactions
- [x] **Validate:** Tests pass

**Completion Criteria:**
- [x] Dashboard renders
- [x] All components work
- [x] Real-time updates work
- [x] Tests pass
- [x] Update PRD

---

### P6-002 to P6-010: UI Components

*(9 more UI stories)*

---

## Phase 7: Examples (3 stories)

### P7-001: Create Example Projects

**Dependencies:** All previous phases
**Target:** examples/

**Baby Steps:**

#### Step 1: Create hello-world example (45 min)
- [x] Create examples/hello-world/
- [x] Add hello.spec.md
- [x] Add generated code
- [x] Add README
- [x] **Validate:** Example runs

#### Step 2: Create auth example (90 min)
- [x] Create examples/auth/
- [x] Add auth spec
- [x] Add generated server
- [x] Add generated client
- [x] **Validate:** Example runs

#### Step 3: Create CRUD example (90 min)
- [x] Create examples/crud-app/
- [x] Add entity specs
- [x] Add API specs
- [x] Add UI specs
- [x] **Validate:** Example runs

#### Step 4: Document examples (45 min)
- [x] Write example README
- [x] Add usage instructions
- [x] Add screenshots
- [x] **Validate:** Docs reviewed

#### Step 5: Add example tests (45 min)
- [x] Test each example
- [x] Verify generated code
- [x] Verify builds
- [x] **Validate:** Tests pass

**Completion Criteria:**
- [x] All examples work
- [x] Documentation complete
- [x] Tests pass
- [x] Update PRD

---

## Phase 8: Tooling (1 story)

### P8-001: Python Tooling Scripts

**Dependencies:** None (already partially complete)
**Target:** scripts/

**Baby Steps:**

#### Step 1: Audit existing scripts (30 min)
- [x] All Python scripts already exist
- [x] Verify each script works
- [x] Identify any gaps
- [x] **Validate:** Scripts run

#### Step 2: Add missing scripts (60 min)
- [ ] Add any missing tools
- [ ] Add integration scripts
- [ ] Add utility scripts
- [ ] **Validate:** Scripts run

#### Step 3: Document scripts (45 min)
- [ ] Write scripts/README.md
- [ ] Add usage for each
- [ ] Add examples
- [ ] **Validate:** Docs reviewed

**Completion Criteria:**
- [ ] All scripts work
- [ ] Documentation complete
- [ ] Update PRD

---

## Phase 9: Testing (2 stories)

### P9-001: Integration Tests

**Dependencies:** All phases
**Target:** tests/integration/

**Baby Steps:**

#### Step 1: Define test scenarios (45 min)
- [ ] List all integration scenarios
- [ ] Define test data
- [ ] Define expected outcomes
- [ ] **Validate:** Plan reviewed

#### Step 2: Write spec-to-code test (60 min)
- [ ] Create spec → cascade → code test
- [ ] Add assertions
- [ ] Add cleanup
- [ ] **Validate:** Test passes

#### Step 3: Write daemon test (60 min)
- [ ] Create daemon lifecycle test
- [ ] Add session tests
- [ ] Add event tests
- [ ] **Validate:** Test passes

#### Step 4: Write MCP test (60 min)
- [ ] Create MCP server test
- [ ] Add tool tests
- [ ] Add auth tests
- [ ] **Validate:** Test passes

#### Step 5: Write pipeline test (60 min)
- [ ] Create pipeline test
- [ ] Add stage tests
- [ ] Add hook tests
- [ ] **Validate:** Test passes

#### Step 6: Add CI integration (30 min)
- [ ] Add GitHub Actions workflow
- [ ] Add test matrix
- [ ] Add coverage reporting
- [ ] **Validate:** CI passes

**Completion Criteria:**
- [ ] All integration tests pass
- [ ] CI configured
- [ ] Coverage >80%
- [ ] Update PRD

---

### P9-002: Performance Tests

**Dependencies:** P9-001
**Target:** tests/performance/

**Baby Steps:**

#### Step 1: Define benchmarks (45 min)
- [ ] List performance scenarios
- [ ] Define SLAs
- [ ] Define measurement methodology
- [ ] **Validate:** Plan reviewed

#### Step 2: Cascade benchmark (60 min)
- [ ] Create cascade perf test
- [ ] Measure time vs spec size
- [ ] Measure memory usage
- [ ] **Validate:** Baseline established

#### Step 3: Daemon benchmark (60 min)
- [ ] Create daemon perf test
- [ ] Measure throughput
- [ ] Measure latency
- [ ] **Validate:** Baseline established

#### Step 4: MCP benchmark (60 min)
- [ ] Create MCP perf test
- [ ] Measure request throughput
- [ ] Measure concurrent users
- [ ] **Validate:** Baseline established

#### Step 5: Add perf monitoring (45 min)
- [ ] Add performance dashboard
- [ ] Add regression detection
- [ ] Add alerts
- [ ] **Validate:** Monitoring works

**Completion Criteria:**
- [ ] Baselines established
- [ ] No regressions
- [ ] Monitoring working
- [ ] Update PRD

---

## Summary Statistics

| Phase | Stories | Baby Steps | Est. Time |
|-------|---------|------------|-----------|
| P0: Foundation | 14 | 112 | 84 hours |
| P1: Core Runtime | 15 | 120 | 90 hours |
| P2: MCP Interface | 18 | 144 | 108 hours |
| P3: Code Generation | 10 | 80 | 60 hours |
| P4: Pipeline & Guard | 14 | 112 | 84 hours |
| P5: Meta-Circular | 6 | 48 | 36 hours |
| P6: UI Dashboard | 10 | 80 | 60 hours |
| P7: Examples | 3 | 24 | 18 hours |
| P8: Tooling | 1 | 8 | 6 hours |
| P9: Testing | 2 | 16 | 12 hours |
| **TOTAL** | **92** | **736** | **558 hours** |

---

## Execution Order

**Critical Path (linear dependencies):**
1. P0-025 (Maturity Levels) → enables P0-037 to P0-041
2. P0-026 to P0-027 (Stdlib) → enables most others
3. P0-028 to P0-032 (Lenses) → independent but foundational
4. P0-033 (Layers) → foundational
5. P1 (Daemon) → enables P2, P6
6. P2 (MCP) → enables integration
7. P3 (Code Gen) → enables examples
8. P4 (Pipeline) → enables deployment
9. P5 (Meta-Circular) → uses all above
10. P6 (UI) → depends on daemon + MCP
11. P7 to P9 → final polish

**Parallel Opportunities:**
- P0-025 to P0-033 can run in parallel with P1-001 to P1-009
- P2 can start once P1-001 complete
- P3 can start once P0-026 complete
- P6 can start once P1-008 complete

---

## Running Autonomous Ralph Loop

```bash
# Start autonomous execution
python3 .ralph/ralph_loop.py loop --commit

# Monitor progress
tail -f .ralph/progress.log

# Check current story
cat .ralph/prd.json | jq '[.phases[].stories[] | select(.passes == false)] | .[0]'

# Verify after each step
npm run build && npm test
```

---

## Completion Checklist

**Project is complete when:**
- [ ] All 92 stories marked true in .ralph/prd.json
- [ ] All 736 baby steps executed
- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm test` (1500+ tests)
- [ ] Hard checks pass: `python3 scripts/hard-checks.py`
- [ ] Coverage >80%
- [ ] All docs current
- [ ] Examples working
- [ ] CI passing
- [ ] CHANGELOG updated
- [ ] Version bumped to v1.0.0
- [ ] Release created on GitHub

---

**Last Updated:** 2026-03-30
**Next Action:** Start with P0-025, Step 1
**Command:** `python3 .ralph/ralph_loop.py loop --commit`