# speclang-header lines:10
id: "@speclang/core/file-types"
version: 0.1.0
layer: 2
project_level: "Alpha"
agent_support: "agent_autonomous"
tags: [core]
short: "Spec file types: spec-file, test-spec, generated-file"
parent: ""@ref:speclang/corepart: 3/6
---

## File Types

### @speclang/spec-file

```speclang
# @block:speclang/spec-file @kind:entity
SpecFile:
  extension: .scl
  format: header + blocks
  purpose: describe what to build
  
  kinds:
    - feature.spec.scl: entities, operations
    - test.spec.scl: natural language tests
    - config.spec.scl: configuration
    - northstar.scl: top-level intent
```

### @speclang/test-spec

```speclang
# @block:speclang/test-spec @kind:entity
TestSpec:
  description: "Tests written as specs in natural language"
  
  format:
    # @block:tests/auth.login @kind:test
    Test: User can log in with valid credentials
    
    Given: user exists with email "test@example.com"
    And: password is "secret123"
    When: login is called
    Then: returns success with valid token
    And: session is created
    
    TargetFile: tests/auth.test.go
    Refs: [@ref:specs/auth#login]
```

### @speclang/generated-file

```speclang
# @block:speclang/generated-file @kind:entity
GeneratedFile:
  description: "Output code in target language"
  
  markers:
    // SPECLANG-ID: @ref:specs/auth#login
    // SPECLANG-NORTHSTAR: @ref:northstar#auth
    // SPECLANG-VERSION: 1.0.0
    // SPECLANG-GENERATED: DO NOT EDIT
    
  back_sync:
    - if human edits, BackSyncAgent proposes spec update
    - bidirectional integrity maintained
```