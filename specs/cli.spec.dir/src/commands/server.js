"use strict";
/**
 * SPECLANG-GENERATED: Server command
 * Source: @speclang/mcp.cli
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverCommand = serverCommand;
const server_js_1 = require("../../../mcp.spec.dir/src/server.js");
const utils_js_1 = require("../utils.js");
/**
 * Server command implementation
 */
async function serverCommand(options) {
    (0, utils_js_1.ensureSpeclangDir)();
    const port = options.port || 3000;
    if (!options.json) {
        console.log(`=== SpecLang MCP Server ===\n`);
        console.log(`Mode: ${options.daemon ? 'daemon' : options.http ? 'HTTP' : 'stdio'}`);
        console.log(`Port: ${port}`);
        console.log(`Database: ${(0, utils_js_1.getDbPath)()}\n`);
    }
    const server = new server_js_1.MCPServer({
        port,
        database: (0, utils_js_1.getDbPath)()
    });
    try {
        if (options.http || options.daemon) {
            // HTTP mode
            if (!options.json) {
                console.log(`Starting server on http://localhost:${port}...`);
            }
            await server.startHTTP(port);
        }
        else {
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
    }
    catch (error) {
        if (options.json) {
            console.log(JSON.stringify({
                error: true,
                message: error instanceof Error ? error.message : 'Unknown error'
            }));
        }
        else {
            console.error('Failed to start server:', error);
        }
        process.exit(1);
    }
}
exports.default = serverCommand;
//# sourceMappingURL=server.js.map