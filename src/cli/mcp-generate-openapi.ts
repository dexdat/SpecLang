// CLI for MCP server operations
// DO NOT EDIT MANUALLY

import { Command } from 'commander';
import { ensureDir } from 'fs-extra';
import { execSync } from 'child_process';
import * as path from 'path';

/**
 * Generate MCP server from OpenAPI spec
 */
export async function generateOpenApiMCP(options: {
  input: string;
  output: string;
  transport?: 'stdio' | 'web' | 'streamable-http';
  port?: number;
  serverName?: string;
  baseUrl?: string;
  force?: boolean;
  register?: boolean;
}): Promise<void> {
  const {
    input,
    output,
    transport = 'stdio',
    port = 3000,
    serverName,
    baseUrl,
    force = false,
  } = options;

  console.log(`Generating MCP server from ${input}...`);

  // Ensure output directory exists
  await ensureDir(output);

  // Build arguments for openapi-mcp-generator CLI
  const args = [
    'openapi-mcp-generator',
    '--input', input,
    '--output', output,
    '--transport', transport,
  ];

  if (port) {
    args.push('--port', port.toString());
  }
  if (serverName) {
    args.push('--server-name', serverName);
  }
  if (baseUrl) {
    args.push('--base-url', baseUrl);
  }
  if (force) {
    args.push('--force');
  }

  // Execute generator
  const command = args.join(' ');
  console.log(`Running: ${command}`);
  execSync(command, { stdio: 'inherit' });

  console.log(`MCP server generated at ${output}`);
}

/**
 * Add command to CLI program
 */
export function addGenerateOpenApiCommand(program: Command): void {
  program
    .command('mcp generate-openapi')
    .description('Generate MCP server from OpenAPI spec')
    .requiredOption('-i, --input <path>', 'Path or URL to OpenAPI spec (YAML/JSON)')
    .requiredOption('-o, --output <dir>', 'Output directory for generated MCP project')
    .option('-t, --transport <mode>', 'Transport mode (stdio, web, streamable-http)', 'stdio')
    .option('-p, --port <number>', 'Port for web-based transports', '3000')
    .option('-n, --server-name <name>', 'Name of MCP server')
    .option('-b, --base-url <url>', 'Base URL for API requests')
    .option('--force', 'Overwrite existing files')
    .option('--register', 'Automatically register with SpecLang MCP server')
    .action(generateOpenApiMCP);
}

// src/cli/index.ts

export function createCLI(): Command {
  const program = new Command();
  program.name('speclang').version('1.0.0');

  // Add MCP subcommands
  const mcpCommand = program.command('mcp').description('MCP server operations');
  addGenerateOpenApiCommand(mcpCommand);

  return program;
}

// Main entry point
if (require.main === module) {
  const program = createCLI();
  program.parse(process.argv);
}
