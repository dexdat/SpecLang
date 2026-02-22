/**
 * Agent tools implementation
 * 
 * Generated from: @speclang/agent-protocol
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { Session, Tool, ToolRegistry, ToolHandler, ToolContext } from './types';
import { OwnershipRegistry } from './ownership';

/**
 * Simple tool registry implementation
 */
export class SimpleToolRegistry implements ToolRegistry {
  private tools: Map<string, Tool>;

  constructor() {
    this.tools = new Map();
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
    console.log(`[Tools] Registered: ${tool.name}`);
  }
}

// ============================================================================
// TOOL HANDLERS
// ============================================================================

/**
 * Read a spec file by ID
 */
export const readSpecHandler: ToolHandler = async (input: { id: string }, context: ToolContext) => {
  const { session, index } = context;

  console.log(`[Tools] read_spec: ${input.id}`);

  // Look up spec in index
  let filepath = input.id;
  if (index?.specs?.[input.id]) {
    filepath = index.specs[input.id].path;
  } else if (!input.id.startsWith('specs/')) {
    filepath = `specs/${input.id}`;
  }

  // Check read permission (anyone can read)
  const canRead = context.ownership.canRead(session.agent.id, filepath);
  if (!canRead.allowed) {
    throw new Error(`Cannot read: ${canRead.reason}`);
  }

  // Read file
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    return { success: true, content, path: filepath };
  } catch (error: any) {
    throw new Error(`Failed to read spec: ${error.message}`);
  }
};

/**
 * Write a spec file
 */
export const writeSpecHandler: ToolHandler = async (input: { 
  id: string; 
  content: string;
  message?: string;
}, context: ToolContext) => {
  const { session, ownership } = context;

  console.log(`[Tools] write_spec: ${input.id}`);

  // Determine filepath
  let filepath = input.id;
  if (!input.id.startsWith('specs/') && !input.id.startsWith('src/')) {
    filepath = `specs/${input.id}`;
  }

  // Check write permission
  const canWrite = ownership.canWrite(session.agent.id, session.agent.role, filepath);
  if (!canWrite.allowed) {
    throw new Error(`Cannot write: ${canWrite.reason}`);
  }

  // Ensure directory exists
  await fs.ensureDir(path.dirname(filepath));

  // Write file
  try {
    await fs.writeFile(filepath, input.content, 'utf-8');
    console.log(`[Tools] Wrote: ${filepath}`);
    return { success: true, path: filepath, message: input.message || 'Written successfully' };
  } catch (error: any) {
    throw new Error(`Failed to write spec: ${error.message}`);
  }
};

/**
 * Search specs using FTS
 */
export const searchSpecsHandler: ToolHandler = async (input: {
  query: string;
  tags?: string[];
  layer?: number;
}, context: ToolContext) => {
  const { index } = context;

  console.log(`[Tools] search_specs: ${input.query}`);

  if (!index?.specs) {
    throw new Error('Index not available');
  }

  const results = Object.values(index.specs)
    .filter((spec: any) => {
      // Filter by query in short description or tags
      if (input.query) {
        const queryLower = input.query.toLowerCase();
        const matchShort = spec.short?.toLowerCase().includes(queryLower);
        const matchTags = spec.tags?.some((t: string) => t.toLowerCase().includes(queryLower));
        if (!matchShort && !matchTags) return false;
      }

      // Filter by tags
      if (input.tags?.length) {
        const hasTags = input.tags.some((t: string) => spec.tags?.includes(t));
        if (!hasTags) return false;
      }

      // Filter by layer
      if (input.layer !== undefined && spec.layer !== input.layer) {
        return false;
      }

      return true;
    })
    .map((spec: any) => ({
      id: spec.id,
      path: spec.path,
      short: spec.short,
      layer: spec.layer,
      tags: spec.tags,
    }));

  return { success: true, count: results.length, results };
};

/**
 * Read a file
 */
export const readFileHandler: ToolHandler = async (input: { path: string }, context: ToolContext) => {
  const { ownership } = context;

  console.log(`[Tools] read_file: ${input.path}`);

  // Check read permission
  const canRead = ownership.canRead('', input.path);
  if (!canRead.allowed) {
    throw new Error(`Cannot read: ${canRead.reason}`);
  }

  try {
    const content = await fs.readFile(input.path, 'utf-8');
    return { success: true, content, path: input.path };
  } catch (error: any) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
};

/**
 * Write a file
 */
export const writeFileHandler: ToolHandler = async (input: {
  path: string;
  content: string;
}, context: ToolContext) => {
  const { session, ownership } = context;

  console.log(`[Tools] write_file: ${input.path}`);

  // Check write permission
  const canWrite = ownership.canWrite(session.agent.id, session.agent.role, input.path);
  if (!canWrite.allowed) {
    throw new Error(`Cannot write: ${canWrite.reason}`);
  }

  // Ensure directory exists
  await fs.ensureDir(path.dirname(input.path));

  try {
    await fs.writeFile(input.path, input.content, 'utf-8');
    return { success: true, path: input.path };
  } catch (error: any) {
    throw new Error(`Failed to write file: ${error.message}`);
  }
};

/**
 * List files in a directory
 */
export const listFilesHandler: ToolHandler = async (input: {
  path?: string;
  pattern?: string;
}, context: ToolContext) => {
  const searchPath = input.path || 'specs';

  console.log(`[Tools] list_files: ${searchPath}`);

  try {
    const files = await fs.readdir(searchPath, { withFileTypes: true });
    const results = files
      .filter(f => {
        if (input.pattern) {
          return f.name.match(new RegExp(input.pattern));
        }
        return true;
      })
      .map(f => ({
        name: f.name,
        isDirectory: f.isDirectory(),
        path: path.join(searchPath, f.name),
      }));

    return { success: true, count: results.length, files: results };
  } catch (error: any) {
    throw new Error(`Failed to list files: ${error.message}`);
  }
};

/**
 * Get dependencies for a spec
 */
export const getDependenciesHandler: ToolHandler = async (input: { id: string }, context: ToolContext) => {
  const { index } = context;

  console.log(`[Tools] get_dependencies: ${input.id}`);

  if (!index?.graph?.dependencies) {
    throw new Error('Index not available');
  }

  const deps = index.graph.dependencies[input.id] || [];

  return { success: true, id: input.id, dependencies: deps };
};

/**
 * Get dependents for a spec
 */
export const getDependentsHandler: ToolHandler = async (input: { id: string }, context: ToolContext) => {
  const { index } = context;

  console.log(`[Tools] get_dependents: ${input.id}`);

  if (!index?.graph?.dependents) {
    throw new Error('Index not available');
  }

  const dependents = index.graph.dependents[input.id] || [];

  return { success: true, id: input.id, dependents };
};

/**
 * Get impact analysis for a spec
 */
export const impactAnalysisHandler: ToolHandler = async (input: { id: string }, context: ToolContext) => {
  const { index } = context;

  console.log(`[Tools] impact_analysis: ${input.id}`);

  if (!index) {
    throw new Error('Index not available');
  }

  const dependents = index.graph?.dependents?.[input.id] || [];
  const transitive: string[] = [];
  
  // Simple transitive lookup (depth 2)
  for (const dep of dependents) {
    transitive.push(dep);
    const subDeps = index.graph?.dependents?.[dep] || [];
    transitive.push(...subDeps);
  }

  return { 
    success: true, 
    id: input.id, 
    direct: dependents,
    transitive: Array.from(new Set(transitive)),
  };
};

/**
 * Trigger cascade (placeholder - would integrate with daemon)
 */
export const triggerCascadeHandler: ToolHandler = async (input: { path?: string }, context: ToolContext) => {
  console.log(`[Tools] trigger_cascade: ${input.path || 'all'}`);

  // This would integrate with the daemon in production
  return { 
    success: true, 
    message: 'Cascade triggered (simulated)',
    path: input.path,
  };
};

/**
 * Get cascade status
 */
export const cascadeStatusHandler: ToolHandler = async (_input: any, _context: ToolContext) => {
  console.log(`[Tools] cascade_status`);

  // This would integrate with the daemon in production
  return {
    success: true,
    status: 'idle',
    lastCascade: null,
  };
};

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

/**
 * Get all standard agent tools
 */
export function getStandardTools(): Tool[] {
  return [
    {
      name: 'read_spec',
      description: 'Read a spec file by ID or path',
      input_schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Spec ID or path' },
        },
        required: ['id'],
      },
      handler: readSpecHandler,
    },
    {
      name: 'write_spec',
      description: 'Write a spec file (requires ownership)',
      input_schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Spec ID or path' },
          content: { type: 'string', description: 'Spec content' },
          message: { type: 'string', description: 'Commit message' },
        },
        required: ['id', 'content'],
      },
      handler: writeSpecHandler,
    },
    {
      name: 'search_specs',
      description: 'Search specs using full-text search',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
          layer: { type: 'number', description: 'Filter by layer' },
        },
        required: ['query'],
      },
      handler: searchSpecsHandler,
    },
    {
      name: 'read_file',
      description: 'Read any file',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
        },
        required: ['path'],
      },
      handler: readFileHandler,
    },
    {
      name: 'write_file',
      description: 'Write a file (requires ownership)',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
          content: { type: 'string', description: 'File content' },
        },
        required: ['path', 'content'],
      },
      handler: writeFileHandler,
    },
    {
      name: 'list_files',
      description: 'List files in a directory',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path' },
          pattern: { type: 'string', description: 'Filter pattern' },
        },
      },
      handler: listFilesHandler,
    },
    {
      name: 'get_dependencies',
      description: 'Get dependencies of a spec',
      input_schema: {
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
      description: 'Get specs that depend on this spec',
      input_schema: {
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
      description: 'Analyze impact of changing a spec',
      input_schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Spec ID' },
        },
        required: ['id'],
      },
      handler: impactAnalysisHandler,
    },
    {
      name: 'trigger_cascade',
      description: 'Trigger a cascade manually',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to trigger' },
        },
      },
      handler: triggerCascadeHandler,
    },
    {
      name: 'cascade_status',
      description: 'Get current cascade status',
      input_schema: {
        type: 'object',
        properties: {},
      },
      handler: cascadeStatusHandler,
    },
  ];
}

/**
 * Create a tool registry with all standard tools
 */
export function createToolRegistry(): ToolRegistry {
  const registry = new SimpleToolRegistry();
  
  for (const tool of getStandardTools()) {
    registry.register(tool);
  }

  return registry;
}
