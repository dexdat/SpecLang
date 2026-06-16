/**
speclang-header lines:5
id: @specs/dashboard
version: 1.0.0
layer: 5
 */
export interface GitStatus {
    modified: string[];
    staged: string[];
    untracked: string[];
    branch: string;
    ahead: number;
    behind: number;
}
export interface GitCommit {
    sha: string;
    message: string;
    author: string;
    timestamp: string;
    files: string[];
}
export interface GitDiff {
    sha: string;
    files: Array<{
        path: string;
        additions: number;
        deletions: number;
        content: string;
    }>;
}
export interface GitIntegrationState {
    status: GitStatus | null;
    stagedFiles: Set<string>;
    isLoading: boolean;
    error: string | null;
}
export interface GitIntegrationOptions {
    onToast?: (message: string, type?: 'info' | 'error' | 'success') => void;
}
/**
 * useGitIntegration hook
 *
 * Provides git integration functionality including:
 * - refreshStatus: Get current git status
 * - stageFile/unstageFile: Manage staged files
 * - commit: Commit staged changes
 * - getHistory: Get commit history
 * - showDiff: Show commit diff
 * - revert: Revert a commit
 * - createBranch/switchBranch: Branch management
 * - resolveConflict: Handle merge conflicts
 */
export declare function useGitIntegration(options?: GitIntegrationOptions): {
    status: any;
    stagedFiles: any;
    isLoading: any;
    error: any;
    refreshStatus: any;
    stageFile: any;
    unstageFile: any;
    toggleFile: any;
    stageAll: any;
    unstageAll: any;
    commit: any;
    getHistory: any;
    showDiff: any;
    revert: any;
    createBranch: any;
    switchBranch: any;
    resolveConflict: any;
};
export default useGitIntegration;
//# sourceMappingURL=git-integration.d.ts.map