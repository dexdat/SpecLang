/**
 * Hook Execution System for Pipeline
 *
 * SPECLANG-GENERATED: @speclang/pipeline
 * Generated from: @speclang/pipeline/hooks
 */
import { Hook, HookResult, HookContext } from './types';
export declare class HookExecutor {
    private verbose;
    constructor(verbose?: boolean);
    execute(hook: Hook): Promise<HookResult>;
    executeMultiple(hooks: Hook[]): Promise<HookResult[]>;
    private runScript;
}
export declare const BuiltInHooks: {
    echo: (message: string) => string;
    notifyDiscord: (webhookUrl: string, message: string) => string;
    notifySlack: (webhookUrl: string, message: string) => string;
    logToFile: (filePath: string, message: string) => string;
    notifyOrchestrator: (message: string) => string;
};
export declare function createHookContext(stageName?: string, stageSuccess?: boolean, stageOutput?: string, pipelineResult?: unknown): HookContext;
//# sourceMappingURL=hooks.d.ts.map