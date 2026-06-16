"use strict";
/**
 * SPECLANG-GENERATED: Pipeline Tools
 * Source: @speclang/tools
 *
 * Pipeline operations for batch processing
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
exports.clearPipelinesTool = exports.pipelineResultTool = exports.cancelPipelineTool = exports.listPipelinesTool = exports.pipelineStatusTool = exports.runPipelineTool = void 0;
const crypto = __importStar(require("crypto"));
const pipelines = new Map();
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Generate pipeline ID
 */
function generatePipelineId() {
    return `pipeline-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}
/**
 * Process pipeline
 */
async function processPipeline(pipeline) {
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
    }
    catch (error) {
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
exports.runPipelineTool = {
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
    handler: async (input, context) => {
        const { name, input: pipelineInput } = input;
        console.log(`[PipelineTools] Running pipeline: ${name}`);
        try {
            const pipelineId = generatePipelineId();
            const pipeline = {
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Pipeline status tool - check pipeline status
 */
exports.pipelineStatusTool = {
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
    handler: async (input, _context) => {
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * List pipelines tool - list all pipelines
 */
exports.listPipelinesTool = {
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
    handler: async (input, _context) => {
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Cancel pipeline tool - cancel a running pipeline
 */
exports.cancelPipelineTool = {
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
    handler: async (input, _context) => {
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Get pipeline result tool - get pipeline result
 */
exports.pipelineResultTool = {
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
    handler: async (input, _context) => {
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Clear completed pipelines tool - clean up old pipelines
 */
exports.clearPipelinesTool = {
    name: 'speclang_clear_pipelines',
    description: 'Clear completed pipelines',
    category: 'pipeline',
    requiresOwnership: false,
    auditLog: true,
    inputSchema: {
        type: 'object',
        properties: {},
    },
    handler: async (_input, _context) => {
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
//# sourceMappingURL=pipeline-tools.js.map