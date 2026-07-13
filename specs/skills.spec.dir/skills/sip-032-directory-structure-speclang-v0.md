---
name: sip-032-directory-structure-speclang-v0
title: "SIP 32: Directory Structure"
version: 0.1.0
description: Hierarchical spec organization using .spec.dir/ folders
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 32: Directory Structure

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the Directory Structure—hierarchical spec organization using `.spec.dir/` folders.

### Quick Start

Structure pattern:
1. **Leaf specs**: `auth.spec.md` (single file)
2. **Sub-specs**: `auth.spec.dir/` (folder with sub-specs)
3. **References**: Children reference parent via `@ref`
4. **Unlimited depth**: Nest as deep as needed

### When to Read This

- **Organizing specs**: When to create .spec.dir/
- **Creating sub-specs**: Naming conventions
- **Understanding hierarchy**: Parent-child relationships

### Related SIPs

- SIP 2: Header Format
- SIP 4: Reference System
- SIP 31: Symlinks

## Abstract

This SIP defines the Directory Structure—hierarchical spec organization using `.spec.dir/` folders for sub-specs. Spec files can be leaf specs (single file) or have sub-specs organized in `.spec.dir/` folders. Sub-specs are encouraged for focused context and modular organization.

## Motivation

Flat spec files become problematic:
- Large files hard to navigate
- Too much context at once
- Difficult to find specific content

Sub-specs solve this:
- Focused, modular specs
- Easier to understand and maintain
- Natural hierarchy representation
- Avoids context bloat

## Rationale

**Sub-specs are a feature, not a problem:**

1. **Focused context**: Each spec stays small
2. **Modular**: Easy to understand pieces
3. **Maintainable**: Changes isolated
4. **Deep hierarchy**: Natural organization

## Specification

### Directory Pattern

```yaml
DirectoryPattern:
  spec_file:
    examples:
      - "auth.scl"
      - "auth.spec.md"
      - "auth.spec.yaml"
      - "auth.go.spec"
      
  spec_dir:
    pattern: "*.spec.dir/"
    examples:
      - "auth.spec.dir/"
      - "auth.spec.dir/entities.scl"
      - "auth.spec.dir/operations.scl"
      
  nesting:
    unlimited_depth: true
    examples:
      - "auth.spec.dir/"
      - "auth.spec.dir/login.spec.dir/"
      - "auth.spec.dir/login.spec.dir/handler.go.spec"
```

### Example Structure

```yaml
DirectoryTree:
  specs/:
    project_scl: "north star (level 0)"
    
    auth_spec_md: "level 1 overview"
    auth_dir:
      entities_spec_yaml: null
      operations_spec_yaml: null
      policies_spec_yaml: null
      
      login_dir: "level 3+ login details"
      login_dir_handler_go_spec: "→ generated/go/auth/login/handler.go"
      login_dir_flow_spec_md: null
      
      jwt_dir:
        token_go_spec: null
        validator_go_spec: null
        
    user_spec_md: null
    user_dir:
      profile_spec_yaml: null
      settings_spec_yaml: null
      
  tests/:
    auth_test_spec_scl: null
    auth_dir:
      login_test_spec_scl: null
      jwt_test_spec_scl: null
      
  generated/:
    go/:
      auth/:
        login/:
          handler_go: null
        jwt/:
          token_go: null
          validator_go: null
```

### Parent-Child References

```yaml
ReferencePattern:
  child_to_parent:
    - "auth.spec.dir/entities.scl references ""@ref:specs/auth    - "auth.spec.dir/login.spec.dir/handler.go.spec references ""@ref:specs/auth.spec.dir/login    
  parent_to_children:
    - "auth.spec.md lists children in header"
    - "SQLite tracks relationships"
    
  header_example:
    id: "@specs/auth/entities"
    parent: ""@ref:specs/auth    children: []
```

### Creating New Specs

```yaml
createSpec():
  params:
    parent: Path
    name: String
    kind: SpecKind
    
  steps:
    1: "Determine parent type (file or directory)"
    2: "If parent is a file, create corresponding .spec.dir/ if not exists"
    3: "Determine appropriate file extension based on kind"
    4: "Create spec file at appropriate path"
    5: "If spec requires sub-directory, create .spec.dir/ subdirectory"
    6: "Return path to created spec file"
    
  rules:
    - "If parent is file (auth.spec.md):"
        - "Create auth.spec.dir/ if not exists"
        - "Create auth.spec.dir/{name}.spec.*"
    - "If parent is dir (auth.spec.dir/):"
        - "Create auth.spec.dir/{name}.spec.*"
    - "If needs sub-dir:"
        - "Create auth.spec.dir/{name}.spec.dir/"
        - "Create auth.spec.dir/{name}.spec.dir/{sub}.spec.*"
        
  examples:
    - input: 'createSpec("auth.spec.md", "login", "operation")'
      output: "creates auth.spec.dir/login.spec.yaml"
    - input: 'createSpec("auth.spec.dir/login.spec.yaml", "handler", "code")'
      output: "creates auth.spec.dir/login.spec.dir/handler.go.spec"
```

### SQLite Tree Queries

```sql
-- Get all children of a spec
SELECT path FROM specs
WHERE depends_on LIKE '%@ref:specs/auth%';

-- Get full tree with recursion
WITH RECURSIVE tree AS (
  SELECT path, id, 0 as depth FROM specs WHERE path = 'specs/auth.spec.md'
  UNION ALL
  SELECT s.path, s.id, t.depth + 1
  FROM specs s, tree t
  WHERE s.depends_on LIKE '%' || t.id || '%'
)
SELECT * FROM tree ORDER BY depth;

-- Get parent
SELECT * FROM specs
WHERE id = (SELECT parent_id FROM specs WHERE path = 'specs/auth.spec.dir/entities.scl');
```

### Flattening for Processing

```yaml
FlatteningStrategy:
  purpose: "load tree into memory efficiently"
  
  approach:
    - "SQLite already has flat index"
    - "Load by level (0, then 1, then 2...)"
    - "Or load by dependency order"
    - "Cache in memory during cascade"
    
  benefits:
    - "Fast graph traversal"
    - "No directory walking needed"
    - "Single query for all dependents"
```

### File vs Directory Comparison

```yaml
Comparison:
  file_auth_spec_md:
    type: "Single spec"
    level: "1-2"
    content: "Overview"
    structure: "Direct content"
    focus: "One focus"
    
  directory_auth_spec_dir:
    type: "Modular specs"
    level: "Any level"
    content: "Details"
    structure: "Contained sub-specs"
    focus: "Multiple focused specs"
```

### Naming Conventions

```yaml
NamingRules:
  spec_files:
    format: "lowercase with hyphens"
    examples:
      - "auth.spec.md"
      - "user-profile.spec.yaml"
      
  spec_dirs:
    format: "same name as parent spec + .dir"
    examples:
      - "auth.spec.md → auth.spec.dir/"
      
  sub_specs:
    format: "descriptive name"
    examples:
      - "login.spec.yaml"
      - "jwt-handler.go.spec"
```

### Expansion Depth

```yaml
DepthControl:
  level_0:
    files: "project.scl"
    owner: "user + orchestrator"
    
  level_1:
    files: "*.spec.md (overviews)"
    dirs: "created as needed"
    
  level_2:
    files: "*.spec.dir/*.spec.yaml"
    owner: "spec-writer"
    
  level_3_plus:
    files: "deeper .dir nesting"
    owner: "spec-writer"
    
  level_10:
    files: "*.go.spec (direct mapping)"
    owner: "code-gen"
    
  note: "Nesting depth is unlimited; levels shown are typical patterns"
```

### Code Location

```yaml
CodeLocation:
  principle: "Code LIVES in specs/, not regenerated on every clone"
  
  why:
    - "People don't want to regenerate everything on every clone"
    - "Specs express code in natural language for AI guidance"
    - "Helps AI think slowly - take a spec, add nested graph-linked depth"
    - "SpecLang writes one file at a time, context stays focused"
    
  pattern:
    specs/:
      scripts_spec_dir/:
        generate_index_spec_md: "describes what it does"
        generate_index_py: "the actual code (lives here!)"
        
      implementation_spec_dir/:
        src/:
          validation_system_ts: "the actual code (lives here!)"
          
  symlinks:
    scripts: "→ specs/scripts.spec.spec.dir/"
    src: "→ specs/implementation.spec.spec.dir/src/"
    
  benefits:
    - "AI reads spec, understands what code should do"
    - "Code already exists in specs/ (written by AI or human)"
    - "Spec provides context, code provides implementation"
    - "Both evolve together, both stay in sync"
```

## Examples

### Example 1: Creating a Sub-spec

```yaml
parent: "specs/auth.spec.md"
name: "login"
kind: "operation"

step_1:
  check_parent: "auth.spec.md is a file"
  
step_2:
  create_dir: "mkdir specs/auth.spec.dir/"
  
step_3:
  create_spec: "specs/auth.spec.dir/login.spec.yaml"
  
result:
  path: "specs/auth.spec.dir/login.spec.yaml"
  header:
    id: "@specs/auth/login"
    parent: ""@ref:specs/auth```

### Example 2: Deep Nesting

```yaml
structure:
  specs/:
    features.spec.md:
      level: 1
      
    features.spec.dir/:
      level: 2
      
      payment.spec.yaml:
        level: 2
        
      payment.spec.dir/:
        level: 3
        
        checkout.spec.yaml:
          level: 3
          
        checkout.spec.dir/:
          level: 4
          
          stripe.go.spec:
            level: 4
            target: "generated/go/payment/checkout/stripe.go"
```

### Example 3: Non-Spec Directories (Speclang Meta)

```yaml
When_Speclang_builds_Speclang:
  rule: "EVERYTHING follows the conventions"
  
  structure:
    speclang-project/:
      specs/:
        project_scl: null
        scripts_spec_dir/: "specs for build scripts"
        scripts_spec_dir_generate_index_spec_md: null
        implementation_spec_dir/: "specs for source code"
        implementation_spec_dir_validation_system_spec_md: null
        
      scripts/: "symlinks"
      src/: "symlinks"
      generated/: "generated output"
```

## Implementation

```python
from pathlib import Path
from typing import Optional

class SpecDirectory:
    def __init__(self, specs_root: Path):
        self.root = specs_root
        
    def create_spec(self, parent: str, name: str, kind: str) -> Path:
        parent_path = self.root / parent
        
        if parent_path.is_file():
            dir_path = parent_path.with_suffix('.dir')
            dir_path.mkdir(exist_ok=True)
            spec_path = dir_path / f"{name}.{self._extension(kind)}"
        else:
            spec_path = parent_path / f"{name}.{self._extension(kind)}"
            
        return spec_path
        
    def _extension(self, kind: str) -> str:
        extensions = {
            "overview": "spec.md",
            "entity": "spec.yaml",
            "operation": "spec.yaml",
            "code": "go.spec",
            "test": "test.spec.scl"
        }
        return extensions.get(kind, "spec.yaml")
        
    def get_children(self, spec_path: Path) -> list[Path]:
        dir_path = spec_path.with_suffix('.dir')
        if dir_path.is_dir():
            return list(dir_path.glob("*.spec.*"))
        return []
```

## References

- "@ref:speclang/directory-structure
- @ref:speclang/headers
- @ref:speclang/references
- SIP 2: Header Format
- SIP 4: Reference System

## Copyright

This document is in the public domain.
