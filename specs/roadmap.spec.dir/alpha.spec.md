# speclang-header lines:19
id: "@speclang/roadmap/alpha"
parent: ""@ref:specs/roadmap"version: 1.0.0
layer: 1
target: specs/roadmap.spec.dir/alpha.spec.dir/
short: "Alpha phase: End-to-end workflow with pipeline"
project_level: Alpha
agent_support: agent_autonomous
tags: [roadmap, alpha, phase-3, pipeline, validation]
children:
  - ""@ref:specs/roadmap.spec.dir/alpha.spec.dir/pipeline-executor"  - ""@ref:specs/roadmap.spec.dir/alpha.spec.dir/build-system"  - ""@ref:specs/roadmap.spec.dir/alpha.spec.dir/test-integration"  - ""@ref:specs/roadmap.spec.dir/alpha.spec.dir/recovery-system"depends_on:
  - "@speclang/roadmap/mvp"
  - "@speclang/pipeline"
  - "@speclang/validation"
---

# Alpha Phase: Internal Testing

**Goal**: Complete end-to-end workflow from spec change to deployed application.

## User Story

> As a developer, when I commit a spec change, the system automatically builds, tests, and validates the code, reporting success or failure within minutes.

## Technical Requirements

### 1. Pipeline Executor (P4-001)

**Must Have:**
- [ ] Stage-based pipeline (build → test → validate → deploy)
- [ ] Conditional execution
- [ ] Parallel stage execution
- [ ] Artifact passing between stages

**Implementation:**
- YAML pipeline definitions
- Directed acyclic graph (DAG) for dependencies
- SQLite for pipeline state

### 2. Build System (P4-006, P4-010)

**Must Have:**
- [ ] TypeScript compilation
- [ ] Dependency resolution
- [ ] Incremental builds
- [ ] Build caching

**Implementation:**
- Integration with npm/tsc
- Watch mode for development
- Cache in `.speclang/build/`

### 3. Test Integration (P4-011)

**Must Have:**
- [ ] Unit test execution
- [ ] Test result reporting
- [ ] Coverage tracking
- [ ] Fail cascade on test failure

**Implementation:**
- Vitest integration
- Test specs in `tests/`
- Coverage reports

### 4. Recovery System (P4-003, P4-007)

**Must Have:**
- [ ] Automatic rollback on failure
- [ ] Error classification (transient vs permanent)
- [ ] Retry with backoff
- [ ] Human escalation

**Implementation:**
- Git-based rollback
- Error classification logic
- MCP message to human on unresolved errors

## Acceptance Criteria

✅ **Pipeline Execution**
```
Given: Convergence detected
When: Pipeline triggers
Then: Build → Test → Validate stages execute
```

✅ **Build Success**
```
Given: Valid TypeScript generated
When: Build stage runs
Then: Code compiles without errors
```

✅ **Test Failure Recovery**
```
Given: Tests fail
When: Pipeline detects failure
Then: Cascade rolls back to last known good state
```

✅ **Error Reporting**
```
Given: Pipeline fails
When: Error occurs
Then: Detailed error reported to human via MCP
```

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Pipeline duration | < 5 min | End-to-end execution |
| Build success rate | > 90% | % of builds that pass |
| Test pass rate | > 95% | % of test runs passing |
| Recovery success | > 80% | % of failures auto-recovered |

## Timeline

**Week 1-2**: Pipeline executor + build system
**Week 3-4**: Test integration
**Week 5-6**: Recovery system + error handling

**Target**: 6 weeks from MVP completion

## Definition of Done

Alpha is complete when:
- [ ] Full pipeline executes automatically
- [ ] Build and test integrated
- [ ] Recovery working for common failures
- [ ] Internal team can use for real work

---

**Previous**: [MVP](mvp.spec.md) | **Next**: [Beta](beta.spec.md)
