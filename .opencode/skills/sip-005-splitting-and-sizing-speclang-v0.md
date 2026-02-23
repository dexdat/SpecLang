---
name: sip-005-splitting-and-sizing-speclang-v0
title: "SIP 5: Splitting and Sizing"
version: 0.1.0
description: Dynamic spec splitting when size limits exceeded
category: standard
---

# SIP 5: Splitting and Sizing

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines dynamic spec splitting when size limits are exceeded.

### Quick Start

1. **Limits:** `max_tokens: 10000`, `max_lines: 800`, `max_chars: 60000`
2. **Budget:** `budget_overhead: 500` (real limit: 10500)
3. **When Split:** Spec exceeds limit
4. **Result:** Creates `.spec.dir/` folder with children

### Example

```
Before: auth.spec.yaml (12k tokens)

After:
  auth.spec.yaml (index, 500 tokens)
  auth.spec.spec.dir/
    ├── entities.spec.yaml
    ├── operations.spec.yaml
    └── tests.spec.yaml
```

### Key Concepts

- **User Limits:** Configured in project.scl
- **Budget Overhead:** Extra tokens for headers/refs
- **Smart Splitting:** At block boundaries
- **Parent/Child:** Bidirectional refs

### When to Read This

- **Large specs:** Understand splitting
- **Configuring:** Set limits
- **Merging:** Combine split files

### Related SIPs

- SIP 2: Header Format
- SIP 4: Reference System
- SIP 8: Configuration

## Abstract

This SIP defines the dynamic splitting system for Speclang. When specs exceed user-defined size limits, they automatically split into a parent index file and child specs in a `.spec.dir/` folder.

## Motivation

AI models have token limits. Large specs:
- Exceed context windows
- Become hard to review
- Slow down processing
- Waste tokens

## Rationale

**User-Defined Limits:**
- `max_tokens: 10000`
- `max_lines: 800`
- `max_chars: 60000`

**Budget Overhead:**
- Real limit: limit + overhead
- Overhead accounts for headers and refs
- Example: 10000 + 500 = 10500

**Split Strategy:**
- Parent becomes index
- Children in `.spec.dir/` folder
- Bidirectional refs
- Natural boundaries

## Specification

### Size Limits

**Configured in project.scl:**

```yaml
config:
  split:
    max_tokens: 10000
    max_lines: 800
    max_chars: 60000
    budget_overhead: 500
    strategy: smart  # smart | by-section | by-token
```

**Per-Agent Overrides:**

```yaml
config:
  agents:
    spec-writer:
      max_tokens: 8000
    code-gen:
      max_lines: 500
```

### When to Split

**Check before write:**

```python
def should_split(spec):
    size = estimate_size(spec)
    
    if size.tokens <= config.max_tokens:
        return False  # No split needed
    
    if size.tokens <= config.max_tokens + config.budget_overhead:
        return False  # Within budget
    
    return True  # Must split
```

**After edit:**
- Spec grows beyond limit
- Trigger split
- Create children

### Split Strategies

**smart:**
- Split at block boundaries
- Preserve logical groupings
- Preferred strategy

**by-section:**
- Split at `##` headings
- Simple and predictable

**by-token:**
- Hard token limit
- May split mid-block
- Last resort

### Split Process

**Before:**
```
specs/auth.spec.yaml (12,000 tokens)
  - Block: overview
  - Block: entities
  - Block: operations
  - Block: policies
  - Block: tests
```

**After:**
```
specs/auth.spec.yaml (index, 500 tokens)
specs/auth.spec.spec.dir/
  ├── overview.spec.yaml (2,000 tokens)
  ├── entities.spec.yaml (3,000 tokens)
  ├── operations.spec.yaml (3,500 tokens)
  ├── policies.spec.yaml (2,000 tokens)
  └── tests.spec.yaml (1,000 tokens)
```

### Parent (Index File)

**Structure:**
```yaml
# speclang-header lines:15
id: @specs/auth
version: 1.0.0
children:
  - @ref:specs/auth.spec.spec.dir/overview
  - @ref:specs/auth.spec.spec.dir/entities
  - @ref:specs/auth.spec.spec.dir/operations
  - @ref:specs/auth.spec.spec.dir/policies
  - @ref:specs/auth.spec.spec.dir/tests
short: "Authentication system (split into 5 parts)"
---

# @block:auth/overview @kind:note
This spec has been split. See children in auth.spec.spec.dir/

# @block:auth/index @kind:table
| Part | Description | Size |
|------|-------------|------|
| overview | System overview | 2k tokens |
| entities | Data models | 3k tokens |
| operations | API endpoints | 3.5k tokens |
| policies | Security rules | 2k tokens |
| tests | Test cases | 1k tokens |
```

### Children

**Structure:**
```yaml
# speclang-header lines:12
id: @specs/auth.spec.spec.dir/entities
parent: @ref:specs/auth
part: 2/5
siblings:
  prev: @ref:specs/auth.spec.spec.dir/overview
  next: @ref:specs/auth.spec.spec.dir/operations
order: 2
short: "Auth entities (User, Session, Token)"
refs:
  - @ref:specs/auth.spec.spec.dir/overview
---

# @block:auth/entities @kind:entity
User:
  id: UUID
  email: String
  ...

Session:
  id: UUID
  user_id: UUID
  ...
```

### Directory Structure

**Naming:**
```
{parent-name}.spec.spec.dir/
```

**Examples:**
```
auth.spec.spec.dir/
user-management.spec.spec.dir/
api-endpoints.spec.spec.dir/
```

**Content:**
- One spec per logical unit
- Named descriptively
- Ordered (01-, 02-, or by name)
- Each has header with parent ref

### Merging

**When to merge:**
- Parts shrink
- Combined size < 50% of limit
- User requests merge

**Process:**
```
Before:
  part1: 3,000 tokens
  part2: 2,500 tokens
  combined: 5,500 tokens (< 10,000)

After:
  Merge into single file
  Delete .spec.dir/ folder
  Update refs
```

## Database Indexing

**SQLite tracks splits:**

```sql
CREATE TABLE specs (
  file_path TEXT PRIMARY KEY,
  id TEXT,
  parent_id TEXT,      -- For children
  children JSON,       -- For parents
  part INTEGER,        -- N
  total_parts INTEGER, -- M
  ...
);
```

**Queries:**

```sql
-- Find children
SELECT * FROM specs WHERE parent_id = '@specs/auth';

-- Find parent
SELECT * FROM specs WHERE id = (
  SELECT parent_id FROM specs WHERE id = '@specs/auth.spec.spec.dir/entities'
);

-- Tree
WITH RECURSIVE tree AS (...)
```

## Implementation

### Split Function

```python
def split_spec(file_path, content):
    # Check size
    size = estimate_size(content)
    if not should_split(size):
        return [content]
    
    # Parse blocks
    blocks = parse_blocks(content)
    
    # Group blocks
    groups = group_blocks(blocks, strategy='smart')
    
    # Create parent
    parent = create_parent(file_path, groups)
    
    # Create children
    children = []
    for i, group in enumerate(groups):
        child = create_child(file_path, group, i+1, len(groups))
        children.append(child)
    
    # Write files
    write_file(file_path, parent)
    for child in children:
        write_file(child.path, child.content)
    
    return [parent] + children
```

### Size Estimation

```python
def estimate_size(content):
    return Size(
        tokens=count_tokens(content),
        lines=content.count('\n'),
        chars=len(content)
    )

def count_tokens(text):
    # Use tiktoken or similar
    return tokenizer.encode(text)
```

### Block Grouping

**Smart Strategy:**
```python
def group_blocks(blocks, max_size):
    groups = []
    current_group = []
    current_size = 0
    
    for block in blocks:
        block_size = estimate_size(block)
        
        if current_size + block_size > max_size:
            groups.append(current_group)
            current_group = [block]
            current_size = block_size
        else:
            current_group.append(block)
            current_size += block_size
    
    if current_group:
        groups.append(current_group)
    
    return groups
```

## Integration

**With Cascade:**
- Split triggers children
- Parent and children cascade
- Changes bubble up

**With Git:**
- Parent commit first
- Children commit
- Clear history

**With IDE:**
- Show as collapsed tree
- Navigate between parts
- Search across all

## Examples

### Simple Split

**Before:**
```yaml
# auth.spec.yaml (12k tokens)
id: @specs/auth
blocks:
  - overview
  - entities
  - operations
  - policies
```

**After:**
```yaml
# auth.spec.yaml (index)
id: @specs/auth
children:
  - @ref:specs/auth.spec.spec.dir/entities
  - @ref:specs/auth.spec.spec.dir/operations
```

```yaml
# auth.spec.spec.dir/entities.spec.yaml
id: @specs/auth.spec.spec.dir/entities
parent: @ref:specs/auth
```

```yaml
# auth.spec.spec.dir/operations.spec.yaml
id: @specs/auth.spec.spec.dir/operations
parent: @ref:specs/auth
```

### Complex Split

**Original:**
```
specs/
  api.spec.yaml (15k tokens)
    - REST endpoints
    - GraphQL schema
    - WebSocket handlers
    - Rate limits
    - Authentication
    - Validation
```

**After:**
```
specs/
  api.spec.yaml (index)
  api.spec.spec.dir/
    ├── 01-rest.spec.yaml
    ├── 02-graphql.spec.yaml
    ├── 03-websocket.spec.yaml
    ├── 04-rate-limits.spec.yaml
    ├── 05-auth.spec.yaml
    └── 06-validation.spec.yaml
```

## Backwards Compatibility

**Old Specs:**
- May exceed limits
- Gradual migration
- No forced split

## References

- SIP 2: Header Format
- SIP 3: Block System
- SIP 4: Reference System

## Copyright

This document is in the public domain.