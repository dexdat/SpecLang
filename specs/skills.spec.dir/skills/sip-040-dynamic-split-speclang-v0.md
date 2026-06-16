---
name: sip-040-dynamic-split-speclang-v0
title: "SIP 40: Dynamic Splitting"
version: 0.1.0
description: Auto-split specs into sub-specs when exceeding size limits
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 40: Dynamic Splitting

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines Dynamic Splitting—automatically splitting large specs into focused sub-specs.

### Quick Start

When specs exceed limits, they split into `.spec.spec.dir/` folders:
- `auth.spec.md` (12k tokens) → `auth.spec.spec.dir/` with sub-specs
- Sub-specs stay focused and manageable

### When to Read This

- **Size management**: When specs grow large
- **Splitting strategy**: How splitting works
- **Configuration**: Setting limits

### Related SIPs

- SIP 5: Splitting and Sizing
- SIP 4: Reference System
- SIP 42: Project Layout

## Abstract

This SIP defines Dynamic Splitting—when specs exceed user-defined size limits, the system automatically splits them into `.spec.spec.dir/` folders containing focused sub-specs. Sub-specs are better than bloated single files because each has clear, bounded context.

## Motivation

Large specs cause problems:
- Context bloat for agents
- Hard to navigate
- Difficult to maintain
- Poor signal-to-noise ratio

Splitting solves these by creating focused sub-specs.

## Rationale

**Split approach:**

1. **Detect**: Monitor spec sizes
2. **Split**: Create `.spec.spec.dir/` with sub-specs
3. **Index**: Parent becomes index with children refs
4. **Link**: Sub-specs link back to parent

## Specification

### Configuration

```yaml
SplitConfig:
  location: project.scl under config.split
  
  settings:
    max_tokens: 10000      # user-defined token limit
    max_lines: 800         # user-defined line limit
    max_chars: 60000       # user-defined character limit
    budget_overhead: 500   # extra budget for headers/refs
    strategy: smart        # smart | by-section | by-token
    
  defaults:
    max_tokens: 10000
    max_lines: 800
    max_chars: 60000
    budget_overhead: 500
    strategy: smart
```

### Budget Calculation

```yaml
BudgetCalculation:
  user_limit: 10000 tokens
  overhead: 500 tokens (headers + refs)
  budget_limit: 10500 tokens
  
  thresholds:
    - safe: tokens <= user_limit
    - warning: tokens > user_limit and <= budget_limit
    - critical: tokens > budget_limit
    
  warning_zone_behavior:
    - Try to fit within budget first
    - Optimize references
    - Split optional
    
  critical_zone_behavior:
    - Must split
    - Create .spec.spec.dir/ and sub-specs
```

### Directory Structure

```yaml
DirStructure:
  before_split:
    - specs/auth/login.spec.yaml (12k tokens)

  after_split:
    - specs/auth/login.spec.yaml (index, ~500 tokens)
    - specs/auth/login.spec.spec.dir/
      ├── overview.spec.yaml
      ├── entities.spec.yaml
      ├── operations.spec.yaml
      └── tests.spec.yaml
```

### Parent as Index

```yaml
ParentHeader:
  id: @specs/auth/login
  children:
    - "@ref:specs/auth/login.spec.spec.dir/overview
    - "@ref:specs/auth/login.spec.spec.dir/entities
    - "@ref:specs/auth/login.spec.spec.dir/operations
    - "@ref:specs/auth/login.spec.spec.dir/tests
  short: "Login (4 sub-specs)"
  
content: "See login.spec.spec.dir/ for details"
```

### Child Header

```yaml
ChildHeader:
  id: @specs/auth/login.spec.spec.dir/overview
  parent: @ref:specs/auth/login
  part: 1/4
  order: 1
  short: "Login overview"
```

### Splitting Logic

```python
def check_and_split(spec: Spec) -> list[Spec]:
    tokens = count_tokens(spec.content)
    user_limit = config.split.max_tokens
    budget_limit = user_limit + config.split.budget_overhead
    
    if tokens <= user_limit:
        return [spec]
    
    if tokens <= budget_limit:
        # Try optimization first
        optimized = optimize_refs(spec)
        if count_tokens(optimized) <= user_limit:
            return [optimized]
    
    # Must split
    return create_split(spec)
```

### Token Counting

```yaml
TokenCounting:
  method: tiktoken (cl100k_base)
  
  approximation:
    - 1 token ≈ 4 chars (English)
    - 1 token ≈ 0.75 words
    
  caching:
    - Count on write
    - Store in header
    - Recount only if changed
```

### Merging

```yaml
Merging:
  when: parts shrink below 50% of max_tokens
  
  threshold: 50% of max_tokens
  
  example:
    - part1: 3000 tokens
    - part2: 2500 tokens
    - combined: 5500 tokens (< 10000)
    - result: merge into single file
```

### Triggers

```yaml
SplitTriggers:
  on_write:
    when: agent writes spec
    check: before write completes
    action: split if needed
    
  on_edit:
    when: spec is edited and grows
    check: after edit
    action: re-split if over limit
    
  on_merge:
    when: parts shrink
    check: can merge
    action: merge back to single file
```

### User Commands

```yaml
UserCommands:
  /split <file>: manually split a file
  /merge <parent>: merge all parts back
  /split-status: show which files are split
  /split-limits: show current limits
```

## Examples

### Example 1: Before and After Split

```yaml
Before:
  specs/auth.spec.yaml (12,000 tokens)

After:
  specs/auth.spec.yaml (index)
  specs/auth.spec.spec.dir/
    ├── entities.spec.yaml (3,000 tokens)
    ├── operations.spec.yaml (4,000 tokens)
    └── policies.spec.yaml (3,500 tokens)
```

### Example 2: Configuration

```yaml
# project.scl
config:
  split:
    max_tokens: 10000
    max_lines: 800
    max_chars: 60000
    budget_overhead: 500
    strategy: smart
```

## Implementation

```python
from dataclasses import dataclass
from typing import Optional
import os

@dataclass
class SplitConfig:
    max_tokens: int = 10000
    max_lines: int = 800
    max_chars: int = 60000
    budget_overhead: int = 500
    strategy: str = "smart"

@dataclass
class SplitResult:
    split: bool
    files: list[dict]

class DynamicSplitter:
    def __init__(self, config: SplitConfig):
        self.config = config
        
    def check_and_split(self, path: str, content: str) -> SplitResult:
        tokens = self._count_tokens(content)
        budget = self.config.max_tokens + self.config.budget_overhead
        
        if tokens <= self.config.max_tokens:
            return SplitResult(split=False, files=[{"path": path, "content": content}])
            
        if tokens <= budget:
            optimized = self._optimize(content)
            if self._count_tokens(optimized) <= self.config.max_tokens:
                return SplitResult(split=False, files=[{"path": path, "content": optimized}])
        
        return self._create_split(path, content)
        
    def _create_split(self, path: str, content: str) -> SplitResult:
        dir_path = path.replace(".spec.md", ".spec.dir").replace(".spec.yaml", ".spec.dir")
        os.makedirs(dir_path, exist_ok=True)
        
        blocks = self._extract_blocks(content)
        files = []
        
        for i, block in enumerate(blocks):
            part_path = f"{dir_path}/part-{i+1}.spec.yaml"
            part_content = self._create_part(block, parent=path, part=i+1, total=len(blocks))
            files.append({"path": part_path, "content": part_content})
            
        index_content = self._create_index(path, files)
        files.insert(0, {"path": path, "content": index_content})
        
        return SplitResult(split=True, files=files)
```

## References

- "@ref:speclang/dynamic-split
- @ref:speclang/dynamic-split.spec.dir/strategy
- @ref:speclang/dynamic-split.spec.dir/token-budget
- SIP 5: Splitting and Sizing
- SIP 4: Reference System

## Copyright

This document is in the public domain.
