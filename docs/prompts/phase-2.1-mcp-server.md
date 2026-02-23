# Bootstrap Phase 2.1: Complete MCP Server

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 2.1 of the bootstrap process.

**Prerequisites**: 
- Phase 0 (Foundation) complete
- Phase 1 (Core Runtime) in progress

## Your Task
Complete the MCP (Model Context Protocol) server that allows any editor to interact with SpecLang. This provides a universal interface for AI assistants.

## Read These Specs First
1. `specs/mcp.spec.md` - Main MCP spec
2. `specs/mcp.spec.dir/overview.spec.md` - Overview
3. `specs/mcp.spec.dir/architecture.spec.md` - Architecture
4. `specs/mcp.spec.dir/tools/*.spec.md` - Individual tools

## Current State
- `src/mcp/server.ts` - Partial implementation exists
- Some tools are defined but not complete

## What to Build

### Files to Complete/Create
```
src/mcp/
├── server.ts           # Main MCP server (enhance)
├── tools/
│   ├── index.ts        # Tool registry
│   ├── search.ts       # speclang_search
│   ├── specs.ts        # speclang_get/create/update
│   ├── locks.ts        # speclang_lock/unlock
│   ├── cascade.ts      # speclang_cascade_*
│   └── index-tools.ts  # speclang_index_*
├── sse.ts              # SSE streaming
├── auth.ts             # Authentication
└── config.ts           # Configuration

tests/mcp/
├── server.test.ts
└── tools.test.ts
```

### MCP Tools to Implement

#### 1. Search Tools
```typescript
// speclang_search
{
  name: 'speclang_search',
  description: 'Full-text search across all specs',
  inputSchema: {
    query: string,      // Search query
    tags?: string[],    // Filter by tags
    layer?: number,     // Filter by layer
    limit?: number,     // Max results (default 10)
  },
  returns: {
    results: [{
      id: string,
      file: string,
      score: number,
      snippet: string,
    }]
  }
}

// speclang_index_refresh
{
  name: 'speclang_index_refresh',
  description: 'Rebuild the spec index',
  returns: {
    specs_indexed: number,
    refs_found: number,
    errors: string[],
  }
}
```

#### 2. Spec CRUD Tools
```typescript
// speclang_get_spec
{
  name: 'speclang_get_spec',
  inputSchema: {
    id: string,         // Spec ID or file path
    include_content?: boolean,
  },
  returns: {
    metadata: SpecMetadata,
    content?: string,
    blocks?: Block[],
    dependencies?: string[],
    dependents?: string[],
  }
}

// speclang_create_spec
{
  name: 'speclang_create_spec',
  inputSchema: {
    id: string,
    content: string,
    agent_id?: string,   // For ownership tracking
  },
  returns: {
    success: boolean,
    file: string,
    validation?: ValidationResult,
  }
}

// speclang_update_spec
{
  name: 'speclang_update_spec',
  inputSchema: {
    id: string,
    content: string,
    message?: string,    // Commit message
    agent_id?: string,
  },
  returns: {
    success: boolean,
    changed_blocks: string[],
    validation?: ValidationResult,
  }
}

// speclang_list_specs
{
  name: 'speclang_list_specs',
  inputSchema: {
    tags?: string[],
    layer?: number,
    prefix?: string,     // ID prefix filter
  },
  returns: {
    specs: SpecMetadata[],
    total: number,
  }
}
```

#### 3. Lock Tools
```typescript
// speclang_lock
{
  name: 'speclang_lock',
  inputSchema: {
    resource: string,    // File path or spec ID
    agent_id: string,
    ttl?: number,        // Lock timeout in seconds
  },
  returns: {
    acquired: boolean,
    lock_id?: string,
    held_by?: string,    // If lock failed
  }
}

// speclang_unlock
{
  name: 'speclang_unlock',
  inputSchema: {
    lock_id: string,
    agent_id: string,
  },
  returns: {
    released: boolean,
  }
}
```

#### 4. Cascade Tools
```typescript
// speclang_cascade_status
{
  name: 'speclang_cascade_status',
  returns: {
    status: 'idle' | 'cascading' | 'converged',
    depth?: number,
    files_changed?: string[],
    active_agents?: string[],
    time_elapsed?: number,
  }
}

// speclang_cascade_trigger
{
  name: 'speclang_cascade_trigger',
  inputSchema: {
    spec_id: string,     // Spec that changed
    change_type: 'create' | 'modify' | 'delete',
  },
  returns: {
    cascade_id: string,
    status: string,
  }
}

// speclang_cascade_abort
{
  name: 'speclang_cascade_abort',
  returns: {
    aborted: boolean,
    rolled_back: string[],
  }
}
```

#### 5. Graph Tools
```typescript
// speclang_get_dependencies
{
  name: 'speclang_get_dependencies',
  inputSchema: {
    id: string,
    transitive?: boolean,
  },
  returns: {
    dependencies: string[],
  }
}

// speclang_get_dependents
{
  name: 'speclang_get_dependents',
  inputSchema: {
    id: string,
    transitive?: boolean,
  },
  returns: {
    dependents: string[],
  }
}

// speclang_impact_analysis
{
  name: 'speclang_impact_analysis',
  inputSchema: {
    id: string,          // If this spec changes...
  },
  returns: {
    direct_impact: string[],
    transitive_impact: string[],
    files_affected: string[],
  }
}
```

### SSE Streaming
```typescript
// Real-time events via Server-Sent Events
// GET /sse

interface SSEEvent {
  type: 'file_change' | 'cascade_progress' | 'agent_activity' | 'convergence';
  data: any;
  timestamp: string;
}

// Event types:
// file_change: { path, kind, cascade_id }
// cascade_progress: { cascade_id, depth, agent, action }
// agent_activity: { agent_id, role, status, working_on }
// convergence: { cascade_id, files_changed, duration }
```

### Configuration
```typescript
interface MCPServerConfig {
  port: number;           // Default 3000
  database: string;       // SQLite path
  specs_dir: string;      // specs/ directory
  auth?: {
    enabled: boolean;
    api_keys?: string[];
  };
  sse: {
    enabled: boolean;
    heartbeat_interval: number;
  };
}
```

### CLI Integration
```bash
# Start MCP server
speclang-mcp start --port 3000

# One-shot commands
speclang-mcp search "authentication"
speclang-mcp get @specs/auth
speclang-mcp validate
```

## Test Cases
1. Search returns correct results
2. Get spec returns full metadata
3. Create spec validates header
4. Update spec preserves history
5. Lock prevents concurrent writes
6. SSE streams events correctly
7. Auth rejects invalid keys

## Validation
```bash
bun test tests/mcp/server.test.ts
```

## Output Format
After completing, output:
1. List of tools implemented
2. Test coverage
3. SSE event types supported
