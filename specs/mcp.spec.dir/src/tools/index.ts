/**
 * SPECLANG-GENERATED: MCP Tools Index
 * Source: @speclang/mcp
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { SpecLangDB } from '../../../sqlite.spec.dir/src/index.js';
import type { MCPServerConfig } from '../types.js';

import { SearchToolHandler } from './search.js';
import { SpecsToolHandler } from './specs.js';
import { LocksToolHandler } from './locks.js';
import { CascadeToolHandler } from './cascade.js';
import { IndexToolHandler } from './index-tools.js';
import { DashboardToolHandler } from './dashboard.js';
import { CommandsToolHandler } from './commands.js';
import type { 
  SearchInput, 
  CreateSpecInput, 
  UpdateSpecInput, 
  LockInput, 
  UnlockInput, 
  CascadeTriggerInput,
  CommandInput,
  QueryCommandsInput
} from '../types.js';

/**
 * MCP Tool Registry
 * Registers all MCP tools and handles tool requests
 */
export class MCPToolRegistry {
  private db: SpecLangDB;
  private config: MCPServerConfig;
  
  // Tool handlers
  public search: SearchToolHandler;
  public specs: SpecsToolHandler;
  public locks: LocksToolHandler;
  public cascade: CascadeToolHandler;
  public index: IndexToolHandler;
  public dashboard: DashboardToolHandler;
  public commands: CommandsToolHandler;
  
  constructor(db: SpecLangDB, config: MCPServerConfig) {
    this.db = db;
    this.config = config;
    
    // Initialize handlers
    this.search = new SearchToolHandler(db);
    this.specs = new SpecsToolHandler(db, config.specsDir);
    this.locks = new LocksToolHandler(db);
    this.cascade = new CascadeToolHandler(db);
    this.index = new IndexToolHandler(db, config.specsDir);
    this.dashboard = new DashboardToolHandler(db, this.config);
    this.commands = new CommandsToolHandler(db);
  }
  
  /**
   * Register all tools with the MCP server
   */
  registerTools(server: Server): void {
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        let result: Record<string, unknown>;
        
        switch (name) {
          // Search tools
          case 'speclang_search':
            result = await this.search.handleSearch(args as unknown as SearchInput);
            break;
          case 'speclang_semantic_search':
            result = await this.search.handleSemanticSearch(args as unknown as { query_embedding: number[]; limit?: number });
            break;
            
          // Spec CRUD tools
          case 'speclang_get_spec':
            result = await this.specs.handleGetSpec(args as unknown as { id?: string; file_path?: string; include_content?: boolean });
            break;
          case 'speclang_create_spec':
            result = await this.specs.handleCreateSpec(args as unknown as CreateSpecInput);
            break;
          case 'speclang_update_spec':
            result = await this.specs.handleUpdateSpec(args as unknown as UpdateSpecInput);
            break;
          case 'speclang_list_specs':
            result = await this.specs.handleListSpecs(args as unknown as { tags?: string[]; layer?: number; prefix?: string; limit?: number });
            break;
            
          // Lock tools
          case 'speclang_lock':
            result = await this.locks.handleLock(args as unknown as LockInput);
            break;
          case 'speclang_unlock':
            result = await this.locks.handleUnlock(args as unknown as UnlockInput);
            break;
          case 'speclang_check_lock':
            result = await this.locks.handleCheckLock(args as unknown as { resource: string });
            break;
          case 'speclang_force_unlock':
            result = await this.locks.handleForceUnlock(args as unknown as { resource: string });
            break;
            
          // Cascade tools
          case 'speclang_cascade_status':
            result = await this.cascade.handleCascadeStatus() as unknown as Record<string, unknown>;
            break;
          case 'speclang_cascade_trigger':
            result = await this.cascade.handleCascadeTrigger(args as unknown as CascadeTriggerInput);
            break;
          case 'speclang_cascade_abort':
            result = await this.cascade.handleCascadeAbort();
            break;
          case 'speclang_cascade_converge':
            result = await this.cascade.handleCascadeConverge(args as unknown as { cascade_id: string });
            break;
            
          // Index tools
          case 'speclang_index_refresh':
            result = await this.index.handleIndexRefresh(args as unknown as { specsDir?: string }) as unknown as Record<string, unknown>;
            break;
          case 'speclang_index_stats':
            result = await this.index.handleIndexStats();
            break;
          case 'speclang_index_validate':
            result = await this.index.handleIndexValidate();
            break;
            
          // Graph tools (using index)
          case 'speclang_get_dependencies':
            result = await this.handleGetDependencies(args as unknown as { id: string; transitive?: boolean });
            break;
          case 'speclang_get_dependents':
            result = await this.handleGetDependents(args as unknown as { id: string; transitive?: boolean });
            break;
          case 'speclang_impact_analysis':
            result = await this.handleImpactAnalysis(args as unknown as { id: string });
            break;
            
          // Status tool
          case 'speclang_get_status':
            result = await this.handleGetStatus();
            break;
            
          // Dashboard/UI tools
          case 'speclang_query_events':
            result = await this.dashboard.handleQueryEvents(args as unknown as { limit?: number; cascade_id?: string; agent?: string; file_pattern?: string; since?: string });
            break;
          case 'speclang_get_agent_statuses':
            result = await this.dashboard.handleGetAgentStatuses(args as unknown as { agent_type?: string; status?: string });
            break;
          case 'speclang_get_project_stats':
            result = await this.dashboard.handleGetProjectStats();
            break;
          case 'speclang_get_queue_status':
            result = await this.dashboard.handleGetQueueStatus(args as unknown as { limit?: number });
            break;
          case 'speclang_get_system_stats':
            result = await this.dashboard.handleGetSystemStats();
            break;
          case 'speclang_subscribe_events':
            result = await this.dashboard.handleSubscribeEvents(args as unknown as { types?: string[] });
            break;

          // Command queue tools
          case 'speclang_query_commands':
            result = await this.commands.handleQueryCommands(args as unknown as QueryCommandsInput) as unknown as Record<string, unknown>;
            break;
          case 'speclang_insert_command':
            result = await this.commands.handleInsertCommand(args as unknown as CommandInput);
            break;
          case 'speclang_update_command':
            result = await this.commands.handleUpdateCommand(args as unknown as { command_id: string; status: 'pending' | 'running' | 'completed' | 'failed'; error?: string });
            break;
          case 'speclang_delete_command':
            result = await this.commands.handleDeleteCommand(args as unknown as { command_id: string });
            break;
          case 'speclang_get_next_command':
            result = await this.commands.handleGetNextCommand() as unknown as Record<string, unknown>;
            break;
          case 'speclang_clear_completed':
            result = await this.commands.handleClearCompleted(args as unknown as { olderThan?: number });
            break;
          case 'speclang_batch_insert':
            result = await this.commands.handleBatchInsert(args as unknown as { commands: Array<{ cascade_id: string; action: string; target_file?: string; priority?: number }> });
            break;
            
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
        
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }]
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: errorMessage }) }],
          isError: true
        };
      }
    });
  }
  
  /**
   * Handle speclang_get_dependencies - Get dependencies for a spec
   */
  private async handleGetDependencies(args: { id: string; transitive?: boolean }): Promise<{
    dependencies: string[];
  }> {
    const { id, transitive = false } = args;
    
    const db = this.db.getDatabase();
    
    if (transitive) {
      // Get all transitive dependencies using recursive CTE
      const rows = db.prepare(`
        WITH RECURSIVE deps AS (
          SELECT s.id, s.file_path, 0 as depth
          FROM specs s
          WHERE s.id = ? OR s.file_path = ?
          
          UNION ALL
          
          SELECT target.id, target.file_path, d.depth + 1
          FROM specs target
          JOIN spec_deps sd ON target.rowid = sd.dst_spec_pk
          JOIN specs src ON sd.src_spec_pk = src.rowid
          JOIN deps d ON src.id = d.id OR src.file_path = d.file_path
          WHERE d.depth < 10
        )
        SELECT DISTINCT id, file_path FROM deps WHERE id != ? AND file_path != ?
      `).all(id, id, id, id) as Array<{ id: string; file_path: string }>;
      
      return { dependencies: rows.map(r => r.id || r.file_path) };
    }
    
    // Direct dependencies only
    const rows = db.prepare(`
      SELECT target.id, target.file_path
      FROM specs target
      JOIN spec_deps sd ON target.rowid = sd.dst_spec_pk
      JOIN specs src ON sd.src_spec_pk = src.rowid
      WHERE src.id = ? OR src.file_path = ?
    `).all(id, id) as Array<{ id: string; file_path: string }>;
    
    return { dependencies: rows.map(r => r.id || r.file_path) };
  }
  
  /**
   * Handle speclang_get_dependents - Get dependents for a spec
   */
  private async handleGetDependents(args: { id: string; transitive?: boolean }): Promise<{
    dependents: string[];
  }> {
    const { id, transitive = false } = args;
    
    const db = this.db.getDatabase();
    
    if (transitive) {
      // Get all transitive dependents
      const rows = db.prepare(`
        WITH RECURSIVE dents AS (
          SELECT s.id, s.file_path, 0 as depth
          FROM specs s
          WHERE s.id = ? OR s.file_path = ?
          
          UNION ALL
          
          SELECT target.id, target.file_path, dents.depth + 1
          FROM specs target
          JOIN spec_deps sd ON target.rowid = sd.src_spec_pk
          JOIN specs src ON sd.dst_spec_pk = src.rowid
          JOIN dents ON src.id = dents.id OR src.file_path = dents.file_path
          WHERE dents.depth < 10
        )
        SELECT DISTINCT id, file_path FROM dents WHERE id != ? AND file_path != ?
      `).all(id, id, id, id) as Array<{ id: string; file_path: string }>;
      
      return { dependents: rows.map(r => r.id || r.file_path) };
    }
    
    // Direct dependents only
    const rows = db.prepare(`
      SELECT target.id, target.file_path
      FROM specs target
      JOIN spec_deps sd ON target.rowid = sd.src_spec_pk
      JOIN specs src ON sd.dst_spec_pk = src.rowid
      WHERE src.id = ? OR src.file_path = ?
    `).all(id, id) as Array<{ id: string; file_path: string }>;
    
    return { dependents: rows.map(r => r.id || r.file_path) };
  }
  
  /**
   * Handle speclang_impact_analysis - Get impact analysis
   */
  private async handleImpactAnalysis(args: { id: string }): Promise<{
    direct_impact: string[];
    transitive_impact: string[];
    files_affected: string[];
  }> {
    const { id } = args;
    
    const db = this.db.getDatabase();
    
    // Direct dependents
    const directRows = db.prepare(`
      SELECT DISTINCT s.id, s.file_path
      FROM specs s
      JOIN spec_deps sd ON s.rowid = sd.src_spec_pk
      JOIN specs target ON sd.dst_spec_pk = target.rowid
      WHERE target.id = ? OR target.file_path = ?
    `).all(id, id) as Array<{ id: string; file_path: string }>;
    
    const directImpact = directRows.map(r => r.id || r.file_path);
    
    // Transitive dependents
    const transitiveRows = db.prepare(`
      WITH RECURSIVE dents AS (
        SELECT s.id, s.file_path, 0 as depth
        FROM specs s
        WHERE s.id = ? OR s.file_path = ?
        
        UNION ALL
        
        SELECT target.id, target.file_path, dents.depth + 1
        FROM specs target
        JOIN spec_deps sd ON target.rowid = sd.src_spec_pk
        JOIN specs src ON sd.dst_spec_pk = src.rowid
        JOIN dents ON src.id = dents.id OR src.file_path = dents.file_path
        WHERE dents.depth < 10
      )
      SELECT DISTINCT id, file_path FROM dents WHERE id != ? AND file_path != ?
    `).all(id, id, id, id) as Array<{ id: string; file_path: string }>;
    
    const transitiveImpact = transitiveRows.map(r => r.id || r.file_path);
    
    // Get file paths
    const filesAffected = transitiveRows
      .map(r => r.file_path)
      .filter(Boolean);
    
    return {
      direct_impact: directImpact,
      transitive_impact: transitiveImpact,
      files_affected: filesAffected
    };
  }
  
  /**
   * Handle speclang_get_status - Get overall system status
   */
  private async handleGetStatus(): Promise<Record<string, unknown>> {
    const db = this.db.getDatabase();
    
    const specCount = db.prepare('SELECT COUNT(*) as count FROM specs').get() as { count: number };
    const activeSessions = db.prepare("SELECT COUNT(*) as count FROM sessions WHERE status = 'active'").get() as { count: number };
    const pendingCommands = db.prepare("SELECT COUNT(*) as count FROM commands WHERE status = 'pending'").get() as { count: number };
    const activeCascades = db.prepare("SELECT COUNT(*) as count FROM cascades WHERE status = 'cascading'").get() as { count: number };
    
    return {
      specs_count: specCount.count,
      active_sessions: activeSessions.count,
      pending_commands: pendingCommands.count,
      active_cascades: activeCascades.count,
      converged: activeSessions.count === 0 && pendingCommands.count === 0 && activeCascades.count === 0
    };
  }
}

/**
 * Get all tool definitions for registration
 */
export function getToolDefinitions() {
  return [
    // Search tools
    {
      name: 'speclang_search',
      description: 'Full-text search across all specs using FTS5',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
          layer: { type: 'number', description: 'Filter by layer' },
          limit: { type: 'number', description: 'Max results', default: 10 }
        },
        required: ['query']
      }
    },
    {
      name: 'speclang_semantic_search',
      description: 'Vector similarity search (requires sqlite-vss)',
      inputSchema: {
        type: 'object',
        properties: {
          query_embedding: { type: 'array', items: { type: 'number' }, description: 'Query embedding' },
          limit: { type: 'number', default: 5 }
        },
        required: ['query_embedding']
      }
    },
    
    // Spec CRUD tools
    {
      name: 'speclang_get_spec',
      description: 'Get full spec by ID or path',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Spec ID' },
          file_path: { type: 'string', description: 'File path' },
          include_content: { type: 'boolean', default: false }
        }
      }
    },
    {
      name: 'speclang_create_spec',
      description: 'Create new spec',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Spec ID' },
          content: { type: 'string', description: 'Spec content' },
          agent_id: { type: 'string', description: 'Agent ID for ownership' },
          file_path: { type: 'string', description: 'Optional file path' }
        },
        required: ['id', 'content']
      }
    },
    {
      name: 'speclang_update_spec',
      description: 'Update existing spec',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Spec ID or file path' },
          content: { type: 'string', description: 'New content' },
          message: { type: 'string', description: 'Commit message' },
          agent_id: { type: 'string', description: 'Agent ID' }
        },
        required: ['id', 'content']
      }
    },
    {
      name: 'speclang_list_specs',
      description: 'List all specs with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          tags: { type: 'array', items: { type: 'string' } },
          layer: { type: 'number' },
          prefix: { type: 'string', description: 'ID prefix filter' },
          limit: { type: 'number', default: 100 }
        }
      }
    },
    
    // Lock tools
    {
      name: 'speclang_lock',
      description: 'Acquire file lock',
      inputSchema: {
        type: 'object',
        properties: {
          resource: { type: 'string', description: 'File path or spec ID' },
          agent_id: { type: 'string', description: 'Agent requesting lock' },
          ttl: { type: 'number', description: 'Lock timeout in seconds', default: 60 }
        },
        required: ['resource', 'agent_id']
      }
    },
    {
      name: 'speclang_unlock',
      description: 'Release file lock',
      inputSchema: {
        type: 'object',
        properties: {
          lock_id: { type: 'string', description: 'Lock ID' },
          agent_id: { type: 'string', description: 'Agent releasing lock' }
        },
        required: ['agent_id']
      }
    },
    {
      name: 'speclang_check_lock',
      description: 'Check if resource is locked',
      inputSchema: {
        type: 'object',
        properties: {
          resource: { type: 'string', description: 'File path or spec ID' }
        },
        required: ['resource']
      }
    },
    {
      name: 'speclang_force_unlock',
      description: 'Force unlock a resource (admin)',
      inputSchema: {
        type: 'object',
        properties: {
          resource: { type: 'string', description: 'File path or spec ID' }
        },
        required: ['resource']
      }
    },
    
    // Cascade tools
    {
      name: 'speclang_cascade_status',
      description: 'Get current cascade status',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'speclang_cascade_trigger',
      description: 'Trigger a cascade from spec change',
      inputSchema: {
        type: 'object',
        properties: {
          spec_id: { type: 'string', description: 'Spec that changed' },
          change_type: { type: 'string', enum: ['create', 'modify', 'delete'] }
        },
        required: ['spec_id', 'change_type']
      }
    },
    {
      name: 'speclang_cascade_abort',
      description: 'Abort active cascade',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'speclang_cascade_converge',
      description: 'Mark cascade as converged',
      inputSchema: {
        type: 'object',
        properties: {
          cascade_id: { type: 'string' }
        },
        required: ['cascade_id']
      }
    },
    
    // Index tools
    {
      name: 'speclang_index_refresh',
      description: 'Rebuild the spec index',
      inputSchema: {
        type: 'object',
        properties: {
          specsDir: { type: 'string', description: 'Specs directory' }
        }
      }
    },
    {
      name: 'speclang_index_stats',
      description: 'Get index statistics',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'speclang_index_validate',
      description: 'Validate index integrity',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    
    // Graph tools
    {
      name: 'speclang_get_dependencies',
      description: 'Get dependencies for a spec',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Spec ID' },
          transitive: { type: 'boolean', default: false }
        },
        required: ['id']
      }
    },
    {
      name: 'speclang_get_dependents',
      description: 'Get dependents for a spec',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Spec ID' },
          transitive: { type: 'boolean', default: false }
        },
        required: ['id']
      }
    },
    {
      name: 'speclang_impact_analysis',
      description: 'Analyze impact of changing a spec',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Spec ID' }
        },
        required: ['id']
      }
    },
    
    // Status tool
    {
      name: 'speclang_get_status',
      description: 'Get overall system status',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    
    // Dashboard/UI tools
    {
      name: 'speclang_query_events',
      description: 'Query recent cascade events with filtering',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max events to return', default: 20 },
          cascade_id: { type: 'string', description: 'Filter by cascade ID' },
          agent: { type: 'string', description: 'Filter by agent' },
          file_pattern: { type: 'string', description: 'Filter by file pattern' },
          since: { type: 'string', description: 'Filter events after timestamp (ISO 8601)' }
        }
      }
    },
    {
      name: 'speclang_get_agent_statuses',
      description: 'Get detailed status for all agent sessions',
      inputSchema: {
        type: 'object',
        properties: {
          agent_type: { type: 'string', description: 'Filter by agent type' },
          status: { type: 'string', description: 'Filter by status (idle, active, error)' }
        }
      }
    },
    {
      name: 'speclang_get_project_stats',
      description: 'Get project statistics (specs count, generated files, tests)',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'speclang_get_queue_status',
      description: 'Get detailed queue status (pending commands)',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max commands to return', default: 50 }
        }
      }
    },
    {
      name: 'speclang_get_system_stats',
      description: 'Get system-level statistics (CPU, memory, disk)',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'speclang_subscribe_events',
      description: 'Get SSE endpoint info for real-time event streaming',
      inputSchema: {
        type: 'object',
        properties: {
          types: {
            type: 'array',
            items: { type: 'string' },
            description: 'Event types to subscribe to (file_change, cascade_progress, agent_activity, convergence)'
          }
        }
      }
    },

    // Command queue tools
    {
      name: 'speclang_query_commands',
      description: 'Query commands from the queue',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Filter by status', default: 'pending' },
          limit: { type: 'number', description: 'Max results', default: 10 },
          cascade_id: { type: 'string', description: 'Filter by cascade ID' },
          session_id: { type: 'string', description: 'Filter by session ID' }
        }
      }
    },
    {
      name: 'speclang_insert_command',
      description: 'Insert a command into the queue',
      inputSchema: {
        type: 'object',
        properties: {
          cascade_id: { type: 'string', description: 'Cascade this command belongs to' },
          action: { type: 'string', description: 'Action to perform' },
          target_file: { type: 'string', description: 'Target file for the action' },
          session_id: { type: 'string', description: 'Associated session ID' },
          payload: { type: 'object', description: 'Additional payload data' },
          priority: { type: 'number', description: 'Command priority (higher = more urgent)', default: 0 }
        },
        required: ['cascade_id', 'action']
      }
    },
    {
      name: 'speclang_update_command',
      description: 'Update command status',
      inputSchema: {
        type: 'object',
        properties: {
          command_id: { type: 'string', description: 'Command ID' },
          status: { type: 'string', enum: ['pending', 'running', 'completed', 'failed'], description: 'New status' },
          error: { type: 'string', description: 'Error message if failed' }
        },
        required: ['command_id', 'status']
      }
    },
    {
      name: 'speclang_delete_command',
      description: 'Delete a command from the queue',
      inputSchema: {
        type: 'object',
        properties: {
          command_id: { type: 'string', description: 'Command ID to delete' }
        },
        required: ['command_id']
      }
    },
    {
      name: 'speclang_get_next_command',
      description: 'Get next pending command (highest priority)',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'speclang_clear_completed',
      description: 'Clear completed or failed commands older than cutoff',
      inputSchema: {
        type: 'object',
        properties: {
          olderThan: { type: 'number', description: 'Unix timestamp cutoff' }
        }
      }
    },
    {
      name: 'speclang_batch_insert',
      description: 'Insert multiple commands in batch',
      inputSchema: {
        type: 'object',
        properties: {
          commands: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                cascade_id: { type: 'string' },
                action: { type: 'string' },
                target_file: { type: 'string' },
                priority: { type: 'number' }
              }
            },
            description: 'Array of commands to insert'
          }
        },
        required: ['commands']
      }
    }
  ];
}
