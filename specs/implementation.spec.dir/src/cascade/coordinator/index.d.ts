import { CascadeState, TreeNode } from './dependency.js';
export interface VerificationGate {
    name: string;
    check: () => Promise<GateResult>;
}
export interface GateResult {
    passed: boolean;
    message: string;
    details?: string[];
}
export interface CoordinatorOptions {
    maxDepth?: number;
    verbose?: boolean;
    skipTests?: boolean;
}
export declare class CascadeCoordinator {
    private tracker;
    private state;
    private options;
    private gates;
    constructor(indexPath?: string, options?: CoordinatorOptions);
    private setupGates;
    private runReferenceValidation;
    private runCompilationCheck;
    private runTestExecution;
    runGate(gateName: string): Promise<GateResult>;
    runAllGates(): Promise<Record<string, GateResult>>;
    start(triggerFile: string): void;
    processTree(treeType: 'spec' | 'code' | 'test' | 'doc', onNode?: (node: TreeNode) => Promise<void>): Promise<{
        processed: number;
        failed: number;
    }>;
    cascadeFrom(triggerId: string): Promise<CascadeResult>;
    canContinue(): boolean;
    pause(): void;
    resume(): void;
    getState(): CascadeState;
    saveState(): void;
    loadState(): boolean;
}
export interface CascadeResult {
    success: boolean;
    stepsCompleted: number;
    gatesPassed: number;
    gatesFailed: number;
    errors: string[];
}
//# sourceMappingURL=index.d.ts.map