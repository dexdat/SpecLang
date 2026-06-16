# Bootstrap Phase 1.12: Agent Tools API

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.12 of the bootstrap process.

**Prerequisites**: 
- Phase 0 (Foundation) complete
- Phase 1.1-1.11 (Agent system) complete
- Tool registry defined

## Your Task
Implement the agent tools API that provides spec manipulation, file operations, dependency analysis, and cascade control to AI agents.

## Read These Specs First
1. `specs/tools.spec.md` - Tool API definitions
2. `specs/agent-protocol.spec.md` - Agent communication
3. `specs/cascade.spec.md` - Cascade operations

## What to Build

### Files to Create
```
src/tools/
├── index.ts              # Main exports
├── registry.ts           # Tool registry implementation
├── handlers/
│   ├── spec.ts           # Spec operations
│   ├── file.ts           # File operations
│   ├── dependency.ts     # Dependency analysis
│   └── cascade.ts        # Cascade operations
├── context.ts            # Tool execution context
└── types.ts              # Tool type definitions

tests/tools/
└── tools.test.ts
```

### Requirements

#### 1. Tool Types

```typescript
// src/tools/types.ts

export interface Tool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: ToolHandler;
  requiresOwnership?: boolean;
}

export interface ToolHandler<TInput = unknown, TOutput = unknown> {
  (input: TInput, context: ToolContext): Promise<TOutput>;
}

export interface ToolContext {
  sessionId: string;
  agentRole: AgentRole;
  workingDirectory: string;
  index: SpecIndex;
  db: Database;
  logger: Logger;
  ownership: OwnershipRegistry;
}

export interface ToolRegistry {
  register(tool: Tool): void;
  get(name: string): Tool | undefined;
  list(): Tool[];
  execute(name: string, input: unknown, context: ToolContext): Promise<unknown>;
}

export type AgentRole = 'north-star' | 'spec-writer' | 'code-gen' | 'test-writer' | 'back-sync';

export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: JSONSchema;
  description?: string;
  enum?: string[];
  default?: unknown;
}
```

#### 2. Tool Registry

```typescript
// src/tools/registry.ts

import { Tool, ToolRegistry, ToolContext, JSONSchema } from './types';

export class SimpleToolRegistry implements ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  
  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
  }
  
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }
  
  list(): Tool[] {
    return Array.from(this.tools.values());
  }
  
  async execute(name: string, input: unknown, context: ToolContext): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    
    const validated = this.validateInput(tool, input);
    
    if (tool.requiresOwnership && typeof validated === 'object' && validated !== null) {
      const filepath = (validated as any).filepath || (validated as any).id;
      if (filepath && !context.ownership.canWrite(context.sessionId, filepath)) {
        throw new Error(`Agent does not have ownership of: ${filepath}`);
      }
    }
    
    return tool.handler(validated, context);
  }
  
  private validateInput(tool: Tool, input: unknown): unknown {
    // Basic JSON schema validation
    const schema = tool.inputSchema;
    
    if (schema.type === 'object' && typeof input !== 'object') {
      throw new Error(`Tool ${tool.name}: expected object input`);
    }
    
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in (input as object))) {
          throw new Error(`Tool ${tool.name}: missing required field "${field}"`);
        }
      }
    }
    
    return input;
  }
}

export function createToolRegistry(): ToolRegistry {
  return new SimpleToolRegistry();
}
```

#### 3. Spec Tool Handlers

```typescript
// src/tools/handlers/spec.ts

import { ToolHandler, ToolContext } from '../types';

export interface ReadSpecInput {
  id: string;
}

export interface ReadSpecOutput {
  id: string;
  filepath: string;
  header: Record<string, unknown>;
  blocks: Block[];
  content: string;
}

export const readSpecHandler: ToolHandler<ReadSpecInput, ReadSpecOutput> = async (
  input: ReadSpecInput,
  context: ToolContext
) => {
  const spec = context.index.getSpec(input.id);
  if (!spec) {
    throw new Error(`Spec not found: ${input.id}`);
  }
  
  const content = await context.db.getSpecContent(spec.filepath);
  
  return {
    id: input.id,
    filepath: spec.filepath,
    header: spec.header,
    blocks: spec.blocks,
    content,
  };
};

export interface WriteSpecInput {
  id: string;
  content: string;
  message: string;
}

export interface WriteSpecOutput {
  success: boolean;
  filepath: string;
  commitHash?: string;
}

export const writeSpecHandler: ToolHandler<WriteSpecInput, WriteSpecOutput> = async (
  input: WriteSpecInput,
  context: ToolContext
) => {
  const spec = context.index.getSpec(input.id);
  if (!spec) {
    throw new Error(`Spec not found: ${input.id}`);
  }
  
  if (!context.ownership.canWrite(context.sessionId, spec.filepath)) {
    throw new Error(`Agent does not own: ${spec.filepath}`);
  }
  
  // Validate header
  const headerMatch = input.content.match(/# speclang-header lines:(\d+)/);
  if (!headerMatch) {
    throw new Error('Invalid spec: missing header');
  }
  
  // Write file
  await context.db.writeFile(spec.filepath, input.content);
  
  // Update index
  context.index.updateSpec(spec.filepath, input.content);
  
  // Log change
  context.logger.info({
    type: 'spec_write',
    id: input.id,
    session: context.sessionId,
    message: input.message,
  });
  
  return {
    success: true,
    filepath: spec.filepath,
  };
};

export interface SearchSpecsInput {
  query: string;
  tags?: string[];
  layer?: number;
  limit?: number;
}

export interface SearchSpecsOutput {
  results: Array<{
    id: string;
    filepath: string;
    score: number;
    snippet: string;
  }>;
  total: number;
}

export const searchSpecsHandler: ToolHandler<SearchSpecsInput, SearchSpecsOutput> = async (
  input: SearchSpecsInput,
  context: ToolContext
) => {
  const results = await context.db.searchSpecs({
    query: input.query,
    tags: input.tags,
    layer: input.layer,
    limit: input.limit || 50,
  });
  
  return {
    results: results.map(r => ({
      id: r.id,
      filepath: r.filepath,
      score: r.score,
      snippet: r.snippet,
    })),
    total: results.length,
  };
};
```

#### 4. File Tool Handlers

```typescript
// src/tools/handlers/file.ts

import { ToolHandler, ToolContext } from '../types';

export interface ReadFileInput {
  path: string;
}

export interface ReadFileOutput {
  path: string;
  content: string;
  exists: boolean;
}

export const readFileHandler: ToolHandler<ReadFileInput, ReadFileOutput> = async (
  input: ReadFileInput,
  context: ToolContext
) => {
  const fullPath = resolve(context.workingDirectory, input.path);
  
  try {
    const content = await context.db.readFile(fullPath);
    return {
      path: input.path,
      content,
      exists: true,
    };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        path: input.path,
        content: '',
        exists: false,
      };
    }
    throw e;
  }
};

export interface WriteFileInput {
  path: string;
  content: string;
  message?: string;
}

export interface WriteFileOutput {
  success: boolean;
  path: string;
}

export const writeFileHandler: ToolHandler<WriteFileInput, WriteFileOutput> = async (
  input: WriteFileInput,
  context: ToolContext
) => {
  const fullPath = resolve(context.workingDirectory, input.path);
  
  if (!context.ownership.canWrite(context.sessionId, fullPath)) {
    throw new Error(`Agent does not own: ${input.path}`);
  }
  
  await context.db.writeFile(fullPath, input.content);
  
  context.logger.info({
    type: 'file_write',
    path: input.path,
    session: context.sessionId,
    message: input.message,
  });
  
  return {
    success: true,
    path: input.path,
  };
};

export interface ListFilesInput {
  pattern?: string;
  directory?: string;
}

export interface ListFilesOutput {
  files: Array<{
    path: string;
    type: 'file' | 'directory';
    size?: number;
    modified?: string;
  }>;
}

export const listFilesHandler: ToolHandler<ListFilesInput, ListFilesOutput> = async (
  input: ListFilesInput,
  context: ToolContext
) => {
  const dir = input.directory 
    ? resolve(context.workingDirectory, input.directory)
    : context.workingDirectory;
  
  const files = await context.db.listFiles(dir, input.pattern || '**/*');
  
  return {
    files: files.map(f => ({
      path: relative(context.workingDirectory, f.path),
      type: f.isDirectory ? 'directory' : 'file',
      size: f.size,
      modified: f.modified?.toISOString(),
    })),
  };
};
```

#### 5. Dependency Tool Handlers

```typescript
// src/tools/handlers/dependency.ts

import { ToolHandler, ToolContext } from '../types';

export interface GetDependenciesInput {
  id: string;
}

export interface GetDependenciesOutput {
  id: string;
  dependencies: Array<{
    id: string;
    type: 'ref' | 'import' | 'extends';
    location: { line: number; column: number };
  }>;
}

export const getDependenciesHandler: ToolHandler<GetDependenciesInput, GetDependenciesOutput> = async (
  input: GetDependenciesInput,
  context: ToolContext
) => {
  const spec = context.index.getSpec(input.id);
  if (!spec) {
    throw new Error(`Spec not found: ${input.id}`);
  }
  
  const deps = context.index.getDependencies(input.id);
  
  return {
    id: input.id,
    dependencies: deps.map(d => ({
      id: d.targetId,
      type: d.type,
      location: d.location,
    })),
  };
};

export interface GetDependentsInput {
  id: string;
}

export interface GetDependentsOutput {
  id: string;
  dependents: Array<{
    id: string;
    type: 'ref' | 'import' | 'extends';
  }>;
}

export const getDependentsHandler: ToolHandler<GetDependentsInput, GetDependentsOutput> = async (
  input: GetDependentsInput,
  context: ToolContext
) => {
  const dependents = context.index.getDependents(input.id);
  
  return {
    id: input.id,
    dependents: dependents.map(d => ({
      id: d.sourceId,
      type: d.type,
    })),
  };
};

export interface ImpactAnalysisInput {
  id: string;
  changeType: 'modify' | 'delete' | 'add';
}

export interface ImpactAnalysisOutput {
  id: string;
  directImpact: string[];
  transitiveImpact: string[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export const impactAnalysisHandler: ToolHandler<ImpactAnalysisInput, ImpactAnalysisOutput> = async (
  input: ImpactAnalysisInput,
  context: ToolContext
) => {
  const dependents = context.index.getDependents(input.id, { recursive: true });
  
  const directDependents = context.index.getDependents(input.id);
  const transitiveDependents = dependents.filter(
    d => !directDependents.some(dd => dd.sourceId === d.sourceId)
  );
  
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (transitiveDependents.length > 10) riskLevel = 'high';
  else if (transitiveDependents.length > 3 || directDependents.length > 5) riskLevel = 'medium';
  
  const recommendations: string[] = [];
  if (input.changeType === 'delete') {
    recommendations.push('Consider deprecation before deletion');
    recommendations.push('Verify no active references exist');
  }
  if (riskLevel === 'high') {
    recommendations.push('Run full test suite before merging');
    recommendations.push('Notify affected spec owners');
  }
  
  return {
    id: input.id,
    directImpact: directDependents.map(d => d.sourceId),
    transitiveImpact: [...new Set(transitiveDependents.map(d => d.sourceId))],
    riskLevel,
    recommendations,
  };
};
```

#### 6. Cascade Tool Handlers

```typescript
// src/tools/handlers/cascade.ts

import { ToolHandler, ToolContext } from '../types';

export interface TriggerCascadeInput {
  path?: string;
  options?: {
    dryRun?: boolean;
    force?: boolean;
    maxDepth?: number;
  };
}

export interface TriggerCascadeOutput {
  cascadeId: string;
  triggered: boolean;
  affectedSpecs: string[];
  estimatedDuration?: number;
}

export const triggerCascadeHandler: ToolHandler<TriggerCascadeInput, TriggerCascadeOutput> = async (
  input: TriggerCascadeInput,
  context: ToolContext
) => {
  const cascadeId = context.db.generateId();
  
  const triggerPath = input.path 
    ? resolve(context.workingDirectory, input.path)
    : null;
  
  if (input.options?.dryRun) {
    const affectedSpecs = triggerPath
      ? context.index.getDependents(triggerPath, { recursive: true }).map(d => d.sourceId)
      : context.index.getAllSpecIds();
    
    return {
      cascadeId,
      triggered: false,
      affectedSpecs: [...new Set(affectedSpecs)],
      estimatedDuration: affectedSpecs.length * 500,
    };
  }
  
  // Queue cascade
  await context.db.queueCascade({
    id: cascadeId,
    triggerPath,
    options: input.options,
    sessionId: context.sessionId,
  });
  
  const affectedSpecs = triggerPath
    ? context.index.getDependents(triggerPath, { recursive: true }).map(d => d.sourceId)
    : [];
  
  context.logger.info({
    type: 'cascade_triggered',
    cascadeId,
    session: context.sessionId,
    triggerPath,
  });
  
  return {
    cascadeId,
    triggered: true,
    affectedSpecs: [...new Set(affectedSpecs)],
  };
};

export interface CascadeStatusInput {
  cascadeId?: string;
}

export interface CascadeStatusOutput {
  active: boolean;
  cascadeId?: string;
  status?: 'pending' | 'running' | 'paused' | 'converged' | 'failed';
  processedCount?: number;
  totalCount?: number;
  currentFile?: string;
  errors?: Array<{ file: string; error: string }>;
}

export const cascadeStatusHandler: ToolHandler<CascadeStatusInput, CascadeStatusOutput> = async (
  input: CascadeStatusInput,
  context: ToolContext
) => {
  if (input.cascadeId) {
    const cascade = await context.db.getCascade(input.cascadeId);
    if (!cascade) {
      throw new Error(`Cascade not found: ${input.cascadeId}`);
    }
    
    return {
      active: cascade.status === 'running',
      cascadeId: cascade.id,
      status: cascade.status,
      processedCount: cascade.processedCount,
      totalCount: cascade.totalCount,
      currentFile: cascade.currentFile,
      errors: cascade.errors,
    };
  }
  
  const activeCascade = await context.db.getActiveCascade();
  
  return {
    active: !!activeCascade,
    cascadeId: activeCascade?.id,
    status: activeCascade?.status,
    processedCount: activeCascade?.processedCount,
    totalCount: activeCascade?.totalCount,
    currentFile: activeCascade?.currentFile,
    errors: activeCascade?.errors,
  };
};
```

#### 7. Standard Tools Registration

```typescript
// src/tools/index.ts

import { Tool } from './types';
import { createToolRegistry, SimpleToolRegistry } from './registry';
import { readSpecHandler, writeSpecHandler, searchSpecsHandler } from './handlers/spec';
import { readFileHandler, writeFileHandler, listFilesHandler } from './handlers/file';
import { getDependenciesHandler, getDependentsHandler, impactAnalysisHandler } from './handlers/dependency';
import { triggerCascadeHandler, cascadeStatusHandler } from './handlers/cascade';

export * from './types';
export * from './registry';
export * from './handlers/spec';
export * from './handlers/file';
export * from './handlers/dependency';
export * from './handlers/cascade';

export function getStandardTools(): Tool[] {
  return [
    // Spec operations
    {
      name: 'read_spec',
      description: 'Read a spec by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Spec ID (e.g., @specs/auth)' },
        },
        required: ['id'],
      },
      handler: readSpecHandler,
    },
    {
      name: 'write_spec',
      description: 'Write to a spec file (requires ownership)',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Spec ID' },
          content: { type: 'string', description: 'Full spec content' },
          message: { type: 'string', description: 'Change description' },
        },
        required: ['id', 'content', 'message'],
      },
      handler: writeSpecHandler,
      requiresOwnership: true,
    },
    {
      name: 'search_specs',
      description: 'Search specs by query',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          tags: { type: 'array', items: { type: 'string' } },
          layer: { type: 'number' },
          limit: { type: 'number' },
        },
        required: ['query'],
      },
      handler: searchSpecsHandler,
    },
    
    // File operations
    {
      name: 'read_file',
      description: 'Read a file from the working directory',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to working directory' },
        },
        required: ['path'],
      },
      handler: readFileHandler,
    },
    {
      name: 'write_file',
      description: 'Write to a file (requires ownership)',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
          content: { type: 'string', description: 'File content' },
          message: { type: 'string', description: 'Change description' },
        },
        required: ['path', 'content'],
      },
      handler: writeFileHandler,
      requiresOwnership: true,
    },
    {
      name: 'list_files',
      description: 'List files in a directory',
      inputSchema: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Glob pattern' },
          directory: { type: 'string', description: 'Directory to list' },
        },
      },
      handler: listFilesHandler,
    },
    
    // Dependency operations
    {
      name: 'get_dependencies',
      description: 'Get dependencies of a spec',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Spec ID' },
        },
        required: ['id'],
      },
      handler: getDependenciesHandler,
    },
    {
      name: 'get_dependents',
      description: 'Get specs that depend on a spec',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Spec ID' },
        },
        required: ['id'],
      },
      handler: getDependentsHandler,
    },
    {
      name: 'impact_analysis',
      description: 'Analyze impact of a change to a spec',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Spec ID' },
          changeType: { type: 'string', enum: ['modify', 'delete', 'add'] },
        },
        required: ['id', 'changeType'],
      },
      handler: impactAnalysisHandler,
    },
    
    // Cascade operations
    {
      name: 'trigger_cascade',
      description: 'Trigger a cascade reaction',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File to trigger cascade from' },
          options: {
            type: 'object',
            properties: {
              dryRun: { type: 'boolean' },
              force: { type: 'boolean' },
              maxDepth: { type: 'number' },
            },
          },
        },
      },
      handler: triggerCascadeHandler,
    },
    {
      name: 'cascade_status',
      description: 'Get cascade status',
      inputSchema: {
        type: 'object',
        properties: {
          cascadeId: { type: 'string', description: 'Cascade ID (optional)' },
        },
      },
      handler: cascadeStatusHandler,
    },
  ];
}

export { SimpleToolRegistry, createToolRegistry };
```

## Test Cases
1. Registry stores and retrieves tools
2. Tool execution validates input
3. Ownership check blocks unauthorized writes
4. read_spec returns spec content
5. write_spec updates spec
6. search_specs finds matching specs
7. Dependency analysis works
8. Impact analysis calculates risk
9. Cascade trigger queues cascade
10. Cascade status returns correct state

## Validation
```bash
bun test tests/tools/tools.test.ts
npx tsc --noEmit src/tools/
```

## Output Format
After completing, output:
1. Tool types implemented
2. Tool registry implemented
3. Spec handlers implemented
4. File handlers implemented
5. Dependency handlers implemented
6. Cascade handlers implemented
7. Test results
