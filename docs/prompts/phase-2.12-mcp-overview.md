# Bootstrap Phase 2.12: MCP Server Overview

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 2.12 of the bootstrap process.

**Prerequisite**: Phases 2.1-2.11 (MCP components) should be complete.

## Your Task
Create the MCP server overview and main entry point. This server provides SQLite access via MCP tools and works with ANY MCP-compatible editor.

## Read These Specs First
1. `specs/mcp.spec.dir/overview.spec.md` - MCP server overview
2. `specs/mcp.spec.dir/architecture.spec.md` - Architecture details
3. `specs/mcp.spec.dir/run-modes.spec.md` - Run modes

## What to Build

### Files to Create
```
src/mcp/
├── index.ts            # Main entry point
├── server.ts           # MCP server setup
├── types.ts            # MCP types
└── README.md           # Usage documentation
```

### Requirements

#### 1. MCP Server Overview
```typescript
// speclang-mcp.ts (~600 lines TypeScript)
// - Standalone server, not tied to OpenCode
// - Provides SQLite access via MCP tools
// - Works with ANY MCP-compatible editor
// - Three run modes: editor-initiated, remote, server
// - Commands table for inter-agent communication
// - Error logs accessible via MCP tools
```

#### 2. Server Configuration
```typescript
interface MCPServerConfig {
  name: 'speclang-mcp';
  version: string;
  transport: 'stdio' | 'sse' | 'http';
  database: {
    path: string;
    readonly: boolean;
  };
  tools: MCPTool[];
}
```

#### 3. Available Tools (Quick Reference)
```typescript
const MCP_TOOLS = {
  // Query
  'speclang_query': 'Execute SQL query',
  'speclang_search': 'Search specs by content',
  
  // Index
  'speclang_index': 'Get spec index',
  'speclang_get': 'Get spec by ID',
  
  // Commands
  'speclang_command': 'Execute agent command',
  'speclang_commands': 'List pending commands',
  
  // Logs
  'speclang_logs': 'Get error logs',
};
```

#### 4. Run Modes
```typescript
type RunMode = 
  | 'editor-initiated'  // stdio, started by editor
  | 'remote'           // SSE, remote access
  | 'server';          // HTTP, standalone server

function detectRunMode(): RunMode;
function startServer(mode: RunMode): Promise<void>;
```

#### 5. Main Entry Point
```typescript
// src/mcp/index.ts
export async function main() {
  const mode = detectRunMode();
  const server = await createServer(mode);
  
  server.on('error', handleError);
  server.on('request', handleRequest);
  
  await server.start();
  console.error(`SpecLang MCP started in ${mode} mode`);
}
```

## Architecture Summary
```
┌─────────────────────────────────────┐
│         MCP-Compatible Editor       │
│   (Cursor, Claude Code, Zed, etc)   │
└─────────────────┬───────────────────┘
                  │ MCP Protocol
┌─────────────────▼───────────────────┐
│          SpecLang MCP Server        │
│  ┌───────────┐  ┌────────────────┐  │
│  │   Tools   │  │   Transport    │  │
│  │  - query  │  │  - stdio       │  │
│  │  - search │  │  - SSE         │  │
│  │  - index  │  │  - HTTP        │  │
│  └─────┬─────┘  └────────────────┘  │
└────────┼────────────────────────────┘
         │
┌────────▼────────────────────────────┐
│           SQLite Database           │
│     (specs, refs, commands)         │
└─────────────────────────────────────┘
```

## Test Cases
1. Server starts in stdio mode
2. Server starts in SSE mode
3. All tools are registered
4. Error handling works
5. Graceful shutdown

## Validation
```bash
bun test tests/mcp/overview.test.ts
```

## Output Format
After completing, output:
1. Files created
2. Tools registered
3. Run modes supported
