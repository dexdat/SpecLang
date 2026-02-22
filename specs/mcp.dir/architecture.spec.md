# speclang-header lines:13
id: "@speclang/mcp.architecture"
parent: "@ref:specs/mcp"
part: 2/12
siblings:
  next: "@ref:specs/mcp.dir/run-modes"
short: MCP server architecture diagram and components
project_level: Alpha
agent_support: agent_assisted
tags: [speclang]
version: 0.1.0
layer: 0
---
# MCP Server Architecture

### @mcp/architecture

```speclang
# @block:mcp/architecture @kind:diagram
```mermaid
flowchart LR
    subgraph Editors["Any MCP-Compatible Editor"]
        C[Cursor]
        CC[Claude Code]
        OC[OpenCode]
        Z[Zed]
        W[Windsurf]
    end
    
    subgraph MCP["MCP Server"]
        S[speclang-mcp.ts]
        Router[Request Router]
        Auth[Auth Layer]
        Handlers[Tool Handlers]
    end
    
    subgraph DB[SQLite]
        DB1[specs]
        DB2[events]
        DB3[commands]
        DB4[FTS]
    end
    
    C -->|MCP stdio| S
    CC -->|MCP stdio| S
    OC -->|MCP stdio| S
    Z -->|MCP stdio| S
    W -->|HTTP/SSE| S
    
    S --> Router
    Router --> Auth
    Auth --> Handlers
    Handlers -->|SQL| DB
    
    DB1 --> DB4
```
```
