---
name: sip-058-spec-references-speclang-v0
title: "SIP 58: Spec References"
version: 0.1.0
description: Reference syntax, resolution, and validation
category: standard
---

# SIP 58: Spec References

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines reference syntax, resolution, and validation for Speclang.

### Quick Start

1. **File Reference:** `@ref:specs/auth`
2. **Block Reference:** `@ref:specs/auth#login`
3. **Resolution:** Parse → Find file → Find block (optional)
4. **Validation:** Check format, existence, no circular deps

### Example

```yaml
# speclang-header lines:10
id: @specs/auth/login
refs:
  - @ref:specs/auth/entities#User
  - @ref:specs/auth/policies#rate-limit
depends_on:
  - @ref:stdlib/Result
---
```

### Key Concepts

- **@ref: Prefix:** Reference marker
- **Path:** File location without extension
- **#block:** Specific block identifier
- **Graph:** References create dependency graph

### When to Read This

- **Creating references:** Link specs together
- **Resolution:** How references resolve
- **Validation:** Ensure reference integrity

### Related SIPs

- SIP 4: Reference System
- SIP 3: Block System
- SIP 2: Header Format

## Abstract

This SIP extends the reference system with detailed syntax specification, resolution algorithms, and validation rules for ensuring reference integrity.

## Motivation

References need:
- Precise syntax rules
- Reliable resolution
- Integrity validation
- Circular dependency detection
- Graph traversal support

## Rationale

**Reference Format:** `@ref:domain/path#block-id`

**Components:**

| Component | Required | Description |
|-----------|----------|-------------|
| `@ref:` | Yes | Reference marker |
| `domain/path` | Yes | File path without extension |
| `#block-id` | No | Specific block within file |

**Benefits:**
- Machine-parseable
- Human-readable
- IDE navigable
- Graph queryable

## Specification

### Reference Syntax

**Full Syntax:** `@ref:<path>[#<block-id>]`

**Path Rules:**
- Lowercase letters
- Forward slashes as separators
- No file extension
- No `..` (security)
- No leading `/`

**Block ID Rules:**
- Lowercase letters
- Hyphens for separation
- Unique within file
- Matches block declaration

**Examples:**

```
@ref:specs/auth                    → File reference
@ref:specs/auth#login              → Block reference
@ref:specs/auth/entities#User      → Nested block
@ref:northstar                     → North star reference
@ref:stdlib/Result                 → Standard library
```

### Reference Types

**Current Types:**

| Type | Format | Purpose |
|------|--------|---------|
| `ref` | `@ref:...` | General reference |

**Future Extensions:**

| Type | Format | Purpose |
|------|--------|---------|
| `issue` | `@issue:123` | Issue tracker |
| `pr` | `@pr:456` | Pull request |
| `commit` | `@commit:abc123` | Git commit |
| `doc` | `@doc:guide/auth` | Documentation |

### Header Fields

**Reference Fields:**

```yaml
# Outgoing references
refs:
  - @ref:specs/user
  - @ref:specs/auth#login

# Dependencies (must exist)
depends_on:
  - @ref:stdlib/Result
  - @ref:stdlib/JWT

# Child specs
children:
  - @ref:specs/auth/entities
  - @ref:specs/auth/operations

# Parent spec
parent: @ref:specs/auth
```

**Field Semantics:**

| Field | Meaning |
|-------|---------|
| `refs` | "This mentions..." (any reference) |
| `depends_on` | "This requires..." (dependency) |
| `children` | "This contains..." (split parts) |
| `parent` | "This belongs to..." (container) |

### Reference Resolution

**Resolution Algorithm:**

```python
def resolve_reference(ref_str: str, current_file: str) -> ResolvedRef:
    # Parse reference string
    ref = parse_ref(ref_str)
    
    # Resolve path
    file_path = resolve_path(ref.path, current_file)
    
    # Validate file exists
    if not file_exists(file_path):
        raise ReferenceError(f"File not found: {file_path}")
    
    # If block reference, resolve block
    if ref.block_id:
        block = find_block(file_path, ref.block_id)
        if not block:
            raise ReferenceError(
                f"Block not found: {ref.block_id} in {file_path}"
            )
        return ResolvedRef(file=file_path, block=block)
    
    return ResolvedRef(file=file_path)
```

**Path Resolution:**

```python
def resolve_path(ref_path: str, current_file: str) -> str:
    # Check for special paths
    if ref_path == 'northstar':
        return find_northstar()
    
    # Check standard library
    if ref_path.startswith('stdlib/'):
        return resolve_stdlib(ref_path)
    
    # Resolve relative to project root
    return f"{project_root}/{ref_path}.spec.{ext}"
```

**Block Resolution:**

```python
def find_block(file_path: str, block_id: str) -> Block:
    content = read_file(file_path)
    blocks = parse_blocks(content)
    
    for block in blocks:
        if block.id == block_id:
            return block
    
    return None
```

### Reference Validation

**Validation Checks:**

```python
def validate_reference(ref_str: str, context: ValidationContext) -> ValidationResult:
    errors = []
    warnings = []
    
    # 1. Format validation
    if not is_valid_format(ref_str):
        errors.append(f"Invalid format: {ref_str}")
        return ValidationResult(errors, warnings)
    
    # 2. Parse reference
    ref = parse_ref(ref_str)
    
    # 3. File existence
    file_path = resolve_path(ref.path, context.current_file)
    if not file_exists(file_path):
        errors.append(f"File not found: {file_path}")
    
    # 4. Block existence (if specified)
    if ref.block_id and file_exists(file_path):
        if not find_block(file_path, ref.block_id):
            errors.append(f"Block not found: {ref.block_id}")
    
    # 5. Circular dependency check
    if creates_cycle(ref, context):
        errors.append(f"Circular dependency: {ref}")
    
    return ValidationResult(errors, warnings)
```

**Validation Rules:**

```yaml
ValidationRules:
  format:
    - Must start with @ref:
    - Path must be valid (no .., no leading /)
    - Block ID must be valid (lowercase, hyphens)
    
  existence:
    - Target file must exist
    - Block must exist (if specified)
    
  integrity:
    - No circular dependencies
    - No self-references
    - Parent/child consistency
```

### Circular Dependency Detection

**Algorithm:**

```python
def detect_circular_deps(graph: Dict[str, List[str]]) -> List[List[str]]:
    cycles = []
    visited = set()
    rec_stack = set()
    
    def dfs(node: str, path: List[str]):
        visited.add(node)
        rec_stack.add(node)
        
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                dfs(neighbor, path + [neighbor])
            elif neighbor in rec_stack:
                # Found cycle
                cycle_start = path.index(neighbor)
                cycles.append(path[cycle_start:] + [neighbor])
        
        rec_stack.remove(node)
    
    for node in graph:
        if node not in visited:
            dfs(node, [node])
    
    return cycles
```

### Reference Graph

**Graph Structure:**

```python
class ReferenceGraph:
    def __init__(self):
        self.nodes: Dict[str, Node] = {}
        self.edges: List[Edge] = []
    
    def add_spec(self, spec_id: str, refs: List[str]):
        if spec_id not in self.nodes:
            self.nodes[spec_id] = Node(id=spec_id)
        
        for ref in refs:
            self.add_edge(spec_id, ref)
    
    def add_edge(self, from_id: str, to_id: str):
        edge = Edge(from_id=from_id, to_id=to_id)
        self.edges.append(edge)
    
    def get_dependencies(self, spec_id: str) -> List[str]:
        return [e.to_id for e in self.edges if e.from_id == spec_id]
    
    def get_dependents(self, spec_id: str) -> List[str]:
        return [e.from_id for e in self.edges if e.to_id == spec_id]
    
    def get_transitive_deps(self, spec_id: str) -> Set[str]:
        deps = set()
        to_visit = [spec_id]
        
        while to_visit:
            current = to_visit.pop()
            for dep in self.get_dependencies(current):
                if dep not in deps:
                    deps.add(dep)
                    to_visit.append(dep)
        
        return deps
```

### Database Schema

**SQLite Tables:**

```sql
-- References table
CREATE TABLE references (
  id INTEGER PRIMARY KEY,
  from_spec TEXT NOT NULL,
  to_spec TEXT NOT NULL,
  to_block TEXT,
  ref_type TEXT DEFAULT 'ref',
  created_at TEXT NOT NULL,
  FOREIGN KEY (from_spec) REFERENCES specs(id),
  FOREIGN KEY (to_spec) REFERENCES specs(id)
);

CREATE INDEX idx_refs_from ON references(from_spec);
CREATE INDEX idx_refs_to ON references(to_spec);

-- Reference validation errors
CREATE TABLE ref_errors (
  id INTEGER PRIMARY KEY,
  spec_id TEXT NOT NULL,
  ref_str TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

### Reference Queries

**Find Dependents:**

```sql
SELECT from_spec 
FROM references 
WHERE to_spec = '@specs/auth';
```

**Find Dependencies:**

```sql
SELECT to_spec, to_block 
FROM references 
WHERE from_spec = '@specs/auth/login';
```

**Find Circular Dependencies:**

```sql
WITH RECURSIVE paths AS (
  SELECT from_spec, to_spec, 1 as depth
  FROM references
  
  UNION ALL
  
  SELECT p.from_spec, r.to_spec, p.depth + 1
  FROM paths p
  JOIN references r ON p.to_spec = r.from_spec
  WHERE p.depth < 100
)
SELECT from_spec, to_spec 
FROM paths 
WHERE from_spec = to_spec;
```

## Implementation

### Reference Parser

```python
import re

REFERENCE_PATTERN = re.compile(
    r'@ref:(?P<path>[a-zA-Z0-9/_-]+)(?:#(?P<block>[a-zA-Z0-9_-]+))?'
)

def parse_ref(ref_str: str) -> Reference:
    match = REFERENCE_PATTERN.match(ref_str)
    if not match:
        raise ValueError(f"Invalid reference: {ref_str}")
    
    return Reference(
        path=match.group('path'),
        block_id=match.group('block')
    )

def extract_refs_from_content(content: str) -> List[str]:
    return REFERENCE_PATTERN.findall(content)
```

### Reference Validator

```python
class ReferenceValidator:
    def __init__(self, db: SQLite, project_root: str):
        self.db = db
        self.project_root = project_root
        self.graph = ReferenceGraph()
    
    def validate_all(self) -> List[ValidationError]:
        errors = []
        
        # Load all specs
        specs = self.load_all_specs()
        
        # Build graph
        for spec in specs:
            refs = self.extract_refs(spec)
            self.graph.add_spec(spec.id, refs)
        
        # Check each reference
        for spec in specs:
            for ref_str in self.extract_refs(spec):
                result = self.validate_reference(ref_str, spec)
                errors.extend(result.errors)
        
        # Check for cycles
        cycles = detect_circular_deps(self.graph)
        for cycle in cycles:
            errors.append(ValidationError(
                type='circular_dependency',
                message=f"Circular dependency: {' → '.join(cycle)}"
            ))
        
        return errors
    
    def validate_reference(self, ref_str: str, spec: Spec) -> ValidationResult:
        errors = []
        
        try:
            ref = parse_ref(ref_str)
        except ValueError as e:
            errors.append(str(e))
            return ValidationResult(errors)
        
        # Check file exists
        file_path = self.resolve_path(ref.path)
        if not os.path.exists(file_path):
            errors.append(f"File not found: {ref.path}")
        
        # Check block exists
        if ref.block_id and os.path.exists(file_path):
            if not self.find_block(file_path, ref.block_id):
                errors.append(f"Block not found: {ref.block_id}")
        
        return ValidationResult(errors)
```

## CLI Commands

```bash
# Validate all references
speclang refs validate

# Find dependents of a spec
speclang refs dependents @specs/auth

# Find dependencies of a spec
speclang refs deps @specs/auth

# Show reference graph
speclang refs graph

# Find broken references
speclang refs broken
```

## References

- SIP 4: Reference System
- SIP 3: Block System
- SIP 2: Header Format
- SIP 48: Dependency Graph

## Copyright

This document is in the public domain.
