/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/workflow.dir/daily-use.spec.md
 * Blocks: @workflow/review, @workflow/review-commands
 * Generated: 2026-02-22
 *
 * Edit the spec, not this file.
 */
/**
 * Change information
 */
export interface FileChange {
    path: string;
    status: 'added' | 'modified' | 'deleted';
    additions?: number;
    deletions?: number;
}
/**
 * Spec change information
 */
export interface SpecChange {
    id: string;
    path: string;
    changes: string[];
}
/**
 * Complete change summary
 */
export interface ChangeSummary {
    specsModified: SpecChange[];
    codeGenerated: FileChange[];
    testsAdded: FileChange[];
    lastConvergence?: string;
}
/**
 * Status output format
 */
export interface StatusOutput {
    daemon: {
        running: boolean;
        pid?: number;
        uptime?: number;
    };
    cascade: {
        running: boolean;
        paused: boolean;
        activeAgents: number;
        lastConvergence?: string;
    };
    locks: {
        count: number;
        files: string[];
    };
    project: {
        path: string;
        version: string;
    };
}
/**
 * Get changes since last convergence
 *
 * @block:workflow/review-commands @kind:code
 */
export declare function getChanges(projectPath: string): ChangeSummary;
/**
 * Show spec diff for a given spec
 *
 * @block:workflow/review-commands @kind:code
 */
export declare function showSpecDiff(specId: string, projectPath: string): string;
/**
 * Show status of daemon and cascade
 *
 * @block:workflow/review @kind:entity
 */
export declare function showStatus(json?: boolean): Promise<void>;
/**
 * Format changes for display
 */
export declare function formatChanges(changes: ChangeSummary): string;
//# sourceMappingURL=review.d.ts.map