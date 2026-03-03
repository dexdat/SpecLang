export interface CascadeState {
    cascade_id: string;
    depth: number;
    max_depth: number;
    status: 'running' | 'paused' | 'completed' | 'failed';
    trigger_file: string;
    current_agent: string;
    agents_invoked: AgentInvocation[];
    verification_results: VerificationResult[];
    depth_by_tree: Record<string, number>;
}
export interface AgentInvocation {
    agent: string;
    timestamp: string;
    result: 'success' | 'failure';
    files_modified: string[];
}
export interface VerificationResult {
    step: number;
    timestamp: string;
    checks: {
        compilation: {
            status: string;
            files_checked: number;
        };
        references: {
            status: string;
            broken_refs: number;
        };
        tests: {
            status: string;
            passed: number;
            failed: number;
        };
    };
}
export type CascadeStatus = 'running' | 'paused' | 'completed' | 'failed';
export declare function createInitialState(triggerFile: string, maxDepth?: number): CascadeState;
//# sourceMappingURL=state.d.ts.map