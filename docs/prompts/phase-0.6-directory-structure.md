# Bootstrap Phase 0.6: Directory Structure

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.6 of the bootstrap process.

**Prerequisites**: 
- Phase 0.1 (SQLite Database) complete
- Phase 0.2 (Header Parser) complete
- Phase 0.3 (Indexer) complete
- Phase 0.4 (Workflow) complete
- Phase 0.5 (Config) complete

## Your Task
Implement the hierarchical directory structure system using `.spec.dir/` folders for sub-specs and unlimited nesting.

## Read These Specs First
1. `specs/directory-structure.spec.md` - Full directory structure spec
2. `specs/project-layout.spec.md` - Project layout conventions
3. `specs/file-naming.spec.md` - Naming conventions

## What to Build

### Files to Create
```
src/directory/
├── index.ts            # Main directory utilities
├── structure.ts        # Directory structure types
├── creator.ts          # createSpec operation
├── scanner.ts          # Scan specs/ tree
├── resolver.ts         # Resolve parent-child refs
└── flattener.ts        # Flatten tree for processing

tests/
└── directory.test.ts   # Directory tests
```

### Requirements

#### 1. Directory Pattern (from directory-structure.spec.md)
```
spec_file:
  - auth.scl
  - auth.spec.md
  - auth.spec.yaml
  - auth.go.spec

spec_dir:
  - auth.spec.dir/           # contains sub-specs
  - auth.spec.dir/entities.scl
  - auth.spec.dir/operations.scl

nesting (unlimited depth):
  - auth.spec.dir/
  - auth.spec.dir/login.spec.dir/
  - auth.spec.dir/login.spec.dir/handler.go.spec
```

#### 2. Example Structure
```
specs/
  project.scl                    # north star (level 0)
  
  auth.spec.md                   # level 1 overview
  auth.spec.dir/                      # level 2+ details
    entities.spec.yaml
    operations.spec.yaml
    policies.spec.yaml
    
    login.spec.dir/                   # level 3+ login details
      handler.go.spec            # → generated/go/auth/login/handler.go
      flow.spec.md
    
    jwt.spec.dir/
      token.go.spec
      validator.go.spec
      
  user.spec.md
  user.spec.dir/
    profile.spec.yaml
    settings.spec.yaml
```

#### 3. createSpec Operation
```typescript
function createSpec(
  parent: Path, 
  name: string, 
  kind: SpecKind
): Path {
  // Steps:
  // 1. Determine parent type (file or directory)
  // 2. If parent is file, create .spec.dir/ if not exists
  // 3. Determine appropriate extension based on kind
  // 4. Create spec file at appropriate path
  // 5. If spec needs sub-dir, create .spec.dir/ subdirectory
  // 6. Return path to created spec file
}

// Examples:
createSpec("auth.spec.md", "login", "operation")
// → creates auth.spec.dir/login.spec.yaml

createSpec("auth.spec.dir/login.spec.yaml", "handler", "code")
// → creates auth.spec.dir/login.spec.dir/handler.go.spec
```

#### 4. Parent-Child References
```typescript
// Child references parent via header
interface ChildHeader {
  parent: string;  // "@ref:specs/auth"
  // ...
}

// Parent lists children in header
interface ParentHeader {
  children: string[];  // ["@specs/auth/entities", "@specs/auth/operations"]
  // ...
}
```

#### 5. SQLite Tree Queries
```sql
-- Get all children of a spec
SELECT path FROM specs
WHERE depends_on LIKE '%@ref:specs/auth%';

-- Get full tree (recursive CTE)
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

#### 6. Flattening Strategy
```typescript
interface FlatteningStrategy {
  purpose: "load tree into memory efficiently";
  
  approach: [
    "SQLite already has flat index",
    "Load by level (0, then 1, then 2...)",
    "Or load by dependency order",
    "Cache in memory during cascade"
  ];
  
  benefits: [
    "Fast graph traversal",
    "No directory walking needed",
    "Single query for all dependents"
  ];
}
```

#### 7. Naming Conventions
```
spec_files:
  - lowercase with hyphens
  - auth.spec.md, user-profile.spec.yaml

spec_dirs:
  - same name as parent spec + .dir
  - auth.spec.md → auth.spec.dir/

sub_specs:
  - descriptive name
  - login.spec.yaml, jwt-handler.go.spec
```

#### 8. Git Ignore for Spec Dirs
```gitignore
# Symlinks are OK (point to specs/)
# Code lives in specs/, symlinks are for convenience

# Speclang internal
.speclang/

# Keep spec dirs
!*.spec.dir/
!specs/
```

#### 9. Code Location Principle
```
Code LIVES in specs/, not regenerated on every clone.

specs/
  scripts.spec.dir/
    generate-index.spec.md    # describes what it does
    generate-index.py         # the actual code (lives here!)

  implementation.spec.dir/
    src/
      validation-system.ts     # the actual code (lives here!)
```

### Code Quality
- Handle unlimited nesting depth
- Support all spec extensions (.scl, .spec.md, .spec.yaml, .go.spec)
- All operations typed with JSDoc
- Reference spec blocks in comments

## Validation
```bash
bun test tests/directory.test.ts
speclang directory scan
speclang directory tree @specs/auth
```

## Output Format
After completing, output:
1. List of files created
2. Test results
3. Any deviations from the spec (with justification)
