/**
 * SPECLANG-GENERATED: MCP Server Index
 * Source: @speclang/mcp
 */

export { MCPServer } from './server.js';
export { MCPToolRegistry, getToolDefinitions } from './tools/index.js';
export { createAuth, MCPAuth } from './auth.js';
export { createSSEManager, SSEManager } from './sse.js';
export { loadConfig, getArg, getArgInt, getArgBool } from './config.js';

export type { 
  MCPServerConfig, 
  MCPAuthConfig, 
  MCPSSEConfig,
  SearchInput,
  SearchResult,
  MCPSpecMetadata,
  GetSpecInput,
  CreateSpecInput,
  UpdateSpecInput,
  ListSpecsInput,
  LockInput,
  UnlockInput,
  CascadeStatus,
  CascadeTriggerInput,
  DependenciesInput,
  ImpactResult,
  ValidationResult,
  IndexRefreshResult,
  SSEEvent,
  SSEEventType
} from './types.js';
