# speclang-header lines:10
id: "@speclang/config-spec-dir/schema"
version: 0.1.0
layer: 2
tags: [config, schema, entities]
project_level: Alpha
agent_support: agent_assisted
parent: ""@ref:speclang/configpart: 1/2
short: Configuration schema definitions
---
# Configuration Schema

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
    continuous_improvement: ContinuousImprovementConfig
    agents: AgentsConfig
```

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

## Continuous Improvement Configuration

### @config/continuous-improvement

```speclang
# @block:config/continuous-improvement @kind:entity
ContinuousImprovementConfig:
  description: "Configuration for continuous improvement loop. See @ref:specs/cascade/continuous-improvement for details."
  
  enabled:
    description: "Enable continuous improvement loop"
    type: Boolean
    default: true
    
  max_iterations:
    description: "Maximum number of improvement iterations before stopping (0 = unlimited)"
    type: Integer
    default: 0
    
  max_time_since_human_update:
    description: "Maximum seconds since last human interaction before pausing loop (0 = no limit)"
    type: Integer
    default: 86400  # 24 hours
    
  escalation_threshold:
    description: "Number of unresolved MCP messages before escalating to human"
    type: Integer
    default: 5
    
  auto_resolve_confidence_threshold:
    description: "Confidence threshold (0.0-1.0) for AI to auto-resolve messages without human input"
    type: Float
    default: 0.8
```

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