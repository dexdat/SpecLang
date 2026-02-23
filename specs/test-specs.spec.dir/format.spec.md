# speclang-header lines:11
id: "@speclang/test-specs/format"
version: 0.1.0
layer: 2
tags: [tests, bdd, natural-language, format]
imports: ["@speclang/core"]
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Test Spec Format
---
# Test Spec Format

Part 1 of 2: Format and structure definitions. See also @ref:speclang/test-specs/examples for concrete examples.



## Test Spec Format

### @tests/format

```speclang
# @block:tests/format @kind:entity
TestSpec:
  file: tests/{feature}.test.spec.scl
  header: standard speclang header
  
  blocks:
    - Test: name/description
    - Given: preconditions
    - When: action
    - Then: expected outcome
    - And: additional conditions/assertions
    - Refs: what code this tests
```

---

## Block Types

### @tests/block-types

```speclang
# @block:tests/block-types @kind:entity
TestBlockKinds:
  @kind:test: main test definition
  
  Within a test block:
  Test:    what we're testing (required, first)
  Given:   setup/preconditions
  When:    action being tested
  Then:    expected result
  And:     additional conditions (follows Given/When/Then)
  But:     negative conditions
  Where:   parameterized test data (table)
```

---

## Test Targets

### @tests/targets

```speclang
# @block:tests/targets @kind:entity
TestTargets:
  generated alongside code, matching language
  
  Go:
    tests/auth_test.go
    uses: testing package
    
  TypeScript:
    tests/auth.test.ts
    uses: jest or vitest
    
  Python:
    tests/test_auth.py
    uses: pytest
    
  Rust:
    tests/auth.rs
    uses: built-in #[test]
```

---

## Test Results

### @tests/results

```speclang
# @block:tests/results @kind:entity
TestResults:
  written_to: reports/tests/
  format: JSON + HTML
  
  status:
    - pending: not yet run
    - passed: all assertions passed
    - failed: one or more failures
    - skipped: intentionally skipped
    
  location:
    - reports/tests/{test-id}.json
    - reports/tests/index.html
    - reports/tests/summary.json
    
  no_cascade:
    - reports/ is in .gitignore + watcher ignore
    - test results never trigger new cascades
    - prevents infinite loop: test → result → test → result
    
  view_results:
    - speclang test --report  # Show last results
    - speclang test --watch   # Watch mode (separate)
```

---

## Test Categories

### @tests/categories

```speclang
# @block:tests/categories @kind:entity
TestCategories:
  unit: single function/component
  integration: multiple components
  e2e: full system flow
  performance: speed/throughput
  security: auth/injection/etc
  
  declared via header:
  # speclang-header
  id: @tests/auth.login
  category: unit
```

---

## Mocking

### @tests/mocking

```speclang
# @block:tests/mocking @kind:entity
Mocking:
  external dependencies declared in test
  
  Mock blocks:
  # @block:tests/mock-email @kind:mock
  Mock: EmailService
  Returns:
    - send(): always succeeds
    - lastSent: captures last email
  
  Usage:
  Given: EmailService is mocked with @ref:tests/mock-email
```

---

## Test Agent Behavior

### @tests/agent

```speclang
# @block:tests/agent @kind:entity
TestAgent:
  on test spec change:
    1. parse test blocks
    2. generate test code
    3. run tests
    4. annotate spec with results
    
  on code change:
    1. find affected tests (via refs)
    2. re-run those tests
    3. update results
    
  failure handling:
    - if test fails, mark in spec
    - don't block other tests
    - collect all failures
    - report summary to user
```

---

## Test Discovery

### @tests/discovery

```speclang
# @block:tests/discovery @kind:operation
discover_tests(code_file: Path) -> TestSpec[]:
  1. parse code file for SPECLANG-ID markers
  2. extract @ref:tests/... references
  3. load those test specs
  4. return list
  
Used when:
  - code changes, need to re-run tests
  - showing test coverage
  - finding orphaned code
```

---

## Coverage

### @tests/coverage

```speclang
# @block:tests/coverage @kind:entity
Coverage:
  tracked at spec level
  
  metrics:
    - blocks_with_tests: blocks that have test refs
    - blocks_without_tests: need tests
    - coverage_percent: with/total
    
  report:
    speclang coverage
    
    specs/auth.scl:
      entity User: covered (3 tests)
      operation login: covered (4 tests)
      operation register: NOT COVERED
      policy AuthPolicy: covered (2 tests)
    
    Coverage: 75% (3/4 blocks)
```