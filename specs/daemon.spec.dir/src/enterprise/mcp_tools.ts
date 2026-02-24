/**
 * MCP Tools for speclangd Enterprise
 * 
 * Generated from: @speclang/mcp-daemon/architecture
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

export interface MCPToolHandlers {
  onQueueStatus?: () => Promise<{ pending: string[]; in_progress: string[]; completed: string[]; depth: number }>;
  onQueuePause?: () => Promise<{ ok: boolean; paused_at: number }>;
  onQueueResume?: () => Promise<{ ok: boolean; resumed_at: number }>;
  onWorktreeCreate?: (params: { name: string; base_commit?: string }) => Promise<{ path: string; ready: boolean }>;
  onWorktreeTest?: (params: { worktree: string; filter?: string }) => Promise<{ test_id: string; status: string; results?: unknown }>;
  onWorktreeDeploy?: (params: { worktree: string; target: string }) => Promise<{ deployment_id: string; status: string }>;
  onAgentControl?: (params: { session: string; command: string }) => Promise<{ ok: boolean; new_status: string }>;
}

export class MCPTools {
  private server: Server | null = null;
  private handlers: MCPToolHandlers;

  constructor(handlers: MCPToolHandlers = {}) {
    this.handlers = handlers;
  }

  public async initialize(): Promise<void> {
    this.server = new Server(
      {
        name: 'speclangd-enterprise',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'speclang_queue_status',
            description: 'Get current queue status',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'speclang_queue_pause',
            description: 'Pause queue processing',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'speclang_queue_resume',
            description: 'Resume queue processing',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'speclang_worktree_create',
            description: 'Create isolated worktree',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Worktree name' },
                base_commit: { type: 'string', description: 'Base commit SHA (optional)' },
              },
              required: ['name'],
            },
          },
          {
            name: 'speclang_worktree_test',
            description: 'Run tests in worktree',
            inputSchema: {
              type: 'object',
              properties: {
                worktree: { type: 'string', description: 'Worktree name' },
                filter: { type: 'string', description: 'Test filter (optional)' },
              },
              required: ['worktree'],
            },
          },
          {
            name: 'speclang_worktree_deploy',
            description: 'Deploy worktree version',
            inputSchema: {
              type: 'object',
              properties: {
                worktree: { type: 'string', description: 'Worktree name' },
                target: { type: 'string', description: 'Target environment' },
              },
              required: ['worktree', 'target'],
            },
          },
          {
            name: 'speclang_agent_control',
            description: 'Control a specific agent',
            inputSchema: {
              type: 'object',
              properties: {
                session: { type: 'string', description: 'Agent session ID' },
                command: { 
                  type: 'string', 
                  description: 'Command: pause, resume, split, re-expand, priority, kill',
                  enum: ['pause', 'resume', 'split', 're-expand', 'priority', 'kill'],
                },
              },
              required: ['session', 'command'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'speclang_queue_status': {
            if (this.handlers.onQueueStatus) {
              const result = await this.handlers.onQueueStatus();
              return { content: [{ type: 'text', text: JSON.stringify(result) }] };
            }
            return { content: [{ type: 'text', text: JSON.stringify({ pending: [], in_progress: [], completed: [], depth: 0 }) }] };
          }

          case 'speclang_queue_pause': {
            const paused_at = Date.now();
            if (this.handlers.onQueuePause) {
              await this.handlers.onQueuePause();
            }
            return { content: [{ type: 'text', text: JSON.stringify({ ok: true, paused_at }) }] };
          }

          case 'speclang_queue_resume': {
            const resumed_at = Date.now();
            if (this.handlers.onQueueResume) {
              await this.handlers.onQueueResume();
            }
            return { content: [{ type: 'text', text: JSON.stringify({ ok: true, resumed_at }) }] };
          }

          case 'speclang_worktree_create': {
            const params = args as { name: string; base_commit?: string };
            let result = { path: '', ready: false };
            if (this.handlers.onWorktreeCreate) {
              result = await this.handlers.onWorktreeCreate(params);
            }
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
          }

          case 'speclang_worktree_test': {
            const params = args as { worktree: string; filter?: string };
            let result = { test_id: '', status: 'running' };
            if (this.handlers.onWorktreeTest) {
              result = await this.handlers.onWorktreeTest(params);
            }
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
          }

          case 'speclang_worktree_deploy': {
            const params = args as { worktree: string; target: string };
            let result = { deployment_id: '', status: 'pending' };
            if (this.handlers.onWorktreeDeploy) {
              result = await this.handlers.onWorktreeDeploy(params);
            }
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
          }

          case 'speclang_agent_control': {
            const params = args as { session: string; command: string };
            let result = { ok: false, new_status: 'unknown' };
            if (this.handlers.onAgentControl) {
              result = await this.handlers.onAgentControl(params);
            }
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    });
  }

  public async start(): Promise<void> {
    if (!this.server) {
      await this.initialize();
    }
    const transport = new StdioServerTransport();
    await this.server!.connect(transport);
    console.log('[MCPTools] MCP Server started on stdio');
  }

  public async stop(): Promise<void> {
    if (this.server) {
      await this.server.close();
      console.log('[MCPTools] MCP Server stopped');
    }
  }
}
