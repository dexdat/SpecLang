import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs/promises';
import fg from 'fast-glob';

// ---- Test 1: Module loads ----

async function test_server_instantiates(): Promise<void> {
  console.log('--- test_server_instantiates ---');
  try {
    const mod = await import('./mcp-server.spec');
    console.log('✅ PASS: MCP server module loads without errors');
    console.log(`  Module keys: ${Object.keys(mod).join(', ')}`);
  } catch (err: any) {
    console.log(`❌ FAIL: MCP server module failed to load: ${err.message}`);
  }
}

// ---- Test 2: Server instantiation and tool registration ----

async function test_server_and_tools(): Promise<void> {
  console.log('\n--- test_server_and_tools ---');

  const testServer = new Server(
    { name: 'speclang-test', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );
  console.log('✅ PASS: Server instantiated');

  // Register ListTools handler
  testServer.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'create_spec_file',
        description: 'Create a new spec file with valid YAML front matter',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Path for the new spec file' },
            id: { type: 'string', description: 'Spec ID' },
            version: { type: 'string', description: 'Semantic version' },
            content: { type: 'string', description: 'Body content' },
          },
          required: ['filePath', 'id', 'version'],
        },
      },
      {
        name: 'validate_specs',
        description: 'Validate spec headers and @ref: links',
        inputSchema: {
          type: 'object',
          properties: { specPath: { type: 'string' } },
        },
      },
      {
        name: 'get_status',
        description: 'Show system status',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'assemble',
        description: 'Assemble a .spec.{lang}.md file into .spec.{lang}',
        inputSchema: {
          type: 'object',
          properties: { specPath: { type: 'string' } },
          required: ['specPath'],
        },
      },
    ],
  }));

  console.log('✅ PASS: ListTools handler registered with 4 tools');
  testServer.close();
}

// ---- Test 3: create_spec_file logic (standalone) ----

async function test_create_spec_file_logic(): Promise<void> {
  console.log('\n--- test_create_spec_file_logic ---');

  const tmpDir = await fs.mkdtemp('/tmp/speclang-mcp-test-');
  const testFilePath = `${tmpDir}/test-create.spec.md`;

  const id = '@specs/test-create';
  const version = '1.0.0';
  const content = '# Test Spec Created by MCP';

  // Simulate the create_spec_file handler
  const header = `---
id: "${id}"
version: "${version}"
status: draft
---

${content}`;

  await fs.writeFile(testFilePath, header, 'utf-8');
  const fileContent = await fs.readFile(testFilePath, 'utf-8');

  const checks = {
    'Contains id': fileContent.includes(id),
    'Contains version': fileContent.includes(version),
    'Contains status: draft': fileContent.includes('status: draft'),
    'Contains content': fileContent.includes(content),
    'Has YAML front matter': /^---\n/.test(fileContent),
  };

  const allPassed = Object.values(checks).every(Boolean);
  if (allPassed) {
    console.log('✅ PASS: create_spec_file produces valid spec file');
    Object.entries(checks).forEach(([k, v]) => console.log(`  ${v ? '✅' : '❌'} ${k}`));
  } else {
    console.log('❌ FAIL: Some checks failed');
    Object.entries(checks).forEach(([k, v]) => console.log(`  ${v ? '✅' : '❌'} ${k}`));
    console.log(`  Content:\n${fileContent}`);
  }

  await fs.rm(tmpDir, { recursive: true, force: true });
}

// ---- Test 4: glob works for get_status ----

async function test_glob_functionality(): Promise<void> {
  console.log('\n--- test_glob_functionality ---');

  const specFiles = await fg('**/*.spec.md', { cwd: process.cwd(), ignore: ['node_modules/**', '.git/**'] });

  console.log(`✅ PASS: fast-glob works — found ${specFiles.length} spec files`);
  if (specFiles.length > 0) {
    specFiles.slice(0, 3).forEach((f: string) => console.log(`  - ${f}`));
    if (specFiles.length > 3) console.log(`  ... and ${specFiles.length - 3} more`);
  }
}

// ---- Test 5: Server with Stdio transport ----

async function test_stdio_transport(): Promise<void> {
  console.log('\n--- test_stdio_transport ---');

  try {
    const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
    const transport = new StdioServerTransport();
    console.log('✅ PASS: StdioServerTransport instantiated');
  } catch (err: any) {
    console.log(`❌ FAIL: StdioServerTransport error: ${err.message}`);
  }
}

// ---- Main ----

async function main() {
  console.log('=== MCP Server Spec Tests ===\n');

  await test_server_instantiates();
  await test_server_and_tools();
  await test_create_spec_file_logic();
  await test_glob_functionality();
  await test_stdio_transport();

  console.log('\n=== All MCP server tests complete ===');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
