# speclang-header lines:12
id: "@speclang/pipeline/hooks"
parent: "@ref:speclang/pipelinepart: 2/3
siblings:
  prev: ""@ref:speclang/pipeline/build  next: ""@ref:speclang/pipeline/recoveryshort: Build Pipeline - Hooks
project_level: Alpha
agent_support: agent_assisted
tags: [pipeline, hooks]
imports: ["@speclang/core"]
version: 0.1.0
layer: 2
---
## Hooks

### @pipeline/hooks

```speclang
# @block:pipeline/hooks @kind:entity
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

### @pipeline/hooks-example

```speclang
# @block:pipeline/hooks-example @kind:code
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
```
