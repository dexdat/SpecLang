---
id: "@speclang/assembler/mcp-server"
version: 1.0.0
layer: 2
target_lang: ts
output: .speclang/mcp-server.spec.ts
owned-by: assembler
model_pool: code-gen
max_concurrent: 1
seed: false
tags: [assembler, mcp, server, tools, external-access]
short: "MCP server — exposes SpecLang tools to Hermes, Claude, Codex"
depends_on:
  - "@ref:specs/assembler/assembler"
  - "@ref:specs/mcp"
status: draft
---

# MCP Server

## Overview

The MCP server exposes SpecLang tools to external AI agents via the Model Context Protocol (stdio transport). Agents connect and use tools like `create_spec_file`, `validate_specs`, `run_cascade`, and `get_status`.

### Tools

| Tool | Description |
|------|-------------|
| `create_spec_file` | Create a new spec file with valid front matter |
| `validate_specs` | Validate spec headers and @ref: links |
| `run_cascade` | Trigger cascade for a spec change |
| `get_status` | Show system status (spec count, cascade history) |
| `get_cascade_history` | List recent cascades with status |
| `assemble` | Assemble a .spec.{lang}.md → .spec.{lang} |

## Implementation

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Assembler } from './assembler.spec';
import * as fs from 'fs/promises';
import { glob } from 'fast-glob';

// ---- MCP Server ----

const server = new Server(
  { name: 'speclang', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ---- Tool Definitions ----

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'create_spec_file',
      description: 'Create a new spec file with valid YAML front matter',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Path for the new spec file' },
          id: { type: 'string', description: 'Spec ID (e.g., @specs/my-spec)' },
          version: { type: 'string', description: 'Semantic version' },
          content: { type: 'string', description: 'Body content after the front matter' },
        },
        required: ['filePath', 'id', 'version'],
      },
    },
    {
      name: 'validate_specs',
      description: 'Validate spec headers and @ref: links',
      inputSchema: {
        type: 'object',
        properties: {
          specPath: { type: 'string', description: 'Optional specific spec path' },
        },
      },
    },
    {
      name: 'get_status',
      description: 'Show system status',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'assemble',
      description: 'Assemble a .spec.{lang}.md file into .spec.{lang}',
      inputSchema: {
        type: 'object',
        properties: {
          specPath: { type: 'string', description: 'Path to the .spec.ts.md file' },
        },
        required: ['specPath'],
      },
    },
  ],
}));

// ---- Tool Handlers ----

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'create_spec_file': {
      const { filePath, id, version, content } = args as any;
      const header = `---
id: "${id}"
version: "${version}"
status: draft
---

${content || ''}`;
      await fs.writeFile(filePath, header, 'utf-8');
      return { content: [{ type: 'text', text: `Created ${filePath}` }] };
    }

    case 'validate_specs': {
      const { specPath } = args as any;
      const { validateSpecHeaders } = require('./pipeline.spec');
      const result = await validateSpecHeaders(specPath || '.');
      return {
        content: [{
          type: 'text',
          text: result.valid
            ? 'All specs valid ✅'
            : `Errors:\n${result.errors.join('\n')}`,
        }],
      };
    }

    case 'get_status': {
      const specFiles = await glob('**/*.spec.md', { ignore: ['node_modules/**', '.git/**'] });
      const cascadeHistory: string[] = [];
      try {
        const state = await fs.readFile('.speclang/cascade-state.json', 'utf-8');
        cascadeHistory.push(...JSON.parse(state).history || []);
      } catch { /* no state yet */ }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            specCount: specFiles.length,
            cascadeCount: cascadeHistory.length,
            recentCascades: cascadeHistory.slice(-5),
          }, null, 2),
        }],
      };
    }

    case 'assemble': {
      const { specPath } = args as any;
      const assembler = new Assembler();
      const result = await assembler.assemble(specPath);
      return {
        content: [{
          type: 'text',
          text: result.success
            ? `Assembled: ${result.outputPath}`
            : `Failed:\n${result.errors.join('\n')}`,
        }],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// ---- Start ----

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[speclang-mcp] Server started on stdio');
}

main().catch(console.error);
```

## Verification

```bash
# Start MCP server (connects to Hermes/Claude via stdio)
npx tsx .speclang/mcp-server.spec.ts

# In another terminal, test with MCP inspector:
npx @modelcontextprotocol/inspector npx tsx .speclang/mcp-server.spec.ts
```
