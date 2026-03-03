/**
 * SPECLANG-GENERATED: Server command
 * Source: @speclang/mcp.cli
 */

import { MCPServer } from '../../../mcp.spec.dir/src/server.js';
import { getDbPath, ensureSpeclangDir } from '../utils.js';

export interface ServerOptions {
  port?: number;
  daemon?: boolean;
  http?: boolean;
  json?: boolean;
}

/**
 * Server command implementation
 */
export async function serverCommand(options: ServerOptions): Promise<void> {
  ensureSpeclangDir();
  
  const port = options.port || 3000;
  
  if (!options.json) {
    console.log(`=== SpecLang MCP Server ===\n`);
    console.log(`Mode: ${options.daemon ? 'daemon' : options.http ? 'HTTP' : 'stdio'}`);
    console.log(`Port: ${port}`);
    console.log(`Database: ${getDbPath()}\n`);
  }
  
  const server = new MCPServer({
    port,
    database: getDbPath()
  });
  
  try {
    if (options.http || options.daemon) {
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

export default serverCommand;
