# speclang-header lines:15
id: "@speclang/sqlite"
version: 0.2.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [sqlite, database, fts, vector, graph]
children:
    - "@ref:specs/sqlite.spec.dir/schema"
    - "@ref:specs/sqlite.spec.dir/fts"
    - "@ref:specs/sqlite.spec.dir/graph"
    - "@ref:specs/sqlite.spec.dir/vectors"
short: "SQLite Database - Context preservation and search"
status: draft
---

# SQLite Database

Embedded SQLite database with full-text search, vector embeddings, and graph traversal for zero context loss in SpecLang.

## Overview

```speclang
# @block:sqlite/overview @kind:entity
SQLiteDB:
  purpose: "Never lose context. Everything searchable."
  file: .speclang/speclang.db
  size: few MB (even for 10k files)
  
  features:
    - full_text_search: Instant search across all specs
    - vector_embeddings: Semantic similarity search
    - graph_traversal: Follow dependency chains
    - change_history: Track every file modification
    - command_queue: Agent coordination table
  
  tables:
    - specs: All spec files with headers
    - blocks: Individual blocks within specs
    - references: @ref: dependencies between specs
    - embeddings: Vector representations for semantic search
    - commands: Coordination queue for agents
    - events: File change history
  
  queries:
    - "Find all specs referencing User entity"
    - "Show dependency graph from North Star"
    - "Find similar specs to 'rate limiting'"
    - "Get history of auth.spec.md changes"
```

## Schema

See @ref:specs/sqlite.spec.dir/schema for database schema, table definitions, and indexes.

## Full-Text Search

See @ref:specs/sqlite.spec.dir/fts for full-text search configuration and query patterns.

## Graph Traversal

See @ref:specs/sqlite.spec.dir/graph for dependency graph traversal and relationship queries.

## Vector Embeddings

See @ref:specs/sqlite.spec.dir/vectors for semantic search using vector embeddings.

## Agent Support System

The SQLite database provides critical support for agents:

### Graph System for Understanding
- **Dependency visualization**: See the entire spec tree at once
- **Impact analysis**: What specs will be affected by a change
- **Path finding**: Shortest dependency path between specs
- **Cycle detection**: Prevent circular dependencies

### Search Tools for Agents
- **Full-text search**: Find specs by content, not just filenames
- **Semantic search**: "Find specs about authentication" using vector embeddings
- **Reference tracking**: "What specs reference this entity?"
- **History queries**: "How has this spec evolved over time?"

### System State Management
- **Queue tracking**: What agents are working on what files
- **Convergence monitoring**: Is the system quiet or active?
- **Failure analysis**: What builds failed and why?
- **Performance metrics**: Which specs take longest to process?

## Integration

The database is:
1. **Auto-updated**: On every file change, headers are parsed and indexed
2. **Queryable via MCP**: Agents can query with natural language
3. **Essential for context**: AI agents read headers from DB, not raw files
4. **Recovery resilient**: Survives crashes, resumes on restart
5. **Graph-enabled**: Provides dependency visualization for complex systems

