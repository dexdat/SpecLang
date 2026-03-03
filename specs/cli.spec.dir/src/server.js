"use strict";
/**
 * SPECLANG-GENERATED: Server command
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
exports.serverCommand = serverCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const server_js_1 = require("../../../mcp.spec.dir/src/server.js");
const utils_js_1 = require("../utils.js");
const PID_FILE = '.speclang/mcp.pid';
const STATUS_FILE = '.speclang/mcp.status';
function getPidPath() {
    return (0, utils_js_1.getDbPath)().replace('.speclang.db', '') + '/' + PID_FILE;
}
function getStatusPath() {
    return (0, utils_js_1.getDbPath)().replace('.speclang.db', '') + '/' + STATUS_FILE;
}
function writePid(pid) {
    const pidPath = getPidPath();
    const dir = path.dirname(pidPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(pidPath, pid.toString());
}
function removePid() {
    try {
        const pidPath = getPidPath();
        if (fs.existsSync(pidPath)) {
            fs.unlinkSync(pidPath);
        }
    }
    catch { }
}
function writeStatus(status) {
    const statusPath = getStatusPath();
    const dir = path.dirname(statusPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
}
function removeStatus() {
    try {
        const statusPath = getStatusPath();
        if (fs.existsSync(statusPath)) {
            fs.unlinkSync(statusPath);
        }
    }
    catch { }
}
function readPid() {
    try {
        const pidPath = getPidPath();
        if (fs.existsSync(pidPath)) {
            return parseInt(fs.readFileSync(pidPath, 'utf-8').trim(), 10);
        }
    }
    catch { }
    return null;
}
/**
 * Server command implementation
 */
async function serverCommand(options) {
    (0, utils_js_1.ensureSpeclangDir)();
    const port = options.port || 3000;
    const mode = options.daemon ? 'daemon' : options.http || options.remote ? 'http' : 'stdio';
    if (!options.json) {
        console.log(`=== SpecLang MCP Server ===\n`);
        console.log(`Mode: ${mode}`);
        console.log(`Port: ${port}`);
        if (options.auth && options.auth !== 'none') {
            console.log(`Auth: ${options.auth}`);
        }
        console.log(`Database: ${(0, utils_js_1.getDbPath)()}\n`);
    }
    // Check if daemon already running
    if (options.daemon) {
        const existingPid = readPid();
        if (existingPid) {
            try {
                process.kill(existingPid, 0);
                if (!options.json) {
                    console.error('Daemon already running (PID:', existingPid, ')');
                }
                else {
                    console.log(JSON.stringify({ error: true, message: 'Daemon already running', pid: existingPid }));
                }
                process.exit(1);
            }
            catch {
                removePid();
            }
        }
    }
    const server = new server_js_1.MCPServer({
        port,
        database: (0, utils_js_1.getDbPath)(),
        auth: {
            enabled: options.auth !== undefined && options.auth !== 'none',
            type: options.auth || 'none',
            user: options.user,
            pass: options.pass,
            token: options.token
        }
    });
    try {
        if (options.http || options.remote) {
            if (!options.json) {
                console.log(`Starting server on http://localhost:${port}...`);
            }
            await server.startHTTP(port);
        }
        else {
            if (!options.json) {
                console.log('Starting server in stdio mode...');
            }
            await server.startStdio();
        }
        // Write PID for daemon mode
        if (options.daemon) {
            writePid(process.pid);
            writeStatus({
                port,
                mode,
                auth: options.auth || 'none',
                started: new Date().toISOString(),
                pid: process.pid
            });
            if (!options.json) {
                console.log(`Daemon started (PID: ${process.pid})`);
            }
        }
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            if (!options.json) {
                console.log('\nShutting down server...');
            }
            await server.stop();
            removePid();
            removeStatus();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            if (!options.json) {
                console.log('\nShutting down server...');
            }
            await server.stop();
            removePid();
            removeStatus();
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