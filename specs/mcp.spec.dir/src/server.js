"use strict";
/**
 * SPECLANG-GENERATED: MCP Server Main
 * Source: @speclang/mcp
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const express_1 = __importDefault(require("express"));
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const index_js_2 = require("../../sqlite.spec.dir/src/index.js");
const index_js_3 = require("./tools/index.js");
const config_js_1 = require("./config.js");
const auth_js_1 = require("./auth.js");
const sse_js_2 = require("./sse.js");
const search_js_1 = require("./tools/search.js");
const specs_js_1 = require("./tools/specs.js");
const metrics_js_1 = require("./metrics.js");
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
        // better-sqlite3 cannot create parent directories — a fresh clone has no
        // .speclang/ (gitignored), so ensure it exists before opening the DB.
        const dbDir = path.dirname(this.config.database);
        fs.mkdirSync(dbDir, { recursive: true });
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
        // MCP message endpoint - handles JSON-RPC 2.0 MCP protocol
        app.post('/mcp/message', express_1.default.json(), async (req, res) => {
            try {
                const { jsonrpc, method, params, id } = req.body;
                // Validate JSON-RPC 2.0
                if (jsonrpc !== '2.0') {
                    return res.status(400).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32600,
                            message: 'Invalid Request'
                        },
                        id
                    });
                }
                // Handle MCP methods
                let result;
                switch (method) {
                    case 'initialize':
                        result = {
                            protocolVersion: '2024-11-05',
                            capabilities: {
                                tools: {},
                                resources: {},
                                prompts: {}
                            },
                            serverInfo: {
                                name: 'speclang',
                                version: '1.0.0'
                            }
                        };
                        break;
                    case 'tools/list':
                        // Return list of available tools
                        result = {
                            tools: (0, index_js_3.getToolDefinitions)()
                        };
                        break;
                    case 'tools/call':
                        // Call a specific tool - handled by tool registry
                        if (this.toolRegistry && params?.name && params.arguments) {
                            const toolResult = await this.callTool(params.name, params.arguments);
                            result = toolResult;
                        }
                        else {
                            result = { error: 'Tool not found or arguments missing' };
                        }
                        break;
                    case 'resources/list':
                        result = { resources: [] };
                        break;
                    case 'prompts/list':
                        result = { prompts: [] };
                        break;
                    default:
                        return res.json({
                            jsonrpc: '2.0',
                            error: {
                                code: -32601,
                                message: 'Method not found'
                            },
                            id
                        });
                }
                // Return successful response
                return res.json({
                    jsonrpc: '2.0',
                    result,
                    id
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error('[MCP] Request handling error:', errorMessage);
                return res.status(500).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: 'Internal error',
                        data: errorMessage
                    },
                    id: req.body.id
                });
            }
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
        // Prometheus scrape endpoint — public like /health (no auth): a scraper
        // holds no MCP credentials, and the payload is host/process telemetry, not
        // spec content. res.end() (not res.send()) keeps the Content-Type byte for
        // byte: express's send() re-serialises the header and reorders the
        // "version=0.0.4" parameter after the charset.
        app.get('/metrics', (req, res) => {
            const body = (0, metrics_js_1.renderMetrics)();
            res.status(200);
            res.set('Content-Type', metrics_js_1.PROMETHEUS_CONTENT_TYPE);
            res.set('Content-Length', String(Buffer.byteLength(body)));
            res.end(body);
        });
        app.listen(httpPort, () => {
            console.error(`SpecLang MCP server running on http://localhost:${httpPort}`);
            console.error(`  MCP endpoint: http://localhost:${httpPort}/mcp`);
            console.error(`  Events endpoint: http://localhost:${httpPort}/events`);
            console.error(`  Metrics endpoint: http://localhost:${httpPort}/metrics`);
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
        // Register tool definitions. NOTE: @modelcontextprotocol/sdk 1.x has no
        // `Server.registerTool` — serve tools/list via the request handler instead.
        server.setRequestHandler(types_js_1.ListToolsRequestSchema, () => ({
            tools: (0, index_js_3.getToolDefinitions)().map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema
            }))
        }));
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
    /**
     * Call an MCP tool by name with arguments
     */
    async callTool(toolName, args) {
        if (!this.toolRegistry) {
            throw new Error('Tool registry not initialized');
        }
        // Get tool definitions
        const tools = (0, index_js_3.getToolDefinitions)();
        const toolDef = tools.find(t => t.name === toolName);
        if (!toolDef) {
            throw new Error(`Unknown tool: ${toolName}`);
        }
        // Route to appropriate handler based on tool name prefix
        const registry = this.toolRegistry;
        switch (true) {
            case toolName.startsWith('speclang_search'):
                return await registry.search.handleSearch(args);
            case toolName === 'speclang_get_spec':
                return await registry.specs.handleGetSpec(args);
            case toolName === 'speclang_create_spec':
                return await registry.specs.handleCreateSpec(args);
            case toolName === 'speclang_update_spec':
                return await registry.specs.handleUpdateSpec(args);
            case toolName === 'speclang_list_specs':
                return await registry.specs.handleListSpecs(args);
            case toolName.startsWith('speclang_lock'):
                if (toolName === 'speclang_lock')
                    return await registry.locks.handleLock(args);
                if (toolName === 'speclang_unlock')
                    return await registry.locks.handleUnlock(args);
                if (toolName === 'speclang_check_lock')
                    return await registry.locks.handleCheckLock(args);
                if (toolName === 'speclang_force_unlock')
                    return await registry.locks.handleForceUnlock(args);
                break;
            case toolName.startsWith('speclang_cascade'):
                if (toolName === 'speclang_cascade_status')
                    return await registry.cascade.handleCascadeStatus();
                if (toolName === 'speclang_cascade_trigger')
                    return await registry.cascade.handleCascadeTrigger(args);
                if (toolName === 'speclang_cascade_abort')
                    return await registry.cascade.handleCascadeAbort();
                if (toolName === 'speclang_cascade_converge')
                    return await registry.cascade.handleCascadeConverge(args);
                break;
            case toolName.startsWith('speclang_index'):
                if (toolName === 'speclang_index_refresh')
                    return await registry.index.handleIndexRefresh(args);
                if (toolName === 'speclang_index_stats')
                    return await registry.index.handleIndexStats();
                if (toolName === 'speclang_index_validate')
                    return await registry.index.handleIndexValidate();
                break;
            case toolName.startsWith('speclang_query') || toolName.startsWith('speclang_get') || toolName.startsWith('speclang_subscribe'):
                return await this.handleDashboardTool(toolName, args);
            case toolName.startsWith('speclang_'):
                // Generic fallback - return a placeholder response
                return { message: `Tool ${toolName} not fully implemented`, args };
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
        return { message: `Tool ${toolName} executed` };
    }
    /**
     * Handle dashboard/tool queries
     */
    async handleDashboardTool(toolName, args) {
        if (!this.toolRegistry) {
            throw new Error('Tool registry not initialized');
        }
        const registry = this.toolRegistry;
        switch (toolName) {
            case 'speclang_query_events':
                return await registry.dashboard.handleQueryEvents(args);
            case 'speclang_get_agent_statuses':
                return await registry.dashboard.handleGetAgentStatuses(args);
            case 'speclang_get_project_stats':
                return await registry.dashboard.handleGetProjectStats();
            case 'speclang_get_queue_status':
                return await registry.dashboard.handleGetQueueStatus(args);
            case 'speclang_get_system_stats':
                return await registry.dashboard.handleGetSystemStats();
            case 'speclang_subscribe_events':
                return await registry.dashboard.handleSubscribeEvents(args);
            default:
                return { error: `Unknown dashboard tool: ${toolName}` };
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
            case 'search': {
                // One-shot search
                const query = args.slice(1).join(' ');
                if (!query) {
                    console.error('Usage: speclang-mcp search <query>');
                    process.exit(1);
                }
                try {
                    const config = (0, config_js_1.loadConfig)();
                    const db = (0, index_js_2.createDatabase)({ path: config.database, wal: true, verbose: false });
                    const searchHandler = new search_js_1.SearchToolHandler(db);
                    const result = await searchHandler.handleSearch({ query });
                    console.log(JSON.stringify(result, null, 2));
                }
                catch (error) {
                    console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
                    process.exit(1);
                }
                break;
            }
            case 'get': {
                // One-shot get
                const specId = args[1];
                if (!specId) {
                    console.error('Usage: speclang-mcp get <spec-id>');
                    process.exit(1);
                }
                try {
                    const config = (0, config_js_1.loadConfig)();
                    const db = (0, index_js_2.createDatabase)({ path: config.database, wal: true, verbose: false });
                    const specsHandler = new specs_js_1.SpecsToolHandler(db);
                    const result = await specsHandler.handleGetSpec({ id: specId, include_content: true });
                    console.log(JSON.stringify(result, null, 2));
                }
                catch (error) {
                    console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
                    process.exit(1);
                }
                break;
            }
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