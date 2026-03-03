"use strict";
/**
 * SPECLANG-GENERATED: Cascade Tools
 * Source: @speclang/tools
 *
 * Cascade operations for reactive updates
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
exports.processCascadeQueueTool = exports.clearCascadeQueueTool = exports.getCascadeQueueTool = exports.queueCascadeTool = exports.cascadeStatusTool = exports.triggerCascadeTool = void 0;
const crypto = __importStar(require("crypto"));
const cascadeState = {
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
function generateCascadeId() {
    return `cascade-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}
/**
 * Trigger cascade via daemon
 */
async function triggerDaemonCascade(path, cascadeId) {
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
async function processCascade(path, cascadeId) {
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
exports.triggerCascadeTool = {
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
    handler: async (input, context) => {
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Cascade status tool - check current cascade status
 */
exports.cascadeStatusTool = {
    name: 'speclang_cascade_status',
    description: 'Check current cascade status',
    category: 'cascade',
    requiresOwnership: false,
    auditLog: false,
    inputSchema: {
        type: 'object',
        properties: {},
    },
    handler: async (_input, context) => {
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Queue cascade tool - add to cascade queue without immediate processing
 */
exports.queueCascadeTool = {
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
    handler: async (input, context) => {
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Get cascade queue tool - get pending cascade items
 */
exports.getCascadeQueueTool = {
    name: 'speclang_get_cascade_queue',
    description: 'Get pending cascade queue',
    category: 'cascade',
    requiresOwnership: false,
    auditLog: false,
    inputSchema: {
        type: 'object',
        properties: {},
    },
    handler: async (_input, context) => {
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
exports.clearCascadeQueueTool = {
    name: 'speclang_clear_cascade_queue',
    description: 'Clear pending cascade queue',
    category: 'cascade',
    requiresOwnership: true,
    auditLog: true,
    inputSchema: {
        type: 'object',
        properties: {},
    },
    handler: async (_input, context) => {
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
exports.processCascadeQueueTool = {
    name: 'speclang_process_cascade_queue',
    description: 'Process all queued cascade items',
    category: 'cascade',
    requiresOwnership: false,
    auditLog: true,
    inputSchema: {
        type: 'object',
        properties: {},
    },
    handler: async (_input, context) => {
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
//# sourceMappingURL=cascade-tools.js.map