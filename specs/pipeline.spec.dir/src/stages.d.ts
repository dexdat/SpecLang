/**
 * Stage Execution for Pipeline
 *
 * SPECLANG-GENERATED: @speclang/pipeline
 * Generated from: @speclang/pipeline/build
 */
import { Stage, StageResult, HookContext } from './types';
export declare class StageExecutor {
    private hookExecutor;
    private verbose;
    constructor(verbose?: boolean);
    execute(stage: Stage, context: HookContext, dryRun?: boolean): Promise<StageResult>;
    runCommand(command: string): Promise<{
        code: number;
        stdout: string;
        stderr: string;
    }>;
}
export declare function areDependenciesMet(stage: Stage, completedStages: Set<string>): boolean;
export declare function orderStages(stages: Stage[]): Stage[];
//# sourceMappingURL=stages.d.ts.map