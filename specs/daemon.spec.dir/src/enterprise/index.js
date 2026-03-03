"use strict";
/**
 * Enterprise Daemon Module
 *
 * Generated from: @speclang/mcp-daemon
 *
 * This module provides enterprise features:
 * - HTTP server with SSE for real-time events
 * - MCP tools for IDE integration
 * - Worktree management for isolated testing
 * - Queue management with priority control
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorktreeManager = exports.MCPTools = exports.HTTPServer = void 0;
var http_server_1 = require("./http_server");
Object.defineProperty(exports, "HTTPServer", { enumerable: true, get: function () { return http_server_1.HTTPServer; } });
var mcp_tools_1 = require("./mcp_tools");
Object.defineProperty(exports, "MCPTools", { enumerable: true, get: function () { return mcp_tools_1.MCPTools; } });
var worktree_1 = require("./worktree");
Object.defineProperty(exports, "WorktreeManager", { enumerable: true, get: function () { return worktree_1.WorktreeManager; } });
//# sourceMappingURL=index.js.map