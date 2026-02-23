/**
 * SPECLANG-GENERATED: MCP Server Configuration
 * Source: @speclang/mcp
 */

import * as fs from 'fs';
import * as path from 'path';
import type { MCPServerConfig, MCPAuthConfig, MCPSSEConfig } from './types.js';

const DEFAULT_CONFIG: MCPServerConfig = {
  port: 3000,
  host: '0.0.0.0',
  database: '.speclang/speclang.db',
  databaseWalMode: true,
  serverMode: 'http',
  specsDir: 'specs',
  auth: {
    enabled: false,
    type: 'none'
  },
  sse: {
    enabled: true,
    heartbeatInterval: 30000
  },
  logging: {
    level: 'info'
  },
  limits: {
    maxConnections: 100,
    queryTimeoutMs: 5000,
    maxResults: 1000
  }
};

/**
 * Load MCP server configuration from file or environment
 */
export function loadConfig(options?: Partial<MCPServerConfig>): MCPServerConfig {
  const config = { ...DEFAULT_CONFIG, ...options };
  
  // Override with environment variables
  if (process.env.MCP_PORT) {
    config.port = parseInt(process.env.MCP_PORT, 10);
  }
  if (process.env.MCP_HOST) {
    config.host = process.env.MCP_HOST;
  }
  if (process.env.MCP_DATABASE) {
    config.database = process.env.MCP_DATABASE;
  }
  if (process.env.MCP_SPECS_DIR) {
    config.specsDir = process.env.MCP_SPECS_DIR;
  }
  if (process.env.MCP_AUTH_ENABLED === 'true') {
    config.auth.enabled = true;
    config.auth.type = (process.env.MCP_AUTH_TYPE as MCPAuthConfig['type']) || 'token';
  }
  if (process.env.MCP_API_KEYS) {
    config.auth.apiKeys = process.env.MCP_API_KEYS.split(',');
  }
  if (process.env.MCP_SSE_ENABLED === 'false') {
    config.sse.enabled = false;
  }
  if (process.env.MCP_LOG_LEVEL) {
    config.logging = { ...config.logging, level: process.env.MCP_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error' };
  }
  if (process.env.MCP_LOG_FILE) {
    config.logging = { ...config.logging, file: process.env.MCP_LOG_FILE };
  }
  if (process.env.MCP_MAX_CONNECTIONS) {
    config.limits = { ...config.limits, maxConnections: parseInt(process.env.MCP_MAX_CONNECTIONS, 10) };
  }
  if (process.env.MCP_QUERY_TIMEOUT_MS) {
    config.limits = { ...config.limits, queryTimeoutMs: parseInt(process.env.MCP_QUERY_TIMEOUT_MS, 10) };
  }
  if (process.env.MCP_MAX_RESULTS) {
    config.limits = { ...config.limits, maxResults: parseInt(process.env.MCP_MAX_RESULTS, 10) };
  }
  if (process.env.MCP_WAL_MODE) {
    config.databaseWalMode = process.env.MCP_WAL_MODE === 'true';
  }
  if (process.env.MCP_SERVER_MODE) {
    config.serverMode = process.env.MCP_SERVER_MODE as 'stdio' | 'http' | 'socket';
  }
  
  return config;
}

/**
 * Load config from file
 */
export function loadConfigFromFile(configPath: string): MCPServerConfig {
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const fileConfig = JSON.parse(content);
    return loadConfig(fileConfig);
  } catch (error) {
    console.error(`Failed to load config from ${configPath}:`, error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Validate configuration
 */
export function validateConfig(config: MCPServerConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (config.port < 1 || config.port > 65535) {
    errors.push('Port must be between 1 and 65535');
  }
  
  if (config.auth.enabled && config.auth.type === 'basic') {
    if (!config.auth.user || !config.auth.pass) {
      errors.push('Basic auth requires user and pass');
    }
  }
  
  if (config.auth.enabled && config.auth.type === 'token') {
    if (!config.auth.token && (!config.auth.apiKeys || config.auth.apiKeys.length === 0)) {
      errors.push('Token auth requires token or apiKeys');
    }
  }
  
  // Check database directory exists
  const dbDir = path.dirname(config.database);
  if (!fs.existsSync(dbDir)) {
    errors.push(`Database directory does not exist: ${dbDir}`);
  }
  
  if (config.serverMode === 'http' && (!config.port || config.port < 1 || config.port > 65535)) {
    errors.push('HTTP mode requires valid port between 1 and 65535');
  }
  
  if (config.limits) {
    if (config.limits.maxConnections < 1) {
      errors.push('maxConnections must be at least 1');
    }
    if (config.limits.queryTimeoutMs < 100) {
      errors.push('queryTimeoutMs must be at least 100');
    }
    if (config.limits.maxResults < 1) {
      errors.push('maxResults must be at least 1');
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Get CLI argument parser
 */
export function getArg(args: string[], name: string, defaultValue: string = ''): string {
  const index = args.indexOf(name);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : defaultValue;
}

export function getArgInt(args: string[], name: string, defaultValue: number): number {
  const value = getArg(args, name);
  return value ? parseInt(value, 10) : defaultValue;
}

export function getArgBool(args: string[], name: string): boolean {
  return args.includes(name);
}
