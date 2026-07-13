# speclang-header lines:11
id: "@speclang/config-spec-dir/defaults"
version: 0.1.0
layer: 2
tags: [config, defaults, examples]
project_level: Alpha
agent_support: agent_assisted
parent: "@ref:speclang/config"

short: Configuration defaults and examples
---
# Configuration Defaults

## Overview

### @config/overview

```speclang
# @block:config/overview @kind:note
All settings live in project.scl under the config: section.

Principles:
- User controls limits and behavior
- Sensible defaults provided
- Per-agent overrides supported
- Same embedding model everywhere
```

## Complete Example

### @config/full-example

```speclang
# @block:config/full-example @kind:code
```yaml
# project.scl
metadata:
  name: my-saas-app
  version: 1.0.0
  description: "Full-stack auth system"

targets:
  - go
  - typescript
  - python

config:
  # File watching
  watcher:
    patterns:
      - "**/*.spec.{md,yaml,yml,scl}"
      - "**/*.{go,ts,py}.spec"
    ignore:
      uses: ".gitignore"
      plus: [".speclang/", "*.log"]
    debounce: 100
  
  # Dynamic split
  split:
    max_tokens: 10000
    max_lines: 800
    max_chars: 60000
    budget_overhead: 500
    strategy: smart
  
  # Embeddings
  embeddings:
    enabled: true
    model: openai/text-embedding-3-small
    dimensions: 1536
    batch_size: 100
  
  # SQLite
  database:
    mode: WAL
    synchronous: NORMAL
    cache_size: 10000
    temp_store: MEMORY
  
  # Cascade
  cascade:
    quiet_period: 30
    max_depth: 50
    max_files: 1000
  
  # Continuous improvement loop
  continuous_improvement:
    enabled: true
    max_iterations: 0
    max_time_since_human_update: 86400
    escalation_threshold: 5
    auto_resolve_confidence_threshold: 0.8
  
  # Agent overrides
  agents:
    spec-writer:
      max_tokens: 8000
    code-gen:
      max_lines: 500
    test-writer:
      max_tokens: 6000
```
```