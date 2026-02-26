---
name: sip-048-dependency-graph-speclang-v0
title: "SIP 48: Dependency Graph"
version: 0.1.0
description: Spec dependency graph for validation, ordering, and impact analysis
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 48: Dependency Graph

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the Dependency Graph—a directed graph of spec relationships used for validation ordering, impact analysis, and cascade triggering.

### Quick Start

1. **Build Graph:** Parse all specs, extract `depends_on` and `refs`
2. **Query:** Find dependents, dependencies, or impact scope
3. **Validate:** Detect cycles, ensure acyclic dependencies
4. **Order:** Topological sort for processing order

### When to Read This

- **Change impact:** What specs are affected by a change?
- **Processing order:** What order to validate/generate specs?
- **Cycle detection:** Are there circular dependencies?
- **Cascade triggers:** What should cascade when X changes?

### Related SIPs

- SIP 4: Reference System (defines `@ref:` syntax)
- SIP 7: Cascade System (uses graph for triggers)
- SIP 46: Validation Tool (uses graph for ordering)
- SIP 47: Transition Workflows (checks dependencies)

## Abstract

This SIP defines the Dependency Graph data structure and algorithms for SpecLang. The graph captures relationships between specs through their `depends_on` and `refs` fields, enabling impact analysis, validation ordering, and cascade triggering.

## Motivation

Specs have relationships:
- Auth spec depends on User spec
- Login spec references Password policy
- North Star influences all specs

Without a graph:
- Can't determine processing order
- Can't assess change impact
- Can't detect circular dependencies
- Cascades may miss affected specs

## Rationale

**Directed Acyclic Graph (DAG):**

1. **Directed:** A → B means "A depends on B"
2. **Acyclic:** No circular dependencies allowed
3. **Multiple roots:** North Star + multiple top-level specs
4. **Multiple leaves:** Many specs with no dependents

**Benefits:**
- Topological sort for processing order
- Transitive closure for impact analysis
- Cycle detection for validation
- Efficient graph queries via SQLite

## Specification

### Graph Structure

```yaml
DependencyGraph:
  nodes:
    - id: string           # Spec ID (e.g., @specs/auth)
      path: string         # File path
      level: integer       # Layer level
      maturity: string     # project_level
      
  edges:
    - from: string         # Source spec ID
      to: string           # Target spec ID
      type: string         # depends_on | refs | parent | children
      strength: string     # hard | soft
      
  metadata:
    built_at: timestamp
    spec_count: integer
    edge_count: integer
    cycle_count: integer   # Should be 0
```

### Edge Types

| Type | Direction | Strength | Description |
|------|-----------|----------|-------------|
| `depends_on` | A → B | hard | A requires B |
| `refs` | A → B | soft | A mentions B |
| `parent` | A → B | hard | A is child of B |
| `children` | B → A | hard | B has child A |

**Hard vs Soft:**
- **Hard:** Must exist, blocks validation if missing
- **Soft:** Should exist, warning if missing

### Building the Graph

```python
from dataclasses import dataclass, field
from typing import Dict, List, Set, Optional
from enum import Enum
import sqlite3
from collections import defaultdict

class EdgeType(Enum):
    DEPENDS_ON = "depends_on"
    REFS = "refs"
    PARENT = "parent"
    CHILDREN = "children"

class EdgeStrength(Enum):
    HARD = "hard"
    SOFT = "soft"

@dataclass
class Node:
    id: str
    path: str
    level: int = 0
    maturity: str = "POC"

@dataclass
class Edge:
    from_id: str
    to_id: str
    edge_type: EdgeType
    strength: EdgeStrength

@dataclass
class DependencyGraph:
    nodes: Dict[str, Node] = field(default_factory=dict)
    edges: List[Edge] = field(default_factory=list)
    outgoing: Dict[str, Set[str]] = field(default_factory=lambda: defaultdict(set))
    incoming: Dict[str, Set[str]] = field(default_factory=lambda: defaultdict(set))
    
    def add_node(self, node: Node):
        self.nodes[node.id] = node
        
    def add_edge(self, edge: Edge):
        if edge.from_id not in self.nodes or edge.to_id not in self.nodes:
            return
        self.edges.append(edge)
        self.outgoing[edge.from_id].add(edge.to_id)
        self.incoming[edge.to_id].add(edge.from_id)
        
    def get_dependencies(self, spec_id: str, edge_types: List[EdgeType] = None) -> Set[str]:
        """Get all specs this spec depends on (outgoing edges)."""
        if edge_types is None:
            return self.outgoing.get(spec_id, set())
        return {
            e.to_id for e in self.edges 
            if e.from_id == spec_id and e.edge_type in edge_types
        }
        
    def get_dependents(self, spec_id: str, edge_types: List[EdgeType] = None) -> Set[str]:
        """Get all specs that depend on this spec (incoming edges)."""
        if edge_types is None:
            return self.incoming.get(spec_id, set())
        return {
            e.from_id for e in self.edges 
            if e.to_id == spec_id and e.edge_type in edge_types
        }
        
    def get_transitive_dependencies(self, spec_id: str) -> Set[str]:
        """Get all transitive dependencies (what this spec needs)."""
        visited = set()
        stack = list(self.outgoing.get(spec_id, set()))
        while stack:
            current = stack.pop()
            if current not in visited:
                visited.add(current)
                stack.extend(self.outgoing.get(current, set()))
        return visited
        
    def get_transitive_dependents(self, spec_id: str) -> Set[str]:
        """Get all transitive dependents (what depends on this spec)."""
        visited = set()
        stack = list(self.incoming.get(spec_id, set()))
        while stack:
            current = stack.pop()
            if current not in visited:
                visited.add(current)
                stack.extend(self.incoming.get(current, set()))
        return visited
        
    def detect_cycles(self) -> List[List[str]]:
        """Detect all cycles in the graph using DFS."""
        cycles = []
        visited = set()
        rec_stack = set()
        path = []
        
        def dfs(node_id):
            visited.add(node_id)
            rec_stack.add(node_id)
            path.append(node_id)
            
            for neighbor in self.outgoing.get(node_id, set()):
                if neighbor not in visited:
                    dfs(neighbor)
                elif neighbor in rec_stack:
                    cycle_start = path.index(neighbor)
                    cycles.append(path[cycle_start:] + [neighbor])
                    
            path.pop()
            rec_stack.remove(node_id)
            
        for node_id in self.nodes:
            if node_id not in visited:
                dfs(node_id)
                
        return cycles
        
    def topological_sort(self) -> List[str]:
        """Return specs in dependency order (dependencies first)."""
        in_degree = {node_id: 0 for node_id in self.nodes}
        
        for edge in self.edges:
            if edge.strength == EdgeStrength.HARD:
                in_degree[edge.from_id] = in_degree.get(edge.from_id, 0) + 1
                
        queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
        result = []
        
        while queue:
            current = queue.pop(0)
            result.append(current)
            
            for dependent in self.incoming.get(current, set()):
                in_degree[dependent] -= 1
                if in_degree[dependent] == 0:
                    queue.append(dependent)
                    
        return result
```

### SQLite Schema

```sql
CREATE TABLE graph_nodes (
    id TEXT PRIMARY KEY,
    path TEXT NOT NULL,
    level INTEGER DEFAULT 0,
    maturity TEXT DEFAULT 'POC',
    updated_at INTEGER NOT NULL
);

CREATE TABLE graph_edges (
    id TEXT PRIMARY KEY,
    from_id TEXT NOT NULL,
    to_id TEXT NOT NULL,
    type TEXT NOT NULL,
    strength TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    
    FOREIGN KEY (from_id) REFERENCES graph_nodes(id),
    FOREIGN KEY (to_id) REFERENCES graph_nodes(id),
    UNIQUE(from_id, to_id, type)
);

CREATE INDEX idx_edges_from ON graph_edges(from_id);
CREATE INDEX idx_edges_to ON graph_edges(to_id);

CREATE VIEW graph_summary AS
SELECT 
    (SELECT COUNT(*) FROM graph_nodes) as node_count,
    (SELECT COUNT(*) FROM graph_edges) as edge_count,
    (SELECT COUNT(*) FROM graph_edges WHERE strength = 'hard') as hard_edge_count,
    (SELECT COUNT(*) FROM graph_edges WHERE strength = 'soft') as soft_edge_count;
```

### Graph Queries

```sql
-- Direct dependencies
SELECT to_id FROM graph_edges 
WHERE from_id = ? AND type = 'depends_on';

-- Direct dependents
SELECT from_id FROM graph_edges 
WHERE to_id = ? AND type = 'depends_on';

-- Transitive dependencies (recursive CTE)
WITH RECURSIVE trans_deps AS (
    SELECT to_id, 1 as depth FROM graph_edges 
    WHERE from_id = ? AND type = 'depends_on'
    UNION
    SELECT e.to_id, td.depth + 1 
    FROM graph_edges e
    JOIN trans_deps td ON e.from_id = td.to_id
    WHERE e.type = 'depends_on'
)
SELECT to_id, MAX(depth) FROM trans_deps GROUP BY to_id ORDER BY depth;

-- Transitive dependents (recursive CTE)
WITH RECURSIVE trans_deps AS (
    SELECT from_id, 1 as depth FROM graph_edges 
    WHERE to_id = ? AND type = 'depends_on'
    UNION
    SELECT e.from_id, td.depth + 1 
    FROM graph_edges e
    JOIN trans_deps td ON e.to_id = td.from_id
    WHERE e.type = 'depends_on'
)
SELECT from_id, MAX(depth) FROM trans_deps GROUP BY from_id ORDER BY depth;

-- Specs with no dependencies (roots)
SELECT id FROM graph_nodes 
WHERE id NOT IN (SELECT from_id FROM graph_edges WHERE type = 'depends_on');

-- Specs with no dependents (leaves)
SELECT id FROM graph_nodes 
WHERE id NOT IN (SELECT to_id FROM graph_edges WHERE type = 'depends_on');
```

### Graph Operations

```yaml
GraphOperations:
  build:
    input: "List of spec files"
    output: "DependencyGraph"
    steps:
      - "Parse all spec headers"
      - "Create node for each spec"
      - "Create edges from depends_on"
      - "Create edges from refs"
      - "Create edges from parent/children"
      - "Validate no cycles"
      - "Store in SQLite"
      
  validate:
    input: "DependencyGraph"
    output: "ValidationResult"
    checks:
      - "All referenced specs exist"
      - "No circular dependencies"
      - "No orphan hard references"
      - "Dependencies at valid maturity level"
      
  query:
    input: "Query type, spec_id"
    output: "Query result"
    types:
      - "dependencies: direct deps"
      - "dependents: direct dependents"
      - "transitive_deps: all deps"
      - "transitive_dependents: all dependents"
      - "impact_scope: specs affected by change"
      - "processing_order: topological sort"
      
  update:
    input: "Changed spec"
    output: "Updated graph"
    steps:
      - "Update node if metadata changed"
      - "Remove old edges for spec"
      - "Add new edges from updated refs"
      - "Check for new cycles"
      - "Notify cascade system"
```

## Examples

### Example 1: Building the Graph

```python
builder = GraphBuilder(spec_dir="specs/")

graph = builder.build()
print(f"Built graph: {len(graph.nodes)} nodes, {len(graph.edges)} edges")
# Built graph: 42 nodes, 87 edges

cycles = graph.detect_cycles()
if cycles:
    print(f"Cycles detected: {cycles}")
else:
    print("No cycles detected")
# No cycles detected
```

### Example 2: Impact Analysis

```python
# What specs are affected by changing the User entity?
impact = graph.get_transitive_dependents("@specs/auth/entities#User")
print(f"Changing User affects: {impact}")
# Changing User affects: {
#   '@specs/auth/login',
#   '@specs/auth/logout', 
#   '@specs/auth/register',
#   '@specs/profile/update',
#   '@specs/admin/users'
# }
```

### Example 3: Processing Order

```python
# In what order should we validate specs?
order = graph.topological_sort()
for i, spec_id in enumerate(order[:5]):
    print(f"{i+1}. {spec_id}")
# 1. @northstar
# 2. @specs/stdlib/Result
# 3. @specs/auth/entities
# 4. @specs/user/entities
# 5. @specs/auth/policies
```

### Example 4: Cycle Detection

```python
cycles = graph.detect_cycles()
if cycles:
    for cycle in cycles:
        print(f"Cycle: {' → '.join(cycle)}")
# Cycle: @specs/auth → @specs/user → @specs/auth
```

## Integration

### With Validation Tool (SIP 46)

```python
class Validator:
    def validate_all(self):
        order = self.graph.topological_sort()
        for spec_id in order:
            self.validate_spec(spec_id)
```

### With Cascade System (SIP 7)

```python
class CascadeSystem:
    def on_change(self, spec_id):
        dependents = self.graph.get_transitive_dependents(spec_id)
        for dep_id in dependents:
            self.trigger_cascade(dep_id)
```

### With Transition Workflows (SIP 47)

```python
class TransitionOrchestrator:
    def check_dependencies(self, spec_id, target_level):
        deps = self.graph.get_dependencies(spec_id, [EdgeType.DEPENDS_ON])
        for dep_id in deps:
            dep_level = self.get_maturity(dep_id)
            if LEVEL_ORDER[dep_level] < LEVEL_ORDER[target_level]:
                raise ValueError(f"Dependency {dep_id} at lower level")
```

## CLI

```bash
# Build graph
speclang graph build

# Show stats
speclang graph stats
# Nodes: 42, Edges: 87, Hard: 54, Soft: 33

# Find dependents
speclang graph dependents @specs/auth/entities
# @specs/auth/login
# @specs/auth/logout
# @specs/auth/register

# Find dependencies
speclang graph dependencies @specs/auth/login
# @specs/auth/entities
# @specs/auth/policies
# @stdlib/Result

# Impact analysis
speclang graph impact @specs/auth/entities
# 5 specs would be affected

# Show processing order
speclang graph order
# 1. @northstar
# 2. @specs/stdlib/Result
# ...

# Detect cycles
speclang graph cycles
# No cycles detected
```

## References

- SIP 4: Reference System
- SIP 7: Cascade System
- SIP 46: Validation Tool
- SIP 47: Transition Workflows
- SIP 54: SQLite Schema

## Copyright

This document is in the public domain.
