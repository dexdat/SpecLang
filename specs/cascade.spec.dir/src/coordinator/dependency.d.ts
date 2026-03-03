export interface TreeNode {
    id: string;
    layer: number;
    type: 'spec' | 'code' | 'test' | 'doc';
    filePath: string;
    dependencies: string[];
    children: TreeNode[];
}
export interface DependencyGraph {
    nodes: Map<string, TreeNode>;
    trees: Map<string, TreeNode[]>;
}
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
export declare class DependencyTracker {
    private graph;
    private indexPath;
    constructor(indexPath?: string);
    loadIndex(): void;
    private buildGraph;
    private determineType;
    private organizeIntoTrees;
    getDependents(specId: string): TreeNode[];
    getDependencies(specId: string): string[];
    getTree(type: string): TreeNode[];
    getNode(specId: string): TreeNode | undefined;
    getNodesByLayer(layer: number): TreeNode[];
    getOrderedForCascade(triggerId: string): TreeNode[];
    saveState(state: CascadeState): void;
    loadState(): CascadeState | null;
    createInitialState(triggerFile: string, maxDepth?: number): CascadeState;
}
//# sourceMappingURL=dependency.d.ts.map