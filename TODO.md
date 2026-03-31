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
- [ ] Update PRD

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
- [ ] Create tests/stdlib/functions.test.ts
- [ ] Test each function category
- [ ] Test composition
- [ ] **Validate:** All tests pass

#### Step 8: Document stdlib usage (30 min)
- [ ] Update specs/stdlib.spec.dir/USAGE.spec.md
- [ ] Add examples for each function
- [ ] Add type annotations
- [ ] **Validate:** Build passes

**Completion Criteria:**
- [ ] All 8 steps complete
- [ ] Build + tests pass
- [ ] Stdlib usable in specs
- [ ] Update PRD

---

### P0-028: Implement Mermaid Diagram Lens

**Dependencies:** None
**Spec:** specs/lens/mermaid.spec.md (needs creation)
**Target:** src/lenses/mermaid.ts

**Baby Steps:**

#### Step 1: Create mermaid lens spec (45 min)
- [ ] Create specs/lens/mermaid.spec.md
- [ ] Add header with proper metadata
- [ ] Define input format (spec blocks)
- [ ] Define output format (Mermaid diagram)
- [ ] Add examples (flowchart, sequence, class)
- [ ] **Validate:** Spec validates

#### Step 2: Generate lens interface (30 min)
- [ ] Run cascade on mermaid spec
- [ ] Verify src/lenses/mermaid.ts generated
- [ ] Check interface matches spec
- [ ] **Validate:** Build passes

#### Step 3: Implement flowchart renderer (60 min)
- [ ] Edit src/lenses/mermaid/flowchart.ts
- [ ] Parse spec structure
- [ ] Generate flowchart syntax
- [ ] Handle nodes, edges, styles
- [ ] **Validate:** Add test, test passes

#### Step 4: Implement sequence renderer (60 min)
- [ ] Edit src/lenses/mermaid/sequence.ts
- [ ] Parse operation flow
- [ ] Generate sequence diagram
- [ ] Handle participants, messages, loops
- [ ] **Validate:** Add test

#### Step 5: Implement class renderer (45 min)
- [ ] Edit src/lenses/mermaid/classDiagram.ts
- [ ] Parse entity definitions
- [ ] Generate class diagram
- [ ] Handle relationships
- [ ] **Validate:** Add test

#### Step 6: Add lens registry (30 min)
- [ ] Edit src/lenses/index.ts
- [ ] Register mermaid lens
- [ ] Add lens detection logic
- [ ] Add format selection
- [ ] **Validate:** Lens discoverable

#### Step 7: Add CLI support (30 min)
- [ ] Add `speclang lens <spec> --format mermaid`
- [ ] Output mermaid diagram
- [ ] Support --output file option
- [ ] **Validate:** Manual test

#### Step 8: Write comprehensive tests (45 min)
- [ ] Create tests/lenses/mermaid.test.ts
- [ ] Test each diagram type
- [ ] Test edge cases
- [ ] **Validate:** All tests pass

**Completion Criteria:**
- [ ] All 8 steps complete
- [ ] Mermaid lens generates diagrams
- [ ] CLI command works
- [ ] Tests pass
- [ ] Update PRD

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
- [ ] Create specs/layer.spec.md
- [ ] Define 10 layers with purpose
- [ ] Define abstraction level for each
- [ ] Add examples per layer
- [ ] Add layer dependencies
- [ ] **Validate:** Spec validates

#### Step 2: Generate layer types (30 min)
- [ ] Run cascade on layer spec
- [ ] Verify src/layers/types.ts generated
- [ ] Check Layer enum correct
- [ ] **Validate:** Build passes

#### Step 3: Implement layer validator (45 min)
- [ ] Implement validateLayer(spec: Spec): boolean
- [ ] Check spec at correct layer
- [ ] Check dependencies valid
- [ ] **Validate:** Add test

#### Step 4: Implement layer resolver (60 min)
- [ ] Implement resolveLayer(ref: string): Layer
- [ ] Auto-detect layer from path
- [ ] Handle special cases
- [ ] **Validate:** Add test

#### Step 5: Add layer to header parser (45 min)
- [ ] Update src/parser/header.ts
- [ ] Validate layer field
- [ ] Auto-assign layer if missing
- [ ] **Validate:** Parser tests pass

#### Step 6: Write layer documentation (45 min)
- [ ] Create docs/layers.md
- [ ] Document each layer
- [ ] Add decision tree
- [ ] Add examples
- [ ] **Validate:** Doc reviewed

#### Step 7: Add CLI layer check (30 min)
- [ ] Add `speclang check --layer <n> <spec>`
- [ ] Show layer violations
- [ ] Suggest corrections
- [ ] **Validate:** Manual test

#### Step 8: Integration tests (45 min)
- [ ] Test layer validation across project
- [ ] Test all 10 layers
- [ ] Test error cases
- [ ] **Test passes**

**Completion Criteria:**
- [ ] Layer system documented
- [ ] Validation working
- [ ] CLI working
- [ ] Tests pass
- [ ] Update PRD

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
- [ ] Read specs/daemon/architecture.spec.md
- [ ] Add component diagram
- [ ] Add sequence diagrams
- [ ] Add deployment modes
- [ ] Add 200+ lines of content
- [ ] **Validate:** Spec validates

#### Step 2: Define daemon interfaces (45 min)
- [ ] Define Daemon interface
- [ ] Define Session interface
- [ ] Define Event interfaces
- [ ] Define Lock interfaces
- [ ] **Validate:** Build passes

#### Step 3: Implement daemon lifecycle (60 min)
- [ ] Implement start(), stop(), restart()
- [ ] Implement health check
- [ ] Implement graceful shutdown
- [ ] **Validate:** Add tests

#### Step 4: Implement session management (60 min)
- [ ] Create session store
- [ ] Add create/destroy/join operations
- [ ] Add session cleanup
- [ ] **Validate:** Add tests

#### Step 5: Implement event system (60 min)
- [ ] Create event emitter
- [ ] Add subscribe/unsubscribe
- [ ] Add event routing
- [ ] **Validate:** Add tests

#### Step 6: Watch for spec changes (60 min)
- [ ] Implement file watcher
- [ ] Add debounce logic
- [ ] Add recursive watching
- [ ] **Validate:** Manual test

#### Step 7: Integrate with cascade (45 min)
- [ ] Connect daemon to cascade
- [ ] Add auto-cascade on change
- [ ] Add cascade results
- [ ] **Validate:** Manual test

#### Step 8: Add CLI daemon commands (45 min)
- [ ] Add `speclang daemon start`
- [ ] Add `speclang daemon stop`
- [ ] Add `speclang daemon status`
- [ ] **Validate:** CLI works

**Completion Criteria:**
- [ ] Daemon runs
- [ ] Sessions work
- [ ] Events work
- [ ] Watching works
- [ ] Tests pass
- [ ] Update PRD

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
- [ ] Expand specs/mcp/overview.spec.md
- [ ] Add all tool definitions
- [ ] Add request/response schemas
- [ ] Add authentication flows
- [ ] **Validate:** Spec validates

#### Step 2: Implement MCP transport (60 min)
- [ ] Implement stdio transport
- [ ] Implement HTTP transport
- [ ] Implement SSE transport
- [ ] **Validate:** Add tests

#### Step 3: Implement tool registry (45 min)
- [ ] Create tool registry
- [ ] Add register/unregister
- [ ] Add discovery
- [ ] **Validate:** Add tests

#### Step 4: Implement request router (60 min)
- [ ] Parse MCP requests
- [ ] Route to handlers
- [ ] Format responses
- [ ] **Validate:** Add tests

#### Step 5: Implement error handling (45 min)
- [ ] Add error codes
- [ ] Add error responses
- [ ] Add recovery logic
- [ ] **Validate:** Add tests

#### Step 6: Add authentication (60 min)
- [ ] Implement token auth
- [ ] Implement API key auth
- [ ] Add auth middleware
- [ ] **Validate:** Add tests

#### Step 7: Write integration tests (60 min)
- [ ] Test all transports
- [ ] Test all tools
- [ ] Test authentication
- [ ] **Validate:** Tests pass

#### Step 8: Document MCP usage (45 min)
- [ ] Write MCP guide
- [ ] Add client examples
- [ ] Add tool examples
- [ ] **Validate:** Doc reviewed

**Completion Criteria:**
- [ ] MCP server complete
- [ ] All tools working
- [ ] Auth working
- [ ] Tests pass
- [ ] Update PRD

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
- [ ] Define generator interface
- [ ] Define template system
- [ ] Define output format
- [ ] Add examples
- [ ] **Validate:** Spec validates

#### Step 2: Implement template engine (90 min)
- [ ] Create template parser
- [ ] Add variable substitution
- [ ] Add conditionals
- [ ] Add loops
- [ ] **Validate:** Add tests

#### Step 3: Implement AST generator (60 min)
- [ ] Parse spec blocks
- [ ] Generate AST nodes
- [ ] Add type mapping
- [ ] **Validate:** Add tests

#### Step 4: Implement code emitter (60 min)
- [ ] Walk AST
- [ ] Emit TypeScript
- [ ] Add formatting
- [ ] **Validate:** Add tests

#### Step 5: Add language targets (90 min)
- [ ] Add TypeScript target
- [ ] Add Python target
- [ ] Add Go target
- [ ] Add Rust target
- [ ] **Validate:** Tests for each

#### Step 6: Implement type mapping (60 min)
- [ ] Map stdlib types to targets
- [ ] Map composite types
- [ ] Map generics
- [ ] **Validate:** Add tests

#### Step 7: Integration tests (60 min)
- [ ] Test full generation flow
- [ ] Test multi-file output
- [ ] Test imports
- [ ] **Validate:** Tests pass

#### Step 8: Performance tests (45 min)
- [ ] Benchmark generation
- [ ] Profile hot paths
- [ ] Optimize if needed
- [ ] **Validate:** Performance acceptable

**Completion Criteria:**
- [ ] Generator works for all targets
- [ ] Tests pass
- [ ] Performance acceptable
- [ ] Update PRD

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
- [ ] Define pipeline stages
- [ ] Define stage ordering
- [ ] Define stage conditions
- [ ] Add examples
- [ ] **Validate:** Spec validates

#### Step 2: Implement pipeline runner (75 min)
- [ ] Create pipeline executor
- [ ] Add stage execution
- [ ] Add stage dependencies
- [ ] **Validate:** Add tests

#### Step 3: Implement build stage (45 min)
- [ ] Add build stage
- [ ] Add build caching
- [ ] Add error handling
- [ ] **Validate:** Add tests

#### Step 4: Implement test stage (45 min)
- [ ] Add test stage
- [ ] Add test filtering
- [ ] Add coverage collection
- [ ] **Validate:** Add tests

#### Step 5: Implement lint stage (30 min)
- [ ] Add lint stage
- [ ] Add lint configurations
- [ ] Add auto-fix option
- [ ] **Validate:** Add tests

#### Step 6: Implement deploy stage (60 min)
- [ ] Add deploy stage
- [ ] Add deployment targets
- [ ] Add rollback logic
- [ ] **Validate:** Add tests

#### Step 7: Add hooks system (45 min)
- [ ] Add pre/post hooks
- [ ] Add hook execution
- [ ] Add hook isolation
- [ ] **Validate:** Add tests

#### Step 8: Write pipeline tests (60 min)
- [ ] Test all stages
- [ ] Test failure scenarios
- [ ] Test recovery
- [ ] **Validate:** Tests pass

**Completion Criteria:**
- [ ] Pipeline executes stages
- [ ] Hooks work
- [ ] Recovery works
- [ ] Tests pass
- [ ] Update PRD

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
- [ ] Expand specs/transition.spec.md to 80+ lines
- [ ] Define upgrade workflows
- [ ] Define downgrade workflows
- [ ] Add safety checks
- [ ] **Validate:** Spec validates

#### Step 2: Implement upgrade workflow (60 min)
- [ ] Create src/transition/upgrade.ts
- [ ] Implement level upgrade
- [ ] Add pre-upgrade checks
- [ ] Add post-upgrade validation
- [ ] **Validate:** Add tests

#### Step 3: Implement downgrade workflow (60 min)
- [ ] Create src/transition/downgrade.ts
- [ ] Implement level downgrade
- [ ] Add safety warnings
- [ ] Add data preservation
- [ ] **Validate:** Add tests

#### Step 4: Add workflow registry (30 min)
- [ ] Create workflow registry
- [ ] Register workflows
- [ ] Add workflow discovery
- [ ] **Validate:** Add tests

#### Step 5: Add CLI commands (45 min)
- [ ] Add `speclang upgrade <level>`
- [ ] Add `speclang downgrade <level>`
- [ ] Add confirmation prompts
- [ ] **Validate:** Manual test

#### Step 6: Write transition tests (60 min)
- [ ] Test upgrade paths
- [ ] Test downgrade paths
- [ ] Test edge cases
- [ ] **Validate:** Tests pass

**Completion Criteria:**
- [ ] Transitions work
- [ ] CLI works
- [ ] Tests pass
- [ ] Update PRD

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
- [ ] Expand specs/ui-dashboard.spec.md
- [ ] Define components
- [ ] Define layouts
- [ ] Add wireframes
- [ ] **Validate:** Spec validates

#### Step 2: Setup UI framework (45 min)
- [ ] Choose framework (React/Vue/etc)
- [ ] Setup build pipeline
- [ ] Add TypeScript support
- [ ] **Validate:** Build works

#### Step 3: Implement layout (60 min)
- [ ] Create main layout
- [ ] Add navigation
- [ ] Add responsive design
- [ ] **Validate:** UI renders

#### Step 4: Implement agent health component (60 min)
- [ ] Create AgentHealth component
- [ ] Add real-time updates
- [ ] Add status indicators
- [ ] **Validate:** Manual test

#### Step 5: Implement cascade graph (90 min)
- [ ] Create CascadeGraph component
- [ ] Add graph visualization
- [ ] Add interactive features
- [ ] **Validate:** Manual test

#### Step 6: Implement log viewer (60 min)
- [ ] Create LogViewer component
- [ ] Add log streaming
- [ ] Add filtering
- [ ] **Validate:** Manual test

#### Step 7: Implement control panel (60 min)
- [ ] Create ControlPanel component
- [ ] Add start/stop controls
- [ ] Add configuration editor
- [ ] **Validate:** Manual test

#### Step 8: Integration tests (60 min)
- [ ] Test all components
- [ ] Test real-time updates
- [ ] Test user interactions
- [ ] **Validate:** Tests pass

**Completion Criteria:**
- [ ] Dashboard renders
- [ ] All components work
- [ ] Real-time updates work
- [ ] Tests pass
- [ ] Update PRD

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
- [ ] Create examples/hello-world/
- [ ] Add hello.spec.md
- [ ] Add generated code
- [ ] Add README
- [ ] **Validate:** Example runs

#### Step 2: Create auth example (90 min)
- [ ] Create examples/auth/
- [ ] Add auth spec
- [ ] Add generated server
- [ ] Add generated client
- [ ] **Validate:** Example runs

#### Step 3: Create CRUD example (90 min)
- [ ] Create examples/crud-app/
- [ ] Add entity specs
- [ ] Add API specs
- [ ] Add UI specs
- [ ] **Validate:** Example runs

#### Step 4: Document examples (45 min)
- [ ] Write example README
- [ ] Add usage instructions
- [ ] Add screenshots
- [ ] **Validate:** Docs reviewed

#### Step 5: Add example tests (45 min)
- [ ] Test each example
- [ ] Verify generated code
- [ ] Verify builds
- [ ] **Validate:** Tests pass

**Completion Criteria:**
- [ ] All examples work
- [ ] Documentation complete
- [ ] Tests pass
- [ ] Update PRD

---

## Phase 8: Tooling (1 story)

### P8-001: Python Tooling Scripts

**Dependencies:** None (already partially complete)
**Target:** scripts/

**Baby Steps:**

#### Step 1: Audit existing scripts (30 min)
- [ ] All Python scripts already exist
- [ ] Verify each script works
- [ ] Identify any gaps
- [ ] **Validate:** Scripts run

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