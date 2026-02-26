/**
speclang-header lines:5
id: @specs/tools
version: 1.0.0
layer: 5
 */

/**
 * SPECLANG-GENERATED: Cascade Tools
 * Source: @speclang/tools
 * 
 * Cascade operations for reactive updates
 */

import * as crypto from 'crypto';
import {
  Tool,
  ToolContext,
  ToolResult,
  TriggerCascadeInput,
  TriggerCascadeOutput,
  CascadeStatusInput,
  CascadeStatusOutput,
} from './types.js';

// ============================================================================
// CASCADE STATE (in-memory for now)
// ============================================================================

interface CascadeState {
  active: boolean;
  depth: number;
  filesChanged: number;
  lastChange: number | null;
  cascadeId: string | null;
  queue: string[];
}

const cascadeState: CascadeState = {
  active: false,
  depth: 0,
  filesChanged: 0,
  lastChange: null,
  cascadeId: null,
  queue: [],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique cascade ID
 */
function generateCascadeId(): string {
  return `cascade-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Trigger cascade via daemon
 */
async function triggerDaemonCascade(path: string, cascadeId: string): Promise<void> {
  // If daemon is available, send event
  if (globalThis.__speclangDaemon) {
    await globalThis.__speclangDaemon.queueEvent({
      type: 'cascade',
      path,
      cascadeId,
    });
  }
}

/**
 * Simulate cascade processing
 */
async function processCascade(path: string, cascadeId: string): Promise<void> {
  cascadeState.active = true;
  cascadeState.cascadeId = cascadeId;

  console.log(`[CascadeTools] Processing cascade: ${cascadeId} for ${path}`);

  // Simulate processing
  cascadeState.depth = 0;
  cascadeState.filesChanged = 1;
  cascadeState.lastChange = Date.now();

  // Process dependent files
  // In real implementation, this would trigger code generation
  cascadeState.depth++;

  cascadeState.active = false;
}

// ============================================================================
// CASCADE TOOLS
// ============================================================================

/**
 * Trigger cascade tool - manually trigger cascade from a file
 */
export const triggerCascadeTool: Tool<TriggerCascadeInput, TriggerCascadeOutput> = {
  name: 'speclang_trigger_cascade',
  description: 'Manually trigger cascade from a file',
  category: 'cascade',
  requiresOwnership: false,
  auditLog: true,
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path to trigger cascade from' },
    },
    required: ['path'],
  },
  handler: async (
    input: TriggerCascadeInput,
    context: ToolContext
  ): Promise<ToolResult<TriggerCascadeOutput>> => {
    const { path } = input;

    console.log(`[CascadeTools] Triggering cascade: ${path}`);

    try {
      const cascadeId = generateCascadeId();

      // Queue cascade event
      cascadeState.queue.push(path);

      // Try to trigger via daemon if available
      if (context.daemon) {
        await context.daemon.queueEvent({
          type: 'cascade',
          path,
          cascadeId,
        });
      }

      // Process immediately for simple case
      await processCascade(path, cascadeId);

      return {
        success: true,
        data: { cascade_id: cascadeId, status: 'queued' },
        sideEffects: ['cascade_triggered'],
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Cascade status tool - check current cascade status
 */
export const cascadeStatusTool: Tool<CascadeStatusInput, CascadeStatusOutput> = {
  name: 'speclang_cascade_status',
  description: 'Check current cascade status',
  category: 'cascade',
  requiresOwnership: false,
  auditLog: false,
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async (
    _input: CascadeStatusInput,
    context: ToolContext
  ): Promise<ToolResult<CascadeStatusOutput>> => {
    console.log(`[CascadeTools] Getting cascade status`);

    try {
      // Get status from daemon if available
      if (context.daemon) {
        const status = await context.daemon.getCascadeStatus();
        return {
          success: true,
          data: {
            active: status.active,
            depth: status.depth,
            files_changed: status.filesChanged,
            last_change: status.lastChange,
          },
        };
      }

      // Return in-memory status
      return {
        success: true,
        data: {
          active: cascadeState.active,
          depth: cascadeState.depth,
          files_changed: cascadeState.filesChanged,
          last_change: cascadeState.lastChange,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Queue cascade tool - add to cascade queue without immediate processing
 */
export const queueCascadeTool: Tool<{ paths: string[] }, { queued: number }> = {
  name: 'speclang_queue_cascade',
  description: 'Add files to cascade queue',
  category: 'cascade',
  requiresOwnership: false,
  auditLog: true,
  inputSchema: {
    type: 'object',
    properties: {
      paths: { type: 'array', items: { type: 'string' }, description: 'File paths to queue' },
    },
    required: ['paths'],
  },
  handler: async (
    input: { paths: string[] },
    context: ToolContext
  ): Promise<ToolResult<{ queued: number }>> => {
    console.log(`[CascadeTools] Queueing cascade for ${input.paths.length} files`);

    try {
      for (const path of input.paths) {
        if (!cascadeState.queue.includes(path)) {
          cascadeState.queue.push(path);
        }
      }

      return {
        success: true,
        data: { queued: input.paths.length },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Get cascade queue tool - get pending cascade items
 */
export const getCascadeQueueTool: Tool<{}, { queue: string[]; count: number }> = {
  name: 'speclang_get_cascade_queue',
  description: 'Get pending cascade queue',
  category: 'cascade',
  requiresOwnership: false,
  auditLog: false,
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async (
    _input: {},
    context: ToolContext
  ): Promise<ToolResult<{ queue: string[]; count: number }>> => {
    console.log(`[CascadeTools] Getting cascade queue`);

    return {
      success: true,
      data: {
        queue: [...cascadeState.queue],
        count: cascadeState.queue.length,
      },
    };
  },
};

/**
 * Clear cascade queue tool - clear pending cascade items
 */
export const clearCascadeQueueTool: Tool<{}, { cleared: number }> = {
  name: 'speclang_clear_cascade_queue',
  description: 'Clear pending cascade queue',
  category: 'cascade',
  requiresOwnership: true,
  auditLog: true,
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async (
    _input: {},
    context: ToolContext
  ): Promise<ToolResult<{ cleared: number }>> => {
    console.log(`[CascadeTools] Clearing cascade queue`);

    const count = cascadeState.queue.length;
    cascadeState.queue = [];

    return {
      success: true,
      data: { cleared: count },
      sideEffects: ['queue_cleared'],
    };
  },
};

/**
 * Process cascade queue tool - process all queued cascades
 */
export const processCascadeQueueTool: Tool<{}, { processed: number; cascade_id: string }> = {
  name: 'speclang_process_cascade_queue',
  description: 'Process all queued cascade items',
  category: 'cascade',
  requiresOwnership: false,
  auditLog: true,
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async (
    _input: {},
    context: ToolContext
  ): Promise<ToolResult<{ processed: number; cascade_id: string }>> => {
    console.log(`[CascadeTools] Processing cascade queue`);

    if (cascadeState.queue.length === 0) {
      return {
        success: true,
        data: { processed: 0, cascade_id: '' },
      };
    }

    const cascadeId = generateCascadeId();
    const count = cascadeState.queue.length;

    cascadeState.active = true;
    cascadeState.cascadeId = cascadeId;

    // Process each item in queue
    for (const path of cascadeState.queue) {
      cascadeState.filesChanged++;
      cascadeState.lastChange = Date.now();
      cascadeState.depth++;
    }

    // Clear queue
    cascadeState.queue = [];
    cascadeState.active = false;

    return {
      success: true,
      data: { processed: count, cascade_id: cascadeId },
      sideEffects: ['cascades_processed'],
    };
  },
};
