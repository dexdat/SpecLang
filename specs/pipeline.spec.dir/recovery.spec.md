# speclang-header lines:11
id: "@speclang/pipeline/recovery"
parent: "@ref:speclang/pipeline"
part: 3/3
short: Build Pipeline - Recovery
project_level: Alpha
agent_support: agent_assisted
tags: [pipeline, recovery]
version: 0.1.0
layer: 2
---
## Recovery

### @pipeline/recovery

```speclang
# @block:pipeline/recovery @kind:entity
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

### @pipeline/recovery-example

```speclang
# @block:pipeline/recovery-example @kind:code
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
