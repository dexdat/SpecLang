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
export { HTTPServer } from './http_server';
export type { QueueItem, DaemonStatusResponse, QueueResponse, CommandRequest, WorktreeInfo, TestResult, SSEEvent, SSEEventType, } from './http_server';
export { MCPTools } from './mcp_tools';
export type { MCPToolHandlers } from './mcp_tools';
export { WorktreeManager } from './worktree';
export type { WorktreeSpec, TestResult as WorktreeTestResult, DeploymentResult } from './worktree';
//# sourceMappingURL=index.d.ts.map