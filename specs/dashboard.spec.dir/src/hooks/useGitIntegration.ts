/**
speclang-header lines:5
id: @specs/dashboard
version: 1.0.0
layer: 5
 */

// SPECLANG-GENERATED: @specs/ui.dir/interactions.spec.md
// DO NOT EDIT MANUALLY
// Source: @ui/interactions-git-integration

/**
 * useGitIntegration Hook
 * 
 * React hook for git operations.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

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
  // State
  status: GitStatus | null;
  stagedFiles: Set<string>;
  isLoading: boolean;
  error: Error | null;
  
  // Status
  refreshStatus: () => Promise<void>;
  
  // Staging
  stageFile: (file: string) => void;
  unstageFile: (file: string) => void;
  toggleFile: (file: string) => void;
  stageAll: () => void;
  unstageAll: () => void;
  
  // Commit
  commit: (message: string) => Promise<void>;
  
  // History
  getHistory: (filter?: { speclangOnly?: boolean }) => Promise<GitCommit[]>;
  showDiff: (commitSha: string) => Promise<GitDiff | null>;
  revert: (commitSha: string) => Promise<void>;
  
  // Branches
  createBranch: (name: string) => Promise<void>;
  switchBranch: (name: string) => Promise<void>;
  
  // Conflicts
  resolveConflict: (file: string, resolution: 'ours' | 'theirs' | 'manual', content?: string) => Promise<void>;
}

// Mock MCP client - would be injected in real implementation
const mcpClient = {
  call: async (tool: string, params: Record<string, unknown>): Promise<unknown> => {
    console.log(`[MCP] Calling ${tool}:`, params);
    return { success: true };
  }
};

/**
 * useGitIntegration React hook
 */
export function useGitIntegration(options: UseGitIntegrationOptions = {}): UseGitIntegrationReturn {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    onToast
  } = options;

  const [status, setStatus] = useState<GitStatus | null>(null);
  const [stagedFiles, setStagedFiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Toast notification
  const toast = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    if (onToast) {
      onToast(message, type);
    } else {
      console.log(`[Toast] ${type}: ${message}`);
    }
  }, [onToast]);

  // Refresh git status
  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const gitStatus = await mcpClient.call('speclang_git_status', {}) as GitStatus;
      setStatus(gitStatus);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Failed to get git status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Stage a file
  const stageFile = useCallback((file: string) => {
    setStagedFiles(prev => new Set([...prev, file]));
  }, []);

  // Unstage a file
  const unstageFile = useCallback((file: string) => {
    setStagedFiles(prev => {
      const next = new Set(prev);
      next.delete(file);
      return next;
    });
  }, []);

  // Toggle file staging
  const toggleFile = useCallback((file: string) => {
    setStagedFiles(prev => {
      if (prev.has(file)) {
        const next = new Set(prev);
        next.delete(file);
        return next;
      } else {
        return new Set([...prev, file]);
      }
    });
  }, []);

  // Stage all modified files
  const stageAll = useCallback(() => {
    if (!status) return;
    
    const allFiles = [...status.modified, ...status.untracked];
    setStagedFiles(new Set(allFiles));
  }, [status]);

  // Unstage all files
  const unstageAll = useCallback(() => {
    setStagedFiles(new Set());
  }, []);

  // Commit changes
  const commit = useCallback(async (message: string) => {
    if (stagedFiles.size === 0) {
      toast('No files staged', 'error');
      return;
    }

    if (!message.trim()) {
      toast('Commit message required', 'error');
      return;
    }

    setIsLoading(true);
    setError(null);

    const prefixedMessage = message.startsWith('speclang:')
      ? message
      : `speclang: ${message}`;

    try {
      await mcpClient.call('speclang_insert_command', {
        action: 'git_commit',
        files: Array.from(stagedFiles),
        message: prefixedMessage
      });

      setStagedFiles(new Set());
      toast('Committed successfully', 'success');
      refreshStatus();
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast(`Failed to commit: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [stagedFiles, toast, refreshStatus]);

  // Get commit history
  const getHistory = useCallback(async (filter?: { speclangOnly?: boolean }): Promise<GitCommit[]> => {
    try {
      const commits = await mcpClient.call('speclang_git_log', filter || {}) as GitCommit[];
      return commits;
    } catch (err) {
      toast(`Failed to get history: ${err}`, 'error');
      return [];
    }
  }, [toast]);

  // Show diff for commit
  const showDiff = useCallback(async (commitSha: string): Promise<GitDiff | null> => {
    try {
      const diff = await mcpClient.call('speclang_git_diff', { sha: commitSha }) as GitDiff;
      return diff;
    } catch (err) {
      toast(`Failed to get diff: ${err}`, 'error');
      return null;
    }
  }, [toast]);

  // Revert a commit
  const revert = useCallback(async (commitSha: string) => {
    const confirmed = window.confirm('Revert this commit?');
    if (!confirmed) return;

    setIsLoading(true);
    setError(null);

    try {
      await mcpClient.call('speclang_git_revert', { sha: commitSha });
      toast('Commit reverted', 'success');
      refreshStatus();
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast(`Failed to revert: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast, refreshStatus]);

  // Create a new branch
  const createBranch = useCallback(async (name: string) => {
    if (!name.trim()) {
      toast('Branch name required', 'error');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await mcpClient.call('speclang_git_branch', { action: 'create', name });
      toast(`Branch "${name}" created`, 'success');
      refreshStatus();
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast(`Failed to create branch: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast, refreshStatus]);

  // Switch to a different branch
  const switchBranch = useCallback(async (name: string) => {
    if (status && status.modified.length > 0) {
      const confirmed = window.confirm(
        'You have uncommitted changes that will be lost. Continue?'
      );
      if (!confirmed) return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await mcpClient.call('speclang_git_branch', { action: 'switch', name });
      toast(`Switched to "${name}"`, 'success');
      refreshStatus();
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast(`Failed to switch branch: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [status, toast, refreshStatus]);

  // Resolve a conflict
  const resolveConflict = useCallback(async (
    file: string,
    resolution: 'ours' | 'theirs' | 'manual',
    content?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      await mcpClient.call('speclang_git_resolve', { file, resolution, content });
      toast('Conflict resolved', 'success');
      refreshStatus();
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast(`Failed to resolve conflict: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast, refreshStatus]);

  // Initial status refresh and auto-refresh
  useEffect(() => {
    refreshStatus();
    
    if (autoRefresh) {
      refreshTimerRef.current = setInterval(refreshStatus, refreshInterval);
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, refreshStatus]);

  return {
    // State
    status,
    stagedFiles,
    isLoading,
    error,
    
    // Status
    refreshStatus,
    
    // Staging
    stageFile,
    unstageFile,
    toggleFile,
    stageAll,
    unstageAll,
    
    // Commit
    commit,
    
    // History
    getHistory,
    showDiff,
    revert,
    
    // Branches
    createBranch,
    switchBranch,
    
    // Conflicts
    resolveConflict
  };
}

export default useGitIntegration;
