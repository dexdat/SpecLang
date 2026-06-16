# Bootstrap Phase 2.9: MCP Configuration

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 2.9 of the bootstrap process.

**Prerequisites**: Phase 2.1 (MCP Server), Phase 2.2 (MCP CLI) complete.

## Your Task
Implement MCP configuration with schema validation and defaults.

## Read These Specs First
1. `specs/mcp.spec.dir/configuration.spec.md` - Configuration options and schema

## Configuration Schema

```yaml
Configuration:
  file: .speclang/mcp.json
  
  schema:
    database:
      path: string (default: .speclang/speclang.db)
      wal_mode: boolean (default: true)
      
    server:
      mode: "stdio" | "http" | "socket"
      port: number (if http)
      host: string (default: localhost)
      
    auth:
      type: "none" | "basic" | "token"
      users: array (if basic)
      tokens: array (if token)
      
    logging:
      level: "debug" | "info" | "warn" | "error"
      file: string
      
    limits:
      max_connections: number
      query_timeout_ms: number
      max_results: number
```

## Example Configuration

```json
{
  "database": {
    "path": ".speclang/speclang.db",
    "wal_mode": true
  },
  "server": {
    "mode": "http",
    "port": 3000,
    "host": "127.0.0.1"
  },
  "auth": {
    "type": "token",
    "tokens": ["dev-token-123", "prod-token-456"]
  },
  "logging": {
    "level": "info",
    "file": ".speclang/mcp.log"
  },
  "limits": {
    "max_connections": 100,
    "query_timeout_ms": 5000,
    "max_results": 1000
  }
}
```

## Implementation

### 1. Configuration Types (`mcp/config/types.ts`)

```typescript
export interface MCPConfig {
  database: DatabaseConfig;
  server: ServerConfig;
  auth?: AuthConfig;
  logging?: LoggingConfig;
  limits?: LimitsConfig;
}

export interface DatabaseConfig {
  path: string;
  wal_mode: boolean;
}

export interface ServerConfig {
  mode: 'stdio' | 'http' | 'socket';
  port?: number;
  host: string;
}

export interface AuthConfig {
  type: 'none' | 'basic' | 'token' | 'config';
  users?: AuthUser[];
  tokens?: string[];
  configFile?: string;
}

export interface AuthUser {
  user: string;
  pass?: string;
  hash?: string;
  permissions: string[];
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  file?: string;
}

export interface LimitsConfig {
  max_connections: number;
  query_timeout_ms: number;
  max_results: number;
}

export const DEFAULT_CONFIG: MCPConfig = {
  database: {
    path: '.speclang/speclang.db',
    wal_mode: true,
  },
  server: {
    mode: 'stdio',
    host: 'localhost',
  },
  logging: {
    level: 'info',
  },
  limits: {
    max_connections: 100,
    query_timeout_ms: 5000,
    max_results: 1000,
  },
};
```

### 2. Configuration Loader (`mcp/config/loader.ts`)

```typescript
import fs from 'fs';
import path from 'path';
import { MCPConfig, DEFAULT_CONFIG } from './types';

export class ConfigLoader {
  private configPath: string;
  
  constructor(configPath?: string) {
    this.configPath = configPath || this.findConfigFile();
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
      auth: partial.auth ? {
        type: partial.auth.type || 'none',
        ...partial.auth,
      } : undefined,
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

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

### 3. Environment Variable Overrides

```typescript
export function applyEnvOverrides(config: MCPConfig): MCPConfig {
  const env = process.env;
  
  if (env.MCP_DB_PATH) {
    config.database.path = env.MCP_DB_PATH;
  }
  
  if (env.MCP_SERVER_MODE) {
    config.server.mode = env.MCP_SERVER_MODE as any;
  }
  
  if (env.MCP_SERVER_PORT) {
    config.server.port = parseInt(env.MCP_SERVER_PORT, 10);
  }
  
  if (env.MCP_SERVER_HOST) {
    config.server.host = env.MCP_SERVER_HOST;
  }
  
  if (env.MCP_LOG_LEVEL) {
    config.logging = config.logging || { level: 'info' };
    config.logging.level = env.MCP_LOG_LEVEL as any;
  }
  
  if (env.MCP_AUTH_TOKEN) {
    config.auth = { type: 'token', tokens: [env.MCP_AUTH_TOKEN] };
  }
  
  return config;
}
```

### 4. CLI Integration

```bash
# Use default config
speclang mcp

# Specify config file
speclang mcp --config ./custom-mcp.json

# Override with CLI flags
speclang mcp --mode=http --port=3000 --log-level=debug

# Generate default config
speclang mcp config init

# Validate config
speclang mcp config validate

# Show current config
speclang mcp config show
```

### 5. Config CLI Commands (`mcp/config/cli.ts`)

```typescript
import { ConfigLoader } from './loader';

export const configInitCommand = {
  command: 'config init',
  action: () => {
    const loader = new ConfigLoader();
    loader.save(DEFAULT_CONFIG);
    console.log('Created default config at .speclang/mcp.json');
  },
};

export const configValidateCommand = {
  command: 'config validate',
  action: () => {
    const loader = new ConfigLoader();
    const config = loader.load();
    const result = loader.validate(config);
    
    if (result.valid) {
      console.log('Config is valid');
    } else {
      console.error('Config errors:');
      result.errors.forEach(e => console.error(`  - ${e}`));
    }
    
    if (result.warnings.length > 0) {
      console.warn('Warnings:');
      result.warnings.forEach(w => console.warn(`  - ${w}`));
    }
    
    process.exit(result.valid ? 0 : 1);
  },
};

export const configShowCommand = {
  command: 'config show',
  action: () => {
    const loader = new ConfigLoader();
    const config = applyEnvOverrides(loader.load());
    console.log(JSON.stringify(config, null, 2));
  },
};
```

### 6. Hot Reload Support

```typescript
export class ConfigWatcher {
  private loader: ConfigLoader;
  private onChange?: (config: MCPConfig) => void;
  private watcher?: fs.FSWatcher;
  
  constructor(loader: ConfigLoader) {
    this.loader = loader;
  }
  
  start(onChange: (config: MCPConfig) => void) {
    this.onChange = onChange;
    
    this.watcher = fs.watch(
      path.dirname(this.loader['configPath']),
      (eventType, filename) => {
        if (filename === path.basename(this.loader['configPath'])) {
          const config = this.loader.load();
          this.onChange?.(config);
        }
      }
    );
  }
  
  stop() {
    this.watcher?.close();
  }
}
```

## Test Cases
1. Load config from JSON file
2. Load config from YAML file
3. Use defaults when no config file
4. Merge partial config with defaults
5. Validate HTTP mode requires port
6. Validate basic auth requires users
7. Validate token auth requires tokens
8. Apply environment variable overrides
9. Save config to file
10. Hot reload config on file change

## Output
1. Config types with defaults
2. ConfigLoader class
3. Validation logic
4. Environment variable support
5. CLI commands
6. Hot reload support
7. Integration tests
