# SpecLang Development Todo List

## Phase 1: Manual Emulation (Human + AI)
- [x] Review all specs for completeness and correctness
- [x] Fix any remaining file naming issues
- [x] Ensure all headers follow conventions
- [x] Verify all references point to existing IDs
- [x] Create missing implementation specs

## Phase 2: Implementation Specs
- [x] Write OpenCode plugin implementation spec (layer 3+) - NEEDS FIXES
- [x] Write MCP server implementation spec (layer 3+) - NEEDS FIXES
- [x] Write SQLite schema implementation spec (layer 3+)
- [x] Write Ralph Loop implementation spec (layer 3+)
- [x] Write validation system implementation spec (layer 3+)
- [x] Write code generation specs (.go.spec, .ts.spec)

## Phase 2a: Critical Spec Fixes (From Adversarial Review)
- [x] Fix MCP spec header format: Add `lines:N` to mcp.spec.md line 1
- [x] Fix cascade_id requirement: Make cascade_id nullable in events/commands tables OR provide cascade creation flow
- [x] Add missing MCP tools: Define `speclang_query` and `speclang_execute` tools or remove from plugin
- [x] Fix return type contracts: Define queryOne vs queryAll in MCP client (partially fixed search handler)
- [x] Complete HTTP MCP: Add `/mcp/message` endpoint for SSE (placeholder added)
- [x] Fix convergence bug: Check all `processed=0` events, not just unclaimed
- [x] Clear session timers: Add completion path to clear timeouts
- [x] Define ownership lifecycle: When/how is owner_session_id set during indexing
- [x] JSON serialization: Ensure all payload/details/result fields are JSON strings
- [x] Harden git execution: Use spawn() with array args, handle spaces
- [x] Add auth credentials: Plugin config needs token/basic auth for remote mode
- [x] Reconcile file patterns: .scl vs .spec.md mismatch
- [x] Fix naming: change_type vs changeType consistency
- [x] Fix FTS scoring: bm25() vs rank inconsistency
- [x] Handle delete events: Don't hash deleted files

## Phase 3: Code Generation
- [x] Generate OpenCode plugin TypeScript code
- [x] Generate MCP server TypeScript code
- [x] Generate SQLite schema implementation
- [x] Generate Ralph Loop implementation
- [x] Generate validation system
- [x] Generate code generation tools

## Phase 4: Self-Hosting
- [ ] Use generated Speclang to improve itself
- [ ] Run full cascade with generated system
- [ ] Validate meta-circular approach works
- [ ] Create example project to demonstrate system

## Phase 5: Autonomous Agent Readiness

**Goal**: Specs should have enough depth to be used by autonomous agents totally.

**Priority Order**:
1. Semantic Definitions (Task 2) - Foundation for everything else
2. Validation Rules (Task 1) - Ensures quality of autonomous specs
3. Update Existing Specs (Task 6) - Fix current inconsistencies
4. Agent Behavior Matrix (Task 3) - Enables proper agent operation
5. Transition Workflows (Task 4) - Supports project evolution
6. Safety Nets (Task 5) - Prevents system failures
7. Tool Implementation (Task 7) - Automated enforcement
8. Labeling & Protocol Extensions (Tasks 6, 8) - Final consistency
### Task 1: Create Autonomous Validation Rules Spec
- [ ] Create `specs/autonomous-validation.spec.md` with validation criteria
- [ ] Define validation for step-by-step descriptions in operations
- [ ] Define validation for resolved `@ref:` references
- [ ] Define validation for unambiguous natural language
- [ ] Define validation for required metadata fields
- [ ] Integrate with existing validation system

### Task 2: Create Semantic Definitions Spec
- [ ] Create `specs/semantic-definitions.spec.md`
- [ ] Define concrete criteria for each `project_level` (POC → Enterprise)
- [ ] Define complete `layer` mapping (0-10 with concrete examples)
- [ ] Define `agent_support` behavioral expectations
- [ ] Provide examples for each metadata combination

### Task 3: Create Agent Behavior Matrix Spec
- [ ] Create `specs/agent-behavior-matrix.spec.md`
- [ ] Define behavior rules for each `project_level` × `agent_support` combination
- [ ] Define mixed maturity level handling procedures
- [ ] Define fallback protocols for ambiguous situations
- [ ] Define resource allocation rules based on maturity levels

### Task 4: Create Transition Workflows Spec
- [ ] Create `specs/transition-workflows.spec.md`
- [ ] Define checklist for upgrading from `agent_assisted` to `agent_autonomous`
- [ ] Define required reviews, tests, completeness checks for level transitions
- [ ] Define automated validation gates before transitions
- [ ] Define rollback procedures for failed transitions

### Task 5: Create Safety Nets Spec
- [ ] Create `specs/safety-nets.spec.md`
- [ ] Define automated analysis of spec completeness
- [ ] Define peer-review hooks for critical changes
- [ ] Define confidence scoring for autonomous readiness
- [ ] Define fallback to human review when confidence is low

### Task 6: Update Existing Specs for Consistency
- [ ] Update `headers.spec.md` with detailed semantic definitions
- [ ] Update `spec-format.spec.md` with extended layer table (5-10)
- [ ] Update `validation.spec.md` to integrate autonomous validation rules
- [ ] Set appropriate `agent_support` values for all existing specs

### Task 7: Create Validation Tool Implementation
- [ ] Implement Python/TypeScript tool that scans `agent_autonomous` specs
- [ ] Implement checks for step-by-step descriptions
- [ ] Implement reference resolution validation
- [ ] Implement spec completeness scoring
- [ ] Generate validation reports

### Task 8: Create Agent Protocol Extensions
- [ ] Update `agent-protocol.spec.md` with behavior rules based on metadata
- [ ] Define session behavior for different maturity levels
- [ ] Specify ownership transfer during maturity transitions

## Validation Checklist
- [ ] All specs have valid headers
- [ ] All IDs follow @domain/path convention
- [ ] All references resolve to existing IDs
- [ ] File extensions follow conventions (.spec.md, .spec.yaml, .{ext}.spec)
- [ ] Layer values appropriate (0-10) and consistent with content
- [ ] Tags non-empty and meaningful
- [ ] Dependencies correctly specified
- [ ] Generated code compiles without errors
- [ ] All tests pass
- [ ] Integration tests successful
- [ ] Autonomous agent validation:
  - [ ] Specs with `agent_support: agent_autonomous` have step-by-step descriptions
  - [ ] All `@ref:` references resolve to existing blocks
  - [ ] No ambiguous natural language in `agent_autonomous` specs
  - [ ] Required metadata fields present for each maturity level
  - [ ] `project_level` criteria met for each spec
  - [ ] Layer mapping consistent across project
  - [ ] Validation rules defined for each maturity transition

## Phase 6: Adversarial Review Results - 150 Issues Found

### Summary by Severity
- P0 (Critical): ~10 issues - Will break at runtime
- P1 (Major): ~28 issues - Significant problems
- P2 (Minor): ~112 issues - Should fix but not blocking

### Top 10 P0 Blockers (Must Fix Before Implementation)
1. Missing database tables - cascades, file_locks not in schema
2. cascade_id requirement - Required but not provided
3. Missing MCP tools - speclang_query/execute dont exist
4. SQL injection - speclang_query allows arbitrary SQL
5. INSERT OR REPLACE bug - Breaks foreign key relationships
6. Deadlock prevention - No wait-for graph
7. Embeddings failure - No fallback when embedding fails
8. Convergence bug - Ignores claimed events
9. HTTP MCP incomplete - Missing /mcp/message endpoint
10. No reconnection logic - MCP client doesnt retry

### Missing P0 Specs (Must Create)
- layer-definitions.spec.md
- project-maturity-levels.spec.md
- agent-support-levels.spec.md

### Key Integration Issues
- Plugin calls MCP tools that dont exist
- Event schema mismatch between plugin and MCP
- JSON fields need explicit JSON.stringify()
- Git commands need array-based spawn
- Session timeouts need cleanup path

### Next Steps
1. Fix all P0 issues first
2. Create missing P0 specs
3. Run adversarial review again
4. Begin code generation
