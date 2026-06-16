/**
 * SPECLANG-GENERATED: Pipeline Tools
 * Source: @speclang/tools
 *
 * Pipeline operations for batch processing
 */
import { Tool, RunPipelineInput, RunPipelineOutput, PipelineStatusInput, PipelineStatusOutput } from './types.js';
/**
 * Run pipeline tool - run a named pipeline
 */
export declare const runPipelineTool: Tool<RunPipelineInput, RunPipelineOutput>;
/**
 * Pipeline status tool - check pipeline status
 */
export declare const pipelineStatusTool: Tool<PipelineStatusInput, PipelineStatusOutput>;
/**
 * List pipelines tool - list all pipelines
 */
export declare const listPipelinesTool: Tool<{
    status?: string;
}, {
    pipelines: any[];
}>;
/**
 * Cancel pipeline tool - cancel a running pipeline
 */
export declare const cancelPipelineTool: Tool<{
    pipeline_id: string;
}, {
    cancelled: boolean;
}>;
/**
 * Get pipeline result tool - get pipeline result
 */
export declare const pipelineResultTool: Tool<{
    pipeline_id: string;
}, {
    result?: any;
    error?: string;
}>;
/**
 * Clear completed pipelines tool - clean up old pipelines
 */
export declare const clearPipelinesTool: Tool<{}, {
    cleared: number;
}>;
//# sourceMappingURL=pipeline-tools.d.ts.map