/**
 * Worktree Management for speclangd Enterprise
 *
 * Generated from: @speclang/mcp-daemon/config
 */
export interface WorktreeSpec {
    name: string;
    path: string;
    baseCommit?: string;
    createdAt: number;
    ready: boolean;
}
export interface TestResult {
    test_id: string;
    status: 'running' | 'passed' | 'failed';
    passed?: number;
    failed?: number;
    duration?: number;
    errors?: string[];
}
export interface DeploymentResult {
    deployment_id: string;
    status: 'pending' | 'deploying' | 'deployed' | 'failed';
    target: string;
    timestamp: number;
}
export declare class WorktreeManager {
    private basePath;
    private worktrees;
    constructor(basePath?: string);
    initialize(): Promise<void>;
    create(name: string, baseCommit?: string): Promise<WorktreeSpec>;
    remove(name: string): Promise<void>;
    list(): Promise<WorktreeSpec[]>;
    get(name: string): WorktreeSpec | undefined;
    runTests(name: string, filter?: string): Promise<TestResult>;
    deploy(name: string, target: string): Promise<DeploymentResult>;
    merge(name: string): Promise<{
        ok: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=worktree.d.ts.map