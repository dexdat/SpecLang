# speclang-header lines:9
id: "@speclang/search"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [search, queries, indexing]
short: "Search functionality: queries and indexing"
children: ["@speclang/search/queries", "@speclang/search/indexing"]
---

# Search Functionality

This spec defines search capabilities for SpecLang, split into two sub‑specs:

- **@ref:speclang/search/queries** – Query types: FTS, semantic, tag, layer, combined
- **@ref:speclang/search/indexing** – Indexing: FTS table, embeddings, update triggers

## Search Tool Handler

### @block::search/tool-handler @kind:entity
```text
export class SearchToolHandler {
```

