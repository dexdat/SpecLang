"use strict";
/**
 * SPECLANG-GENERATED: MCP command
 * Source: @speclang/mcp.cli
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpCommand = mcpCommand;
const server_js_1 = require("../../../mcp.spec.dir/src/server.js");
const utils_js_1 = require("../utils.js");
const fs = __importStar(require("fs"));
/**
 * Get MCP state file path
 */
function getMCPStatePath() {
    return '.speclang/mcp-state.json';
}
function loadMCPState() {
    const statePath = getMCPStatePath();
    if (fs.existsSync(statePath)) {
        try {
            return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
        }
        catch {
            // Invalid state
        }
    }
    return {};
}
/**
 * Save MCP state
 */
function saveMCPState(state) {
    const dir = '.speclang';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(getMCPStatePath(), JSON.stringify(state, null, 2));
}
/**
 * Start MCP server
 */
async function mcpStart(options) {
    (0, utils_js_1.ensureSpeclangDir)();
    const port = options.port || 3000;
    if (!options.json) {
        console.log('=== Starting SpecLang MCP Server ===\n');
        console.log(`Mode: ${options.remote ? 'remote' : 'stdio'}`);
        if (options.remote) {
            console.log(`Port: ${port}`);
        }
        console.log(`Database: ${(0, utils_js_1.getDbPath)()}\n`);
    }
    const server = new server_js_1.MCPServer({
        port,
        database: (0, utils_js_1.getDbPath)()
    });
    try {
        if (options.remote) {
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
        // Save state
        saveMCPState({
            pid: process.pid,
            port: options.remote ? port : undefined,
            mode: options.remote ? 'http' : 'stdio',
            startedAt: Date.now()
        });
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
/**
 * Serve MCP server (daemon mode)
 */
async function mcpServe(options) {
    // TODO: Implement daemon mode
    console.error('Serve command not yet implemented');
    process.exit(1);
}
/**
 * Show MCP server status
 */
async function mcpStatus(options) {
    const state = loadMCPState();
    if (options.json) {
        console.log(JSON.stringify(state, null, 2));
    }
    else {
        console.log('=== MCP Server Status ===\n');
        if (state.pid) {
            console.log(`Status: RUNNING (PID ${state.pid})`);
            console.log(`Mode: ${state.mode || 'unknown'}`);
            if (state.port) {
                console.log(`Port: ${state.port}`);
            }
            if (state.startedAt) {
                console.log(`Started: ${new Date(state.startedAt).toISOString()}`);
            }
        }
        else {
            console.log('Status: STOPPED');
            console.log('No MCP server is currently running');
        }
    }
}
/**
 * Stop MCP server
 */
async function mcpStop(options) {
    const state = loadMCPState();
    if (!state.pid) {
        if (options.json) {
            console.log(JSON.stringify({ stopped: false, reason: 'No running server' }));
        }
        else {
            console.log('No MCP server is currently running');
        }
        return;
    }
    // TODO: Actually stop the server process (send signal)
    // For now, just remove state file
    fs.unlinkSync(getMCPStatePath());
    if (options.json) {
        console.log(JSON.stringify({ stopped: true }));
    }
    else {
        console.log('✅ MCP server stopped');
    }
}
/**
 * Generate OpenAPI MCP server
 */
async function mcpGenerateOpenApi(options) {
    // TODO: Implement generate-openapi using openapi-mcp-generator
    console.error('Generate-openapi command not yet implemented');
    process.exit(1);
}
/**
 * MCP command implementation
 */
async function mcpCommand(action, options) {
    switch (action) {
        case 'start':
            await mcpStart(options);
            break;
        case 'serve':
            await mcpServe(options);
            break;
        case 'status':
            await mcpStatus(options);
            break;
        case 'stop':
            await mcpStop(options);
            break;
        case 'generate-openapi':
            await mcpGenerateOpenApi(options);
            break;
        default:
            console.error(`Unknown MCP action: ${action}`);
            process.exit(1);
    }
}
exports.default = mcpCommand;
//# sourceMappingURL=mcp.js.map