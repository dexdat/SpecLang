# Bootstrap Phase 0.12: Agent Tools API

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.12 of the bootstrap process.

**Prerequisites**: 
- Phase 0.1-0.11 complete (SQLite, Parser, Indexer, Config, Workflow, Stdlib, Skills)
- Daemon and Agent infrastructure in progress

## Your Task
Implement the Agent Tools API - the interface through which agents interact with specs, files, and the system. Tools provide controlled access with ownership enforcement and audit logging.

## Read These Specs First
1. `specs/tools.spec.md` - Tool API definitions
2. `specs/agent-protocol.spec.md` - Agent communication
3. `specs/cascade.spec.md` - Cascade tools

## What to Build

### Files to Create
```
src/tools/
├── index.ts              # Main exports
├── registry.ts           # Tool registry
├── types.ts              # TypeScript types
├── file-tools.ts         # File operations
├── query-tools.ts        # Query operations
├── graph-tools.ts        # Dependency graph
├── validation-tools.ts   # Validation helpers
├── cascade-tools.ts      # Cascade operations
├── git-tools.ts          # Git integration
├── pipeline-tools.ts     # Pipeline operations
└── session-tools.ts      # Session management

tests/
└── tools.test.ts
```

### Requirements

#### 1. Tool Types (types.ts)

```typescript
interface Tool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: ToolHandler<TInput, TOutput>;
  requiresOwnership?: boolean;
  auditLog?: boolean;
}

type ToolHandler<I, O> = (input: I, context: ToolContext) => Promise<ToolResult<O>>;

interface ToolContext {
  sessionId: string;
  agentRole: string;
  owns: string[];
  workingDirectory: string;
}

interface ToolResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  sideEffects?: string[];
}

interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  [key: string]: any;
}
```

#### 2. Tool Registry (registry.ts)

```typescript
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private ownershipChecker: OwnershipChecker;
  
  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }
  
  async execute(name: string, input: any, context: ToolContext): Promise<ToolResult> {
    const tool = this.tools.get(name);
    
    if (!tool) {
      return { success: false, error: `Unknown tool: ${name}` };
    }
    
    // Validate input schema
    const validation = this.validateInput(tool, input);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // Check ownership if required
    if (tool.requiresOwnership) {
      const ownership = this.ownershipChecker.check(context, input);
      if (!ownership.allowed) {
        return { success: false, error: ownership.reason };
      }
    }
    
    // Execute with audit logging
    if (tool.auditLog !== false) {
      await this.logToolCall(name, input, context);
    }
    
    try {
      const result = await tool.handler(input, context);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  list(): ToolMetadata[] {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      requiresOwnership: t.requiresOwnership
    }));
  }
  
  private validateInput(tool: Tool, input: any): ValidationResult {
    // JSON Schema validation
    return validate(tool.inputSchema, input);
  }
}
```

#### 3. File Tools (file-tools.ts)

```typescript
// speclang_create_spec
export const createSpecTool: Tool<CreateSpecInput, CreateSpecOutput> = {
  name: 'speclang_create_spec',
  description: 'Create a new spec file',
  requiresOwnership: true,
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Where to create' },
      header: { type: 'object', description: 'Header fields' },
      content: { type: 'string', description: 'Spec content' }
    },
    required: ['path', 'header', 'content']
  },
  handler: async (input, context) => {
    const { path, header, content } = input;
    
    // 1. Check ownership
    // 2. Write file with formatted header
    // 3. Update SQLite index
    // 4. Trigger inotify for cascade
    
    return {
      success: true,
      data: { path },
      sideEffects: ['file_written', 'index_updated', 'cascade_triggered']
    };
  }
};

// speclang_read_file
export const readFileTool: Tool<ReadFileInput, ReadFileOutput> = {
  name: 'speclang_read_file',
  description: 'Read full file content',
  requiresOwnership: false,
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' }
    },
    required: ['path']
  },
  handler: async (input, context) => {
    const content = await fs.readFile(input.path, 'utf-8');
    const header = await parseHeader(content);
    
    return { success: true, data: { content, header } };
  }
};

// speclang_read_header
export const readHeaderTool: Tool<ReadHeaderInput, ReadHeaderOutput> = {
  name: 'speclang_read_header',
  description: 'Read only header (efficient)',
  requiresOwnership: false,
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' }
    },
    required: ['path']
  },
  handler: async (input, context) => {
    // Read only first N+2 lines (optimization)
    const header = await readHeaderOnly(input.path);
    return { success: true, data: header };
  }
};

// speclang_update_spec
export const updateSpecTool: Tool<UpdateSpecInput, UpdateSpecOutput> = {
  name: 'speclang_update_spec',
  description: 'Update existing spec',
  requiresOwnership: true,
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' },
      header: { type: 'object' },
      content: { type: 'string' },
      append: { type: 'boolean' }
    },
    required: ['path']
  },
  handler: async (input, context) => {
    // 1. Check ownership
    // 2. Update file (append or replace)
    // 3. Update index
    
    return { success: true, data: { path: input.path } };
  }
};

// speclang_delete_spec
export const deleteSpecTool: Tool<DeleteSpecInput, DeleteSpecOutput> = {
  name: 'speclang_delete_spec',
  description: 'Delete a spec file',
  requiresOwnership: true,
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' }
    },
    required: ['path']
  },
  handler: async (input, context) => {
    // 1. Check for dependents
    const dependents = await findDependents(input.path);
    
    if (dependents.length > 0) {
      return {
        success: false,
        data: { dependents },
        error: 'Cannot delete: has dependents'
      };
    }
    
    // 2. Delete file
    await fs.unlink(input.path);
    
    // 3. Update index
    await removeFromIndex(input.path);
    
    return { success: true, data: { dependents: [] } };
  }
};
```

#### 4. Query Tools (query-tools.ts)

```typescript
// speclang_find_dependents
export const findDependentsTool: Tool<FindDependentsInput, FindDependentsOutput> = {
  name: 'speclang_find_dependents',
  description: 'Find all specs that depend on this one',
  requiresOwnership: false,
  inputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: '@ref to search' }
    },
    required: ['id']
  },
  handler: async (input, context) => {
    // SQLite query
    const dependents = await db.query(`
      SELECT path, id, layer 
      FROM specs 
      WHERE content LIKE ? 
      ORDER BY layer
    `, [`%${input.id}%`]);
    
    return { success: true, data: { dependents } };
  }
};

// speclang_find_dependencies
export const findDependenciesTool: Tool = {
  name: 'speclang_find_dependencies',
  description: 'Find all specs this one depends on',
  requiresOwnership: false,
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' }
    },
    required: ['path']
  },
  handler: async (input, context) => {
    const content = await fs.readFile(input.path, 'utf-8');
    const refs = extractRefs(content);
    
    const dependencies = await Promise.all(
      refs.map(async ref => ({
        path: await resolveRefToPath(ref),
        id: ref,
        resolved: await checkRefExists(ref)
      }))
    );
    
    return { success: true, data: { dependencies } };
  }
};

// speclang_find_by_tag
export const findByTagTool: Tool = {
  name: 'speclang_find_by_tag',
  description: 'Find specs by tag',
  requiresOwnership: false,
  inputSchema: {
    type: 'object',
    properties: {
      tag: { type: 'string' },
      layer: { type: 'number' }
    },
    required: ['tag']
  },
  handler: async (input, context) => {
    let query = `SELECT path, id, short FROM specs WHERE tags LIKE ?`;
    const params = [`%"${input.tag}"%`];
    
    if (input.layer !== undefined) {
      query += ` AND layer = ?`;
      params.push(input.layer);
    }
    
    const specs = await db.query(query, params);
    return { success: true, data: { specs } };
  }
};

// speclang_find_by_level
export const findByLevelTool: Tool = {
  name: 'speclang_find_by_level',
  description: 'Find specs at a specific level',
  requiresOwnership: false,
  inputSchema: {
    type: 'object',
    properties: {
      level: { type: 'number' },
      parent: { type: 'string' }
    },
    required: ['level']
  },
  handler: async (input, context) => {
    let query = `SELECT path, id, short FROM specs WHERE layer = ?`;
    const params = [input.level];
    
    if (input.parent) {
      query += ` AND parent = ?`;
      params.push(input.parent);
    }
    
    const specs = await db.query(query, params);
    return { success: true, data: { specs } };
  }
};

// speclang_get_tree
export const getTreeTool: Tool = {
  name: 'speclang_get_tree',
  description: 'Get parent and children of a spec',
  requiresOwnership: false,
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' },
      depth: { type: 'number', default: 1 }
    },
    required: ['path']
  },
  handler: async (input, context) => {
    const spec = await getSpec(input.path);
    const parent = spec.parent ? await getSpecById(spec.parent) : null;
    const children = await getChildren(spec.id, input.depth || 1);
    
    return { success: true, data: { tree: { ...spec, parent, children } } };
  }
};
```

#### 5. Graph Tools (graph-tools.ts)

```typescript
// speclang_graph_dependents
export const graphDependentsTool: Tool = {
  name: 'speclang_graph_dependents',
  description: 'Get full dependency graph from a spec',
  requiresOwnership: false,
  inputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      max_depth: { type: 'number', default: 10 }
    },
    required: ['id']
  },
  handler: async (input, context) => {
    const nodes: any[] = [];
    const edges: any[] = [];
    
    await buildDependentGraph(input.id, nodes, edges, input.max_depth || 10);
    
    return { success: true, data: { graph: { nodes, edges } } };
  }
};

// speclang_graph_ancestors
export const graphAncestorsTool: Tool = {
  name: 'speclang_graph_ancestors',
  description: 'Get all ancestors back to north star',
  requiresOwnership: false,
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' }
    },
    required: ['path']
  },
  handler: async (input, context) => {
    const ancestors: any[] = [];
    let current = await getSpec(input.path);
    
    while (current) {
      ancestors.push({
        path: current.path,
        id: current.id,
        level: current.layer
      });
      
      current = current.parent ? await getSpecById(current.parent) : null;
    }
    
    return { success: true, data: { ancestors } };
  }
};
```

#### 6. Validation Tools (validation-tools.ts)

```typescript
// speclang_validate_header
export const validateHeaderTool: Tool = {
  name: 'speclang_validate_header',
  description: 'Validate a header',
  requiresOwnership: false,
  inputSchema: {
    type: 'object',
    properties: {
      header: { type: 'object' }
    },
    required: ['header']
  },
  handler: async (input, context) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check required fields
    if (!input.header.id) errors.push('Missing id');
    if (!input.header.version) errors.push('Missing version');
    if (!input.header.layer && input.header.layer !== 0) errors.push('Missing layer');
    
    // Check format
    if (input.header.id && !input.header.id.startsWith('@')) {
      errors.push('id must start with @');
    }
    
    return {
      success: errors.length === 0,
      data: { errors, warnings }
    };
  }
};

// speclang_validate_refs
export const validateRefsTool: Tool = {
  name: 'speclang_validate_refs',
  description: 'Check all refs in a spec exist',
  requiresOwnership: false,
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' }
    },
    required: ['path']
  },
  handler: async (input, context) => {
    const content = await fs.readFile(input.path, 'utf-8');
    const refs = extractRefs(content);
    const brokenRefs: string[] = [];
    
    for (const ref of refs) {
      if (!await checkRefExists(ref)) {
        brokenRefs.push(ref);
      }
    }
    
    return {
      success: brokenRefs.length === 0,
      data: { broken_refs: brokenRefs }
    };
  }
};
```

#### 7. Cascade Tools (cascade-tools.ts)

```typescript
// speclang_trigger_cascade
export const triggerCascadeTool: Tool = {
  name: 'speclang_trigger_cascade',
  description: 'Manually trigger cascade from a file',
  requiresOwnership: false,
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' }
    },
    required: ['path']
  },
  handler: async (input, context) => {
    const cascadeId = generateCascadeId();
    
    // Queue cascade event
    await daemon.queueEvent({
      type: 'cascade',
      path: input.path,
      cascadeId
    });
    
    return { success: true, data: { cascade_id: cascadeId, status: 'queued' } };
  }
};

// speclang_cascade_status
export const cascadeStatusTool: Tool = {
  name: 'speclang_cascade_status',
  description: 'Check current cascade status',
  requiresOwnership: false,
  inputSchema: { type: 'object', properties: {} },
  handler: async (input, context) => {
    const status = await daemon.getCascadeStatus();
    
    return {
      success: true,
      data: {
        active: status.active,
        depth: status.depth,
        files_changed: status.filesChanged,
        last_change: status.lastChange
      }
    };
  }
};
```

#### 8. Git Tools (git-tools.ts)

```typescript
// speclang_git_commit
export const gitCommitTool: Tool = {
  name: 'speclang_git_commit',
  description: 'Commit changed files',
  requiresOwnership: false,
  inputSchema: {
    type: 'object',
    properties: {
      files: { type: 'array', items: { type: 'string' } },
      message: { type: 'string' }
    },
    required: ['files', 'message']
  },
  handler: async (input, context) => {
    await exec(`git add ${input.files.map(f => `"${f}"`).join(' ')}`);
    await exec(`git commit -m "${input.message}"`);
    const hash = await getLatestHash();
    
    return { success: true, data: { commit_hash: hash } };
  }
};

// speclang_git_status
export const gitStatusTool: Tool = {
  name: 'speclang_git_status',
  description: 'Check git status',
  requiresOwnership: false,
  inputSchema: { type: 'object', properties: {} },
  handler: async (input, context) => {
    const status = await getGitStatus();
    
    return {
      success: true,
      data: {
        modified: status.modified,
        added: status.added,
        deleted: status.deleted
      }
    };
  }
};
```

#### 9. Session Tools (session-tools.ts)

```typescript
// speclang_session_info
export const sessionInfoTool: Tool = {
  name: 'speclang_session_info',
  description: 'Get current session info',
  requiresOwnership: false,
  inputSchema: { type: 'object', properties: {} },
  handler: async (input, context) => {
    return {
      success: true,
      data: {
        session_id: context.sessionId,
        agent: context.agentRole,
        owns: context.owns,
        status: 'active'
      }
    };
  }
};

// speclang_sessions_list
export const sessionsListTool: Tool = {
  name: 'speclang_sessions_list',
  description: 'List all active sessions',
  requiresOwnership: false,
  inputSchema: { type: 'object', properties: {} },
  handler: async (input, context) => {
    const sessions = await sessionManager.listActive();
    
    return {
      success: true,
      data: {
        sessions: sessions.map(s => ({
          id: s.id,
          agent: s.role,
          status: s.status,
          current_file: s.currentFile
        }))
      }
    };
  }
};
```

#### 10. Register All Tools

```typescript
// src/tools/index.ts
import { ToolRegistry } from './registry';
import { createSpecTool, readFileTool, readHeaderTool, updateSpecTool, deleteSpecTool } from './file-tools';
import { findDependentsTool, findDependenciesTool, findByTagTool, findByLevelTool, getTreeTool } from './query-tools';
import { graphDependentsTool, graphAncestorsTool } from './graph-tools';
import { validateHeaderTool, validateRefsTool } from './validation-tools';
import { triggerCascadeTool, cascadeStatusTool } from './cascade-tools';
import { gitCommitTool, gitStatusTool } from './git-tools';
import { sessionInfoTool, sessionsListTool } from './session-tools';

export function initializeTools(): ToolRegistry {
  const registry = new ToolRegistry();
  
  // File tools
  registry.register(createSpecTool);
  registry.register(readFileTool);
  registry.register(readHeaderTool);
  registry.register(updateSpecTool);
  registry.register(deleteSpecTool);
  
  // Query tools
  registry.register(findDependentsTool);
  registry.register(findDependenciesTool);
  registry.register(findByTagTool);
  registry.register(findByLevelTool);
  registry.register(getTreeTool);
  
  // Graph tools
  registry.register(graphDependentsTool);
  registry.register(graphAncestorsTool);
  
  // Validation tools
  registry.register(validateHeaderTool);
  registry.register(validateRefsTool);
  
  // Cascade tools
  registry.register(triggerCascadeTool);
  registry.register(cascadeStatusTool);
  
  // Git tools
  registry.register(gitCommitTool);
  registry.register(gitStatusTool);
  
  // Session tools
  registry.register(sessionInfoTool);
  registry.register(sessionsListTool);
  
  return registry;
}
```

## Test Cases
1. Create spec with ownership check
2. Read spec without ownership (allowed)
3. Update spec with ownership check
4. Delete spec with dependent check
5. Find dependents returns correct list
6. Find by tag filters correctly
7. Graph tools build correct structure
8. Validation tools detect errors
9. Cascade tools trigger correctly
10. Git tools interact with repo

## Validation
```bash
bun test tests/tools.test.ts

# List available tools
speclang tools list

# Test specific tool
speclang tools test speclang_find_dependents --input '{"id": "@specs/auth"}'
```

## Output Format
After completing, output:
1. Files created
2. Tools implemented by category
3. Ownership enforcement summary
4. Test results
