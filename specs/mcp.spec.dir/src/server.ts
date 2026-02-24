/**
 * SPECLANG-GENERATED: MCP Server Main
 * Source: @speclang/mcp
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express, { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

import { createDatabase, SpecLangDB } from '../db/index.js';
import { MCPToolRegistry, getToolDefinitions } from './tools/index.js';
import { loadConfig, getArg, getArgInt, getArgBool } from './config.js';
import { createAuth, MCPAuth } from './auth.js';
import { createSSEManager, SSEManager } from './sse.js';
import type { MCPServerConfig } from './types.js';

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
    
    // MCP message endpoint
    app.post('/mcp/message', (req, res) => {
      // Handle MCP protocol messages
      res.json({ ok: true });
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
    
    // Register tool definitions
    const tools = getToolDefinitions();
    for (const tool of tools) {
      // @ts-expect-error - MCP SDK has different type definitions
      server.registerTool(tool.name, {
        description: tool.description,
        inputSchema: tool.inputSchema
      });
    }
    
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
        
      case 'search':
        // One-shot search
        const query = args.slice(1).join(' ');
        if (!query) {
          console.error('Usage: speclang-mcp search <query>');
          process.exit(1);
        }
        // TODO: Implement one-shot search
        console.log('Search not implemented yet');
        break;
        
      case 'get':
        // One-shot get
        const specId = args[1];
        if (!specId) {
          console.error('Usage: speclang-mcp get <spec-id>');
          process.exit(1);
        }
        // TODO: Implement one-shot get
        console.log('Get not implemented yet');
        break;
        
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
