# speclang-header lines:12
id: @speclang/mcp-openapi-generation-cli
version: 0.1.0
layer: 10
imports: [@speclang/mcp, @speclang/cli, @speclang/mcp-openapi-generation]
tags: [mcp, openapi, cli, typescript, implementation]
short: TypeScript implementation of speclang mcp generate-openapi command
produces: src/cli/mcp-generate-openapi.ts
---
# OpenAPI MCP Generation CLI Implementation

TypeScript implementation of the `speclang mcp generate-openapi` command.

## Command Handler

```speclang
# @block:openapi-generation/cli-handler @kind:code
```typescript
import { Command } from 'commander';
import { getToolsFromOpenApi } from 'openapi-mcp-generator';
import { MCPServer } from '../mcp/server';
import { ensureDir, writeFile } from 'fs-extra';
import { join } from 'path';
import { execSync } from 'child_process';

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
    register = false,
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

  // If register flag is set, register tools with SpecLang MCP server
  if (register) {
    await registerOpenApiTools(input, output, { baseUrl });
  }
}

/**
 * Register generated tools with SpecLang MCP server
 */
async function registerOpenApiTools(
  specPath: string,
  outputDir: string,
  options: { baseUrl?: string }
): Promise<void> {
  const tools = await getToolsFromOpenApi(specPath, {
    baseUrl: options.baseUrl,
    dereference: true,
  });

  const server = MCPServer.getInstance();
  for (const tool of tools) {
    server.registerTool({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      handler: async (args: any) => {
        // Proxy request to actual API
        const response = await fetch(tool.url, {
          method: tool.method,
          headers: tool.headers,
          body: JSON.stringify(args),
        });
        return response.json();
      },
    });
  }

  console.log(`Registered ${tools.length} tools from ${specPath}`);
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
```
```

## Integration with CLI

```speclang
# @block:openapi-generation/cli-integration @kind:code
```typescript
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
```
```

## Dependencies

```speclang
# @block:openapi-generation/dependencies @kind:entity
Dependencies:
  - openapi-mcp-generator: ^1.0.0
  - commander: ^11.0.0
  - fs-extra: ^11.0.0
```

## References

- @ref:speclang/mcp#mcp/cli
- @ref:speclang/mcp-openapi-generation