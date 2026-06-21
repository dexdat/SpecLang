# speclang-header lines:13
id: "@speclang/index/tools"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [typescript, generated, auto-generated, index, tools]
short: "Tool handler for index operations"
status: draft
depends_on:
  - "@ref:specs/indexer"
  - "@ref:specs/tools"
---

# Index Tools Spec

Auto-generated spec for index-tools.ts from cascade.

## Overview

### @block::indextoolhandler @kind:class

```typescript
export class IndexToolHandler {
  private indexer: SpecIndexer;
  private db: SpecLangDB;
  
  constructor(indexer: SpecIndexer, db: SpecLangDB);
  
  // Handle speclang_search tool
  async handleSearch(args: SearchArgs): Promise<SearchResult>;
  
  // Handle speclang_validate tool
  async handleValidate(args: ValidateArgs): Promise<ValidateResult>;
  
  // Handle speclang_expand tool
  async handleExpand(args: ExpandArgs): Promise<ExpandResult>;
  
  // Handle speclang_tree tool
  async handleTree(args: TreeArgs): Promise<TreeResult>;
}
```

### @block::search-operation @kind:function

```typescript
interface SearchOperation {
  // Full-text search in specs
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>
  
  // Search by tag
  searchByTag(tag: string): Promise<SpecIndex[]>
  
  // Search by layer
  searchByLayer(layer: number): Promise<SpecIndex[]>
}
```

### @block::usage @kind:prose

**MCP Tools Provided:**

```json
{
  "name": "speclang_search",
  "description": "Search specs by keyword",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string" },
      "tags": { "type": "array", "items": { "type": "string" } }
    }
  }
}
```

