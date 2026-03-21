/**
 * SPECLANG-GENERATED: MCP command
 * Source: @speclang/mcp.cli
 */

import { MCPServer } from '../../../mcp.spec.dir/src/server.js';
import { getDbPath, ensureSpeclangDir } from '../utils.js';
import * as fs from 'fs';
import * as path from 'path';

export interface MCPOptions {
  json?: boolean;
}

export interface MCPStartOptions extends MCPOptions {
  port?: number;
  remote?: boolean;
  auth?: string;
  user?: string;
  pass?: string;
  token?: string;
  config?: string;
}

export interface MCPServeOptions extends MCPOptions {
  config?: string;
}

export interface MCPStatusOptions extends MCPOptions {}

export interface MCPStopOptions extends MCPOptions {}

export interface MCPGenerateOpenApiOptions extends MCPOptions {
  input: string;
  output: string;
  transport?: string;
  port?: number;
  serverName?: string;
  baseUrl?: string;
  force?: boolean;
  register?: boolean;
}

/**
 * Get MCP state file path
 */
function getMCPStatePath(): string {
  return '.speclang/mcp-state.json';
}

/**
 * Load MCP state
 */
interface MCPState {
  pid?: number;
  port?: number;
  mode?: 'stdio' | 'http' | 'socket';
  startedAt?: number;
}
function loadMCPState(): MCPState {
  const statePath = getMCPStatePath();
  if (fs.existsSync(statePath)) {
    try {
      return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    } catch {
      // Invalid state
    }
  }
  return {};
}

/**
 * Save MCP state
 */
function saveMCPState(state: MCPState): void {
  const dir = '.speclang';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(getMCPStatePath(), JSON.stringify(state, null, 2));
}

/**
 * Start MCP server
 */
async function mcpStart(options: MCPStartOptions): Promise<void> {
  ensureSpeclangDir();
  
  const port = options.port || 3000;
  
  if (!options.json) {
    console.log('=== Starting SpecLang MCP Server ===\n');
    console.log(`Mode: ${options.remote ? 'remote' : 'stdio'}`);
    if (options.remote) {
      console.log(`Port: ${port}`);
    }
    console.log(`Database: ${getDbPath()}\n`);
  }
  
  const server = new MCPServer({
    port,
    database: getDbPath()
  });
  
  try {
    if (options.remote) {
      // HTTP mode
      if (!options.json) {
        console.log(`Starting server on http://localhost:${port}...`);
      }
      await server.startHTTP(port);
    } else {
      // Stdio mode (default)
      if (!options.json) {
        console.log('Starting server in stdio mode...');
      }
      await server.startStdio();
    }
    
    // Save state
    saveMCPState({
      pid: process.pid,
      port: options.remote ? port : undefined,
      mode: options.remote ? 'http' : 'stdio',
      startedAt: Date.now()
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      if (!options.json) {
        console.log('\nShutting down server...');
      }
      await server.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      if (!options.json) {
        console.log('\nShutting down server...');
      }
      await server.stop();
      process.exit(0);
    });
    
  } catch (error) {
    if (options.json) {
      console.log(JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : 'Unknown error'
      }));
    } else {
      console.error('Failed to start server:', error);
    }
    process.exit(1);
  }
}

/**
 * Serve MCP server (daemon mode)
 */
async function mcpServe(options: MCPServeOptions): Promise<void> {
  // TODO: Implement daemon mode
  console.error('Serve command not yet implemented');
  process.exit(1);
}

/**
 * Show MCP server status
 */
async function mcpStatus(options: MCPStatusOptions): Promise<void> {
  const state = loadMCPState();
  
  if (options.json) {
    console.log(JSON.stringify(state, null, 2));
  } else {
    console.log('=== MCP Server Status ===\n');
    if (state.pid) {
      console.log(`Status: RUNNING (PID ${state.pid})`);
      console.log(`Mode: ${state.mode || 'unknown'}`);
      if (state.port) {
        console.log(`Port: ${state.port}`);
      }
      if (state.startedAt) {
        console.log(`Started: ${new Date(state.startedAt).toISOString()}`);
      }
    } else {
      console.log('Status: STOPPED');
      console.log('No MCP server is currently running');
    }
  }
}

/**
 * Stop MCP server
 */
async function mcpStop(options: MCPStopOptions): Promise<void> {
  const state = loadMCPState();
  
  if (!state.pid) {
    if (options.json) {
      console.log(JSON.stringify({ stopped: false, reason: 'No running server' }));
    } else {
      console.log('No MCP server is currently running');
    }
    return;
  }
  
  // TODO: Actually stop the server process (send signal)
  // For now, just remove state file
  fs.unlinkSync(getMCPStatePath());
  
  if (options.json) {
    console.log(JSON.stringify({ stopped: true }));
  } else {
    console.log('✅ MCP server stopped');
  }
}

/**
 * Generate OpenAPI MCP server
 */
async function mcpGenerateOpenApi(options: MCPGenerateOpenApiOptions): Promise<void> {
  // TODO: Implement generate-openapi using openapi-mcp-generator
  console.error('Generate-openapi command not yet implemented');
  process.exit(1);
}

/**
 * MCP command implementation
 */
export async function mcpCommand(
  action: 'start' | 'serve' | 'status' | 'stop' | 'generate-openapi',
  options: MCPStartOptions | MCPServeOptions | MCPStatusOptions | MCPStopOptions | MCPGenerateOpenApiOptions
): Promise<void> {
  switch (action) {
    case 'start':
      await mcpStart(options as MCPStartOptions);
      break;
    case 'serve':
      await mcpServe(options as MCPServeOptions);
      break;
    case 'status':
      await mcpStatus(options as MCPStatusOptions);
      break;
    case 'stop':
      await mcpStop(options as MCPStopOptions);
      break;
    case 'generate-openapi':
      await mcpGenerateOpenApi(options as MCPGenerateOpenApiOptions);
      break;
    default:
      console.error(`Unknown MCP action: ${action}`);
      process.exit(1);
  }
}

export default mcpCommand;