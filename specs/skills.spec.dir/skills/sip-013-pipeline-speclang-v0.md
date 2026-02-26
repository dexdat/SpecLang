---
name: sip-013-pipeline-speclang-v0
title: "SIP 13: Pipeline Executor"
version: 0.1.0
description: Build pipeline that runs after convergence
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 13: Pipeline Executor

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the build pipeline that runs after cascade convergence.

### Quick Start

1. **Detect Convergence:** No file changes for N seconds
2. **Read Pipeline:** Load build.yaml from project root
3. **Execute Stages:** Run stages in dependency order
4. **Handle Hooks:** Run pre/post actions
5. **Recover:** Handle failures with rollback/retry

### Example

```yaml
# build.yaml
pipeline:
  on_converge:
    - name: go_build
      run: "go build ./..."
      
    - name: go_test
      run: "go test ./..."
      depends_on: [go_build]
      hooks:
        post_fail: "speclang rollback --last"
```

### Key Concepts

- **Self-Defining:** Pipeline is defined in specs
- **Convergence-Triggered:** Runs after quiet period
- **Dependency-Ordered:** Stages run in correct order
- **Self-Healing:** Recovery strategies on failure

### When to Read This

- **Configuring builds:** How to set up build.yaml
- **Adding hooks:** Pre/post stage actions
- **Handling failures:** Recovery strategies

### Related SIPs

- SIP 7: Cascade System
- SIP 10: Daemon Architecture
- SIP 12: Code Generation

## Abstract

This SIP defines the build pipeline system for SpecLang. The pipeline runs after convergence, executes build stages in dependency order, supports pre/post hooks, and implements recovery strategies for failures.

## Motivation

After the cascade finishes:
- Code needs to be compiled
- Tests need to run
- Linting needs to happen
- Artifacts need to be built

The pipeline orchestrates all post-cascade work.

## Rationale

**Pipeline Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Cascade Converged                        │
│            (no file changes for N seconds)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     Read build.yaml                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Execute Stages                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ install │→ │  build  │→ │  test   │→ │  lint   │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│       ↑            ↑            ↑            ↑             │
│    [pre hook]  [pre hook]  [pre hook]  [pre hook]         │
│       ↓            ↓            ↓            ↓             │
│    [post hook] [post hook] [post hook] [post hook]        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    On Success / Failure                     │
│  Success: commit, notify                                    │
│  Failure: rollback, retry, or abort                        │
└─────────────────────────────────────────────────────────────┘
```

**Benefits:**
- Automated post-cascade work
- Dependency-ordered execution
- Consistent recovery behavior
- Extensible via hooks

## Specification

### Pipeline File

```yaml
PipelineFile:
  name: build.yaml or build.scl or build.spec.yaml
  location: project root
  owner: north star (user's primary AI)
  
  contents:
    - triggers: when to run
    - stages: what to execute
    - hooks: pre/post actions
    - recovery: failure handling
```

### Convergence Detection

```speclang
Convergence:
  description: "How speclangd knows the cascade is done"
  
  signals:
    - quiet_period: no file writes for N seconds
    - all_agents_idle: every agent session reports done
    - max_iterations: safety limit (default 100)
    - user_command: /finalize or /build
    
  default_quiet: 30 seconds
  
  on_converge:
    1. wait for in-flight writes
    2. verify agent states
    3. trigger pipeline
```

### Convergence State Machine

```
stateDiagram-v2
    [*] --> Cascading: file change
    Cascading --> Cascading: more changes
    Cascading --> Quiet: no changes for Ns
    Quiet --> Converged: still quiet
    Quiet --> Cascading: new change
    Converged --> Pipeline: run build
    Pipeline --> [*]: success
    Pipeline --> Recovery: failure
    Recovery --> [*]: handled
```

### Triggers

```yaml
Trigger:
  description: "Conditions that start pipeline stages"
  
  types:
    - on_converge: when all files quiet
    - on_file_pattern: when specific files change
    - on_command: user runs /build or /finalize
    - on_schedule: cron-based (for CI)
    
  conditions:
    - "*.go changed": go files modified
    - "specs/ changed": any spec modified
    - "frontend changed": tsx/js files modified
```

Example triggers:

```yaml
triggers:
  - name: backend_changed
    condition: "generated/go/**/*.go"
    run: [go_build, go_test]
    
  - name: frontend_changed
    condition: "generated/ts/**/*.ts"
    run: [npm_build, npm_test]
    
  - name: specs_changed
    condition: "specs/**/*.scl"
    run: [regenerate, all_tests]
```

### Stages

```yaml
Stage:
  name: String
  run: Command | Command[]
  depends_on: String[]?
  condition: String?
  timeout: Duration?
  retry: Int?

StageResult:
  name: String
  status: success | failed | skipped
  output: String
  duration: Duration
  error: String?
```

Stage ordering:
1. Stages with no depends_on run first (parallel)
2. Stages wait for their dependencies
3. If dependency fails, stage is skipped
4. All stages have implicit timeout (default 5min)

### Hooks

```yaml
Hook:
  description: "Actions before/after stages"
  
  types:
    pre: run before stage
    post: run after stage (success or fail)
    post_success: run only on success
    post_fail: run only on failure
    
  built_in_hooks:
    - speclang_rollback: revert last spec change
    - speclang_notify: send message to north star
    - speclang_log: write to log file
    - speclang_commit: git commit changes
```

Example hooks:

```yaml
- name: test
  run: "go test ./..."
  hooks:
    pre: "echo 'Testing {{count}} files...'"
    post_success: "notify 'All tests passed'"
    post_fail:
      - "speclang rollback --last-spec"
      - "notify 'Tests failed, rolled back'"
```

### Recovery

```yaml
Recovery:
  description: "Self-healing when pipeline fails"
  
  strategies:
    - rollback: revert to last known good spec
    - retry: run stage again (with backoff)
    - skip: mark as known failure, continue
    - abort: stop pipeline, notify user
    
  actions:
    - notify_northstar: message the user's primary session
    - log_failure: record in .speclang/failures/
    - create_issue: open github issue (if configured)
    - revert_commit: git reset --hard HEAD~1
```

Example recovery:

```yaml
recovery:
  max_attempts: 3
  backoff: exponential
  
  on_stage_fail:
    - attempt: retry (with backoff)
    - after_max: rollback spec change
    - then: notify northstar with error details
    
  on_pipeline_fail:
    - log: .speclang/failures/{{timestamp}}.log
    - notify: "Build failed. See {{log_path}}"
    - option: create_issue if user confirms
```

### Per-Target Configuration

```yaml
TargetConfig:
  go:
    output: generated/go/
    build: "go build ./..."
    test: "go test ./..."
    lint: "golangci-lint run"
    
  typescript:
    output: generated/ts/
    build: "npm run build"
    test: "npm test"
    lint: "eslint ."
    
  rust:
    output: generated/rs/
    build: "cargo build"
    test: "cargo test"
    lint: "cargo clippy"
    
  python:
    output: generated/py/
    build: "pip install -e ."
    test: "pytest"
    lint: "ruff check ."
```

### Output

```yaml
PipelineOutput:
  artifacts:
    - binaries: compiled executables
    - docker: container images
    - packages: npm/cargo/pypi packages
    
  reports:
    - test_results: .speclang/test-results.json
    - coverage: .speclang/coverage/
    - build_log: .speclang/build.log
    
  notifications:
    - console: stdout/stderr
    - northstar: message to user's AI session
    - webhook: POST to configured URL
```

## Full Example

```yaml
# build.yaml - complete example
convergence:
  quiet_period: 30s
  max_iterations: 100

pipeline:
  on_converge:
    - name: detect_changes
      run: "speclang diff --json"
      
    - name: go_mod
      run: "go mod tidy"
      condition: "go files changed"
      
    - name: go_build
      run: "go build ./..."
      depends_on: [go_mod]
      
    - name: go_test
      run: "go test ./... -coverprofile=coverage.out"
      depends_on: [go_build]
      hooks:
        post_fail: "speclang rollback --last"
        
    - name: npm_install
      run: "npm ci"
      condition: "ts files changed"
      
    - name: npm_build
      run: "npm run build"
      depends_on: [npm_install]
      
    - name: npm_test
      run: "npm test"
      depends_on: [npm_build]
      hooks:
        post_fail: "speclang rollback --last"

  on_success:
    - "git add -A"
    - "git commit -m 'speclang: build complete'"
    - "echo '✅ Ready to ship'"

recovery:
  max_attempts: 3
  on_fail:
    - rollback: last_spec_change
    - notify: northstar
    - log: .speclang/failures.log
```

## References

- @ref:specs/pipeline - Pipeline spec (parent)
- @ref:specs/pipeline.spec.dir/build - Core stages
- @ref:specs/pipeline.spec.dir/hooks - Hook system
- @ref:specs/pipeline.spec.dir/recovery - Recovery strategies
- SIP 7: Cascade System
- SIP 10: Daemon Architecture
- SIP 12: Code Generation

## Copyright

This document is in the public domain.
