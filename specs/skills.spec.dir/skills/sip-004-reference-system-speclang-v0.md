---
name: sip-004-reference-system-speclang-v0
title: "SIP 4: Reference System"
version: 0.1.0
description: Universal reference system for linking specs
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 4: Reference System

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the universal reference system for linking specs.

### Quick Start

1. **File Reference:** `@ref:specs/auth`
2. **Block Reference:** `@ref:specs/auth#login`
3. **Header Field:** `refs: [@ref:specs/user]`
4. **In Content:** `See @ref:specs/auth#login`

### Example

```yaml
# speclang-header lines:7
id: @specs/auth/login
refs:
  - "@ref:specs/auth/entities#User
  - "@ref:specs/auth/policies#rate-limit
depends_on:
  - "@ref:stdlib/Result
---
```

### Key Concepts

- **@ref: Prefix:** Marks as reference
- **Path:** File location (without extension)
- **#block:** Specific block (optional)
- **Graph:** References create dependency graph

### When to Read This

- **Linking specs:** Create references between files
- **Querying:** Find dependents/dependencies
- **Cascades:** Understand what triggers what

### Related SIPs

- SIP 2: Header Format
- SIP 3: Block System
- SIP 7: Cascade System

## Abstract

This SIP defines the universal reference system for Speclang. References allow specs to link to each other, creating a dependency graph that prevents context loss.

## Motivation

Specs need to reference:
- Other specs
- Specific blocks
- North Star
- Standard library

Without a standard format, references become ambiguous and fragile.

## Rationale

**Format:** `@ref:path#block`

**Why this format?**
- `@` clearly marks it as a reference
- `ref:` namespace for different reference types (future)
- `path` locates the file
- `#block` identifies specific content

**Benefits:**
- Unambiguous
- Machine-parseable
- Human-readable
- Supports IDE navigation
- Enables graph queries

## Specification

### Reference Format

**Full Format:** `@ref:domain/path#block-id`

**Components:**

| Component | Required | Description |
|-----------|----------|-------------|
| `@ref:` | Yes | Reference marker |
| `domain/path` | Yes | File path (without extension) |
| `#block-id` | Optional | Specific block |

### Path Format

**Structure:** `domain/path`

**Rules:**
- Lowercase
- Forward slashes
- No extension
- Matches file ID

**Examples:**
```
specs/auth           → specs/auth.spec.yaml
specs/auth/login     → specs/auth/login.spec.yaml
stdlib/Result        → stdlib/Result.spec.yaml
northstar            → project.scl
```

### Block ID Format

**Structure:** `#block-id`

**Rules:**
- Lowercase
- Hyphen-separated
- Unique within file
- Matches block declaration

**Examples:**
```
#login
#entities/user
#rate-limit-policy
```

### Complete Examples

**File Reference:**
```
@ref:specs/auth
@ref:specs/auth/entities
@ref:northstar
```

**Block Reference:**
```
@ref:specs/auth#login
@ref:specs/auth/entities#user
@ref:specs/auth/policies#rate-limit
```

### Reference Types

**Current Types:**

| Type | Format | Purpose |
|------|--------|---------|
| `ref` | `@ref:...` | General reference |

**Future Types:**

| Type | Format | Purpose |
|------|--------|---------|
| `issue` | `@issue:123` | Issue tracker |
| `pr` | `@pr:456` | Pull request |
| `commit` | `@commit:abc123` | Git commit |
| `version` | `@version:1.0.0` | Version |

### Using References

**In Headers:**

```yaml
# speclang-header lines:12
id: @specs/auth/login
refs:
  - "@ref:specs/auth/entities#User
  - "@ref:specs/auth/policies#rate-limit
depends_on:
  - "@ref:stdlib/Result
  - "@ref:stdlib/JWT
```

**In Blocks:**

```markdown
# @block:auth/login @kind:operation
refs:
  - "@ref:specs/auth/entities#User
  - "@ref:specs/auth/policies#rate-limit
  - "@ref:northstar#auth
```

**In Code:**

```go
// SPECLANG-ID: @ref:specs/auth/login
func Login(...) {...}

// SPECLANG-PARENT: @ref:specs/auth
// SPECLANG-REFS: @ref:specs/auth/entities#User
```

**In Text:**

```markdown
The login operation (@ref:specs/auth#login) uses 
the User entity (@ref:specs/auth/entities#user).
```

### Reference Headers

**Standard Header Fields:**

```yaml
refs:              # Outgoing references
  - "@ref:specs/user
depends_on:       # Dependencies
  - "@ref:stdlib/Result
children:          # Child specs
  - "@ref:specs/auth/entities
  - "@ref:specs/auth/operations
parent:            # Parent spec
  @ref:specs/auth
```

**Reference vs Depends On:**

- `refs`: "This mentions..." (any reference)
- `depends_on`: "This requires..." (dependency)

**Example:**
```yaml
# Login mentions User but depends on Result
refs: [@ref:specs/user]
depends_on: [@ref:stdlib/Result]
```

## Reference Resolution

### Algorithm

```python
def resolve_reference(ref_str, current_file):
    # Parse reference
    ref = parse_ref(ref_str)
    
    # Check if block-specific
    if ref.block:
        # Look up file, then block
        file = find_file(ref.path)
        block = find_block(file, ref.block)
        return block
    else:
        # Return entire file
        return find_file(ref.path)
```

### Resolution Rules

1. **Path Resolution:**
   - Relative to project root
   - No `..` allowed (security)
   - Must exist

2. **Block Resolution:**
   - Find file first
   - Then find block
   - Block must exist

3. **Circular Detection:**
   - Build dependency graph
   - Detect cycles
   - Error on circular

### Validation

**Checks:**

1. **Format Valid:**
   - Starts with `@`
   - Has `ref:`
   - Valid path format
   - Valid block format (if present)

2. **Target Exists:**
   - File exists
   - Block exists (if specified)

3. **No Circular:**
   - Dependencies don't loop
   - Parent/child no cycles

**Errors:**
```
Error: Invalid reference ""@ref:specs/auth#login"  File not found: specs/auth.spec.yaml

Error: Invalid reference ""@ref:specs/auth#login"  Block not found: "login" in specs/auth.spec.yaml

Error: Circular dependency detected
  specs/auth → specs/user → specs/auth
```

## Reference Graph

### Building the Graph

```python
def build_graph(files):
    graph = {}
    
    for file in files:
        graph[file.id] = {
            'refs': file.header.refs,
            'depends_on': file.header.depends_on,
            'children': file.header.children,
            'parent': file.header.parent
        }
    
    return graph
```

### Graph Queries

**Find Dependents:**
```sql
SELECT file_path 
FROM specs 
WHERE refs LIKE '%"@specs/auth"%'
```

**Find Dependencies:**
```sql
SELECT depends_on 
FROM specs 
WHERE id = '@specs/auth/login'
```

**Get Tree:**
```sql
-- Recursive CTE for tree
```

## Integration

**With SQLite:**
- References stored as JSON
- Indexed for fast queries
- Graph traversal via SQL

**With Cascade:**
- Changes trigger dependents
- Graph determines order
- Circular blocks cascade

**With IDE:**
- Click to navigate
- Show references
- Refactor safely

## Backwards Compatibility

**Old References:**
- Plain text links
- Auto-converted
- Validation warnings

## Examples

### Complete Reference Example

```markdown
---
# speclang-header lines:15
id: @specs/auth/login
version: 1.0.0
parent: @ref:specs/auth
depends_on:
  - "@ref:specs/auth/entities#User
  - "@ref:specs/auth/policies#rate-limit
  - "@ref:stdlib/Result
refs:
  - "@ref:northstar#auth
  - "@ref:specs/user
---

# @block:auth/login @kind:operation
login(email: String, password: String) -> Result<Token, Error>:

inputs:
  - email: String @ref:specs/auth/entities#User.email

steps:
  1. Find @ref:specs/auth/entities#User
  2. Check @ref:specs/auth/policies#rate-limit
  3. Return @ref:stdlib/Result

refs:
  - "@ref:specs/auth/entities#User
  - "@ref:specs/auth/policies#rate-limit
```

### Code Markers

```go
// SPECLANG-ID: @ref:specs/auth/login
// SPECLANG-GENERATED: 2024-01-15T10:30:00Z
// SPECLANG-FROM: @ref:specs/auth/login.go.spec
func Login(email, password string) (*Token, error) {
    // Implementation
}
```

## References

- SIP 2: Header Format
- SIP 3: Block System
- SIP 5: Splitting and Sizing

## Copyright

This document is in the public domain.