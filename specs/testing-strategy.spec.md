# speclang-header lines:8
id: "@speclang/testing-strategy"
version: 0.1.0
layer: 1
tags: [testing, strategy, verification, quality, maturity]
project_level: Alpha
agent_support: agent_autonomous
short: "Testing Strategy - Comprehensive approach to verifying SpecLang"
---

# Testing Strategy

**Comprehensive testing approach for SpecLang - from unit tests to full cascade integration.**

## Overview

```speclang
# @block:testing-strategy/overview @kind:entity
TestingStrategy:
  philosophy: "Test at every level, automate everything"
  
  levels:
    1. unit: Individual functions and components
    2. integration: Component interactions
    3. cascade: Full reactive loop
    4. agent: Agent behavior verification
    5. end_to_end: Complete user workflows
    
  automation:
    - All tests run in CI/CD
    - Tests run after every cascade
    - Coverage enforced by maturity level
    - Failed tests block deployment
```

## Test Categories

### @testing-strategy/categories

```speclang
# @block:testing-strategy/categories @kind:entity
TestCategories:
  
  unit_tests:
    purpose: "Verify individual functions work correctly"
    location: "src/**/*.test.ts"
    framework: "Jest"
    coverage_target: "80%"
    examples:
      - "Parser extracts header correctly"
      - "Reference resolver finds all @ref: targets"
      - "Block extractor handles multi-line blocks"
      
  integration_tests:
    purpose: "Verify components work together"
    location: "tests/integration/**/*.test.ts"
    framework: "Jest"
    coverage_target: "70%"
    examples:
      - "Parser + Validator: Parse then validate spec"
      - "Daemon + Queue: File change triggers queue update"
      - "Agent + Guard: Agent writes only owned files"
      
  cascade_tests:
    purpose: "Verify reactive loop works end-to-end"
    location: "tests/cascade/**/*.test.ts"
    framework: "Jest + Mock File System"
    coverage_target: "60%"
    examples:
      - "File change → agent reaction → convergence"
      - "Build failure → orchestrator recovery → success"
      - "Infinite loop → detection → termination"
      
  agent_tests:
    purpose: "Verify agents produce correct output"
    location: "tests/agents/**/*.test.ts"
    framework: "Jest + AI Mocking"
    coverage_target: "50%"
    examples:
      - "spec-writer creates valid spec from input"
      - "code-gen generates compiling TypeScript"
      - "test-writer creates passing tests"
      
  e2e_tests:
    purpose: "Verify complete user workflows"
    location: "tests/e2e/**/*.test.ts"
    framework: "Jest + Real File System"
    coverage_target: "40%"
    examples:
      - "Hello World cascade completes successfully"
      - "Auth module cascade generates working code"
      - "Full project bootstrap and generation"
```

## Test Coverage Requirements by Maturity

### @testing-strategy/coverage-requirements

```speclang
# @block:testing-strategy/coverage-requirements @kind:entity
CoverageByMaturity:
  
  POC:
    unit: 50%
    integration: 30%
    cascade: 20%
    agent: 10%
    e2e: 0%
    description: "Minimal testing, prove concept works"
    
  MVP:
    unit: 60%
    integration: 40%
    cascade: 30%
    agent: 20%
    e2e: 10%
    description: "Core functionality tested"
    
  Alpha:
    unit: 70%
    integration: 50%
    cascade: 40%
    agent: 30%
    e2e: 20%
    description: "Internal testing ready"
    
  Beta:
    unit: 80%
    integration: 60%
    cascade: 50%
    agent: 40%
    e2e: 30%
    description: "External testing ready"
    
  Production:
    unit: 90%
    integration: 70%
    cascade: 60%
    agent: 50%
    e2e: 40%
    description: "Production ready"
    
  Enterprise:
    unit: 95%
    integration: 80%
    cascade: 70%
    agent: 60%
    e2e: 50%
    description: "Compliance ready"
```

## Cascade Testing Strategy

### @testing-strategy/cascade-testing

```speclang
# @block:testing-strategy/cascade-testing @kind:entity
CascadeTesting:
  
  challenge: "Cascade is reactive and timing-dependent"
  
  approach:
    mock_filesystem:
      description: "Use in-memory filesystem for deterministic tests"
      tools: ["memfs", "unionfs"]
      benefits:
        - Fast execution
        - Deterministic timing
        - No file pollution
        
    mock_agents:
      description: "Mock agent responses for predictable testing"
      tools: ["jest.mock", "test doubles"]
      benefits:
        - Isolate cascade logic
        - Control agent outputs
        - Test error handling
        
    time_control:
      description: "Control time for convergence detection"
      tools: ["jest.useFakeTimers", "sinon"]
      benefits:
        - Fast-forward convergence
        - Test timeout handling
        - No real waiting
        
  test_scenarios:
    happy_path:
      name: "Simple cascade completes"
      steps:
        1. Create spec file
        2. Verify agent triggered
        3. Verify output file created
        4. Advance time 30 seconds
        5. Verify convergence detected
      expected: "Cascade completes successfully"
      
    build_failure:
      name: "Build failure triggers rollback"
      steps:
        1. Create spec that generates invalid code
        2. Verify cascade runs
        3. Verify build fails
        4. Verify rollback triggered
        5. Verify human notified
      expected: "System rolls back and notifies"
      
    infinite_loop:
      name: "Infinite cascade detection"
      steps:
        1. Create spec that always triggers cascade
        2. Verify cascade starts
        3. Verify depth counter increments
        4. Verify cascade stops at max_depth
        5. Verify error reported
      expected: "Cascade stops and reports error"
```

## Agent Testing Strategy

### @testing-strategy/agent-testing

```speclang
# @block:testing-strategy/agent-testing @kind:entity
AgentTesting:
  
  challenge: "Agents use AI which is non-deterministic"
  
  approach:
    golden_files:
      description: "Compare agent output to expected golden files"
      process:
        1. Provide known input
        2. Capture agent output
        3. Compare to golden file
        4. Fail if differs significantly
      tolerance: "Minor formatting differences allowed"
      
    contract_testing:
      description: "Verify agent output matches expected schema"
      checks:
        - Output file has valid header
        - All required fields present
        - References resolve correctly
        - Code compiles (for code-gen)
        
    behavior_testing:
      description: "Verify agent behavior patterns"
      checks:
        - Agent only writes owned files
        - Agent reads dependencies correctly
        - Agent handles errors gracefully
        - Agent produces valid commits
        
  test_fixtures:
    spec_writer_input:
      file: "tests/fixtures/spec-writer-input.spec.md"
      description: "Simple spec for spec-writer to expand"
      
    code_gen_input:
      file: "tests/fixtures/code-gen-input.ts.spec"
      description: "Code mapping spec for code-gen"
      
    test_writer_input:
      file: "tests/fixtures/test-writer-input.spec.md"
      description: "Spec with operations to test"
```

## Test Execution Strategy

### @testing-strategy/execution

```speclang
# @block:testing-strategy/execution @kind:entity
TestExecution:
  
  local_development:
    command: "npm test"
    what_runs:
      - All unit tests
      - Fast integration tests
    what_skips:
      - Slow e2e tests
      - AI-dependent tests
    time: "< 30 seconds"
    
  pre_commit:
    command: "npm run test:quick"
    what_runs:
      - Unit tests for changed files
      - Related integration tests
    what_skips:
      - Full test suite
    time: "< 10 seconds"
    
  post_cascade:
    command: "npm run test:cascade"
    what_runs:
      - Generated code tests
      - Integration tests for changed components
    what_skips:
      - Unrelated tests
    time: "Depends on cascade scope"
    
  ci_pipeline:
    stages:
      1. lint: "npm run lint" (30s)
      2. unit: "npm run test:unit" (60s)
      3. integration: "npm run test:integration" (120s)
      4. cascade: "npm run test:cascade" (180s)
      5. e2e: "npm run test:e2e" (300s)
    total_time: "~12 minutes"
    
  coverage_check:
    command: "npm run test:coverage"
    enforcement:
      - Block PR if coverage drops
      - Require coverage target by maturity level
      - Generate coverage report for review
```

## Test Data Management

### @testing-strategy/test-data

```speclang
# @block:testing-strategy/test-data @kind:entity
TestDataManagement:
  
  fixtures:
    location: "tests/fixtures/"
    contents:
      - specs/ - Sample spec files
      - generated/ - Expected generated code
      - golden/ - Golden files for comparison
      
  test_specs:
    purpose: "Real specs used for testing"
    location: "tests/fixtures/specs/"
    examples:
      - "minimal.spec.md" - Simplest valid spec
      - "complex.spec.md" - Spec with many references
      - "invalid.spec.md" - Spec with known errors
      
  mock_responses:
    purpose: "Mock AI responses for deterministic testing"
    location: "tests/mocks/"
    examples:
      - "spec-writer-response.json"
      - "code-gen-response.json"
      - "test-writer-response.json"
```

## Quality Gates

### @testing-strategy/quality-gates

```speclang
# @block:testing-strategy/quality-gates @kind:entity
QualityGates:
  
  pre_merge:
    - All unit tests pass
    - All integration tests pass
    - Coverage meets maturity target
    - No new TypeScript errors
    - No new lint warnings
    
  pre_deploy:
    - All cascade tests pass
    - All e2e tests pass
    - Generated code compiles
    - Generated tests pass
    - Security scan passes
    
  continuous:
    - Monitor test flakiness
    - Track coverage trends
    - Alert on test failures
    - Weekly test health report
```

## Testing Best Practices

### @testing-strategy/best-practices

```speclang
# @block:testing-strategy/best-practices @kind:note
Best Practices for SpecLang Testing:

1. ISOLATE TESTS
   - Each test should be independent
   - Use beforeEach/afterEach for setup/cleanup
   - Mock external dependencies

2. USE DESCRIPTIVE NAMES
   - test('greet returns personalized greeting', ...)
   - NOT: test('works', ...)

3. TEST EDGE CASES
   - Empty input
   - Missing fields
   - Circular references
   - Unicode in specs

4. MOCK FILE SYSTEM
   - Don't write to real files in tests
   - Use memfs or similar
   - Clean up after tests

5. CONTROL TIME
   - Use fake timers for convergence tests
   - Don't use real timeouts
   - Fast-forward when possible

6. VERIFY COMMITS
   - Check commit messages are correct
   - Verify parent hash is set
   - Check file changes are as expected

7. TEST ERROR PATHS
   - What happens when AI fails?
   - What happens on network error?
   - What happens on invalid input?

8. KEEP TESTS FAST
   - Unit tests < 100ms each
   - Integration tests < 1s each
   - Full suite < 5 minutes
```

## Test Commands Reference

### @testing-strategy/commands

```speclang
# @block:testing-strategy/commands @kind:table
| Command | Purpose | Time |
|---------|---------|------|
| npm test | Run all fast tests | < 30s |
| npm run test:unit | Run unit tests only | < 10s |
| npm run test:integration | Run integration tests | < 60s |
| npm run test:cascade | Run cascade tests | < 120s |
| npm run test:e2e | Run e2e tests | < 300s |
| npm run test:coverage | Run with coverage report | < 60s |
| npm run test:watch | Watch mode for development | - |
| npm run test:debug | Debug mode with logs | - |
```

## References

- "@ref:specs/test-specs - Test spec format"
- @ref:specs/validation - Validation system
- @ref:specs/cascade.spec.dir/error-handling - Error handling
- @ref:specs/project-maturity-levels - Maturity levels
- @ref:specs/pipeline - Build pipeline