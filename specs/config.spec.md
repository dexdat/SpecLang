# speclang-header lines:10
id: "@speclang/config"
version: 0.1.0
layer: 0
tags: [config, settings, project]
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Configuration
---

# Configuration

Complete project configuration in project.scl

## Overview

```speclang
# @block:config/overview @kind:note
All settings live in project.scl under the config: section.

Principles:
- User controls limits and behavior
- Sensible defaults provided
- Per-agent overrides supported
- Same embedding model everywhere
```

---

## Top-Level Structure

### @config/structure

```speclang
# @block:config/structure @kind:entity
project.scl:
  metadata:
    name: String
    version: Semver
    description: String
    
  targets: [Language]
  
  config:
    watcher: WatcherConfig
    split: SplitConfig
    embeddings: EmbeddingConfig
    database: DatabaseConfig
    cascade: CascadeConfig
    agents: AgentsConfig
```

---

## Watcher Configuration

### @config/watcher

```speclang
# @block:config/watcher @kind:entity
WatcherConfig:
  patterns:
    description: "Which files trigger cascades"
    type: [String]  # glob patterns
    default:
      - "**/*.spec.{md,yaml,yml,scl}"
      - "**/*.{go,ts,js,py,rs,java}.spec"
      - "**/project.scl"
      - "**/build.{scl,yaml}"
    
  ignore:
    description: "Respect .gitignore + extra ignores"
    type: Object
    fields:
      uses: ".gitignore"  # read from project root
      plus: [String]     # additional patterns
    default:
      plus: [".speclang/", "*.log", "reports/", ".git/"]
    
  debounce:
    description: "Batch rapid changes (ms)"
    type: Integer
    default: 100
```

---

## Split Configuration

### @config/split

```speclang
# @block:config/split @kind:entity
SplitConfig:
  max_tokens:
    description: "Token limit before split"
    type: Integer
    default: 10000
    
  max_lines:
    description: "Line limit before split"
    type: Integer
    default: 800
    
  max_chars:
    description: "Character limit before split"
    type: Integer
    default: 60000
    
  budget_overhead:
    description: "Extra tokens for headers/refs"
    type: Integer
    default: 500
    
  strategy:
    description: "How to split"
    type: Enum
    values: [smart, by-section, by-token]
    default: smart
```

---

## Embedding Configuration

### @config/embeddings

```speclang
# @block:config/embeddings @kind:entity
EmbeddingConfig:
  enabled:
    description: "Generate embeddings"
    type: Boolean
    default: true
    
  model:
    description: "Embedding model"
    type: String
    default: openai/text-embedding-3-small
    
  dimensions:
    description: "Vector dimensions"
    type: Integer
    default: 1536
    
  batch_size:
    description: "Batch size for generation"
    type: Integer
    default: 100
    
  why_single_model:
    - All specs use same embedding space
    - Enables semantic search across project
    - Consistent similarity calculations
```

---

## Database Configuration

### @config/database

```speclang
# @block:config/database @kind:entity
DatabaseConfig:
  mode:
    description: "SQLite journal mode"
    type: String
    default: WAL
    
  synchronous:
    description: "Sync mode"
    type: String
    default: NORMAL
    
  cache_size:
    description: "Page cache size"
    type: Integer
    default: 10000
    
  temp_store:
    description: "Temp tables location"
    type: String
    default: MEMORY
```

---

## Cascade Configuration

### @config/cascade

```speclang
# @block:config/cascade @kind:entity
CascadeConfig:
  quiet_period:
    description: "Seconds of no changes to trigger convergence"
    type: Integer
    default: 30
    
  max_depth:
    description: "Max cascade depth (safety)"
    type: Integer
    default: 50
    
  max_files:
    description: "Max files changed per cascade (safety)"
    type: Integer
    default: 1000
```

---

## Agent Configuration

### @config/agents

```speclang
# @block:config/agents @kind:entity
AgentsConfig:
  description: "Per-agent overrides"
  type: Map<String, AgentConfig>
  
AgentConfig:
  max_tokens: Integer?
  max_lines: Integer?
  max_chars: Integer?
  model: String?
  temperature: Float?
  
  examples:
    spec-writer:
      max_tokens: 8000
      
    code-gen:
      max_lines: 500
      
    test-writer:
      max_tokens: 6000
```

---

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
