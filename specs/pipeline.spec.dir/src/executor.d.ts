/**
 * Pipeline Executor
 *
 * SPECLANG-GENERATED: @speclang/pipeline
 * Generated from: @speclang/pipeline/build
 */
import { EventEmitter } from 'events';
import { PipelineConfig, PipelineResult, StageResult, ExecutorOptions } from './types';
import { ConvergenceResult } from '../daemon/types';
export declare class PipelineExecutor extends EventEmitter {
    private configManager;
    private stageExecutor;
    private recoveryExecutor;
    private options;
    private stageStates;
    constructor(options?: ExecutorOptions);
    /**
     * Execute the full pipeline
     */
    execute(convergence?: ConvergenceResult): Promise<PipelineResult>;
    /**
     * Execute a single stage by name
     */
    executeStage(stageName: string): Promise<StageResult | null>;
    /**
     * Evaluate a condition for stage execution
     */
    private evaluateCondition;
    /**
     * Execute success actions (like git commit)
     */
    private executeSuccessActions;
    private runGitCommand;
    private runShellCommand;
    /**
     * Emit pipeline event
     */
    private emitEvent;
    /**
     * Get current stage states
     */
    getStageStates(): Map<string, 'pending' | 'running' | 'completed' | 'failed' | 'skipped'>;
    /**
     * Get configuration
     */
    getConfig(): Promise<PipelineConfig>;
}
export declare function createPipelineExecutor(options?: ExecutorOptions): Promise<PipelineExecutor>;
//# sourceMappingURL=executor.d.ts.map