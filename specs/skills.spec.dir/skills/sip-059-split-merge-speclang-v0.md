---
name: sip-059-split-merge-speclang-v0
title: "SIP 59: Spec Split and Merge"
version: 0.1.0
description: Rules and processes for splitting and merging specs
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 59: Spec Split and Merge

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines rules and processes for splitting and merging Speclang specs.

### Quick Start

1. **Split Trigger:** Spec exceeds size limits
2. **Split Result:** Parent index + children in `.spec.dir/`
3. **Merge Trigger:** Children shrink below threshold
4. **Merge Result:** Single combined spec

### Example

```
Before: auth.spec.yaml (12k tokens)

After Split:
  auth.spec.yaml (index, 500 tokens)
  auth.spec.spec.dir/
    ├── entities.spec.yaml (3k tokens)
    ├── operations.spec.yaml (3.5k tokens)
    └── policies.spec.yaml (2k tokens)
```

### Key Concepts

- **Split:** Large spec → index + children
- **Merge:** Small children → single spec
- **Thresholds:** Based on token/line/char limits
- **References:** Bidirectional parent/child refs

### When to Read This

- **Large specs:** Understanding split behavior
- **Merging:** Combining split parts
- **Configuration:** Setting limits

### Related SIPs

- SIP 5: Splitting and Sizing
- SIP 40: Dynamic Split
- SIP 4: Reference System

## Abstract

This SIP defines the complete rules and processes for splitting oversized specs into manageable parts and merging split parts back together when they shrink.

## Motivation

Specs need:
- Size management for AI context limits
- Logical organization
- Maintainable file sizes
- Ability to recombine when appropriate

## Rationale

**Split Rules:**
- Split at block boundaries
- Preserve logical groupings
- Create bidirectional refs
- Maintain spec integrity

**Merge Rules:**
- Combine when under threshold
- Preserve all content
- Update references
- Clean up `.spec.dir/` folders

## Specification

### Size Thresholds

**Configuration:**

```yaml
config:
  split:
    # Limits
    max_tokens: 10000
    max_lines: 800
    max_chars: 60000
    
    # Budget (real limit = limit + overhead)
    budget_overhead: 500
    
    # Strategy
    strategy: smart  # smart | by-section | by-token
    
    # Merge threshold (% of max)
    merge_threshold: 0.5  # 50% of max
```

### Split Rules

**When to Split:**

```python
def should_split(spec: Spec, config: Config) -> bool:
    size = estimate_size(spec)
    effective_limit = config.max_tokens + config.budget_overhead
    
    # Check if over limit
    if size.tokens > effective_limit:
        return True
    
    # Check other metrics
    if size.lines > config.max_lines:
        return True
    
    if size.chars > config.max_chars:
        return True
    
    return False
```

**Split Strategies:**

```yaml
SplitStrategy:
  smart:
    description: "Split at block boundaries, preserve logical groupings"
    preferred: true
    algorithm: group_blocks_smartly
    
  by-section:
    description: "Split at ## headings"
    preferred: false
    algorithm: split_at_sections
    
  by-token:
    description: "Hard token limit, may split mid-block"
    preferred: false
    algorithm: split_at_token_limit
```

**Split Locations:**

```yaml
AllowedSplitLocations:
  - Between top-level blocks
  - Between sections (##)
  - Between major entities
  - NOT mid-paragraph
  - NOT mid-code-block
  - NOT mid-entity-definition
```

### Split Process

**Step-by-Step:**

```python
def split_spec(file_path: str, content: str) -> SplitResult:
    # 1. Parse spec
    spec = parse_spec(content)
    
    # 2. Check if split needed
    if not should_split(spec, config):
        return SplitResult(split=False)
    
    # 3. Group blocks
    groups = group_blocks(spec.blocks, strategy=config.strategy)
    
    # 4. Create parent index
    parent = create_parent_index(spec, groups)
    
    # 5. Create children
    children = []
    for i, group in enumerate(groups):
        child = create_child_spec(spec, group, i, len(groups))
        children.append(child)
    
    # 6. Write files
    write_file(file_path, parent)
    dir_path = create_dir(file_path)
    for child in children:
        write_file(f"{dir_path}/{child.name}", child.content)
    
    # 7. Update database
    update_spec_index(parent, children)
    
    return SplitResult(split=True, parent=parent, children=children)
```

### Parent Index Structure

**Parent Format:**

```yaml
# speclang-header lines:15
id: @specs/auth
version: 1.0.0
children:
  - @ref:specs/auth.spec.dir/entities
  - @ref:specs/auth.spec.dir/operations
  - @ref:specs/auth.spec.dir/policies
short: "Authentication system (split into 3 parts)"
part: 0/3
total_parts: 3
---

# Auth System

This spec has been split into focused sub-specs. 
See `auth.spec.dir/` for details.

## Sub-specs

| Part | Description | Size |
|------|-------------|------|
| entities | Data models | 3k tokens |
| operations | API endpoints | 3.5k tokens |
| policies | Security rules | 2k tokens |
```

### Child Spec Structure

**Child Format:**

```yaml
# speclang-header lines:12
id: @specs/auth.spec.dir/entities
parent: @ref:specs/auth
part: 1/3
siblings:
  prev: null
  next: @ref:specs/auth.spec.dir/operations
order: 1
short: "Auth entities (User, Session, Token)"
---

# Auth Entities

## @auth/entities

User:
  id: UUID
  email: String
  ...

Session:
  id: UUID
  user_id: UUID
  ...
```

### Directory Naming

**Naming Rules:**

```yaml
DirectoryNaming:
  pattern: "{parent-name}.spec.dir/"
  
  examples:
    auth.spec.yaml → auth.spec.dir/
    user-management.spec.yaml → user-management.spec.dir/
    api-endpoints.spec.yaml → api-endpoints.spec.dir/
  
  child_naming:
    pattern: "{topic}.spec.yaml" or "{N}-{topic}.spec.yaml"
    examples:
      - entities.spec.yaml
      - operations.spec.yaml
      - 01-overview.spec.yaml
      - 02-entities.spec.yaml
```

### Merge Rules

**When to Merge:**

```python
def should_merge(children: List[Spec], config: Config) -> bool:
    # Calculate combined size
    total_size = sum(estimate_size(c) for c in children)
    merge_threshold = config.max_tokens * config.merge_threshold
    
    # Check if under threshold
    if total_size.tokens < merge_threshold:
        return True
    
    # User-requested merge
    # (handled separately)
    
    return False
```

**Merge Conditions:**

```yaml
MergeConditions:
  automatic:
    - Combined size < 50% of max_tokens
    - All children exist
    - No conflicts in content
    
  manual:
    - User requests merge
    - Via CLI: speclang merge auth.spec.dir/
```

### Merge Process

**Step-by-Step:**

```python
def merge_specs(dir_path: str) -> MergeResult:
    # 1. Find parent and children
    parent = find_parent(dir_path)
    children = find_children(dir_path)
    
    # 2. Validate merge is safe
    if not can_merge(parent, children):
        return MergeResult(success=False, reason="Merge conditions not met")
    
    # 3. Combine content
    combined = combine_specs(parent, children)
    
    # 4. Check combined size
    if should_split(combined, config):
        return MergeResult(success=False, reason="Combined spec too large")
    
    # 5. Update references
    update_references(parent, children)
    
    # 6. Write merged file
    merged_path = get_merged_path(parent)
    write_file(merged_path, combined.content)
    
    # 7. Delete children and dir
    for child in children:
        delete_file(child.path)
    delete_dir(dir_path)
    
    # 8. Update database
    update_spec_index_after_merge(parent, children, merged_path)
    
    return MergeResult(success=True, path=merged_path)
```

### Reference Updates

**On Split:**

```python
def update_refs_on_split(parent_id: str, children: List[Spec]):
    # Find all refs to parent
    refs_to_parent = find_references_to(parent_id)
    
    # For each ref, check if should point to child
    for ref in refs_to_parent:
        if ref.is_block_specific():
            # Find which child has the block
            child = find_child_with_block(children, ref.block_id)
            if child:
                update_reference(ref, child.id)
```

**On Merge:**

```python
def update_refs_on_merge(parent_id: str, children: List[Spec]):
    # Find all refs to children
    for child in children:
        refs_to_child = find_references_to(child.id)
        
        # Update each ref to point to parent
        for ref in refs_to_child:
            if ref.is_block_specific():
                update_reference(ref, parent_id, ref.block_id)
            else:
                update_reference(ref, parent_id)
```

### Bidirectional Links

**Parent → Children:**

```yaml
# In parent header
children:
  - @ref:specs/auth.spec.dir/entities
  - @ref:specs/auth.spec.dir/operations
```

**Children → Parent:**

```yaml
# In child header
parent: @ref:specs/auth
siblings:
  prev: @ref:specs/auth.spec.dir/entities
  next: @ref:specs/auth.spec.dir/policies
```

### Database Schema

**SQLite Tables:**

```sql
-- Track split relationships
CREATE TABLE spec_splits (
  id INTEGER PRIMARY KEY,
  parent_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  part_number INTEGER NOT NULL,
  total_parts INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES specs(id),
  FOREIGN KEY (child_id) REFERENCES specs(id)
);

CREATE INDEX idx_splits_parent ON spec_splits(parent_id);
CREATE INDEX idx_splits_child ON spec_splits(child_id);

-- Track split history
CREATE TABLE split_history (
  id INTEGER PRIMARY KEY,
  action TEXT NOT NULL,  -- 'split' or 'merge'
  spec_id TEXT NOT NULL,
  details JSON NOT NULL,
  created_at TEXT NOT NULL
);
```

## Implementation

### Split Manager

```python
class SplitManager:
    def __init__(self, db: SQLite, config: Config):
        self.db = db
        self.config = config
    
    def check_and_split(self, spec: Spec) -> Optional[SplitResult]:
        if not self.should_split(spec):
            return None
        
        return self.perform_split(spec)
    
    def should_split(self, spec: Spec) -> bool:
        size = self.estimate_size(spec)
        limit = self.config.max_tokens + self.config.budget_overhead
        return size.tokens > limit
    
    def perform_split(self, spec: Spec) -> SplitResult:
        # Group blocks
        groups = self.group_blocks(spec.blocks)
        
        # Create parent
        parent = self.create_parent(spec, groups)
        
        # Create children
        children = []
        for i, group in enumerate(groups):
            child = self.create_child(spec, group, i + 1, len(groups))
            children.append(child)
        
        # Write files
        self.write_split_files(spec.path, parent, children)
        
        # Log history
        self.log_split(spec, parent, children)
        
        return SplitResult(parent=parent, children=children)
    
    def group_blocks(self, blocks: List[Block]) -> List[List[Block]]:
        if self.config.strategy == 'smart':
            return self.group_blocks_smart(blocks)
        elif self.config.strategy == 'by-section':
            return self.group_blocks_by_section(blocks)
        else:
            return self.group_blocks_by_token(blocks)
    
    def estimate_size(self, spec: Spec) -> Size:
        content = render_spec(spec)
        return Size(
            tokens=count_tokens(content),
            lines=content.count('\n'),
            chars=len(content)
        )
```

### Merge Manager

```python
class MergeManager:
    def __init__(self, db: SQLite, config: Config):
        self.db = db
        self.config = config
    
    def check_and_merge(self, dir_path: str) -> Optional[MergeResult]:
        children = self.find_children(dir_path)
        
        if not self.should_merge(children):
            return None
        
        return self.perform_merge(dir_path, children)
    
    def should_merge(self, children: List[Spec]) -> bool:
        total = sum(self.estimate_size(c) for c in children)
        threshold = self.config.max_tokens * self.config.merge_threshold
        return total.tokens < threshold
    
    def perform_merge(self, dir_path: str, children: List[Spec]) -> MergeResult:
        parent = self.find_parent(dir_path)
        
        # Combine content
        combined = self.combine_specs(parent, children)
        
        # Write merged file
        merged_path = self.get_merged_path(parent)
        self.write_file(merged_path, combined)
        
        # Cleanup
        self.cleanup_children(children, dir_path)
        
        # Update refs
        self.update_references(parent, children)
        
        # Log history
        self.log_merge(parent, children, merged_path)
        
        return MergeResult(success=True, path=merged_path)
```

## CLI Commands

```bash
# Check if spec needs split
speclang split check specs/auth.spec.yaml

# Force split a spec
speclang split specs/auth.spec.yaml

# Check if dir can merge
speclang merge check specs/auth.spec.dir/

# Force merge a dir
speclang merge specs/auth.spec.dir/

# View split history
speclang split history @specs/auth

# Auto-split all oversized specs
speclang split all
```

## Configuration

```yaml
config:
  split:
    max_tokens: 10000
    max_lines: 800
    max_chars: 60000
    budget_overhead: 500
    strategy: smart
    merge_threshold: 0.5
    auto_split: true
    auto_merge: false
```

## References

- SIP 5: Splitting and Sizing
- SIP 40: Dynamic Split
- SIP 4: Reference System
- SIP 32: Directory Structure

## Copyright

This document is in the public domain.
