"use strict";
/**
 * SPECLANG-GENERATED: MCP subcommands
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
exports.mcpStartCommand = mcpStartCommand;
exports.mcpServeCommand = mcpServeCommand;
exports.mcpStatusCommand = mcpStatusCommand;
exports.mcpStopCommand = mcpStopCommand;
exports.mcpGenerateOpenapiCommand = mcpGenerateOpenapiCommand;
exports.mcpGenerateAllCommand = mcpGenerateAllCommand;
const server_js_1 = require("../../../mcp.spec.dir/src/server.js");
const utils_js_1 = require("../utils.js");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const yaml = __importStar(require("yaml"));
const PID_FILE = '.speclang/mcp.pid';
const STATUS_FILE = '.speclang/mcp.status';
function getPidPath() {
    return (0, utils_js_1.getDbPath)().replace('.speclang.db', '') + '/' + PID_FILE;
}
function getStatusPath() {
    return (0, utils_js_1.getDbPath)().replace('.speclang.db', '') + '/' + STATUS_FILE;
}
function readPid() {
    try {
        const fs = require('fs');
        const pidPath = getPidPath();
        if (fs.existsSync(pidPath)) {
            return parseInt(fs.readFileSync(pidPath, 'utf-8').trim(), 10);
        }
    }
    catch { }
    return null;
}
function writePid(pid) {
    const fs = require('fs');
    const pidPath = getPidPath();
    const dir = require('path').dirname(pidPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(pidPath, pid.toString());
}
function removePid() {
    try {
        const fs = require('fs');
        const pidPath = getPidPath();
        if (fs.existsSync(pidPath)) {
            fs.unlinkSync(pidPath);
        }
    }
    catch { }
}
function writeStatus(status) {
    const fs = require('fs');
    const statusPath = getStatusPath();
    const dir = require('path').dirname(statusPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
}
function readStatus() {
    try {
        const fs = require('fs');
        const statusPath = getStatusPath();
        if (fs.existsSync(statusPath)) {
            return JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
        }
    }
    catch { }
    return null;
}
/**
 * MCP start command - start MCP server
 */
async function mcpStartCommand(options) {
    try {
        const server = new server_js_1.MCPServer();
        if (!options.json) {
            console.log('Starting SpecLang MCP server...');
        }
        if (options.remote || options.port) {
            const port = options.port || 3000;
            if (!options.json) {
                console.log(`Starting in HTTP mode on port ${port}...`);
            }
            await server.startHTTP(port);
        }
        else {
            if (!options.json) {
                console.log('Starting in stdio mode...');
            }
            await server.startStdio();
        }
    }
    catch (error) {
        if (!options.json) {
            console.error('Failed to start MCP server:', error);
        }
        else {
            console.log(JSON.stringify({
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            }));
        }
        process.exit(1);
    }
}
/**
 * MCP serve command - daemon mode
 */
async function mcpServeCommand(options) {
    const pid = readPid();
    if (pid) {
        try {
            process.kill(pid, 0);
            if (!options.json) {
                console.log('MCP server is already running');
            }
            else {
                console.log(JSON.stringify({ success: false, message: 'Server already running' }));
            }
            return;
        }
        catch {
            removePid();
        }
    }
    const baseDir = (0, utils_js_1.getDbPath)().replace('.speclang.db', '');
    const daemonScript = path.join(baseDir, '.speclang', 'mcp-daemon.sh');
    const logFile = path.join(baseDir, '.speclang', 'mcp.log');
    const daemonContent = `#!/bin/bash
exec npx speclang-mcp start --http --port 3000 >> "${logFile}" 2>&1
`;
    const dir = path.dirname(daemonScript);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(daemonScript, daemonContent);
    fs.chmodSync(daemonScript, 0o755);
    const child = (0, child_process_1.spawn)(daemonScript, [], {
        detached: true,
        stdio: 'ignore',
        cwd: baseDir
    });
    child.unref();
    const serverPid = child.pid;
    writePid(serverPid);
    writeStatus({
        mode: 'daemon',
        started: new Date().toISOString(),
        pid: serverPid
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!options.json) {
        console.log(`MCP server started in daemon mode (PID: ${serverPid})`);
        console.log(`Log file: ${logFile}`);
    }
    else {
        console.log(JSON.stringify({ success: true, pid: serverPid }));
    }
}
/**
 * MCP status command - show server status
 */
async function mcpStatusCommand(options) {
    const pid = readPid();
    const status = readStatus();
    if (!options.json) {
        console.log('=== SpecLang MCP Server Status ===\n');
        if (pid) {
            try {
                process.kill(pid, 0);
                console.log(`Status: Running`);
                console.log(`PID: ${pid}`);
            }
            catch {
                console.log(`Status: Not running (stale PID file)`);
                removePid();
            }
        }
        else {
            console.log('Status: Not running');
        }
        if (status) {
            console.log(`\nDetails:`);
            console.log(`  Port: ${status.port || 'N/A'}`);
            console.log(`  Mode: ${status.mode || 'N/A'}`);
            console.log(`  Started: ${status.started || 'N/A'}`);
        }
    }
    else {
        console.log(JSON.stringify({
            running: pid ? true : false,
            pid: pid,
            status: status
        }, null, 2));
    }
}
/**
 * MCP stop command - stop daemon
 */
async function mcpStopCommand(options) {
    const pid = readPid();
    if (!pid) {
        if (!options.json) {
            console.log('No MCP server is running');
        }
        else {
            console.log(JSON.stringify({ success: false, message: 'No server running' }));
        }
        return;
    }
    try {
        process.kill(pid, 'SIGTERM');
        let attempts = 0;
        while (attempts < 10) {
            try {
                process.kill(pid, 0);
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }
            catch {
                break;
            }
        }
        if (attempts >= 10) {
            process.kill(pid, 'SIGKILL');
        }
        removePid();
        if (!options.json) {
            console.log('MCP server stopped');
        }
        else {
            console.log(JSON.stringify({ success: true }));
        }
    }
    catch (error) {
        if (!options.json) {
            console.error('Failed to stop server:', error);
        }
        else {
            console.log(JSON.stringify({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }));
        }
        process.exit(1);
    }
}
/**
 * MCP generate-openapi command - generate MCP server from OpenAPI spec
 */
async function mcpGenerateOpenapiCommand(options) {
    const input = options.input;
    const output = options.output;
    if (!input) {
        if (!options.json) {
            console.error('Error: --input is required');
            console.error('Usage: speclang mcp generate-openapi --input <spec> --output <dir> [options]');
        }
        else {
            console.log(JSON.stringify({ success: false, message: '--input is required' }));
        }
        process.exit(1);
    }
    if (!output) {
        if (!options.json) {
            console.error('Error: --output is required');
            console.error('Usage: speclang mcp generate-openapi --input <spec> --output <dir> [options]');
        }
        else {
            console.log(JSON.stringify({ success: false, message: '--output is required' }));
        }
        process.exit(1);
    }
    if (!options.json) {
        console.log(`Generating MCP server from OpenAPI spec: ${input}`);
        console.log(`Output directory: ${output}`);
    }
    const transport = options.transport || 'stdio';
    const port = options.port || 3000;
    const serverName = options.serverName || 'generated-mcp-server';
    const baseUrl = options.baseUrl || '';
    const force = options.force ? '--force' : '';
    const register = options.register ? '--register' : '';
    const dryRun = options.dryRun;
    let specPath = input;
    if (input.startsWith('http://') || input.startsWith('https://')) {
        specPath = input;
    }
    else if (!fs.existsSync(input)) {
        if (!options.json) {
            console.error(`Error: OpenAPI spec not found: ${input}`);
        }
        else {
            console.log(JSON.stringify({ success: false, message: `File not found: ${input}` }));
        }
        process.exit(1);
    }
    if (dryRun) {
        if (!options.json) {
            console.log(`Dry run mode - validating OpenAPI spec without generating files`);
        }
        try {
            let specContent;
            if (specPath.startsWith('http://') || specPath.startsWith('https://')) {
                const https = await Promise.resolve().then(() => __importStar(require('https')));
                specContent = await new Promise((resolve, reject) => {
                    https.get(specPath, (res) => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => resolve(data));
                        res.on('error', reject);
                    }).on('error', reject);
                });
            }
            else {
                specContent = fs.readFileSync(specPath, 'utf-8');
            }
            const parsed = yaml.parse(specContent);
            if (!parsed) {
                console.log(JSON.stringify({ success: false, message: 'Empty spec' }));
                process.exit(1);
            }
            const paths = parsed.paths || {};
            const operations = Object.entries(paths).flatMap(([p, methods]) => {
                if (!methods || typeof methods !== 'object')
                    return [];
                return Object.entries(methods)
                    .filter(([m]) => ['get', 'post', 'put', 'delete', 'patch'].includes(m))
                    .map(([m, op]) => ({ path: p, method: m, operationId: op.operationId || `${m}${p.replace(/[^a-zA-Z0-9]/g, '')}` }));
            });
            const info = parsed.info || {};
            const result = {
                success: true,
                dryRun: true,
                spec: specPath,
                info: {
                    title: info.title || 'Unknown API',
                    version: info.version || '1.0.0',
                    description: info.description || ''
                },
                operations: operations.length,
                tools: operations.map((op) => `${serverName}_${op.operationId}`),
                output: output,
                transport: transport,
                port: port,
                estimatedFiles: [
                    `${output}/package.json`,
                    `${output}/tsconfig.json`,
                    `${output}/src/index.ts`,
                    `${output}/src/tools.ts`,
                    `${output}/src/types.ts`
                ]
            };
            if (!options.json) {
                console.log(`\nValidation: ✅ PASSED`);
                console.log(`\nAPI Info:`);
                console.log(`  Title: ${result.info.title}`);
                console.log(`  Version: ${result.info.version}`);
                console.log(`\nOperations: ${result.operations}`);
                console.log(`\nTools to generate:`);
                result.tools.forEach((t) => console.log(`  - ${t}`));
                console.log(`\nOutput directory: ${output}`);
                console.log(`Transport: ${transport}`);
                if (transport !== 'stdio')
                    console.log(`Port: ${port}`);
                console.log(`\nEstimated files to create: ${result.estimatedFiles.length}`);
            }
            console.log(JSON.stringify(result, null, options.json ? 2 : 0));
            return;
        }
        catch (error) {
            console.log(JSON.stringify({ success: false, message: error instanceof Error ? error.message : 'Validation failed' }));
            process.exit(1);
        }
    }
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const args = [
        '-y',
        'openapi-mcp-generator',
        '--input', specPath,
        '--output', output,
        '--transport', transport,
        '--port', port.toString(),
        '--server-name', serverName,
        force,
        register
    ].filter(Boolean);
    if (baseUrl) {
        args.push('--base-url', baseUrl);
    }
    try {
        if (!options.json) {
            console.log(`Running: ${npxCmd} ${args.join(' ')}`);
        }
        (0, child_process_1.execSync)(npxCmd + ' ' + args.join(' '), {
            stdio: 'inherit',
            cwd: process.cwd()
        });
        if (!options.json) {
            console.log(`\nMCP server generated successfully!`);
            console.log(`To start the server:`);
            console.log(`  cd ${output} && npm install && npm start`);
        }
        else {
            console.log(JSON.stringify({
                success: true,
                output,
                transport,
                port,
                serverName
            }));
        }
    }
    catch (error) {
        if (!options.json) {
            console.error('Failed to generate MCP server:', error);
        }
        else {
            console.log(JSON.stringify({
                success: false,
                message: error instanceof Error ? error.message : 'Generation failed'
            }));
        }
        process.exit(1);
    }
}
async function mcpGenerateAllCommand(options) {
    const configPath = options.config || '.speclang/openapi-mcp.yaml';
    const baseDir = (0, utils_js_1.getDbPath)().replace('.speclang.db', '');
    const configFile = path.resolve(baseDir, configPath);
    if (!fs.existsSync(configFile)) {
        if (!options.json) {
            console.error(`Config file not found: ${configFile}`);
            console.error(`Create one at ${configPath} with server definitions.`);
        }
        else {
            console.log(JSON.stringify({ success: false, message: `Config not found: ${configFile}` }));
        }
        process.exit(1);
    }
    if (!options.json) {
        console.log(`Loading config: ${configFile}`);
    }
    try {
        const configContent = fs.readFileSync(configFile, 'utf-8');
        const config = yaml.parse(configContent);
        if (!config || !config.servers || !Array.isArray(config.servers)) {
            console.log(JSON.stringify({ success: false, message: 'Invalid config: missing servers array' }));
            process.exit(1);
        }
        const servers = config.servers;
        const results = [];
        for (const server of servers) {
            if (!options.json) {
                console.log(`\nGenerating ${server.name}...`);
            }
            const opts = {
                input: server.spec,
                output: path.join(baseDir, config.defaults?.output_base || 'generated/mcp-servers', server.output || server.name),
                transport: server.transport || config.defaults?.transport || 'stdio',
                port: server.port || config.defaults?.port || 3000,
                serverName: server.name,
                force: options.force,
                json: false
            };
            try {
                await mcpGenerateOpenapiCommand(opts);
                results.push({ name: server.name, success: true, message: 'Generated' });
            }
            catch (err) {
                results.push({ name: server.name, success: false, message: err instanceof Error ? err.message : 'Failed' });
            }
        }
        const successCount = results.filter(r => r.success).length;
        if (!options.json) {
            console.log(`\n=== Generation Complete ===`);
            console.log(`Success: ${successCount}/${results.length}`);
        }
        console.log(JSON.stringify({ success: results.length > 0, total: results.length, successCount, results }, null, 2));
    }
    catch (error) {
        console.log(JSON.stringify({ success: false, message: error instanceof Error ? error.message : 'Config error' }));
        process.exit(1);
    }
}
exports.default = {
    mcpStartCommand,
    mcpServeCommand,
    mcpStatusCommand,
    mcpStopCommand,
    mcpGenerateOpenapiCommand,
    mcpGenerateAllCommand
};
//# sourceMappingURL=mcp.js.map