# speclang-header lines:12
id: "@speclang/sqlite/search"
version: 0.1.0
layer: 2
part: 4
tags: [sqlite, search, fts, vector, graph]
status: draft
project_level: Alpha
agent_support: agent_autonomous
target: src/db/search.ts
short: SQLite search modules - FTS, vectors, graph, JSON
---

# Database Search

Search modules for full-text search, vector similarity, graph traversal, and JSON queries.

## @block:sqlite/search/fts

### FullTextSearch

Full-text search using SQLite FTS5.

```typescript
class FullTextSearch {
  constructor(db: Database)
  
  // Search specs by content
  search(query: string, options?: SearchOptions): SearchResult[]
  
  // Search with tags filter
  searchByTags(tags: string[], query?: string): SearchResult[]
  
  // Get search ranking
  rank(filePath: string, query: string): number
}
```

## @block:sqlite/search/vectors

### VectorSearch

Vector similarity search using embeddings.

```typescript
class VectorSearch {
  constructor(db: Database)
  
  // Find similar specs by embedding
  findSimilar(embedding: number[], limit?: number): SearchResult[]
  
  // Store embedding for a spec
  storeEmbedding(filePath: string, embedding: number[]): void
  
  // Calculate cosine similarity
  cosineSimilarity(a: number[], b: number[]): number
}

Note: Requires sqlite-vss extension or libsql for production use.
```

## @block:sqlite/search/graph

### GraphQueries

Graph traversal for dependency tracking.

```typescript
class GraphQueries {
  constructor(db: Database)
  
  // Get all dependencies of a spec
  getDependencies(filePath: string, depth?: number): DependencyResult[]
  
  // Get all dependents (reverse dependencies)
  getDependents(filePath: string, depth?: number): DependencyResult[]
  
  // Get dependency tree
  getTree(filePath: string): TreeResult[]
  
  // Find path between two specs
  findPath(from: string, to: string): string[] | null
  
  // Detect circular dependencies
  detectCycles(): string[][]
}
```

## @block:sqlite/search/json

### JSONQueries

JSON-based queries for flexible data access.

```typescript
class JSONQueries {
  constructor(db: Database)
  
  // Query by JSON path
  query(path: string, value: any): SpecRecord[]
  
  // Get all specs matching a JSON pattern
  match(pattern: object): SpecRecord[]
  
  // Extract specific fields
  extract(filePath: string, fields: string[]): object
}
```