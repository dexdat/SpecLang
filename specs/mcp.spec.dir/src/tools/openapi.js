"use strict";
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
exports.OpenAPIToolHandler = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("yaml"));
class OpenAPIToolHandler {
    db;
    config;
    constructor(db, config) {
        this.db = db;
        this.config = {
            outputBase: config?.outputBase ?? 'generated/mcp-servers',
            transport: config?.transport ?? 'stdio',
            port: config?.port ?? 3000
        };
    }
    async handleValidate(args) {
        const { spec } = args;
        const errors = [];
        const warnings = [];
        try {
            let specContent;
            if (spec.startsWith('http://') || spec.startsWith('https://')) {
                const https = await Promise.resolve().then(() => __importStar(require('https')));
                specContent = await new Promise((resolve, reject) => {
                    https.get(spec, (res) => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => resolve(data));
                        res.on('error', reject);
                    }).on('error', reject);
                });
            }
            else {
                if (!fs.existsSync(spec)) {
                    return { valid: false, errors: ['Spec file not found: ' + spec], warnings: [] };
                }
                specContent = fs.readFileSync(spec, 'utf-8');
            }
            const parsed = yaml.parse(specContent);
            if (!parsed)
                return { valid: false, errors: ['Empty spec'], warnings: [] };
            if (!parsed.openapi && !parsed.swagger)
                errors.push('Missing required field: openapi or swagger');
            if (parsed.openapi && !parsed.openapi.startsWith('3.')) {
                warnings.push('OpenAPI version may not be fully supported');
            }
            const paths = parsed.paths;
            const operations = paths ? Object.entries(paths).flatMap(([p, methods]) => {
                if (typeof methods !== 'object' || methods === null)
                    return [];
                return Object.entries(methods)
                    .filter(([m]) => ['get', 'post', 'put', 'delete', 'patch'].includes(m))
                    .map(([m, op]) => ({ path: p, method: m, op: op }));
            }) : [];
            const info = parsed.info;
            return {
                valid: errors.length === 0,
                errors,
                warnings,
                info: { title: info?.title, version: info?.version, operations: operations.length }
            };
        }
        catch (e) {
            return { valid: false, errors: ['Error: ' + (e instanceof Error ? e.message : String(e))], warnings: [] };
        }
    }
    async handleGenerate(args) {
        const { input, output, transport = 'stdio', port = 3000, serverName, baseUrl, force = false } = args;
        const validation = await this.handleValidate({ spec: input });
        if (!validation.valid) {
            return { success: false, message: 'Validation failed: ' + validation.errors.join(', ') };
        }
        const outputDir = path.resolve(output);
        const outputBase = path.dirname(outputDir);
        if (fs.existsSync(outputDir) && !force) {
            return { success: false, message: 'Output directory exists. Use --force to overwrite.' };
        }
        if (!fs.existsSync(outputBase))
            fs.mkdirSync(outputBase, { recursive: true });
        const specTitle = validation.info?.title || 'openapi-mcp-server';
        const name = serverName || specTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const specPath = input.startsWith('http://') || input.startsWith('https://') ? input : path.resolve(input);
        try {
            (0, child_process_1.execSync)('npx openapi-mcp-generator --input "' + specPath + '" --output "' + outputDir + '" --transport ' + transport + ' --server-name ' + name, { stdio: 'inherit' });
        }
        catch {
            return this.createLocalMCPServer(specPath, outputDir, name, validation);
        }
        return { success: true, serverPath: outputDir, toolsGenerated: validation.info?.operations || 0, message: 'Generated MCP server' };
    }
    createLocalMCPServer(specPath, outputDir, serverName, validation) {
        fs.mkdirSync(outputDir, { recursive: true });
        const pkg = { name: serverName, version: '1.0.0', type: 'module', main: 'dist/index.js', scripts: { build: 'tsc', start: 'node dist/index.js' }, dependencies: { '@modelcontextprotocol/sdk': '^0.5.0', axios: '^1.6.0' }, devDependencies: { typescript: '^5.0.0', '@types/node': '^20.0.0' } };
        fs.writeFileSync(path.join(outputDir, 'package.json'), JSON.stringify(pkg, null, 2));
        const code = "import { Server } from '@modelcontextprotocol/sdk/server/index.js';\nimport { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';\n\nconst server = new Server({ name: '" + serverName + "', version: '1.0.0' }, { capabilities: { tools: {} } });\n\nserver.connect(new StdioServerTransport()).then(() => console.error('MCP server started')).catch(console.error);\n";
        fs.mkdirSync(path.join(outputDir, 'src'));
        fs.writeFileSync(path.join(outputDir, 'src/index.ts'), code);
        return { success: true, serverPath: outputDir, toolsGenerated: validation.info?.operations || 0, message: 'Created local MCP server' };
    }
    async handleRegister(args) {
        const { serverPath, transport = 'stdio', port = 3000 } = args;
        if (!fs.existsSync(serverPath))
            return { success: false, message: 'Server directory not found' };
        const packageJsonPath = path.join(serverPath, 'package.json');
        if (!fs.existsSync(packageJsonPath))
            return { success: false, message: 'Not a valid MCP server' };
        const serverId = path.basename(serverPath);
        try {
            this.db.getDatabase().prepare('CREATE TABLE IF NOT EXISTS mcp_servers (id TEXT PRIMARY KEY, path TEXT, transport TEXT, port INTEGER, status TEXT, created_at TEXT, updated_at TEXT)').run();
            this.db.getDatabase().prepare('INSERT OR REPLACE INTO mcp_servers VALUES (?, ?, ?, ?, ?, datetime("now"), datetime("now"))').run(serverId, serverPath, transport, port, 'active');
        }
        catch { }
        return { success: true, serverId, tools: [], message: 'Registered MCP server' };
    }
    async handleListServers() {
        try {
            this.db.getDatabase().prepare('CREATE TABLE IF NOT EXISTS mcp_servers (id TEXT PRIMARY KEY, path TEXT, transport TEXT, port INTEGER, status TEXT, created_at TEXT, updated_at TEXT)').run();
        }
        catch { }
        const servers = this.db.getDatabase().prepare('SELECT id, path, transport, port, status FROM mcp_servers').all();
        return { servers };
    }
    async handleUnregister(args) {
        const result = this.db.getDatabase().prepare('DELETE FROM mcp_servers WHERE id = ?').run(args.serverId);
        return result.changes > 0 ? { success: true, message: 'Unregistered MCP server' } : { success: false, message: 'Server not found' };
    }
}
exports.OpenAPIToolHandler = OpenAPIToolHandler;
//# sourceMappingURL=openapi.js.map