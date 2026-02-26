/**
speclang-header lines:5
id: @specs/tools
version: 1.0.0
layer: 5
 */

/**
 * SPECLANG-GENERATED: Pipeline Tools
 * Source: @speclang/tools
 * 
 * Pipeline operations for batch processing
 */

import * as crypto from 'crypto';
import {
  Tool,
  ToolContext,
  ToolResult,
  RunPipelineInput,
  RunPipelineOutput,
  PipelineStatusInput,
  PipelineStatusOutput,
} from './types.js';

// ============================================================================
// PIPELINE STATE
// ============================================================================

interface Pipeline {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  created: number;
  started?: number;
  completed?: number;
}

const pipelines: Map<string, Pipeline> = new Map();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate pipeline ID
 */
function generatePipelineId(): string {
  return `pipeline-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Process pipeline
 */
async function processPipeline(pipeline: Pipeline): Promise<void> {
  pipeline.status = 'running';
  pipeline.started = Date.now();

  console.log(`[PipelineTools] Running pipeline: ${pipeline.name}`);

  try {
    // Simulate pipeline processing
    // In real implementation, this would run actual steps
    for (let i = 0; i <= 100; i += 10) {
      pipeline.progress = i;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    pipeline.status = 'completed';
    pipeline.completed = Date.now();
    pipeline.result = { success: true, steps_completed: 10 };
  } catch (error: any) {
    pipeline.status = 'failed';
    pipeline.error = error.message;
    pipeline.completed = Date.now();
  }
}

// ============================================================================
// PIPELINE TOOLS
// ============================================================================

/**
 * Run pipeline tool - run a named pipeline
 */
export const runPipelineTool: Tool<RunPipelineInput, RunPipelineOutput> = {
  name: 'speclang_run_pipeline',
  description: 'Run a named pipeline',
  category: 'pipeline',
  requiresOwnership: false,
  auditLog: true,
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Pipeline name' },
      input: { type: 'object', description: 'Pipeline input data' },
    },
    required: ['name'],
  },
  handler: async (
    input: RunPipelineInput,
    context: ToolContext
  ): Promise<ToolResult<RunPipelineOutput>> => {
    const { name, input: pipelineInput } = input;

    console.log(`[PipelineTools] Running pipeline: ${name}`);

    try {
      const pipelineId = generatePipelineId();

      const pipeline: Pipeline = {
        id: pipelineId,
        name,
        status: 'pending',
        progress: 0,
        created: Date.now(),
      };

      pipelines.set(pipelineId, pipeline);

      // Run pipeline in background
      processPipeline(pipeline).catch((err) => {
        console.error(`[PipelineTools] Pipeline error: ${err.message}`);
      });

      return {
        success: true,
        data: { pipeline_id: pipelineId, status: 'started' },
        sideEffects: ['pipeline_started'],
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Pipeline status tool - check pipeline status
 */
export const pipelineStatusTool: Tool<PipelineStatusInput, PipelineStatusOutput> = {
  name: 'speclang_pipeline_status',
  description: 'Check pipeline status',
  category: 'pipeline',
  requiresOwnership: false,
  auditLog: false,
  inputSchema: {
    type: 'object',
    properties: {
      pipeline_id: { type: 'string', description: 'Pipeline ID' },
    },
    required: ['pipeline_id'],
  },
  handler: async (
    input: PipelineStatusInput,
    _context: ToolContext
  ): Promise<ToolResult<PipelineStatusOutput>> => {
    const { pipeline_id } = input;

    console.log(`[PipelineTools] Getting pipeline status: ${pipeline_id}`);

    try {
      const pipeline = pipelines.get(pipeline_id);

      if (!pipeline) {
        return { success: false, error: 'Pipeline not found' };
      }

      return {
        success: true,
        data: {
          status: pipeline.status,
          progress: pipeline.progress,
          result: pipeline.result,
          error: pipeline.error,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * List pipelines tool - list all pipelines
 */
export const listPipelinesTool: Tool<{ status?: string }, { pipelines: any[] }> = {
  name: 'speclang_list_pipelines',
  description: 'List all pipelines',
  category: 'pipeline',
  requiresOwnership: false,
  auditLog: false,
  inputSchema: {
    type: 'object',
    properties: {
      status: { type: 'string', description: 'Filter by status' },
    },
  },
  handler: async (
    input: { status?: string },
    _context: ToolContext
  ): Promise<ToolResult<{ pipelines: any[] }>> => {
    console.log(`[PipelineTools] Listing pipelines`);

    try {
      let result = Array.from(pipelines.values());

      if (input.status) {
        result = result.filter((p) => p.status === input.status);
      }

      return {
        success: true,
        data: {
          pipelines: result.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            progress: p.progress,
            created: p.created,
            started: p.started,
            completed: p.completed,
          })),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Cancel pipeline tool - cancel a running pipeline
 */
export const cancelPipelineTool: Tool<{ pipeline_id: string }, { cancelled: boolean }> = {
  name: 'speclang_cancel_pipeline',
  description: 'Cancel a running pipeline',
  category: 'pipeline',
  requiresOwnership: false,
  auditLog: true,
  inputSchema: {
    type: 'object',
    properties: {
      pipeline_id: { type: 'string', description: 'Pipeline ID' },
    },
    required: ['pipeline_id'],
  },
  handler: async (
    input: { pipeline_id: string },
    _context: ToolContext
  ): Promise<ToolResult<{ cancelled: boolean }>> => {
    const { pipeline_id } = input;

    console.log(`[PipelineTools] Cancelling pipeline: ${pipeline_id}`);

    try {
      const pipeline = pipelines.get(pipeline_id);

      if (!pipeline) {
        return { success: false, error: 'Pipeline not found' };
      }

      if (pipeline.status !== 'running' && pipeline.status !== 'pending') {
        return { success: false, error: 'Pipeline is not running' };
      }

      pipeline.status = 'failed';
      pipeline.error = 'Cancelled by user';
      pipeline.completed = Date.now();

      return { success: true, data: { cancelled: true } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Get pipeline result tool - get pipeline result
 */
export const pipelineResultTool: Tool<{ pipeline_id: string }, { result?: any; error?: string }> = {
  name: 'speclang_pipeline_result',
  description: 'Get pipeline result',
  category: 'pipeline',
  requiresOwnership: false,
  auditLog: false,
  inputSchema: {
    type: 'object',
    properties: {
      pipeline_id: { type: 'string', description: 'Pipeline ID' },
    },
    required: ['pipeline_id'],
  },
  handler: async (
    input: { pipeline_id: string },
    _context: ToolContext
  ): Promise<ToolResult<{ result?: any; error?: string }>> => {
    const { pipeline_id } = input;

    console.log(`[PipelineTools] Getting pipeline result: ${pipeline_id}`);

    try {
      const pipeline = pipelines.get(pipeline_id);

      if (!pipeline) {
        return { success: false, error: 'Pipeline not found' };
      }

      if (pipeline.status !== 'completed' && pipeline.status !== 'failed') {
        return { success: false, error: 'Pipeline not yet completed' };
      }

      return {
        success: true,
        data: {
          result: pipeline.result,
          error: pipeline.error,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Clear completed pipelines tool - clean up old pipelines
 */
export const clearPipelinesTool: Tool<{}, { cleared: number }> = {
  name: 'speclang_clear_pipelines',
  description: 'Clear completed pipelines',
  category: 'pipeline',
  requiresOwnership: false,
  auditLog: true,
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async (
    _input: {},
    _context: ToolContext
  ): Promise<ToolResult<{ cleared: number }>> => {
    console.log(`[PipelineTools] Clearing completed pipelines`);

    let cleared = 0;

    for (const [id, pipeline] of Array.from(pipelines.entries())) {
      if (pipeline.status === 'completed' || pipeline.status === 'failed') {
        pipelines.delete(id);
        cleared++;
      }
    }

    return { success: true, data: { cleared } };
  },
};
