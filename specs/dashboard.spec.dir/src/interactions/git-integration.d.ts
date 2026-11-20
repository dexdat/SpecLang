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
    status: GitStatus;
    stagedFiles: Set<string>;
    isLoading: boolean;
    error: string;
    refreshStatus: () => Promise<void>;
    stageFile: (file: string) => void;
    unstageFile: (file: string) => void;
    toggleFile: (file: string) => void;
    stageAll: () => void;
    unstageAll: () => void;
    commit: (message: string) => Promise<void>;
    getHistory: (filter?: {
        speclangOnly?: boolean;
    }) => Promise<GitCommit[]>;
    showDiff: (commitSha: string) => Promise<GitDiff | null>;
    revert: (commitSha: string) => Promise<void>;
    createBranch: (name: string) => Promise<void>;
    switchBranch: (name: string) => Promise<void>;
    resolveConflict: (file: string, resolution: 'ours' | 'theirs' | 'manual', content?: string) => Promise<void>;
};
export default useGitIntegration;
//# sourceMappingURL=git-integration.d.ts.map