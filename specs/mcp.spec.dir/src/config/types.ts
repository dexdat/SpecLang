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
  type: 'none' | 'basic' | 'token';
  users?: AuthUser[];
  tokens?: string[];
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
