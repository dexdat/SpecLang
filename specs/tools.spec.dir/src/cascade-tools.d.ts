/**
 * SPECLANG-GENERATED: Cascade Tools
 * Source: @speclang/tools
 *
 * Cascade operations for reactive updates
 */
import { Tool, TriggerCascadeInput, TriggerCascadeOutput, CascadeStatusInput, CascadeStatusOutput } from './types.js';
/**
 * Trigger cascade tool - manually trigger cascade from a file
 */
export declare const triggerCascadeTool: Tool<TriggerCascadeInput, TriggerCascadeOutput>;
/**
 * Cascade status tool - check current cascade status
 */
export declare const cascadeStatusTool: Tool<CascadeStatusInput, CascadeStatusOutput>;
/**
 * Queue cascade tool - add to cascade queue without immediate processing
 */
export declare const queueCascadeTool: Tool<{
    paths: string[];
}, {
    queued: number;
}>;
/**
 * Get cascade queue tool - get pending cascade items
 */
export declare const getCascadeQueueTool: Tool<{}, {
    queue: string[];
    count: number;
}>;
/**
 * Clear cascade queue tool - clear pending cascade items
 */
export declare const clearCascadeQueueTool: Tool<{}, {
    cleared: number;
}>;
/**
 * Process cascade queue tool - process all queued cascades
 */
export declare const processCascadeQueueTool: Tool<{}, {
    processed: number;
    cascade_id: string;
}>;
//# sourceMappingURL=cascade-tools.d.ts.map