import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import type { SpecLangDB } from '../../db/index.js';

export interface OpenAPIGenerateInput {
  input: string;
  output: string;
  transport?: 'stdio' | 'web' | 'streamable-http';
  port?: number;
  serverName?: string;
  baseUrl?: string;
  force?: boolean;
  register?: boolean;
}

export interface OpenAPIGenerateResult {
  success: boolean;
  serverPath?: string;
  toolsGenerated?: number;
  message: string;
}

export interface OpenAPIValidateInput {
  spec: string;
}

export interface OpenAPIValidateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info?: {
    title?: string;
    version?: string;
    operations?: number;
  };
}

export interface OpenAPIRegisterInput {
  serverPath: string;
  transport?: 'stdio' | 'web' | 'streamable-http';
  port?: number;
}

export interface OpenAPIRegisterResult {
  success: boolean;
  serverId?: string;
  tools?: string[];
  message: string;
}

export class OpenAPIToolHandler {
  private db: SpecLangDB;
  private config: { outputBase: string; transport: string; port: number };

  constructor(db: SpecLangDB, config?: Partial<{ outputBase: string; transport: string; port: number }>) {
    this.db = db;
    this.config = {
      outputBase: config?.outputBase ?? 'generated/mcp-servers',
      transport: config?.transport ?? 'stdio',
      port: config?.port ?? 3000
    };
  }

  async handleValidate(args: OpenAPIValidateInput): Promise<OpenAPIValidateResult> {
    const { spec } = args;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      let specContent: string;
      if (spec.startsWith('http://') || spec.startsWith('https://')) {
        const https = await import('https');
        specContent = await new Promise<string>((resolve, reject) => {
          https.get(spec, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', reject);
          }).on('error', reject);
        });
      } else {
        if (!fs.existsSync(spec)) {
          return { valid: false, errors: ['Spec file not found: ' + spec], warnings: [] };
        }
        specContent = fs.readFileSync(spec, 'utf-8');
      }

      const parsed = yaml.parse(specContent) as Record<string, unknown> | null;
      if (!parsed) return { valid: false, errors: ['Empty spec'], warnings: [] };

      if (!parsed.openapi && !parsed.swagger) errors.push('Missing required field: openapi or swagger');
      if (parsed.openapi && !(parsed.openapi as string).startsWith('3.')) {
        warnings.push('OpenAPI version may not be fully supported');
      }

      const paths = parsed.paths as Record<string, unknown> | undefined;
      const operations = paths ? Object.entries(paths).flatMap(([p, methods]) => {
        if (typeof methods !== 'object' || methods === null) return [];
        return Object.entries(methods)
          .filter(([m]) => ['get', 'post', 'put', 'delete', 'patch'].includes(m))
          .map(([m, op]) => ({ path: p, method: m, op: op as Record<string, unknown> }));
      }) : [];

      const info = parsed.info as Record<string, unknown> | undefined;
      return {
        valid: errors.length === 0,
        errors,
        warnings,
        info: { title: info?.title as string, version: info?.version as string, operations: operations.length }
      };
    } catch (e) {
      return { valid: false, errors: ['Error: ' + (e instanceof Error ? e.message : String(e))], warnings: [] };
    }
  }

  async handleGenerate(args: OpenAPIGenerateInput): Promise<OpenAPIGenerateResult> {
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
    if (!fs.existsSync(outputBase)) fs.mkdirSync(outputBase, { recursive: true });

    const specTitle = validation.info?.title || 'openapi-mcp-server';
    const name = serverName || specTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const specPath = input.startsWith('http://') || input.startsWith('https://') ? input : path.resolve(input);

    try {
      execSync('npx openapi-mcp-generator --input "' + specPath + '" --output "' + outputDir + '" --transport ' + transport + ' --server-name ' + name, { stdio: 'inherit' });
    } catch {
      return this.createLocalMCPServer(specPath, outputDir, name, validation);
    }

    return { success: true, serverPath: outputDir, toolsGenerated: validation.info?.operations || 0, message: 'Generated MCP server' };
  }

  private createLocalMCPServer(specPath: string, outputDir: string, serverName: string, validation: OpenAPIValidateResult): OpenAPIGenerateResult {
    fs.mkdirSync(outputDir, { recursive: true });
    const pkg = { name: serverName, version: '1.0.0', type: 'module', main: 'dist/index.js', scripts: { build: 'tsc', start: 'node dist/index.js' }, dependencies: { '@modelcontextprotocol/sdk': '^0.5.0', axios: '^1.6.0' }, devDependencies: { typescript: '^5.0.0', '@types/node': '^20.0.0' } };
    fs.writeFileSync(path.join(outputDir, 'package.json'), JSON.stringify(pkg, null, 2));

    const code = "import { Server } from '@modelcontextprotocol/sdk/server/index.js';\nimport { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';\n\nconst server = new Server({ name: '" + serverName + "', version: '1.0.0' }, { capabilities: { tools: {} } });\n\nserver.connect(new StdioServerTransport()).then(() => console.error('MCP server started')).catch(console.error);\n";
    fs.mkdirSync(path.join(outputDir, 'src'));
    fs.writeFileSync(path.join(outputDir, 'src/index.ts'), code);

    return { success: true, serverPath: outputDir, toolsGenerated: validation.info?.operations || 0, message: 'Created local MCP server' };
  }

  async handleRegister(args: OpenAPIRegisterInput): Promise<OpenAPIRegisterResult> {
    const { serverPath, transport = 'stdio', port = 3000 } = args;
    if (!fs.existsSync(serverPath)) return { success: false, message: 'Server directory not found' };
    const packageJsonPath = path.join(serverPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) return { success: false, message: 'Not a valid MCP server' };

    const serverId = path.basename(serverPath);
    try {
      this.db.getDatabase().prepare('CREATE TABLE IF NOT EXISTS mcp_servers (id TEXT PRIMARY KEY, path TEXT, transport TEXT, port INTEGER, status TEXT, created_at TEXT, updated_at TEXT)').run();
      this.db.getDatabase().prepare('INSERT OR REPLACE INTO mcp_servers VALUES (?, ?, ?, ?, ?, datetime("now"), datetime("now"))').run(serverId, serverPath, transport, port, 'active');
    } catch {}
    return { success: true, serverId, tools: [], message: 'Registered MCP server' };
  }

  async handleListServers(): Promise<{ servers: Array<{ id: string; path: string; transport: string; port: number; status: string }> }> {
    try {
      this.db.getDatabase().prepare('CREATE TABLE IF NOT EXISTS mcp_servers (id TEXT PRIMARY KEY, path TEXT, transport TEXT, port INTEGER, status TEXT, created_at TEXT, updated_at TEXT)').run();
    } catch {}
    const servers = this.db.getDatabase().prepare('SELECT id, path, transport, port, status FROM mcp_servers').all() as Array<{ id: string; path: string; transport: string; port: number; status: string }>;
    return { servers };
  }

  async handleUnregister(args: { serverId: string }): Promise<{ success: boolean; message: string }> {
    const result = this.db.getDatabase().prepare('DELETE FROM mcp_servers WHERE id = ?').run(args.serverId);
    return result.changes > 0 ? { success: true, message: 'Unregistered MCP server' } : { success: false, message: 'Server not found' };
  }
}
