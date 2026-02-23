# Bootstrap Phase 2.15: MCP Architecture Overview

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 2.15 of the bootstrap process.

**Prerequisites**: Phase 2.1-2.14 (MCP components) complete.

## Your Task
Create comprehensive architecture documentation for the MCP server, including component diagrams, data flows, and system interactions.

## Read These Specs First
1. `specs/mcp.spec.dir/architecture.spec.md` - Architecture diagram
2. `specs/mcp.spec.dir/overview.spec.md` - Server overview
3. `specs/mcp.spec.dir/configuration.spec.md` - Configuration

## Architecture Components

### 1. High-Level Architecture
```typescript
// System architecture
interface MCPSystemArchitecture {
  components: {
    editors: string[];           // MCP-compatible editors
    transport: TransportLayer;     // stdio, SSE, HTTP, socket
    server: MCPServer;             // Main server
    handlers: ToolHandlers;        // Tool implementations
    database: Database;            // SQLite backend
  };
  
  dataFlows: {
    editorToServer: 'JSON-RPC via transport';
    serverToDB: 'SQL queries';
    serverToHandlers: 'Tool calls';
  };
}
```

### 2. Component Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    MCP-Compatible Editors                  │
│         (Cursor, Claude Code, Zed, Windsurf, etc)          │
└─────────────────────────┬───────────────────────────────────┘
                          │ MCP Protocol (JSON-RPC)
┌─────────────────────────▼───────────────────────────────────┐
│                    SpecLang MCP Server                      │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │   Transport   │──│     Auth      │──│    Router     │  │
│  │  - stdio      │  │  - basic      │  │  - request    │  │
│  │  - SSE        │  │  - token      │  │  - response   │  │
│  │  - HTTP       │  │  - api-key    │  │  - middleware │  │
│  │  - socket     │  │               │  │               │  │
│  └───────┬───────┘  └───────────────┘  └───────┬───────┘  │
│          │                                      │          │
│          ▼                                      ▼          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Tool Handlers                      │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐ │  │
│  │  │  query  │ │  search │ │  index  │ │   cascade   │ │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └──────┬──────┘ │  │
│  └───────┼───────────┼───────────┼──────────────┼───────┘  │
└──────────┼───────────┼───────────┼──────────────┼──────────┘
           │           │           │              │
           ▼           ▼           ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SQLite Database                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐   │
│  │  specs  │ │  refs   │ │ events  │ │ commands (FTS)  │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3. Request Flow
```typescript
// Request processing pipeline
interface RequestPipeline {
  steps: [
    'Receive JSON-RPC request from transport',
    'Parse and validate request schema',
    'Check authentication (if enabled)',
    'Route to appropriate tool handler',
    'Execute tool logic',
    'Query/update database',
    'Format response',
    'Send via transport'
  ];
  
  errorHandling: {
    parseError: 'Return JSON-RPC error immediately';
    authError: 'Return 401, log attempt';
    toolError: 'Return tool error response';
    dbError: 'Retry or return error';
  };
}
```

### 4. Transport Layer
```typescript
interface TransportLayer {
  stdio: {
    useCase: 'Editor-initiated mode';
    protocol: 'Bidirectional JSON-RPC over stdout/stdin';
    lifetime: 'Editor process lifetime';
  };
  
  sse: {
    useCase: 'Remote mode with streaming';
    protocol: 'Server-Sent Events + POST for messages';
    endpoints: { events: '/mcp', message: '/mcp/message' };
  };
  
  http: {
    useCase: 'REST-like access';
    protocol: 'HTTP POST/GET';
    endpoints: { rpc: '/rpc', tools: '/tools' };
  };
  
  socket: {
    useCase: 'Server mode, enterprise';
    protocol: 'Unix domain socket or Windows named pipe';
    path: '/tmp/speclang-mcp.sock';
  };
}
```

### 5. Database Schema
```sql
-- Core tables
CREATE TABLE specs (
  id TEXT PRIMARY KEY,
  file TEXT NOT NULL,
  parent TEXT,
  version TEXT,
  layer INTEGER,
  project_level TEXT,
  agent_support TEXT,
  tags TEXT, -- JSON array
  content TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE refs (
  id INTEGER PRIMARY KEY,
  source_spec TEXT,
  target_spec TEXT,
  block_id TEXT,
  ref_type TEXT,
  FOREIGN KEY (source_spec) REFERENCES specs(id)
);

CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  spec_id TEXT,
  event_type TEXT,
  data TEXT, -- JSON
  timestamp TEXT,
  FOREIGN KEY (spec_id) REFERENCES specs(id)
);

CREATE TABLE commands (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  command TEXT,
  status TEXT, -- pending, running, completed, failed
  result TEXT,
  created_at TEXT,
  completed_at TEXT
);

-- Full-text search
CREATE VIRTUAL TABLE specs_fts USING fts5(
  id,
  content,
  content='specs',
  content_rowid='rowid'
);
```

### 6. Tool Registry
```typescript
interface ToolRegistry {
  query: {
    name: 'speclang_query';
    description: 'Execute SQL query on spec database';
    input: { sql: string; params?: any[] };
  };
  
  search: {
    name: 'speclang_search';
    description: 'Full-text search across specs';
    input: { query: string; tags?: string[]; limit?: number };
  };
  
  get: {
    name: 'speclang_get';
    description: 'Get spec by ID with metadata';
    input: { id: string; include_content?: boolean };
  };
  
  index: {
    name: 'speclang_index';
    description: 'Get spec index with filters';
    input: { tags?: string[]; layer?: number };
  };
  
  command: {
    name: 'speclang_command';
    description: 'Execute inter-agent command';
    input: { agent_id: string; command: string };
  };
  
  logs: {
    name: 'speclang_logs';
    description: 'Get error and event logs';
    input: { level?: string; limit?: number };
  };
}
```

### 7. Server Initialization
```typescript
class MCPServer {
  private db: Database;
  private tools: Map<string, ToolHandler>;
  private transports: Transport[];
  
  async initialize(config: MCPServerConfig): Promise<void> {
    // 1. Initialize database
    this.db = new Database(config.database.path);
    await this.runMigrations();
    
    // 2. Build tool registry
    this.tools = this.buildToolRegistry();
    
    // 3. Setup transports based on mode
    this.transports = this.createTransports(config.mode);
    
    // 4. Setup auth (if configured)
    if (config.auth) {
      this.setupAuth(config.auth);
    }
    
    // 5. Register tools with each transport
    for (const transport of this.transports) {
      transport.registerTools(this.tools);
    }
  }
  
  async start(): Promise<void> {
    for (const transport of this.transports) {
      await transport.start();
    }
    console.error('SpecLang MCP server started');
  }
}
```

## Configuration Example
```json
{
  "server": {
    "name": "speclang-mcp",
    "version": "1.0.0"
  },
  "database": {
    "path": "./speclang.db",
    "readonly": false
  },
  "transport": {
    "mode": "stdio",
    "sse": { "heartbeat": 30000 },
    "http": { "port": 3000 }
  },
  "auth": {
    "enabled": false,
    "type": "none"
  },
  "tools": {
    "enabled": ["query", "search", "index", "get", "command", "logs"]
  }
}
```

## Documentation Output
1. Architecture diagram (Mermaid)
2. Component descriptions
3. Data flow documentation
4. API reference
5. Configuration schema

## Test Cases
1. All transports initialize correctly
2. Tools register with each transport
3. Database schema creates successfully
4. Auth middleware chains correctly
5. Request pipeline processes all steps
6. Error responses format correctly
