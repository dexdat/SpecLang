# speclang-header lines:12
id: "@speclang/search/indexing"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [search, indexing, fts, embeddings]
parent: ""@ref:speclang/search"part: 2/2
siblings:
  prev: ""@ref:speclang/search/queries"short: "Search indexing: FTS table, embeddings, update triggers"
---
# Search Indexing

## @block:search/indexing-fts-table @kind:entity

```speclang
# @block:search/indexing-fts-table @kind:entity
FTS_TABLE:
  name: specs_fts
  virtual_table: true
  using: fts5
  columns:
    - content: text (spec content)
    - short_desc: text
    - tags: text (comma-separated)
  content_rowid: spec_pk
  content_table: specs
  tokenize: porter unicode61
  prefix: "2 4"
  sql: |
    CREATE VIRTUAL TABLE specs_fts USING fts5(
      content,
      short_desc,
      tags,
      content_rowid=spec_pk,
      tokenize='porter unicode61',
      prefix='2 4'
    );
```

## @block:search/indexing-embeddings @kind:entity

```speclang
# @block:search/indexing-embeddings @kind:entity
EMBEDDINGS:
  column: content_embedding
  dimensions: 1536
  model: text-embedding-3-small (OpenAI)
  fallback: all-MiniLM-L6-v2 (sentence-transformers)
  storage: blob (float32 array)
  normalization: cosine similarity requires unit vectors
  sql: |
    ALTER TABLE specs ADD COLUMN content_embedding BLOB;
```

## @block:search/indexing-update-triggers @kind:entity

```speclang
# @block:search/indexing-update-triggers @kind:entity
UPDATE_TRIGGERS:
  on_spec_insert: |
    CREATE TRIGGER specs_ai AFTER INSERT ON specs
    BEGIN
      INSERT INTO specs_fts(rowid, content, short_desc, tags)
      VALUES (new.spec_pk, new.content, new.short_desc, new.tags);
    END;
  on_spec_update: |
    CREATE TRIGGER specs_au AFTER UPDATE ON specs
    BEGIN
      UPDATE specs_fts SET content = new.content,
                          short_desc = new.short_desc,
                          tags = new.tags
      WHERE rowid = old.spec_pk;
    END;
  on_spec_delete: |
    CREATE TRIGGER specs_ad AFTER DELETE ON specs
    BEGIN
      DELETE FROM specs_fts WHERE rowid = old.spec_pk;
    END;
```

## @block:search/indexing-embedding-generation @kind:entity

```speclang
# @block:search/indexing-embedding-generation @kind:entity
EMBEDDING_GENERATION:
  trigger: after spec insert/update
  batch_size: 10
  async: true
  process:
    1. Extract text content from spec
    2. Call embedding API (OpenAI, local model)
    3. Store as blob in content_embedding column
    4. Update index if using sqlite-vss
  fallback: compute on-demand during query
```

## @block:search/indexing-vss-extension @kind:entity

```speclang
# @block:search/indexing-vss-extension @kind:entity
VSS_EXTENSION:
  name: sqlite-vss
  version: 0.1.0
  required_for: vector similarity search
  tables:
    - specs_vss: virtual table for vector search
  functions:
    - vss_search: approximate nearest neighbor
  installation: loadable extension or compiled-in
```