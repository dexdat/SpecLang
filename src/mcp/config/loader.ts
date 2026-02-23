import * as fs from 'fs';
import * as path from 'path';
import { MCPConfig, DEFAULT_CONFIG } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ConfigLoader {
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || this.findConfigFile();
  }

  getConfigPath(): string {
    return this.configPath;
  }

  private findConfigFile(): string {
    const candidates = [
      '.speclang/mcp.json',
      '.speclang/mcp.yaml',
      'mcp.json',
      'mcp.yaml',
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return '.speclang/mcp.json';
  }

  load(): MCPConfig {
    if (!fs.existsSync(this.configPath)) {
      return { ...DEFAULT_CONFIG };
    }

    const content = fs.readFileSync(this.configPath, 'utf-8');
    let parsed: Partial<MCPConfig>;

    if (this.configPath.endsWith('.yaml') || this.configPath.endsWith('.yml')) {
      const yaml = require('js-yaml');
      parsed = yaml.load(content);
    } else {
      parsed = JSON.parse(content);
    }

    return this.mergeWithDefaults(parsed);
  }

  private mergeWithDefaults(partial: Partial<MCPConfig>): MCPConfig {
    return {
      database: {
        ...DEFAULT_CONFIG.database,
        ...partial.database,
      },
      server: {
        ...DEFAULT_CONFIG.server,
        ...partial.server,
      },
      auth: partial.auth
        ? {
            type: partial.auth.type || 'none',
            ...partial.auth,
          }
        : undefined,
      logging: {
        ...DEFAULT_CONFIG.logging,
        ...partial.logging,
      },
      limits: {
        ...DEFAULT_CONFIG.limits,
        ...partial.limits,
      },
    };
  }

  save(config: MCPConfig): void {
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const content = JSON.stringify(config, null, 2);
    fs.writeFileSync(this.configPath, content);
  }

  validate(config: MCPConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.server.mode === 'http' && !config.server.port) {
      errors.push('HTTP mode requires port to be specified');
    }

    if (config.auth?.type === 'basic' && !config.auth.users?.length) {
      errors.push('Basic auth requires at least one user');
    }

    if (config.auth?.type === 'token' && !config.auth.tokens?.length) {
      errors.push('Token auth requires at least one token');
    }

    if (config.database.wal_mode && !config.database.path.endsWith('.db')) {
      warnings.push('WAL mode recommended with .db extension');
    }

    if (config.limits && config.limits.max_results > 10000) {
      warnings.push('Large max_results may impact memory usage');
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

export function applyEnvOverrides(config: MCPConfig): MCPConfig {
  const env = process.env;

  if (env.MCP_DB_PATH) {
    config.database.path = env.MCP_DB_PATH;
  }

  if (env.MCP_SERVER_MODE) {
    config.server.mode = env.MCP_SERVER_MODE as 'stdio' | 'http' | 'socket';
  }

  if (env.MCP_SERVER_PORT) {
    config.server.port = parseInt(env.MCP_SERVER_PORT, 10);
  }

  if (env.MCP_SERVER_HOST) {
    config.server.host = env.MCP_SERVER_HOST;
  }

  if (env.MCP_LOG_LEVEL) {
    config.logging = config.logging || { level: 'info' };
    config.logging.level = env.MCP_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error';
  }

  if (env.MCP_AUTH_TOKEN) {
    config.auth = { type: 'token', tokens: [env.MCP_AUTH_TOKEN] };
  }

  return config;
}
