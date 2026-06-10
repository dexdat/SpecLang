---
id: "@speclang/recovery/retry"
version: 0.1.0
layer: 2
part: 2/2
tags: [recovery, retry]
imports: ["@speclang/recovery"]
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Retry
---

# Retry Strategies

### @recovery/retry

```speclang
# @block:recovery/retry @kind:entity
RetryStrategy:
  description: "Try again before giving up"
  
  types:
    immediate: retry right away
    backoff: wait with exponential delay
    scheduled: retry at specific time
    
  limits:
    max_attempts: 3
    backoff_base: 1s
    backoff_max: 30s
```

### @recovery/retry-flow

```speclang
# @block:recovery/retry-flow @kind:code
```yaml
retry:
  max_attempts: 3
  backoff: exponential
  base_delay: 1s
  max_delay: 30s
  
on_transient_error:
  1st attempt: immediate
  2nd attempt: wait 1s
  3rd attempt: wait 2s
  4th attempt: wait 4s (if under max)
  after max: give up, rollback
```
```