// src/cli/index.ts
import { Command } from 'commander';
import { addGenerateOpenApiCommand } from './mcp-generate-openapi';

export function createCLI(): Command {
  const program = new Command();
  program.name('speclang').version('1.0.0');

  // ... other commands

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