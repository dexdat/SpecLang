# Bootstrap Phase 2.11: MCP Search Tools

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 2.11 of the bootstrap process.

**Prerequisites**: Phase 2.1 (MCP Server), Phase 0.1 (SQLite with FTS5) complete.

## Your Task
Implement MCP tools for spec search: full-text search and semantic search.

## Read These Specs First
1. `specs/mcp.spec.dir/tools/search.spec.md` - Search tools specification

## Search Tools

### 1. speclang_search
```yaml
description: Full-text search using FTS5
params:
  query: string (FTS5 query syntax)
  limit: integer (default 10)
  tags: string[] (optional filter)
returns:
  - file_path
  - id
  - short_desc
  - score (bm25)
```

### 2. speclang_semantic_search
```yaml
description: Vector similarity search
params:
  query_embedding: number[] (1536 dims)
  limit: integer (default 5)
returns:
  - file_path
  - id
  - short_desc
  - distance
```

## FTS5 Query Syntax

```
hello world      # Contains "hello" OR "world"
"hello world"    # Exact phrase "hello world"
hello AND world  # Contains both
hello NOT world  # Contains "hello" but not "world"
h*               # Starts with "h"
^hello           # Starts column with "hello"
```

## Implementation

### 1. Tool Registration (`mcp/tools/search.ts`)

```typescript
import { Tool, Database } from '../types';

interface SearchResult {
  file_path: string;
  id: string;
  short_desc: string;
  score: number;
}

interface SemanticSearchResult {
  file_path: string;
  id: string;
  short_desc: string;
  distance: number;
}

export function registerSearchTools(db: Database): Tool[] {
  return [
    {
      name: 'speclang_search',
      description: 'Full-text search across all specs using FTS5',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'FTS5 query string',
          },
          limit: {
            type: 'integer',
            description: 'Maximum results',
            default: 10,
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by tags',
          },
        },
        required: ['query'],
      },
      handler: async (args: {
        query: string;
        limit?: number;
        tags?: string[];
      }): Promise<SearchResult[]> => {
        return fullTextSearch(db, args.query, args.limit || 10, args.tags);
      },
    },
    
    {
      name: 'speclang_semantic_search',
      description: 'Semantic search using vector embeddings',
      inputSchema: {
        type: 'object',
        properties: {
          query_embedding: {
            type: 'array',
            items: { type: 'number' },
            description: 'Query embedding vector (1536 dimensions)',
          },
          limit: {
            type: 'integer',
            description: 'Maximum results',
            default: 5,
          },
        },
        required: ['query_embedding'],
      },
      handler: async (args: {
        query_embedding: number[];
        limit?: number;
      }): Promise<SemanticSearchResult[]> => {
        return semanticSearch(db, args.query_embedding, args.limit || 5);
      },
    },
  ];
}
```

### 2. Full-Text Search

```typescript
function fullTextSearch(
  db: Database,
  query: string,
  limit: number,
  tags?: string[]
): SearchResult[] {
  let sql = `
    SELECT 
      s.file_path, 
      s.id, 
      s.short_desc, 
      bm25(specs_fts) as score
    FROM specs_fts f
    JOIN specs s ON f.rowid = s.spec_pk
    WHERE specs_fts MATCH ?
  `;
  
  const params: any[] = [query];
  
  if (tags && tags.length > 0) {
    sql += ` AND EXISTS (
      SELECT 1 FROM spec_tags st 
      WHERE st.spec_pk = s.spec_pk 
      AND st.tag IN (${tags.map(() => '?').join(',')})
    )`;
    params.push(...tags);
  }
  
  sql += ` ORDER BY score LIMIT ?`;
  params.push(limit);
  
  const rows = db.prepare(sql).all(...params) as any[];
  
  return rows.map(row => ({
    file_path: row.file_path,
    id: row.id,
    short_desc: row.short_desc,
    score: row.score,
  }));
}
```

### 3. Semantic Search (Vector Similarity)

```typescript
function semanticSearch(
  db: Database,
  queryEmbedding: number[],
  limit: number
): SemanticSearchResult[] {
  const queryVector = JSON.stringify(queryEmbedding);
  
  const sql = `
    SELECT 
      s.file_path, 
      s.id, 
      s.short_desc,
      vss_distance_cosine(e.content_embedding, ?) as distance
    FROM spec_embeddings e
    JOIN specs s ON e.spec_pk = s.spec_pk
    WHERE e.content_embedding IS NOT NULL
    ORDER BY distance ASC
    LIMIT ?
  `;
  
  try {
    const rows = db.prepare(sql).all(queryVector, limit) as any[];
    
    return rows.map(row => ({
      file_path: row.file_path,
      id: row.id,
      short_desc: row.short_desc,
      distance: row.distance,
    }));
  } catch (error) {
    console.warn('Vector search failed, falling back to FTS');
    return [];
  }
}
```

### 4. Pure TypeScript Cosine Similarity (Fallback)

```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function semanticSearchFallback(
  db: Database,
  queryEmbedding: number[],
  limit: number
): SemanticSearchResult[] {
  const sql = `
    SELECT 
      s.file_path, 
      s.id, 
      s.short_desc,
      e.content_embedding
    FROM spec_embeddings e
    JOIN specs s ON e.spec_pk = s.spec_pk
    WHERE e.content_embedding IS NOT NULL
  `;
  
  const rows = db.prepare(sql).all() as any[];
  
  const scored = rows.map(row => {
    const embedding = JSON.parse(row.content_embedding);
    const distance = 1 - cosineSimilarity(queryEmbedding, embedding);
    
    return {
      file_path: row.file_path,
      id: row.id,
      short_desc: row.short_desc,
      distance,
    };
  });
  
  scored.sort((a, b) => a.distance - b.distance);
  
  return scored.slice(0, limit);
}
```

### 5. Query Builder Helper

```typescript
class SearchQueryBuilder {
  private terms: string[] = [];
  private tags: string[] = [];
  private phraseMode = false;
  
  term(term: string): this {
    this.terms.push(this.phraseMode ? `"${term}"` : term);
    return this;
  }
  
  phrase(phrase: string): this {
    this.terms.push(`"${phrase}"`);
    return this;
  }
  
  prefix(prefix: string): this {
    this.terms.push(`${prefix}*`);
    return this;
  }
  
  and(): this {
    this.terms.push('AND');
    return this;
  }
  
  or(): this {
    this.terms.push('OR');
    return this;
  }
  
  not(term: string): this {
    this.terms.push(`NOT ${term}`);
    return this;
  }
  
  tag(tag: string): this {
    this.tags.push(tag);
    return this;
  }
  
  build(): { query: string; tags: string[] } {
    return {
      query: this.terms.join(' '),
      tags: this.tags,
    };
  }
}

// Usage
const builder = new SearchQueryBuilder();
const { query, tags } = builder
  .term('authentication')
  .and()
  .term('token')
  .tag('mcp')
  .tag('security')
  .build();
```

### 6. Embedding Generation (Optional Integration)

```typescript
interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
}

class OpenAIEmbedding implements EmbeddingProvider {
  private apiKey: string;
  private model = 'text-embedding-3-small';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async embed(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
      }),
    });
    
    const data = await response.json();
    return data.data[0].embedding;
  }
}

async function searchWithEmbedding(
  db: Database,
  provider: EmbeddingProvider,
  query: string,
  limit: number
): Promise<SemanticSearchResult[]> {
  const embedding = await provider.embed(query);
  return semanticSearch(db, embedding, limit);
}
```

## Usage Examples

### Basic Search
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "speclang_search",
    "arguments": {
      "query": "authentication token",
      "limit": 5
    }
  }
}
```

Response:
```json
{
  "content": [
    {
      "type": "text",
      "text": "[{\"file_path\":\"specs/mcp.spec.dir/authentication.spec.md\",\"id\":\"@speclang/mcp.authentication\",\"short_desc\":\"Authentication methods for remote and server modes\",\"score\":-2.5}]"
    }
  ]
}
```

### Search with Tags
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "speclang_search",
    "arguments": {
      "query": "cascade",
      "tags": ["daemon", "mcp"],
      "limit": 10
    }
  }
}
```

### Semantic Search
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "speclang_semantic_search",
    "arguments": {
      "query_embedding": [0.1, 0.2, ...],
      "limit": 5
    }
  }
}
```

## Test Cases
1. Basic FTS search returns results
2. FTS search ranks by BM25 score
3. FTS phrase search works
4. FTS prefix search works
5. Tag filtering narrows results
6. Combined query and tag filter
7. Semantic search returns similar specs
8. Semantic search handles missing embeddings
9. Fallback cosine similarity works
10. Query builder produces valid FTS5

## Output
1. Search tool registrations
2. Full-text search implementation
3. Semantic search implementation
4. Query builder helper
5. Embedding provider interface
6. Integration tests
