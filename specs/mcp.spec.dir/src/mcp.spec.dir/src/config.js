"use strict";
/**
 * SPECLANG-GENERATED: MCP Server Configuration
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.loadConfigFromFile = loadConfigFromFile;
exports.validateConfig = validateConfig;
exports.getArg = getArg;
exports.getArgInt = getArgInt;
exports.getArgBool = getArgBool;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DEFAULT_CONFIG = {
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
function loadConfig(options) {
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
        config.auth.type = process.env.MCP_AUTH_TYPE || 'token';
    }
    if (process.env.MCP_API_KEYS) {
        config.auth.apiKeys = process.env.MCP_API_KEYS.split(',');
    }
    if (process.env.MCP_SSE_ENABLED === 'false') {
        config.sse.enabled = false;
    }
    if (process.env.MCP_LOG_LEVEL) {
        config.logging = { ...config.logging, level: process.env.MCP_LOG_LEVEL };
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
        config.serverMode = process.env.MCP_SERVER_MODE;
    }
    return config;
}
/**
 * Load config from file
 */
function loadConfigFromFile(configPath) {
    try {
        const content = fs.readFileSync(configPath, 'utf-8');
        const fileConfig = JSON.parse(content);
        return loadConfig(fileConfig);
    }
    catch (error) {
        console.error(`Failed to load config from ${configPath}:`, error);
        return DEFAULT_CONFIG;
    }
}
/**
 * Validate configuration
 */
function validateConfig(config) {
    const errors = [];
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
function getArg(args, name, defaultValue = '') {
    const index = args.indexOf(name);
    return index !== -1 && index + 1 < args.length ? args[index + 1] : defaultValue;
}
function getArgInt(args, name, defaultValue) {
    const value = getArg(args, name);
    return value ? parseInt(value, 10) : defaultValue;
}
function getArgBool(args, name) {
    return args.includes(name);
}
