# speclang-header lines:9
id: "@speclang/directory-structure"
version: 0.1.0
layer: 0
tags: [directory, structure, hierarchy, dir]
imports: ["@speclang/core", "@speclang/project-layout"]
status: draft

---

# Directory Structure

Hierarchical spec organization using .dir folders.

## Overview

```speclang
# @block:dir/overview @kind:note
Specs are organized in a tree hierarchy:

- spec.scl or spec.spec.md = leaf spec
- spec.dir/ = folder containing sub-specs
- Sub-specs reference parent via @ref

This allows unlimited expansion depth
while keeping files organized.
```

---

## Directory Pattern

### @dir/pattern

```speclang
# @block:dir/pattern @kind:entity
DirectoryPattern:
  spec_file:
    - auth.scl
    - auth.spec.md
    - auth.spec.yaml
    - auth.go.spec
    
  spec_dir:
    - auth.dir/           # contains sub-specs
    - auth.dir/entities.scl
    - auth.dir/operations.scl
    
  nesting:
    - auth.dir/
    - auth.dir/login.dir/
    - auth.dir/login.dir/handler.go.spec
```

---

## Example Structure

### @dir/example

```speclang
# @block:dir/example @kind:code
```
specs/
  project.scl                    # north star (level 0)
  
  auth.spec.md                   # level 1 overview
  auth.dir/                      # level 2+ details
    entities.spec.yaml
    operations.spec.yaml
    policies.spec.yaml
    
    login.dir/                   # level 3+ login details
      handler.go.spec            # → generated/go/auth/login/handler.go
      flow.spec.md
    
    jwt.dir/
      token.go.spec
      validator.go.spec
      
  user.spec.md
  user.dir/
    profile.spec.yaml
    settings.spec.yaml
    
tests/
  auth.test.spec.scl
  auth.dir/
    login.test.spec.scl
    jwt.test.spec.scl

generated/
  go/
    auth/
      login/
        handler.go
      jwt/
        token.go
        validator.go
```
```

---

## Parent-Child References

### @dir/refs

```speclang
# @block:dir/refs @kind:entity
ReferencePattern:
  child_to_parent:
    - auth.dir/entities.scl references @ref:specs/auth
    - auth.dir/login.dir/handler.go.spec references @ref:specs/auth.dir/login
    
  parent_to_children:
    - auth.spec.md lists children in header
    - SQLite tracks relationships
    
  example_header:
    --- speclang-header lines:10
    id: @specs/auth/entities
    parent: @ref:specs/auth
    children: []
    ...
```

---

## SQLite Tree Queries

### @dir/sqlite

```speclang
# @block:dir/sqlite @kind:code
```sql
-- Get all children of a spec
SELECT path FROM specs
WHERE depends_on LIKE '%@ref:specs/auth%';

-- Get full tree
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
WHERE id = (SELECT parent_id FROM specs WHERE path = 'specs/auth.dir/entities.scl');
```
```

---

## Flattening for Processing

### @dir/flattening

```speclang
# @block:dir/flattening @kind:entity
FlatteningStrategy:
  purpose: load tree into memory efficiently
  
  approach:
    - SQLite already has flat index
    - Load by level (0, then 1, then 2...)
    - Or load by dependency order
    - Cache in memory during cascade
    
  benefits:
    - Fast graph traversal
    - No directory walking needed
    - Single query for all dependents
```

---

## Creating New Specs

### @dir/creation

```speclang
# @block:dir/creation @kind:operation
createSpec(parent: Path, name: String, kind: SpecKind) -> Path:

rules:
  - If parent is file (auth.spec.md):
    - Create auth.dir/ if not exists
    - Create auth.dir/{name}.spec.*
    
  - If parent is dir (auth.dir/):
    - Create auth.dir/{name}.spec.*
    
  - If needs sub-dir:
    - Create auth.dir/{name}.dir/
    - Create auth.dir/{name}.dir/{sub}.spec.*

example:
  createSpec("auth.spec.md", "login", "operation")
  → creates auth.dir/login.spec.yaml
  
  createSpec("auth.dir/login.spec.yaml", "handler", "code")
  → creates auth.dir/login.dir/handler.go.spec
```

---

## Directory vs File

### @dir/comparison

```speclang
# @block:dir/comparison @kind:table
| File (auth.spec.md) | Directory (auth.dir/) |
|---------------------|----------------------|
| Single spec | Collection of specs |
| Level 1-2 | Level 2+ |
| Human edited | AI expanded |
| Overview | Details |
| No children | Contains sub-specs |
```

---

## Naming Conventions

### @dir/naming

```speclang
# @block:dir/naming @kind:entity
NamingRules:
  spec_files:
    - lowercase with hyphens
    - auth.spec.md, user-profile.spec.yaml
    
  spec_dirs:
    - same name as parent spec + .dir
    - auth.spec.md → auth.dir/
    
  sub_specs:
    - descriptive name
    - login.spec.yaml, jwt-handler.go.spec
```

---

## Expansion Depth

### @dir/depth

```speclang
# @block:dir/depth @kind:entity
DepthControl:
  level_0:
    files: project.scl
    owner: user + orchestrator
    
  level_1:
    files: *.spec.md (overviews)
    dirs: created as needed
    
  level_2:
    files: *.dir/*.spec.yaml
    owner: spec-writer
    
  level_3_plus:
    files: deeper .dir nesting
    owner: spec-writer
    
  level_10:
    files: *.go.spec (direct mapping)
    owner: code-gen
```

---

## Git Ignore

### @dir/gitignore

```speclang
# @block:dir/gitignore @kind:code
```.gitignore
# Generated code
generated/

# Speclang internal
.speclang/

# Keep spec dirs
!*.dir/
```
```
