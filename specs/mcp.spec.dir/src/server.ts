/**
 * SPECLANG-GENERATED: MCP Server Main
 * Source: @speclang/mcp
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import express, { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { createDatabase, SpecLangDB } from '../../sqlite.spec.dir/src/index.js';
import { MCPToolRegistry, getToolDefinitions } from './tools/index.js';
import { loadConfig, getArg, getArgInt, getArgBool } from './config.js';
import { createAuth, MCPAuth } from './auth.js';
import { createSSEManager, SSEManager } from './sse.js';
import type { MCPServerConfig } from './types.js';
import { SearchToolHandler } from './tools/search.js';
import { SpecsToolHandler } from './tools/specs.js';

// ============================================================================
// MCP SERVER
// ============================================================================

/**
 * SpecLang MCP Server
 */
export class MCPServer {
  private config: MCPServerConfig;
  private db: SpecLangDB | null = null;
  private server: Server | null = null;
  private auth: MCPAuth;
  private sseManager: SSEManager | null = null;
  private toolRegistry: MCPToolRegistry | null = null;
  
  constructor(config?: Partial<MCPServerConfig>) {
    this.config = loadConfig(config);
    this.auth = createAuth(this.config.auth);
  }
  
  /**
   * Initialize database connection
   */
  private initDatabase(): void {
    // better-sqlite3 cannot create parent directories — a fresh clone has no
    // .speclang/ (gitignored), so ensure it exists before opening the DB.
    const dbDir = path.dirname(this.config.database);
    fs.mkdirSync(dbDir, { recursive: true });
    this.db = createDatabase({
      path: this.config.database,
      wal: true,
      verbose: false
    });
  }
  
  /**
   * Start server in stdio mode (default)
   */
  async startStdio(): Promise<void> {
    console.error('Starting SpecLang MCP server in stdio mode...');
    
    this.initDatabase();
    this.server = this.createServer();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('SpecLang MCP server running on stdio');
  }
  
  /**
   * Start server in HTTP mode
   */
  async startHTTP(port?: number): Promise<void> {
    const httpPort = port || this.config.port;
    console.error(`Starting SpecLang MCP server on port ${httpPort}...`);
    
    this.initDatabase();
    this.server = this.createServer();
    
    const app = express();
    app.use(express.json());
    
    // Apply auth middleware
    if (this.auth.isEnabled()) {
      app.use('/mcp', this.auth.middleware());
    }
    
    // MCP SSE endpoint
    app.get('/mcp', (req, res) => {
      const clientId = randomUUID();
      const transport = new SSEServerTransport('/mcp/message', res);
      
      this.server!.connect(transport);
      
      res.write(`data: ${JSON.stringify({ clientId })}\n\n`);
      
      req.on('close', () => {
        // Clean up transport
      });
    });
    
    // MCP message endpoint - handles JSON-RPC 2.0 MCP protocol
    app.post('/mcp/message', express.json(), async (req, res) => {
      try {
        const { jsonrpc, method, params, id } = req.body;
        
        // Validate JSON-RPC 2.0
        if (jsonrpc !== '2.0') {
          return res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32600,
              message: 'Invalid Request'
            },
            id
          });
        }
        
        // Handle MCP methods
        let result: unknown;
        
        switch (method) {
          case 'initialize':
            result = {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
                resources: {},
                prompts: {}
              },
              serverInfo: {
                name: 'speclang',
                version: '1.0.0'
              }
            };
            break;
            
          case 'tools/list':
            // Return list of available tools
            result = {
              tools: getToolDefinitions()
            };
            break;
            
          case 'tools/call':
            // Call a specific tool - handled by tool registry
            if (this.toolRegistry && params?.name && params.arguments) {
              const toolResult = await this.callTool(params.name, params.arguments);
              result = toolResult;
            } else {
              result = { error: 'Tool not found or arguments missing' };
            }
            break;
            
          case 'resources/list':
            result = { resources: [] };
            break;
            
          case 'prompts/list':
            result = { prompts: [] };
            break;
            
          default:
            return res.json({
              jsonrpc: '2.0',
              error: {
                code: -32601,
                message: 'Method not found'
              },
              id
            });
        }
        
        // Return successful response
        return res.json({
          jsonrpc: '2.0',
          result,
          id
        });
        
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[MCP] Request handling error:', errorMessage);
        
        return res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal error',
            data: errorMessage
          },
          id: req.body.id
        });
      }
    });
    
    // SSE events endpoint
    if (this.config.sse.enabled) {
      this.sseManager = createSSEManager(this.db, this.config.sse);
      app.get('/events', (req, res) => {
        const clientId = randomUUID();
        this.sseManager!.addClient(clientId, res);
        
        req.on('close', () => {
          this.sseManager!.removeClient(clientId);
        });
      });
    }
    
    // Health check
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', mode: 'http' });
    });
    
    app.listen(httpPort, () => {
      console.error(`SpecLang MCP server running on http://localhost:${httpPort}`);
      console.error(`  MCP endpoint: http://localhost:${httpPort}/mcp`);
      console.error(`  Events endpoint: http://localhost:${httpPort}/events`);
    });
  }
  
  /**
   * Create MCP server instance
   */
  private createServer(): Server {
    const server = new Server(
      {
        name: 'speclang',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );
    
    // Initialize tool registry
    if (this.db) {
      this.toolRegistry = new MCPToolRegistry(this.db, this.config);
      this.toolRegistry.registerTools(server);
    }
    
    // Register tool definitions. NOTE: @modelcontextprotocol/sdk 1.x has no
    // `Server.registerTool` — serve tools/list via the request handler instead.
    server.setRequestHandler(ListToolsRequestSchema, () => ({
      tools: getToolDefinitions().map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    }));
    
    return server;
  }
  
  /**
   * Stop server
   */
  async stop(): Promise<void> {
    if (this.sseManager) {
      this.sseManager.stop();
    }
    if (this.db) {
      this.db.close();
    }
  }
  
  /**
   * Call an MCP tool by name with arguments
   */
  async callTool(toolName: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.toolRegistry) {
      throw new Error('Tool registry not initialized');
    }
    
    // Get tool definitions
    const tools = getToolDefinitions();
    const toolDef = tools.find(t => t.name === toolName);
    
    if (!toolDef) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    
    // Route to appropriate handler based on tool name prefix
    const registry = this.toolRegistry;
    
    switch (true) {
      case toolName.startsWith('speclang_search'):
        return await registry.search.handleSearch(args as unknown as { query: string; tags?: string[]; layer?: number; limit?: number });
      case toolName === 'speclang_get_spec':
        return await registry.specs.handleGetSpec(args as unknown as { id?: string; file_path?: string; include_content?: boolean });
      case toolName === 'speclang_create_spec':
        return await registry.specs.handleCreateSpec(args as unknown as { id: string; content: string; agent_id?: string; file_path?: string });
      case toolName === 'speclang_update_spec':
        return await registry.specs.handleUpdateSpec(args as unknown as { id: string; content: string; message?: string; agent_id?: string });
      case toolName === 'speclang_list_specs':
        return await registry.specs.handleListSpecs(args as unknown as { tags?: string[]; layer?: number; prefix?: string; limit?: number });
      case toolName.startsWith('speclang_lock'):
        if (toolName === 'speclang_lock') return await registry.locks.handleLock(args as unknown as { resource: string; agent_id: string; ttl?: number });
        if (toolName === 'speclang_unlock') return await registry.locks.handleUnlock(args as unknown as { lock_id: string; agent_id: string });
        if (toolName === 'speclang_check_lock') return await registry.locks.handleCheckLock(args as unknown as { resource: string });
        if (toolName === 'speclang_force_unlock') return await registry.locks.handleForceUnlock(args as unknown as { resource: string });
        break;
      case toolName.startsWith('speclang_cascade'):
        if (toolName === 'speclang_cascade_status') return await registry.cascade.handleCascadeStatus() as unknown as Record<string, unknown>;
        if (toolName === 'speclang_cascade_trigger') return await registry.cascade.handleCascadeTrigger(args as unknown as { spec_id: string; change_type: 'create' | 'modify' | 'delete' });
        if (toolName === 'speclang_cascade_abort') return await registry.cascade.handleCascadeAbort();
        if (toolName === 'speclang_cascade_converge') return await registry.cascade.handleCascadeConverge(args as unknown as { cascade_id: string });
        break;
      case toolName.startsWith('speclang_index'):
        if (toolName === 'speclang_index_refresh') return await registry.index.handleIndexRefresh(args as unknown as { specsDir?: string }) as unknown as Record<string, unknown>;
        if (toolName === 'speclang_index_stats') return await registry.index.handleIndexStats() as unknown as Record<string, unknown>;
        if (toolName === 'speclang_index_validate') return await registry.index.handleIndexValidate() as unknown as Record<string, unknown>;
        break;
      case toolName.startsWith('speclang_query') || toolName.startsWith('speclang_get') || toolName.startsWith('speclang_subscribe'):
        return await this.handleDashboardTool(toolName, args);
      case toolName.startsWith('speclang_'):
        // Generic fallback - return a placeholder response
        return { message: `Tool ${toolName} not fully implemented`, args };
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
    
    return { message: `Tool ${toolName} executed` };
  }
  
  /**
   * Handle dashboard/tool queries
   */
  private async handleDashboardTool(toolName: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.toolRegistry) {
      throw new Error('Tool registry not initialized');
    }
    
    const registry = this.toolRegistry;
    
    switch (toolName) {
      case 'speclang_query_events':
        return await registry.dashboard.handleQueryEvents(args as unknown as { limit?: number; cascade_id?: string; agent?: string; file_pattern?: string; since?: string });
      case 'speclang_get_agent_statuses':
        return await registry.dashboard.handleGetAgentStatuses(args as unknown as { agent_type?: string; status?: string });
      case 'speclang_get_project_stats':
        return await registry.dashboard.handleGetProjectStats();
      case 'speclang_get_queue_status':
        return await registry.dashboard.handleGetQueueStatus(args as unknown as { limit?: number });
      case 'speclang_get_system_stats':
        return await registry.dashboard.handleGetSystemStats();
      case 'speclang_subscribe_events':
        return await registry.dashboard.handleSubscribeEvents(args as unknown as { types?: string[] });
      default:
        return { error: `Unknown dashboard tool: ${toolName}` };
    }
  }
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'start';
  
  const server = new MCPServer();
  
  try {
    switch (command) {
      case 'start':
        if (getArgBool(args, '--http') || getArgBool(args, '--remote')) {
          const port = getArgInt(args, '--port', 3000);
          await server.startHTTP(port);
        } else {
          await server.startStdio();
        }
        break;
        
      case 'search': {
        // One-shot search
        const query = args.slice(1).join(' ');
        if (!query) {
          console.error('Usage: speclang-mcp search <query>');
          process.exit(1);
        }
        try {
          const config = loadConfig();
          const db = createDatabase({ path: config.database, wal: true, verbose: false });
          const searchHandler = new SearchToolHandler(db);
          const result = await searchHandler.handleSearch({ query });
          console.log(JSON.stringify(result, null, 2));
        } catch (error) {
          console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
          process.exit(1);
        }
        break;
      }
        
      case 'get': {
        // One-shot get
        const specId = args[1];
        if (!specId) {
          console.error('Usage: speclang-mcp get <spec-id>');
          process.exit(1);
        }
        try {
          const config = loadConfig();
          const db = createDatabase({ path: config.database, wal: true, verbose: false });
          const specsHandler = new SpecsToolHandler(db);
          const result = await specsHandler.handleGetSpec({ id: specId, include_content: true });
          console.log(JSON.stringify(result, null, 2));
        } catch (error) {
          console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
          process.exit(1);
        }
        break;
      }
        
      default:
        console.error(`Unknown command: ${command}`);
        console.error('Usage: speclang-mcp [start|search|get] [options]');
        process.exit(1);
    }
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Run if main
if (require.main === module) {
  main();
}
