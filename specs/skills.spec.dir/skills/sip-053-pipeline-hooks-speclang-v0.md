---
name: sip-053-pipeline-hooks-speclang-v0
title: "SIP 53: Pipeline Hooks"
version: 0.1.0
description: Hook types, hook execution, and built-in hooks for build pipelines
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 53: Pipeline Hooks

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the pipeline hook system for extending and customizing build behavior.

### Quick Start

```yaml
# .speclang/hooks.yaml
hooks:
  - name: notify-slack
    trigger: pipeline.completed
    command: "curl -X POST $SLACK_WEBHOOK -d '{status}'"
    
  - name: run-linter
    trigger: pipeline.before_build
    command: "npm run lint"
```

### Hook Types

- **Pre-hooks:** Run before a stage
- **Post-hooks:** Run after a stage
- **Error-hooks:** Run on stage failure
- **Event-hooks:** Run on daemon events

### When to Read This

- **Extending pipelines:** Adding custom behavior
- **Integration:** Connecting to external systems
- **Automation:** Automating workflows

### Related SIPs

- SIP 13: Pipeline
- SIP 51: Daemon Events
- SIP 10: Daemon Architecture

## Abstract

This SIP specifies the hook types, execution model, and built-in hooks for SpecLang build pipelines.

## Specification

### Hook Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Pipeline Hook System                        │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   Pipeline   │
                    │   Executor   │
                    └──────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌───────────┐    ┌───────────┐    ┌───────────┐
   │ Pre-Hooks │    │Post-Hooks │    │Error-Hooks│
   └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
         │                │                │
         └────────────────┼────────────────┘
                          ▼
                   ┌──────────────┐
                   │ Hook Runner  │
                   └──────┬───────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
   ┌───────────┐   ┌───────────┐   ┌───────────┐
   │  Command  │   │  Script   │   │  HTTP     │
   │  Hooks    │   │  Hooks    │   │  Hooks    │
   └───────────┘   └───────────┘   └───────────┘
```

### Hook Types

```yaml
HookTypes:
  pre_stage:
    description: Run before pipeline stage
    timing: synchronous
    can_abort: true
    timeout: 60s
    
  post_stage:
    description: Run after pipeline stage
    timing: synchronous
    can_abort: false
    timeout: 60s
    
  on_error:
    description: Run on stage failure
    timing: synchronous
    can_abort: false
    timeout: 120s
    
  on_event:
    description: Run on daemon events
    timing: async
    can_abort: false
    timeout: 300s
    
  scheduled:
    description: Run on schedule
    timing: async
    can_abort: false
    timeout: 600s
```

### Hook Definition

```typescript
interface Hook {
  name: string;
  trigger: HookTrigger;
  enabled: boolean;
  priority: number;
  timeout: number;
  retry: RetryConfig;
  action: HookAction;
  condition?: HookCondition;
  environment?: Record<string, string>;
}

type HookTrigger =
  | "pipeline.before_all"
  | "pipeline.after_all"
  | "pipeline.before_validate"
  | "pipeline.after_validate"
  | "pipeline.before_build"
  | "pipeline.after_build"
  | "pipeline.before_test"
  | "pipeline.after_test"
  | "pipeline.before_commit"
  | "pipeline.after_commit"
  | "pipeline.on_error"
  | "cascade.started"
  | "cascade.converged"
  | "file.changed";

interface RetryConfig {
  max_retries: number;
  backoff: "fixed" | "exponential";
  initial_delay: number;
}

type HookAction =
  | { type: "command"; command: string; cwd?: string }
  | { type: "script"; path: string; args?: string[] }
  | { type: "http"; url: string; method: string; body?: object; headers?: object }
  | { type: "mcp"; tool: string; params: object };

type HookCondition = {
  expression: string;
};
```

### Hook Execution

```yaml
HookExecution:
  ordering:
    - Sort by priority (higher first)
    - Same priority: alphabetical by name
    
  parallelism:
    pre_hooks: sequential (abort on failure)
    post_hooks: parallel
    error_hooks: sequential
    
  context:
    environment_variables:
      SPECLANG_HOOK_NAME: hook name
      SPECLANG_TRIGGER: trigger type
      SPECLANG_PIPELINE_ID: pipeline ID
      SPECLANG_CASCADE_ID: cascade ID (if applicable)
      SPECLANG_WORKING_DIR: project root
      
    stdin:
      JSON object with full context
      
  output:
    stdout: captured and logged
    stderr: captured and logged
    exit_code: 0 = success, non-zero = failure
```

### Hook Configuration

```yaml
# .speclang/hooks.yaml

hooks:
  # Pre-validate hook
  - name: check-spec-headers
    trigger: pipeline.before_validate
    priority: 100
    timeout: 30
    action:
      type: command
      command: "python3 scripts/check_headers.py"
      
  # Pre-build hook
  - name: install-dependencies
    trigger: pipeline.before_build
    priority: 50
    action:
      type: command
      command: "npm ci"
      
  # Post-build hook
  - name: generate-docs
    trigger: pipeline.after_build
    priority: 10
    action:
      type: command
      command: "npm run docs"
      
  # Error hook
  - name: notify-on-failure
    trigger: pipeline.on_error
    action:
      type: http
      url: "${SLACK_WEBHOOK_URL}"
      method: POST
      headers:
        Content-Type: application/json
      body:
        text: "Pipeline failed: ${SPECLANG_PIPELINE_ID}"
        
  # Event hook
  - name: sync-remote
    trigger: cascade.converged
    condition: "files_changed > 5"
    action:
      type: command
      command: "git push origin main"
```

### Built-in Hooks

```yaml
BuiltInHooks:
  spec_validator:
    trigger: pipeline.before_validate
    description: Validate spec headers and content
    enabled: true
    cannot_disable: true
    
  dependency_checker:
    trigger: pipeline.before_build
    description: Check dependency resolution
    enabled: true
    
  test_runner:
    trigger: pipeline.before_commit
    description: Run test suite
    enabled: true
    
  git_status_check:
    trigger: pipeline.before_commit
    description: Verify clean working tree
    enabled: true
    
  header_inserter:
    trigger: file.created
    description: Auto-insert spec header
    enabled: true
    
  index_updater:
    trigger: file.changed
    description: Update search index
    enabled: true
```

### Hook Context

```typescript
interface HookContext {
  hook: {
    name: string;
    trigger: string;
    attempt: number;
  };
  pipeline?: {
    id: string;
    stage: string;
    status: "pending" | "running" | "success" | "failed";
    started_at: string;
  };
  cascade?: {
    id: string;
    depth: number;
    files_changed: string[];
    trigger_file: string;
  };
  event?: {
    kind: string;
    file_path?: string;
    timestamp: string;
  };
  project: {
    root: string;
    name: string;
  };
  environment: Record<string, string>;
}
```

### Hook Result

```typescript
interface HookResult {
  hook_name: string;
  success: boolean;
  exit_code: number;
  stdout: string;
  stderr: string;
  duration_ms: number;
  error?: {
    message: string;
    stack?: string;
  };
}
```

### Hook Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                      Hook Lifecycle                             │
└─────────────────────────────────────────────────────────────────┘

Pipeline Start
      │
      ▼
┌─────────────┐     ┌─────────────┐
│ Pre-Hooks   │────>│   Stage     │────> Success? ──No──> Error Hooks
└─────────────┘     │ Execution   │                       │
      │             └─────────────┘                       │
   Abort?                  │                              │
      │                    Yes                            │
      ▼                    ▼                              ▼
   Abort            ┌─────────────┐                 ┌─────────────┐
   Pipeline         │ Post-Hooks  │                 │ Error Hooks │
                    └─────────────┘                 └─────────────┘
                          │                              │
                          ▼                              ▼
                    Next Stage                      Abort Pipeline
```

### Hook Priority

```yaml
HookPriority:
  range: -1000 to 1000
  
  reserved:
    -1000 to -500: Built-in system hooks
    -499 to 0: Built-in user hooks
    1 to 500: User hooks
    501 to 1000: Override hooks
    
  defaults:
    built_in: -100
    user_defined: 0
    
  ordering:
    higher_priority: runs first
    same_priority: alphabetical by name
```

### Error Handling

```yaml
HookErrorHandling:
  on_failure:
    pre_hooks: abort stage, run error hooks
    post_hooks: log error, continue
    error_hooks: log error, continue
    
  on_timeout:
    action: kill process
    treat_as: failure
    
  retry:
    eligible:
      - command timeout
      - network error
    not_eligible:
      - exit code != 0
      - validation error
```

### Hook CLI

```bash
# List all hooks
speclang hooks list

# Show hook details
speclang hooks show <name>

# Enable/disable hook
speclang hooks enable <name>
speclang hooks disable <name>

# Run hook manually
speclang hooks run <name> --context '{"test": true}'

# Validate hook configuration
speclang hooks validate
```

### Hook Events

```yaml
HookEvents:
  hook.started:
    payload:
      hook_name: string
      trigger: string
      context: object
      
  hook.completed:
    payload:
      hook_name: string
      success: boolean
      duration_ms: integer
      
  hook.failed:
    payload:
      hook_name: string
      error: string
      retry_attempt: integer
```

## References

- "@ref:specs/pipeline.spec.dir/hooks
- SIP 13: Pipeline
- SIP 51: Daemon Events
- SIP 10: Daemon Architecture

## Copyright

This document is in the public domain.
