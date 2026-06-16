"use strict";
/**
 * SPECLANG-GENERATED: MCP Server Main
 * Source: @speclang/mcp
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
const express_1 = __importDefault(require("express"));
const crypto_1 = require("crypto");
const index_js_2 = require("../../sqlite.spec.dir/src/index.js");
const index_js_3 = require("./tools/index.js");
const config_js_1 = require("./config.js");
const auth_js_1 = require("./auth.js");
const sse_js_2 = require("./sse.js");
// ============================================================================
// MCP SERVER
// ============================================================================
/**
 * SpecLang MCP Server
 */
class MCPServer {
    config;
    db = null;
    server = null;
    auth;
    sseManager = null;
    toolRegistry = null;
    constructor(config) {
        this.config = (0, config_js_1.loadConfig)(config);
        this.auth = (0, auth_js_1.createAuth)(this.config.auth);
    }
    /**
     * Initialize database connection
     */
    initDatabase() {
        this.db = (0, index_js_2.createDatabase)({
            path: this.config.database,
            wal: true,
            verbose: false
        });
    }
    /**
     * Start server in stdio mode (default)
     */
    async startStdio() {
        console.error('Starting SpecLang MCP server in stdio mode...');
        this.initDatabase();
        this.server = this.createServer();
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.error('SpecLang MCP server running on stdio');
    }
    /**
     * Start server in HTTP mode
     */
    async startHTTP(port) {
        const httpPort = port || this.config.port;
        console.error(`Starting SpecLang MCP server on port ${httpPort}...`);
        this.initDatabase();
        this.server = this.createServer();
        const app = (0, express_1.default)();
        app.use(express_1.default.json());
        // Apply auth middleware
        if (this.auth.isEnabled()) {
            app.use('/mcp', this.auth.middleware());
        }
        // MCP SSE endpoint
        app.get('/mcp', (req, res) => {
            const clientId = (0, crypto_1.randomUUID)();
            const transport = new sse_js_1.SSEServerTransport('/mcp/message', res);
            this.server.connect(transport);
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
            this.sseManager = (0, sse_js_2.createSSEManager)(this.db, this.config.sse);
            app.get('/events', (req, res) => {
                const clientId = (0, crypto_1.randomUUID)();
                this.sseManager.addClient(clientId, res);
                req.on('close', () => {
                    this.sseManager.removeClient(clientId);
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
    createServer() {
        const server = new index_js_1.Server({
            name: 'speclang',
            version: '1.0.0'
        }, {
            capabilities: {
                tools: {}
            }
        });
        // Initialize tool registry
        if (this.db) {
            this.toolRegistry = new index_js_3.MCPToolRegistry(this.db, this.config);
            this.toolRegistry.registerTools(server);
        }
        // Register tool definitions
        const tools = (0, index_js_3.getToolDefinitions)();
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
    async stop() {
        if (this.sseManager) {
            this.sseManager.stop();
        }
        if (this.db) {
            this.db.close();
        }
    }
}
exports.MCPServer = MCPServer;
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
                if ((0, config_js_1.getArgBool)(args, '--http') || (0, config_js_1.getArgBool)(args, '--remote')) {
                    const port = (0, config_js_1.getArgInt)(args, '--port', 3000);
                    await server.startHTTP(port);
                }
                else {
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
    }
    catch (error) {
        console.error('Failed to start MCP server:', error);
        process.exit(1);
    }
}
// Run if main
if (require.main === module) {
    main();
}
//# sourceMappingURL=server.js.map