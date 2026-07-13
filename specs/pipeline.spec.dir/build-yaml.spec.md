# speclang-header lines:9
id: "@speclang/pipeline-spec-dir/build-yaml-spec"
version: 0.1.0
layer: 2
tags: [pipeline, build.yaml, workflow, steps, tool-chaining]
parent: ""@ref:specs/pipelineproject_level: Alpha
agent_support: agent_autonomous
short: "Build YAML - Workflow steps that chain tool calls together"
---

# Build YAML - Workflow Definition

**The build.yaml defines tool calls that chain together with error handling, retries, and recovery logic.**

This is what runs after AI agents finish writing code. The build controls the loop, flow, testing, and validation.

## Overview

```speclang
# @block:build-yaml/overview @kind:note
The build.yaml:

1. IS a makefile replacement - chains tool calls
2. IS NOT code - it's a workflow definition
3. IS self-describing - specs can modify it
4. IS runnable after AI finishes

Core concepts:
- STEPS: Individual tool calls
- CHAINS: Steps connected together
- FLOWS: Conditional execution paths
- HANDLERS: Error handling and retry
- TARGETS: Make-compatible targets
```

## Build Configuration File

### @build-yaml/file-structure

```speclang
# @block:build-yaml/file-structure @kind:entity
BuildFile:
  location: "project root"
  name: "build.yaml" or "build.scl" or ".speclang/build.yaml"
  
  sections:
    - targets: Named workflows (like make targets)
    - steps: Tool calls to execute
    - flows: Execution order and conditions
    - handlers: Error handling and retry logic
    - pipeline: Sequencing and dependencies
```

## Example Build File

### @build-yaml/example

```yaml
# build.yaml - Pipeline configuration
# This runs after AI agents finish writing code

targets:
  # Like make targets, but with tool chaining
  build:
    description: "Build generated code"
    flow: [install, compile, lint]
    
  test:
    description: "Run all tests"
    flow: [build, test-unit, test-integration]
    
  lint:
    description: "Check code quality"
    flow: [compile, lint-check]
    
  full:
    description: "Complete pipeline"
    flow: [build, test, lint]
    on_success: [notify]
    on_failure: [rollback, notify]

steps:
  # Individual tool calls
  install:
    tool: "go"
    args: ["mod", "tidy"]
    description: "Install Go dependencies"
    timeout: 60s
    retry: 2
    on_failure: abort
    
  install-npm:
    tool: "npm"
    args: ["ci"]
    condition: "package.json changed"
    
  compile:
    tool: "go"
    args: ["build", "-v", "./..."]
    depends_on: [install]
    description: "Build Go code"
    timeout: 300s
    
  compile-npm:
    tool: "npm"
    args: ["run", "build"]
    depends_on: [install-npm]
    description: "Build TypeScript code"
    timeout: 300s
    
  test-unit:
    tool: "go"
    args: ["test", "-v", "./...", "-count=1"]
    depends_on: [compile]
    timeout: 300s
    parallel: true
    
  test-npm:
    tool: "npm"
    args: ["test"]
    depends_on: [compile-npm]
    timeout: 300s
    
  lint-check:
    tool: "golangci-lint"
    args: ["run", "-v"]
    depends_on: [compile]
    
  lint-npm:
    tool: "npm"
    args: ["run", "lint"]
    depends_on: [compile-npm]
    
  generate-index:
    tool: "python3"
    args: ["generate_index.py"]
    description: "Rebuild spec index"
    
  notify:
    tool: "speclang-notify"
    args: ["success", "Build complete"]
    
  rollback:
    tool: "speclang-rollback"
    args: ["--last-spec"]
    description: "Rollback failed cascade"

handlers:
  # Error handling, retries, recovery
  compile:
    retry: 3
    backoff: exponential
    on_failure: [notify-failure]
    
  test-unit:
    retry: 1
    on_failure: [rollback, notify-failure]
    timeout: 300s
    
  lint-check:
    retry: 0
    on_failure: [notify-failure]
    timeout: 60s

  test-npm:
    retry: 1
    on_failure: [rollback, notify-failure]

# Default pipeline when converged
default_target: "full"
```

## Step Definition

### @build-yaml/step

```speclang
# @block:build-yaml/step @kind:entity
Step:
  name: String               # Unique step ID
  tool: String               # Tool to execute (go, npm, make, etc.)
  args: String[]             # Arguments to pass
  description: String?       # Human-readable description
  depends_on: String[]?      # Steps that must complete first
  condition: String?         # When to run (file pattern, env var, etc.)
  timeout: Duration?         # Max execution time
  retry: Integer?            # Number of retries on failure
  backoff: String?           # "none" | "linear" | "exponential"
  on_failure: String[]?      # Handlers on failure
  parallel: Boolean?         # Can run with other steps
  env: Map<String, String>? # Environment variables
  working_dir: String?      # Directory to run in
  capture_output: Boolean?   # Save stdout/stderr
```

## Built-in Tools

### @build-yaml/builtin-tools

```speclang
# @block:build-yaml/builtin-tools @kind:entity
BuiltinTools:
  # Language tools
  go:
    path: "$GOROOT/bin/go"
    description: "Go compiler"
    
  npm:
    path: "npm"  # or pnpm, yarn
    description: "Node package manager"
    
  cargo:
    path: "~/.cargo/bin/cargo"
    description: "Rust package manager"
    
  python:
    path: "python3"
    description: "Python runtime"
    
  make:
    path: "make"
    description: "GNU Make"
    # Can call existing makefiles
    args: ["-f", "generated/Makefile", "target"]
    
  # SpecLang tools
  speclang-generate:
    path: "speclang generate"
    description: "Generate code from specs"
    
  speclang-compile:
    path: "speclang compile"
    description: "Compile specs to target language"
    
  speclang-validate:
    path: "speclang validate --specs"
    description: "Validate specs"
    
  speclang-notify:
    path: "speclang notify"
    description: "Send notification"
    
  speclang-rollback:
    path: "speclang rollback"
    description: "Rollback to previous spec version"
    
  speclang-index:
    path: "speclang generate-index"
    description: "Rebuild spec index"
    
  speclang-check:
    path: "speclang check"
    description: "Run all lint checks"
```

## Tool Chaining

### @build-yaml/chaining

```speclang
# @block:build-yaml/chaining @kind:note
Steps chain together:

1. CHAINING VIA DEPENDENCIES
   depends_on: [install, compile]
   - Step runs after ALL dependencies pass
   - If ANY dependency fails, step is SKIPPED
   - Can specify multiple dependencies for parallel execution
   
2. CHAINING VIA FLOWS
   flow: [install, compile, test]
   - Steps execute in ORDER
   - If ANY step fails, flow STOPS
   
3. CHAINING VIA CONDITIONS
   condition: "go.mod changed"
   - Step runs only if condition is true
   - Can chain multiple conditions with AND/OR
```

## Flows

### @build-yaml/flows

```speclang
# @block:build-yaml/flows @kind:entity
Flow:
  name: String              # Flow ID
  description: String?      # Human-readable description
  steps: String[]           # Ordered steps to execute
  on_success: String[]?    # Handlers after all steps pass
  on_failure: String[]?    # Handlers if ANY step fails
  parallel: Boolean?       # Execute steps in parallel
  timeout: Duration?       # Max total execution time
  
FlowExecution:
  steps: [install, compile, test-unit]
  parallel: false
  
  execution:
    1. install: started
    2. install: succeeded
    3. compile: started (depends on install)
    4. compile: succeeded
    5. test-unit: started (depends on compile)
    6. test-unit: failed
    
  result:
    status: FAILED
    failed_step: "test-unit"
    recovery: [on_failure handlers run]
```

## Flows Example

### @build-yaml/flows-example

```speclang
# @block:build-yaml/flows-example @kind:code
```yaml
# build.yaml flows section
flows:
  build-go:
    description: "Build Go project"
    steps: [install-go, compile-go, lint-go, test-go]
    on_failure: [notify-slack]
    
  build-npm:
    description: "Build NPM project"
    steps: [install-npm, compile-npm, lint-npm, test-npm]
    on_failure: [notify-slack]
    
  build-full:
    description: "Build everything"
    flows: [build-go, build-npm]  # Chain flows
    parallel: true
    on_success: [notify-success, commit-changes]
    on_failure: [rollback, notify-failure]
    
  build-go-test:
    description: "Build and test Go"
    flow: [build-go, test-go-unit, test-go-integration]
    on_success: [notify-success]
    on_failure: [rollback-spec, notify-failure]
```

## Conditions

### @build-yaml/conditions

```speclang
# @block:build-yaml/conditions @kind:entity
Condition:
  type: String | Expression | Tool
  evaluation: at runtime, before step execution
  
condition: "go files changed"
  -> matches: **/*.go
  -> runs: speclang diff --pattern "**/*.go"
  
condition: "specs changed"
  -> matches: specs/**/*.spec.md
  -> runs: speclang diff --pattern "specs/**/*.spec.md"
  
condition: "$PROJECT_LEVEL == 'Production'"
  -> evaluates environment variable PROJECT_LEVEL == 'Production'
  
condition: "package.json changed AND tests exist"
  -> evaluates: BOTH conditions true

condition: "target != 'test'"
  -> evaluates: expression is true

condition:
  # Advanced condition
  tool: "speclang diff --json"
  evaluate: "$.go.*.changed == true"
```

## Error Handling and Recovery

### @build-yaml/recovery

```speclang
# @build-yaml/recovery @kind:entity
RecoveryFlow:
  # When a step fails
  on_failure:
    - retry: N times with backoff
    - on_max_retries: recovery flow
    
  # Recovery handlers
  recovery:
    - notify: "Step X failed after Y attempts"
    - rollback: "Revert to previous spec"
    - escalate: "Notify human to investigate"
    
  # Handlers
  handlers:
    notify-failure:
      tool: "speclang notify"
      args: ["failure", "Build failed: {step.name}"]
      
    notify-slack:
      tool: "slack"
      args: ["notify-build-failure", {step: "{step.name}", error: "{error.message}"}]
      
    rollback-spec:
      tool: "speclang rollback"
      args: ["--last-spec-change"]
      
    commit-changes:
      tool: "git"
      args: ["commit", "-m", "speclang: build succeeded [pipeline:{cascade.id}]"]
```

## Make Integration

### @build-yaml/make-integration

```speclang
# @block:build-yaml/make-integration @kind:entity
MakeIntegration:
  # Call existing makefiles
  make-build:
    tool: "make"
    args: ["-f", "generated/go/Makefile", "build"]
    description: "Call make build target"
    
  make-test:
    tool: "make"
    args: ["-f", "generated/go/Makefile", "test"]
    depends_on: [make-build]
    
  make-deploy:
    tool: "make"
    args: ["-f", "generated/go/Makefile", "deploy"]
    depends_on: [make-build, make-test]
    condition: "$DEPLOYMENT_TARGET != 'none'"
```

## SpecLang Tool Calls

### @build-yaml/speclang-tools

```speclang
# @block:build-yaml/speclang-tools @kind:entity
SpecLangTools:
  
  # Code Generation
  speclang-generate:
    usage: "speclang generate --target=typescript --specs=auth"
    description: "Generate code from specs"
    output: "generated/go/**/*.go"
    
  speclang-compile:
    usage: "speclang compile --specs=specs/auth.spec.md --target=typescript"
    description: "Compile specific spec to target language"
    
  spelang-validate-specs:
    usage: "speclang validate --specs"
    description: "Run validation on all specs"
    failure_behavior: "notify human, rollback on critical failure"
    
  speclang-validate-code:
    usage: "speclang validate --generated"
    description: "Validate generated code"
    
  speclang-run-tests:
    usage: "speclang test --all"
    description: "Run all generated tests"
    
  # Pipeline Management
  speclang-commit:
    usage: "speclang commit --all"
    description: "Commit all generated changes"
    
  speclang-rollback:
    usage: "speclang rollback --last-spec"
    description: "Rollback last spec change (after failure)"
    
  # Notifications
  speclang-notify:
    usage: "speclang notify <success|failure> <message>"
    description: "Send notification to configured channels"
```

## Complete Example Build File

### @build-yaml/complete-example

```yaml
# build.yaml - Production-ready build configuration
# Runs after cascade convergence (30s quiet period)

project:
  name: "my-project"
  targets: ["go", "typescript"]
  maturity: "Alpha"
  
  on_converge:
    - "speclang generate --all"
    - "speclang validate --specs"
    - "make build"
    - "make test"
    - "speclang notify success"

targets:
  # Default targets
  build:
    flow: [install, generate, compile]
    
  test:
    flow: [build, test-unit, test-integration]
    
  full:
    flow: [install, generate, compile, lint, test, commit, notify]
    on_failure: [rollback, notify-failure]
    
  clean:
    steps:
      - tool: "rm"
        args: ["-rf", "generated/"]
      - tool: "rm"
        args: ["-rf", "src/**/*.go"]
      - tool: "speclang generate --all"

steps:
  # Installation
  install-go:
    tool: "go"
    args: ["mod", "tidy"]
    timeout: 60s
    retry: 2
    backoff: exponential
    condition: "go.mod changed"
    
  install-npm:
    tool: "npm"
    args: ["ci"]
    timeout: 120s
    retry: 2
    condition: "package.json changed"
    
  # Generation
  generate-index:
    tool: "python3"
    args: ["generate_index.py"]
    description: "Rebuild spec index"
    
  generate-go:
    tool: "speclang"
    args: ["generate", "--target=go", "--specs=all"]
    depends_on: [install-go, generate-index]
    timeout: 300s
    
  generate-ts:
    tool: "speclang"
    args: ["generate", "--target=typescript", "--specs=all"]
    depends_on: [install-npm, generate-index]
    timeout: 300s
    
  # Compilation
  compile-go:
    tool: "go"
    args: ["build", "-v", "./..."]
    depends_on: [generate-go]
    timeout: 300s
    on_failure: [notify-failure]
    
  compile-npm:
    tool: "npm"
    args: ["run", "build"]
    depends_on: [generate-ts]
    timeout: 300s
    on_failure: [notify-failure]
    
  # Linting
  lint-go:
    tool: "speclang"
    args: ["lint", "--target=go"]
    depends_on: [compile-go]
    timeout: 120s
    
  lint-npm:
    tool: "npm"
    args: ["run", "lint"]
    depends_on: [compile-npm]
    timeout: 120s
    on_failure: [notify-failure]
    
  # Unit Tests
  test-unit-go:
    tool: "go"
    args: ["test", "-v", "-count=1", "./..."]
    depends_on: [compile-go]
    timeout: 300s
    parallel: true
    retry: 1
    on_failure: [rollback-spec, notify-failure]
    
  test-unit-npm:
    tool: "npm"
    args: ["test"]
    depends_on: [compile-npm]
    timeout: 300s
    retry: 1
    on_failure: [rollback-spec, notify-failure]
    
  # Integration Tests
  test-integration-go:
    tool: "go"
    args: ["test", "-v", "-tags=integration", "./..."]
    depends_on: [test-unit-go]
    timeout: 600s
    condition: "$RUN_INTEGRATION == 'true'"
    
  # Commit
  commit-changes:
    tool: "git"
    args: ["commit", "-am", "speclang: build succeeded [pipeline:{cascade.id}]"]
    depends_on: [test-unit-go, test-unit-npm]
    
  # Notify
  notify-success:
    tool: "speclang"
    args: ["notify", "success", "Build completed successfully"]
    depends_on: [commit-changes]
    
  notify-failure:
    tool: "speclang"
    args: ["notify", "failure", "Build failed: {step} - {error}"]
    
  # Rollback
  rollback-spec:
    tool: "speclang"
    args: ["rollback", "--last-spec"]
    
  rollback-full:
    tool: "speclang"
    args: ["rollback", "--cascade={cascade.id}"]

flows:
  build:
    steps: [install-go, install-npm, generate-index, generate-go, generate-ts, compile-go, compile-npm]
    on_failure: [notify-failure]
    
  test:
    steps: [build, lint-go, lint-npm, test-unit-go, test-unit-npm]
    on_failure: [rollback-spec, notify-failure]
    
  full:
    steps: [test, commit-changes, notify-success]
    on_failure: [rollback-full, notify-failure]
    
  lint:
    steps: [build, lint-go, lint-npm]
    
  test-integration:
    steps: [build, test-unit-go, test-unit-npm, test-integration-go]
    condition: "$RUN_INTEGRATION == 'true'"

default_target: "full"

recovery:
  on_failure:
    steps: [notify-failure]
    max_attempts: 1
    escalation: "human notification"
```

## Error Handler Behavior

### @build-yaml/error-handling

```speclang
# @block:build-yaml/error-handling @kind:entity
ErrorHandlerBehavior:
  # Retry logic
  retry_logic:
    on_failure: retry
    max_attempts: step.retry
    backoff:
      none: retry immediately
      linear: delay = attempt * base_delay
      exponential: delay = base_delay * 2^attempt
    default_backoff: "exponential"
    default_base_delay: "1s"
    
  # On max retries exceeded
  max_retries_exceeded:
    - log failure
    - mark step as FAILED
    - run step.on_failure handlers
    - mark flow as FAILED
    
  # Failure handlers
  failure_handlers:
    abort: "Stop entire pipeline"
    rollback: "Revert to previous spec version"
    notify-failure: "Send failure notification"
    retry: "Retry step with backoff"
    continue: "Proceed to next step (mark as warning)"
    
  # Cascading failure
  cascade_failure:
    description: "When step fails, dependent steps are SKIPPED"
    behavior:
      - All steps that depend on this step are marked SKIPPED
      - Flow terminates if step is required for downstream steps
      - Flow continues if step has parallel alternatives
```

## Handler Priority

### @build-yaml/handler-priority

```speclang
# @block:build-yaml/handler-priority @kind:entity
HandlerPriority:
  order:
    1. Step-level on_failure handlers
    2. Step retry handlers
    3. Flow-level on_failure handlers
    4. Target-level on_failure handlers
    5. Pipeline-level recovery handlers
    
  example:
    step.on_failure: [notify-failure]
    flow.on_failure: [rollback-spec, notify-failure]
    
    execution_order:
      1. notify-failure (step level)
      2. rollback-spec (flow level)
      3. notify-failure (flow level)
```

## Pipeline Integration

### @build-yaml/pipeline-integration

```speclang
# @block:build-yaml/pipeline-integration @kind:note
How build.yaml integrates with SpecLang:

1. AI AGENTS FINISH
   - Cascade completes
   - Convergence detected (30s quiet period)
   
2. DAEMON TRIGGERS
   - speclangd reads build.yaml
   - Computes which targets need to run
   - Executes default_target (or specified target)
   
3. PIPELINE RUNS
   - Each step is executed with retry logic
   - Tool output is captured and logged
   - Failures trigger handlers
   
4. ON SUCCESS
   - Changes are committed
   - User/AI is notified
   - Pipeline terminates
   
5. ON FAILURE
   - Rollback handlers run
   - User/AI is notified
   - Pipeline terminates with error
```

## Build Configuration Options

### @build-yaml/config-options

```speclang
# @block:build-yaml/config-options @kind:entity
BuildConfigOptions:
  
  # Failure handling
  failure_handling:
    abort_on_failure: true  # Stop pipeline on first failure
    continue_on_failure: false  # Continue to next step
    max_attempts: 3  # Global retry limit
    
  # Timeout
  default_timeout: "300s"
  max_timeout: "3600s"
  
  # Conditions
  run_conditions:
    files_changed: "*.go"
    env_vars_set: "DEPLOYMENT=true"
    cascade_spec: "project.scl"
    maturity_level: ">= Beta"
    
  # Retry
  default_retry: 1
  max_retry: 3
  backoff:
    strategy: "exponential"
    base_delay: "1s"
    max_delay: "30s"
    
  # Notification targets
  notification_targets:
    - console
    - slack
    - email
    - webhook
```

## References

- "@ref:specs/pipeline - Pipeline overview
- @ref:specs/pipeline.spec.dir/hooks - Hooks spec
- @ref:specs/pipeline.spec.dir/recovery - Recovery spec
- @ref:specs/cascade.spec.dir/error-handling - Error handling in cascade