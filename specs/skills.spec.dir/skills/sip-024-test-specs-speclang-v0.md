---
name: sip-024-test-specs-speclang-v0
title: "SIP 24: Test Specs"
version: 0.1.0
description: Tests written as specs in natural language with Given/When/Then syntax
category: standard
---
# speclang-header lines:84
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 24: Test Specs

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines how tests are written as first-class specs using natural language.

### Quick Start

Test specs use Given/When/Then syntax:
1. **Given**: Preconditions and setup
2. **When**: The action being tested
3. **Then**: Expected outcomes

### When to Read This

- **Writing test specs:** Creating natural-language tests
- **Generating test code:** Converting specs to executable tests
- **Understanding BDD:** How SpecLang handles behavior specs

### Related SIPs

- SIP 12: Code Generation
- SIP 13: Pipeline System
- SIP 25: Skills Pack (TestWriter)

## Abstract

This SIP defines Test Specs—tests written as first-class specification files using natural language Given/When/Then syntax. Test specs bridge the gap between requirements and executable tests, allowing TestWriter agents to generate test code while keeping tests synchronized with specs.

## Motivation

Traditional tests are separate from specs:
- Tests diverge from requirements over time
- Manual test maintenance is error-prone
- Non-technical stakeholders can't read tests
- Test intent is hidden in code

Test specs solve this by making tests part of the specification system.

## Rationale

**Tests as Specs:**

1. **Single source of truth**: Test intent lives in specs
2. **Auto-generated tests**: TestWriter converts to code
3. **Always in sync**: Spec changes cascade to tests
4. **Readable**: Non-developers understand Given/When/Then

This follows BDD (Behavior-Driven Development) principles.

## Specification

### Test Spec Format

```yaml
TestSpecFormat:
  file_location: "tests/**/*.test.spec.md"
  header:
    id: "@tests/<feature>"
    version: semver
    layer: 10+ (test layer)
    target: "path/to/test/file"
    
  content_structure:
    - Feature description
    - Scenario blocks with Given/When/Then
    - Examples/parameters
    
  example: |
    # speclang-header lines:12
    id: "@tests/auth/login"
    version: 1.0.0
    layer: 10
    target: "tests/auth/login.test.ts"
    ---
    
    # Login Test Spec
    
    ## Successful Login
    
    ### @test:login-success
    Given a registered user with email "user@example.com"
    And a valid password "correct-password"
    When the user submits the login form
    Then the response status should be 200
    And the response should contain a JWT token
    And the token should expire in 24 hours
```

### Given/When/Then Syntax

```yaml
GivenWhenThen:
  given:
    purpose: "Establish preconditions"
    patterns:
      - "Given a <entity> with <attribute>"
      - "Given the system is in <state>"
      - "Given <condition>"
    supports:
      - "And" for additional preconditions
      
  when:
    purpose: "Describe the action"
    patterns:
      - "When the user <action>"
      - "When the system <action>"
      - "When <action> is performed"
    supports:
      - Multiple actions with "And"
      
  then:
    purpose: "Verify outcomes"
    patterns:
      - "Then the response should be <expected>"
      - "Then <entity> should have <attribute>"
      - "Then <condition> should be true"
    supports:
      - "And" for additional assertions
      - Negative assertions: "should not"
```

### Scenario Blocks

```yaml
ScenarioBlock:
  block_kind: "@test:<scenario-name>"
  
  structure:
    - Optional: Description
    - Required: Given/When/Then steps
    - Optional: Examples table
    
  example: |
    ### @test:login-invalid-password
    
    Scenario: Login with wrong password
    
    Given a registered user with email "user@example.com"
    When the user submits password "wrong-password"
    Then the response status should be 401
    And the error message should be "Invalid credentials"
    And no JWT token should be returned
```

### Examples Tables

```yaml
ExamplesTable:
  purpose: "Parameterize scenarios with multiple inputs"
  
  format:
    pipe_separated: |
      Examples:
      | email | password | expected_status |
      | user@example.com | correct | 200 |
      | user@example.com | wrong | 401 |
      | unknown@example.com | any | 404 |
      
  usage:
    - Reference columns in Given/When/Then
    - TestWriter generates one test per row
    
  example: |
    ### @test:login-multiple
    
    Given a user with email "<email>"
    When login is attempted with password "<password>"
    Then the status should be <expected_status>
    
    Examples:
    | email | password | expected_status |
    | user@test.com | valid | 200 |
    | user@test.com | invalid | 401 |
    | unknown@test.com | any | 404 |
```

### Test Spec Header Fields

```yaml
TestSpecHeader:
  required:
    id: "@tests/<path>"
    version: "X.Y.Z"
    
  test_specific:
    target:
      description: "Path where generated test code will be written"
      example: "tests/auth/login.test.ts"
      
    test_framework:
      description: "Testing framework to use"
      values: ["pytest", "jest", "go-test", "rs-test"]
      
    coverage_target:
      description: "Minimum coverage percentage"
      example: 80
      
  references:
    spec_under_test:
      description: "The spec being tested"
      format: ""@ref:specs/<path>"```

### Test Generation

```yaml
TestGeneration:
  trigger: "Test spec changes"
  agent: "TestWriter"
  
  process:
    1_parse: "Parse Given/When/Then steps"
    2_map: "Map natural language to test code"
    3_generate: "Generate test file"
    4_run: "Execute tests"
    5_report: "Report results back to spec"
    
  mapping_rules:
    given: "Setup/arrange code"
    when: "Act/execute code"
    then: "Assertions"
    
  output:
    location: "As specified in 'target' field"
    format: "Framework-specific test file"
```

### Test Results Feedback

```yaml
TestResultsFeedback:
  flow:
    - Tests are executed
    - Results written back to spec
    - Spec shows pass/fail status
    
  format: |
    ### @test:login-success
    > Status: PASSING
    > Last run: 2024-01-15T10:30:00Z
    > Duration: 45ms
    
    Given a registered user...
    
  failure_format: |
    ### @test:login-invalid-password
    > Status: FAILING
    > Last run: 2024-01-15T10:30:00Z
    > Error: Expected 401, got 500
    > Stack trace in: .speclang/test-logs/test-001.log
    
    Given a registered user...
```

## Examples

### Example 1: Basic Test Spec

```yaml
spec: tests/auth/login.test.spec.md

# speclang-header lines:12
id: "@tests/auth/login"
version: 1.0.0
layer: 10
target: "tests/auth/login.test.ts"
spec_under_test: "@ref:specs/auth"

# Login Tests

## Successful Login

### @test:login-success
Given a registered user with email "test@example.com"
And password "valid-password"
When the user logs in
Then the response should be 200
And a JWT token should be returned

## Failed Login

### @test:login-wrong-password
Given a registered user with email "test@example.com"
When the user logs in with password "wrong"
Then the response should be 401
And the error should be "Invalid credentials"
```

### Example 2: Parameterized Test Spec

```yaml
spec: tests/validation/email.test.spec.md

# speclang-header lines:12
id: "@tests/validation/email"
version: 1.0.0
layer: 10
target: "tests/validation/email.test.ts"
---

# Email Validation Tests

### @test:email-validation

Given an email input "<email>"
When validation is performed
Then the result should be <valid>

Examples:
| email | valid |
| user@example.com | true |
| invalid-email | false |
| @missing-local.com | false |
| spaces in@email.com | false |
```

### Example 3: Integration Test Spec

```yaml
spec: tests/integration/order.test.spec.md

# speclang-header lines:14
id: "@tests/integration/order"
version: 1.0.0
layer: 11
target: "tests/integration/order.test.ts"
test_framework: "jest"
---

# Order Integration Tests

### @test:complete-order-flow

Given a user with ID "user-123"
And a product with ID "prod-456" priced at $29.99
And the user has a valid payment method
When the user places an order for the product
Then an order should be created
And the user should be charged $29.99
And inventory should be decremented
And a confirmation email should be sent
```

## Implementation

```python
class TestSpecParser:
    def __init__(self, spec_path: str):
        self.spec_path = spec_path
        
    def parse_scenario(self, block_content: str) -> Scenario:
        lines = block_content.strip().split('\n')
        given_steps = []
        when_steps = []
        then_steps = []
        examples = []
        
        current_section = None
        
        for line in lines:
            line = line.strip()
            if line.startswith('Given'):
                current_section = 'given'
                given_steps.append(self.parse_step(line))
            elif line.startswith('When'):
                current_section = 'when'
                when_steps.append(self.parse_step(line))
            elif line.startswith('Then'):
                current_section = 'then'
                then_steps.append(self.parse_step(line))
            elif line.startswith('And') and current_section:
                step = self.parse_step(line.replace('And', current_section.capitalize()))
                {'given': given_steps, 'when': when_steps, 'then': then_steps}[current_section].append(step)
            elif line.startswith('|'):
                examples.append(self.parse_example_row(line))
                
        return Scenario(
            given=given_steps,
            when=when_steps,
            then=then_steps,
            examples=examples
        )
        
    def generate_test(self, scenario: Scenario, framework: str) -> str:
        generator = self.get_generator(framework)
        return generator.generate(scenario)
```

## References

- "@ref:speclang/test-specs
- @ref:speclang/test-specs/format
- @ref:speclang/skills (TestWriter)
- SIP 12: Code Generation
- SIP 13: Pipeline System

## Copyright

This document is in the public domain.
