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
export interface UseGitIntegrationOptions {
    autoRefresh?: boolean;
    refreshInterval?: number;
    onToast?: (message: string, type?: 'info' | 'error' | 'success') => void;
}
export interface UseGitIntegrationReturn {
    status: GitStatus | null;
    stagedFiles: Set<string>;
    isLoading: boolean;
    error: Error | null;
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
}
/**
 * useGitIntegration React hook
 */
export declare function useGitIntegration(options?: UseGitIntegrationOptions): UseGitIntegrationReturn;
export default useGitIntegration;
//# sourceMappingURL=useGitIntegration.d.ts.map