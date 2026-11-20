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
    /**
     * ARCH-003: Get all nodes that depend (directly or transitively) on the
     * given triggerId. Used by the swarm to fan out from a trigger file to
     * its full dependent tree (codegen, tests, docs).
     *
     * Distinct from `getOrderedForCascade()` which walks the dependency
     * list (downstream), not the dependent list (upstream). For "a spec
     * changed — what files must regenerate?" we need dependents.
     */
    getDependentsTree(triggerId: string): TreeNode[];
    /**
     * ARCH-003: Partition an ordered node list into parallel "waves".
     *
     * Wave 0 contains all nodes whose `layer` is the minimum layer in the
     * input. Wave 1 contains the next layer up, etc. Nodes in the same wave
     * have no inter-dependencies at the layer level — they can be invoked
     * concurrently by `AgentInvoker.invokeMany()`.
     *
     * Example:
     *   Input:  [a(0), b(0), c(1), d(1), e(2)]
     *   Output: [[a, b], [c, d], [e]]
     *
     * Within a layer, original ordering is preserved (stable partition by
     * occurrence order).
     */
    partitionByDepth(nodes: TreeNode[]): TreeNode[][];
    saveState(state: CascadeState): void;
    loadState(): CascadeState | null;
    createInitialState(triggerFile: string, maxDepth?: number): CascadeState;
}
//# sourceMappingURL=dependency.d.ts.map