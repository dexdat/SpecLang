---
name: sip-008-configuration-speclang-v0
title: "SIP 8: Configuration"
version: 0.1.0
description: Complete project configuration in project.scl
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 8: Configuration

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines complete project configuration in project.scl.

### Quick Start

1. **Location:** `project.scl` under `config:`
2. **Sections:** watcher, split, embeddings, database, cascade, agents
3. **Format:** YAML
4. **Override:** Environment variables

### Example

```yaml
config:
  split:
    max_tokens: 10000
    budget_overhead: 500
  embeddings:
    enabled: true
    model: openai/text-embedding-3-small
```

### Key Concepts

- **Single Source:** All settings in one place
- **Hierarchical:** Global + per-agent overrides
- **Hot Reload:** Changes detected automatically
- **Validation:** Checked on load

### When to Read This

- **Project setup:** Configure new project
- **Tuning:** Adjust limits
- **Troubleshooting:** Check configuration

### Related SIPs

- SIP 5: Splitting and Sizing
- SIP 7: Cascade System

## Abstract

This SIP defines the configuration system for Speclang. All settings live in `project.scl` under the `config:` section, providing a single source of truth for project behavior.

## Motivation

Configuration should be:
- In one place
- Version controlled
- Human readable
- Machine parseable
- Self-documenting

## Rationale

**project.scl as Config:**
- Already exists (North Star)
- YAML format (readable)
- Version controlled (Git)
- Accessible to all agents

**Hierarchical:**
```
config:
  global settings
  agents:
    per-agent overrides
```

## Specification

### Configuration Location

**File:** `project.scl`

**Section:** `config:`

**Format:** YAML

**Example:**
```yaml
# project.scl
metadata:
  name: my-project
  
config:
  # Settings here
```

### Top-Level Sections

**Required:**
- `watcher` - File watching
- `split` - Spec sizing
- `embeddings` - Vector search
- `database` - SQLite
- `cascade` - Cascade behavior

**Optional:**
- `agents` - Per-agent settings
- `pipeline` - Build pipeline
- `targets` - Output languages

### Watcher Configuration

**Purpose:** Define which files trigger cascades

**Format:**
```yaml
config:
  watcher:
    patterns:     # What to watch
      - "**/*.spec.{md,yaml,yml,scl}"
      - "**/*.{go,ts,js,py}.spec"
      - "**/project.scl"
    
    ignore:       # What to ignore
      uses: ".gitignore"  # Respect this
      plus:               # Plus extras
        - ".speclang/"
        - "*.log"
        - "reports/"
    
    debounce: 100  # Milliseconds
```

**Patterns:**
- Glob format
- Recursive (`**/`)
- Extensions
- Specific files

**Ignore:**
- `.gitignore` rules
- Additional patterns
- Negation supported (`!path`)

### Split Configuration

**Purpose:** Define when specs split

**Format:**
```yaml
config:
  split:
    max_tokens: 10000      # Token limit
    max_lines: 800         # Line limit
    max_chars: 60000       # Character limit
    budget_overhead: 500   # Extra budget
    strategy: smart      # smart | by-section | by-token
```

**Budget:**
```
Real limit = max_tokens + budget_overhead
Example: 10000 + 500 = 10500
```

### Embedding Configuration

**Purpose:** Configure vector search

**Format:**
```yaml
config:
  embeddings:
    enabled: true
    model: openai/text-embedding-3-small
    dimensions: 1536
    batch_size: 100
```

**Models:**
- `openai/text-embedding-3-small` (default)
- `openai/text-embedding-3-large`
- `sentence-transformers/all-MiniLM-L6-v2` (local)

**Dimensions:**
- OpenAI: 1536
- MiniLM: 384

### Database Configuration

**Purpose:** SQLite settings

**Format:**
```yaml
config:
  database:
    mode: WAL           # journal_mode
    synchronous: NORMAL # synchronous
    cache_size: 10000   # pages
    temp_store: MEMORY  # temp tables
```

**Modes:**
- `DELETE` - Standard
- `TRUNCATE` - Fast
- `PERSIST` - Fast
- `WAL` - Best (default)

**Why WAL:**
- Survives crashes
- Concurrent reads
- Better performance

### Cascade Configuration

**Purpose:** Cascade behavior

**Format:**
```yaml
config:
  cascade:
    quiet_period: 30   # Seconds to convergence
    max_depth: 50      # Safety limit
    max_files: 1000    # Safety limit
    max_time: 3600     # Seconds safety
```

**Quiet Period:**
- No changes for N seconds
- Then convergence
- Default: 30s

### Agent Configuration

**Purpose:** Per-agent overrides

**Format:**
```yaml
config:
  agents:
    spec-writer:
      max_tokens: 8000
      max_lines: 600
      
    code-gen:
      max_lines: 500
      
    test-writer:
      max_tokens: 6000
```

**Available Agents:**
- `north-star`
- `spec-writer`
- `code-gen`
- `test-writer`
- `back-sync`
- `adversarial-reviewer`
- `recovery-agent`
- `spec-validator`

### Pipeline Configuration

**Purpose:** Build and test pipeline

**Format:**
```yaml
config:
  pipeline:
    on-converge:
      - run: "go build ./..."
        condition: "go files changed"
      - run: "go test ./..."
        condition: "always"
    
    hooks:
      pre: "echo 'Building...'"
      post-success: "echo 'Success!'"
      post-fail: "speclang rollback"
```

### Target Configuration

**Purpose:** Output languages

**Format:**
```yaml
config:
  targets:
    - go
    - typescript
    - python
```

**Available:**
- `go`
- `typescript` / `ts`
- `python` / `py`
- `rust` / `rs`
- `java`
- `cpp` / `c++`

## Complete Example

```yaml
# project.scl
metadata:
  name: my-saas-app
  version: 1.0.0
  description: "Full-stack SaaS with auth"

targets:
  - go
  - typescript

config:
  # File watching
  watcher:
    patterns:
      - "**/*.spec.{md,yaml,yml,scl}"
      - "**/*.{go,ts}.spec"
      - "**/project.scl"
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
    max_time: 3600
  
  # Agent overrides
  agents:
    spec-writer:
      max_tokens: 8000
    code-gen:
      max_lines: 500
    test-writer:
      max_tokens: 6000
  
  # Pipeline
  pipeline:
    on-converge:
      - run: "go mod tidy && go build ./..."
      - run: "npm test"
        condition: "ts files changed"
    hooks:
      pre: "echo 'Building...'"
      post-success: "echo 'Build complete!'"
```

## Validation

**On Load:**
1. Parse YAML
2. Check required sections
3. Validate values
4. Set defaults

**Errors:**
```
Error: Missing required section "config.split"
Error: Invalid value "100000" for split.max_tokens (max: 50000)
Error: Unknown agent "custom-agent"
```

## Environment Variables

**Override config:**
```bash
export SPECLANG_QUIET_PERIOD=60
export SPECLANG_MAX_TOKENS=8000
```

**Precedence:**
1. Environment variables
2. project.scl
3. Default values

## Integration

**With Agents:**
- Read on spawn
- Cache in session
- Reload on change

**With Daemon:**
- Read on start
- Watch for changes
- Hot reload

**With SQLite:**
- Store in config table
- Query for values
- Version history

## References

- SIP 1: How to Write a SIP
- SIP 5: Splitting and Sizing
- SIP 7: Cascade System
- YAML 1.2 Specification

## Copyright

This document is in the public domain.