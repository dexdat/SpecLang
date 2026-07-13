# speclang-header lines:13
id: "@speclang/directory-structure/creation"
version: 0.1.0
layer: 2
tags: [directory, structure, creation]
imports: ["@speclang/directory-structure"]
parent: @ref:specs/directory-structure
part: 2/2
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Directory Creation
---

# Directory Creation

## Parent-Child References

### @dir/refs

```speclang
# @block:dir/refs @kind:entity
ReferencePattern:
  child_to_parent:
    - auth.spec.dir/entities.scl references @ref:specs/auth
    - auth.spec.dir/login.spec.dir/handler.go.spec references @ref:specs/auth.spec.dir/login
    
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
WHERE id = (SELECT parent_id FROM specs WHERE path = 'specs/auth.spec.dir/entities.scl');
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

steps:
  1. Determine parent type (file or directory)
  2. If parent is a file, create corresponding .spec.dir/ directory if not exists
  3. Determine appropriate file extension based on kind
  4. Create spec file at appropriate path
  5. If spec requires sub-directory, create .spec.dir/ subdirectory
  6. Create sub-spec files within subdirectory
  7. Return path to created spec file

rules:
  - If parent is file (auth.spec.md):
    - Create auth.spec.dir/ if not exists
    - Create auth.spec.dir/{name}.spec.*
    
  - If parent is dir (auth.spec.dir/):
    - Create auth.spec.dir/{name}.spec.*
    
  - If needs sub-dir:
    - Create auth.spec.dir/{name}.spec.dir/
    - Create auth.spec.dir/{name}.spec.dir/{sub}.spec.*

example:
  createSpec("auth.spec.md", "login", "operation")
  → creates auth.spec.dir/login.spec.yaml
  
  createSpec("auth.spec.dir/login.spec.yaml", "handler", "code")
  → creates auth.spec.dir/login.spec.dir/handler.go.spec
```

---

## Directory vs File

### @dir/comparison

```speclang
# @block:dir/comparison @kind:table
| File (auth.spec.md) | Sub-specs (auth.spec.dir/) |
|---------------------|----------------------------|
| Single spec | Modular specs |
| Level 1-2 | Any level |
| Overview | Details |
| Direct content | Contained sub-specs |
| One focus | Multiple focused specs |

**Having sub-specs is good.**
Each sub-spec stays focused, avoiding context bloat.
```

---

## Git Ignore

### @dir/gitignore

```speclang
# @block:dir/gitignore @kind:code
```.gitignore
# Symlinks are OK (they point to specs/)
# Code lives in specs/, symlinks are just for convenience

# Speclang internal
.speclang/

# Keep spec dirs
!*.spec.dir/
!specs/
```
```

---

## Code Lives in Specs

### @dir/code-location

```speclang
# @block:dir/code-location @kind:note
Code LIVES in specs/, not regenerated on every clone.

**Why?**
- People don't want to regenerate everything on every clone
- Specs express code in natural language for AI guidance
- Helps AI think slowly - take a spec, add nested graph-linked depth
- Speclang writes one file at a time, context stays focused

**The pattern:**
```
specs/
  scripts.spec.dir/
    generate-index.spec.md    # describes what it does
    generate-index.py         # the actual code (lives here!)
    
  implementation.spec.dir/
    src/
      validation-system.ts     # the actual code (lives here!)
```

**Symlinks for convenience:**
- `scripts/` → `specs/scripts.spec.dir/` (symlink)
- `src/` → `specs/implementation.spec.dir/src/` (symlink)

**Why this works:**
1. AI reads spec, understands what code should do
2. Code already exists in specs/ (written by AI or human)
3. Spec provides context, code provides implementation
4. Both evolve together, both stay in sync
```

---

## Non-Spec Directories

### @dir/non-spec

```speclang
# @block:dir/non-spec @kind:note
NOT applicable when Speclang builds Speclang.

When the project IS Speclang (meta-circular), EVERYTHING follows the rules:
- No directories are exempt
- scripts/ → scripts.spec.dir/ (code lives here)
- src/ → implementation.spec.dir/ (code lives here)

**Only exempt when:**
- Using Speclang for a DIFFERENT project
- Third-party code that isn't part of the system being specified

**For Speclang itself:**
```
speclang-project/
├── specs/              # spec descriptions
│   ├── project.scl
│   ├── scripts.spec.dir/   # specs for build scripts
│   │   ├── generate-index.spec.md
│   │   ├── validate-refs.spec.md
│   │   └── ...
│   ├── implementation.spec.dir/  # specs for source code
│   │   ├── validation-system.spec.md
│   │   ├── ralph-loop.spec.md
│   │   └── ...
│   └── ...
│
├── scripts/           # actual scripts (generated or manual)
├── src/               # actual source code (generated or manual)
└── generated/         # generated output
```

**Rule:** If Speclang builds the project, ALL directories must follow conventions.
```