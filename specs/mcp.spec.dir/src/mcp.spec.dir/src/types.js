"use strict";
/**
 * SPECLANG-GENERATED: MCP Server Types
 * Source: @speclang/mcp
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MCP_CONFIG = void 0;
/** Default server configuration */
exports.DEFAULT_MCP_CONFIG = {
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
