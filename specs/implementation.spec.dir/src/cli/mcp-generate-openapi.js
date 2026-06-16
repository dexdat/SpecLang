"use strict";
// CLI for MCP server operations
// DO NOT EDIT MANUALLY
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOpenApiMCP = generateOpenApiMCP;
exports.addGenerateOpenApiCommand = addGenerateOpenApiCommand;
exports.createCLI = createCLI;
const commander_1 = require("commander");
const fs_extra_1 = require("fs-extra");
const child_process_1 = require("child_process");
/**
 * Generate MCP server from OpenAPI spec
 */
async function generateOpenApiMCP(options) {
    const { input, output, transport = 'stdio', port = 3000, serverName, baseUrl, force = false, } = options;
    console.log(`Generating MCP server from ${input}...`);
    // Ensure output directory exists
    await (0, fs_extra_1.ensureDir)(output);
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
    (0, child_process_1.execSync)(command, { stdio: 'inherit' });
    console.log(`MCP server generated at ${output}`);
}
/**
 * Add command to CLI program
 */
function addGenerateOpenApiCommand(program) {
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
function createCLI() {
    const program = new commander_1.Command();
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
//# sourceMappingURL=mcp-generate-openapi.js.map