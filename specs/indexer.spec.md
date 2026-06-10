---
id: "@specs/indexer"
version: 1.0.0
layer: 3
project_level: Alpha
agent_support: agent_autonomous
tags: [indexer, core, graph, validation]
short: Spec indexer with dependency graph analysis
---

# Indexer Spec

This is the parent spec for the indexer module.

### @block::overview @kind:entity

The indexer module provides spec indexing and dependency graph analysis. It scans the `specs/` directory and generates `_index.json` with full graph analysis including dependency tracking, cycle detection, and impact analysis.

### @block::responsibilities @kind:entity

IndexerResponsibilities:
  scanning:
    - Scan specs/ directory recursively
    - Parse YAML headers from all spec files
    - Extract @ref: dependencies
    - Track file modifications

  indexing:
    - Generate _index.json with full spec metadata
    - Build adjacency list for dependency graph
    - Store specs in SQLite with FTS
    - Enable keyword and semantic search

  analysis:
    - Detect circular dependencies
    - Calculate impact sets for changes
    - Find orphan specs (no incoming refs)
    - Identify missing dependencies

### @block::cli-commands @kind:entity

IndexerCLI:
  index:
    description: Generate index from specs/
    returns: IndexResult

  validateRefs:
    description: Validate all @ref: links
    returns: ValidationResult

  tree:
    description: Show dependency tree for a spec
    params:
      - specId: string
    returns: TreeResult

  impact:
    description: Find specs affected by change
    params:
      - specPath: string
    returns: ImpactResult

### @block::index-result @kind:entity

IndexResult:
  specs: SpecIndex[]
  totalCount: number
  generatedAt: string
  graph: DependencyGraph

SpecIndex:
  id: string
  path: string
  layer: number
  version: string
  tags: string[]
  depends_on: string[]
  short: string

### @block::output @kind:entity

The indexer outputs `_index.json` in the root directory with the following structure:

```json
{
  "version": "1.0.0",
  "generatedAt": "2026-03-22T00:00:00Z",
  "specs": [...],
  "graph": {
    "nodes": [...],
    "edges": [...]
  }
}
```

### @block::usage @kind:entity

CLI Usage:
  - "python3 generate_index.py" - Generate index
  - "python3 generate_index.py --validate" - Validate references
  - "python3 generate_index.py --tree @specs/indexer" - Show dependency tree
  - "python3 generate_index.py --impact specs/indexer.spec.md" - Find impact

### @block::validation-rules @kind:entity

ValidationRules:
  - All @ref: targets must exist
  - No circular dependencies allowed
  - Every spec must have valid YAML header
  - layer values must be non-negative integers
  - All depends_on references must resolve

### @block::dependencies @kind:entity

RelatedSpecs:
  - "@ref:specs/core" - Core types and interfaces
  - "@ref:specs/sqlite" - SQLite database operations
  - "@ref:specs/headers" - Header format specification
