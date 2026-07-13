# speclang-header lines:10
id: "@speclang/dynamic-split/strategy"
version: 0.1.0
layer: 2
tags: [splitting, strategy, logic]
parent: @ref:speclang/dynamic-split
part: 1/2
order: 1
short: Dynamic splitting strategy and configuration
---

# Dynamic Splitting Strategy

When specs exceed size limits, they split into `.spec.dir/` folders with sub-specs.

## Overview

```speclang
# @block:split/overview @kind:note
User sets limits in project.scl:
- max_tokens: 10000
- max_lines: 800
- max_chars: 60000

When a spec exceeds limits:
1. Create parent.spec.dir/ folder
2. Split content into sub-specs inside folder
3. Parent becomes index with children refs
4. Sub-specs link back to parent

**Having sub-specs is not a problem.**

Sub-specs are BETTER than bloated single files because:
- Each sub-spec has focused, manageable context
- Easier to understand and maintain
- Avoids the "everything everywhere" problem

Result: specs stay organized and focused.
```

---

## Configuration

### @split/config

```speclang
# @block:split/config @kind:entity
SplitConfig:
  location: project.scl under config.split
  
  settings:
    max_tokens: Integer       # user-defined limit
    max_lines: Integer        # user-defined limit
    max_chars: Integer        # user-defined limit
    budget_overhead: Integer  # extra budget for headers/refs
    strategy: String          # smart | by-section | by-token
    
  per_agent_override:
    location: project.scl under config.agents.{agent}
    
  defaults:
    max_tokens: 10000
    max_lines: 800
    max_chars: 60000
    budget_overhead: 500
    strategy: smart
```

### @split/config-example

```speclang
# @block:split/config-example @kind:code
```yaml
# project.scl
metadata:
  name: my-app
  
config:
  split:
    max_tokens: 10000
    max_lines: 800
    max_chars: 60000
    budget_overhead: 500
    strategy: smart
    
  agents:
    spec-writer:
      max_tokens: 8000  # override
    code-gen:
      max_lines: 500    # override
```
```

### @split/embedding-config

```speclang
# @block:split/embedding-config @kind:entity
EmbeddingConfig:
  location: project.scl under config.embeddings
  
  required_for_split:
    - enabled: Boolean
    - model: String
    - dimensions: Integer
    
  why_it_matters:
    - Same embedding model across all files
    - Same dimensions for vector search
    - Configurable per project
    
  defaults:
    enabled: true
    model: openai/text-embedding-3-small
    dimensions: 1536
    batch_size: 100
```

---

## Splitting Logic

### @split/logic

```speclang
# @block:split/logic @kind:operation
checkAndSplit(spec: Spec) -> Spec[]:

steps:
  1. Count tokens/lines/chars in content
  2. Determine user_limit (10000 tokens) and budget_limit (10500 tokens)
  3. If token count <= user_limit: return spec as-is
  4. If token count > user_limit and <= budget_limit:
     a. Create parent.spec.dir/ folder
     b. Extract blocks/sections
     c. Create child specs in folder
     d. Update parent as index file
     e. Add bidirectional refs
  5. If token count > budget_limit:
     a. Determine optimal split points based on block boundaries
     b. Create parent.spec.dir/ folder
     c. Split content across child specs
     d. Update parent as index file
     e. Add bidirectional refs
  6. Return parent + children

budget_calculation:
  user_limit: 10000 tokens
  overhead: 500 tokens (headers + refs)
  budget_limit: 10500 tokens
  
  if tokens > 10000 and tokens <= 10500:
    # Try to fit within budget first
    optimize_refs()
    
  if tokens > 10500:
    # Must split
    create_dir_and_split()
```

### @split/dir-structure

```speclang
# @block:split/dir-structure @kind:entity
DirStructure:
  before_split:
    - specs/auth/login.spec.yaml (12k tokens)

  after_split:
    - specs/auth/login.spec.yaml (index, ~500 tokens)
    - specs/auth/login.spec.dir/
      ├── overview.spec.yaml
      ├── entities.spec.yaml
      ├── operations.spec.yaml
      └── tests.spec.yaml

  parent_as_index:
    header:
      id: @specs/auth/login
      children:
        - "@ref:specs/auth/login.spec.dir/overview
        - "@ref:specs/auth/login.spec.dir/entities
        - "@ref:specs/auth/login.spec.dir/operations
        - "@ref:specs/auth/login.spec.dir/tests
      short: "Login (4 sub-specs)"
    content: "See login.spec.dir/ for details"

  sub_specs_link_back:
    header:
      id: @specs/auth/login.spec.dir/overview
      parent: @ref:specs/auth/login
      part: 1/4
      order: 1
      short: "Login overview"
```

---

## Split Result

### @split/result

```speclang
# @block:split/result @kind:entity
SplitResult:
  parent:
    # auth.spec.yaml
    becomes: index file
    contains:
      - header with children refs
      - short description of split
      - no detailed content

  sub_specs:
    # In auth.spec.dir/*.spec.yaml
    contains:
      - header with parent ref
      - part number
      - focused content
      - links between siblings if needed

  **Why sub-specs are better:**
  - Each has clear, bounded context
  - No context bloat
  - Easier to read and maintain
```

### @split/example

```speclang
# @block:split/example @kind:code
Before split:
  specs/auth.spec.yaml (12,000 tokens)

After split:
  specs/auth.spec.yaml (index)
  specs/auth.spec.dir/
    ├── entities.spec.yaml (3,000 tokens)
    ├── operations.spec.yaml (4,000 tokens)
    └── policies.spec.yaml (3,500 tokens)

Parent header (specs/auth.spec.yaml):
  ---
  # speclang-header lines:10
  id: @specs/auth
  version: 1.0.0
  children:
    - "@ref:specs/auth.spec.dir/entities
    - "@ref:specs/auth.spec.dir/operations
    - "@ref:specs/auth.spec.dir/policies
  short: "Authentication system (3 parts)"
  ---
  
  This spec has been split. See auth.spec.dir/ for details.

Child header (specs/auth.spec.dir/entities.spec.yaml):
  ---
  # speclang-header lines:8
  id: @specs/auth.spec.dir/entities
  parent: @ref:specs/auth
  part: 1/3
  siblings:
    next: @ref:specs/auth.spec.dir/operations
  short: "Auth entities (User, Session, Token)"
  ---
```

---

## When Splitting Happens

### @split/triggers

```speclang
# @block:split/triggers @kind:entity
SplitTriggers:
  
  on_write:
    when: agent writes spec
    check: before write completes
    action: split if needed, write parts
    
  on_edit:
    when: spec is edited and grows
    check: after edit
    action: re-split if now over limit
    
  on_merge:
    when: parts shrink (edits reduce size)
    check: parts can merge
    action: merge back into single file
```

---

## Tool for Agents

### @split/tool

```speclang
# @block:split/tool @kind:entity
speclang_split_if_needed:
  params:
    path: String
    content: String
    strategy?: String
    
  returns:
    split: Boolean
    files:
      - path: String
        content: String
        part: Integer
        total: Integer
        
  usage:
    # Before writing, check if split needed
    result = speclang_split_if_needed(path, content)
    for file in result.files:
      write(file.path, file.content)
```

---

## Merging

### @split/merge

```speclang
# @block:split/merge @kind:entity
Merging:
  when: parts shrink below threshold
  
  threshold: 50% of max_tokens
  
  example:
    - part1: 3000 tokens
    - part2: 2500 tokens
    - combined: 5500 tokens (< 12000)
    - result: merge into single file
    
  benefit: reduces file count, simpler navigation
```

---

## Database Indexing

### @split/db

```speclang
# @block:split/db @kind:note
SQLite tracks splits:

- parent_id: reference to parent
- children: JSON array of child refs
- part: N/M indicator
- total_parts: M

Queries understand splits:
- search returns parent with part indicator
- get_tree includes all parts
- find_dependents follows to parent
```

---

## User Control

### @split/user-control

```speclang
# @block:split/user-control @kind:entity
UserCommands:
  
  /split <file>:
    manually split a file
    
  /merge <parent>:
    merge all parts back
    
  /split-status:
    show which files are split
    
  /split-limits:
    show current limits
    
ConfigChanges:
  - user can increase limits to avoid splits
  - user can disable auto-split (manual only)
  - user can set per-file overrides
```