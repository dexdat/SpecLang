// SPECLANG-GENERATED: @specs/ui.dir/interactions.spec.md
// DO NOT EDIT MANUALLY
// Source: @ui/interactions-git-integration

/**
 * Git Integration
 * 
 * Handles git operations including commit, history, branch management,
 * and conflict resolution.
 */

import { useState, useCallback, useEffect } from 'react';

// Types
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

// Mock MCP client - in real implementation would use actual MCP client
const mcpClient = {
  call: async (tool: string, params: Record<string, unknown>): Promise<unknown> => {
    console.log(`[MCP] Calling ${tool}:`, params);
    return { success: true };
  }
};

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
export function useGitIntegration(options: GitIntegrationOptions = {}) {
  const { onToast } = options;

  const [state, setState] = useState<GitIntegrationState>({
    status: null,
    stagedFiles: new Set<string>(),
    isLoading: false,
    error: null
  });

  const toast = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    if (onToast) {
      onToast(message, type);
    } else {
      console.log(`[Toast] ${type}: ${message}`);
    }
  }, [onToast]);

  /**
   * Refresh git status
   */
  const refreshStatus = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const gitStatus = await mcpClient.call('speclang_git_status', {}) as GitStatus;
      setState(prev => ({
        ...prev,
        status: gitStatus,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: `Failed to get git status: ${error}`
      }));
      toast(`Failed to get git status: ${error}`, 'error');
    }
  }, [toast]);

  /**
   * Stage a file for commit
   */
  const stageFile = useCallback((file: string) => {
    setState(prev => ({
      ...prev,
      stagedFiles: new Set([...prev.stagedFiles, file])
    }));
  }, []);

  /**
   * Unstage a file
   */
  const unstageFile = useCallback((file: string) => {
    setState(prev => {
      const next = new Set(prev.stagedFiles);
      next.delete(file);
      return { ...prev, stagedFiles: next };
    });
  }, []);

  /**
   * Toggle file staging
   */
  const toggleFile = useCallback((file: string) => {
    setState(prev => {
      if (prev.stagedFiles.has(file)) {
        const next = new Set(prev.stagedFiles);
        next.delete(file);
        return { ...prev, stagedFiles: next };
      } else {
        return { ...prev, stagedFiles: new Set([...prev.stagedFiles, file]) };
      }
    });
  }, []);

  /**
   * Commit staged changes
   */
  const commit = useCallback(async (message: string) => {
    if (state.stagedFiles.size === 0) {
      toast('No files staged', 'error');
      return;
    }

    if (!message.trim()) {
      toast('Commit message required', 'error');
      return;
    }

    const prefixedMessage = message.startsWith('speclang:')
      ? message
      : `speclang: ${message}`;

    try {
      await mcpClient.call('speclang_insert_command', {
        action: 'git_commit',
        files: Array.from(state.stagedFiles),
        message: prefixedMessage
      });

      setState(prev => ({
        ...prev,
        stagedFiles: new Set<string>()
      }));

      toast('Committed successfully', 'success');
      refreshStatus();
    } catch (error) {
      toast(`Failed to commit: ${error}`, 'error');
    }
  }, [state.stagedFiles, toast, refreshStatus]);

  /**
   * Get commit history
   */
  const getHistory = useCallback(async (filter?: { speclangOnly?: boolean }): Promise<GitCommit[]> => {
    try {
      const commits = await mcpClient.call('speclang_git_log', filter || {}) as GitCommit[];
      return commits;
    } catch (error) {
      toast(`Failed to get history: ${error}`, 'error');
      return [];
    }
  }, [toast]);

  /**
   * Show diff for a commit
   */
  const showDiff = useCallback(async (commitSha: string): Promise<GitDiff | null> => {
    try {
      const diff = await mcpClient.call('speclang_git_diff', { sha: commitSha }) as GitDiff;
      return diff;
    } catch (error) {
      toast(`Failed to get diff: ${error}`, 'error');
      return null;
    }
  }, [toast]);

  /**
   * Revert a commit
   */
  const revert = useCallback(async (commitSha: string) => {
    const confirmed = window.confirm('Revert this commit?');
    if (!confirmed) return;

    try {
      await mcpClient.call('speclang_git_revert', { sha: commitSha });
      toast('Commit reverted', 'success');
      refreshStatus();
    } catch (error) {
      toast(`Failed to revert: ${error}`, 'error');
    }
  }, [toast, refreshStatus]);

  /**
   * Create a new branch
   */
  const createBranch = useCallback(async (name: string) => {
    if (!name.trim()) {
      toast('Branch name required', 'error');
      return;
    }

    try {
      await mcpClient.call('speclang_git_branch', { action: 'create', name });
      toast(`Branch "${name}" created`, 'success');
      refreshStatus();
    } catch (error) {
      toast(`Failed to create branch: ${error}`, 'error');
    }
  }, [toast, refreshStatus]);

  /**
   * Switch to a different branch
   */
  const switchBranch = useCallback(async (name: string) => {
    const { status } = state;
    
    if (status && status.modified.length > 0) {
      const confirmed = window.confirm(
        'You have uncommitted changes that will be lost. Continue?'
      );
      if (!confirmed) return;
    }

    try {
      await mcpClient.call('speclang_git_branch', { action: 'switch', name });
      toast(`Switched to "${name}"`, 'success');
      refreshStatus();
    } catch (error) {
      toast(`Failed to switch branch: ${error}`, 'error');
    }
  }, [state.status, toast, refreshStatus]);

  /**
   * Resolve a conflict
   */
  const resolveConflict = useCallback(async (
    file: string,
    resolution: 'ours' | 'theirs' | 'manual',
    content?: string
  ) => {
    try {
      await mcpClient.call('speclang_git_resolve', { file, resolution, content });
      toast('Conflict resolved', 'success');
      refreshStatus();
    } catch (error) {
      toast(`Failed to resolve conflict: ${error}`, 'error');
    }
  }, [toast, refreshStatus]);

  /**
   * Stage all modified files
   */
  const stageAll = useCallback(() => {
    const { status } = state;
    if (!status) return;

    const allFiles = [...status.modified, ...status.untracked];
    setState(prev => ({
      ...prev,
      stagedFiles: new Set(allFiles)
    }));
  }, [state.status]);

  /**
   * Unstage all files
   */
  const unstageAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      stagedFiles: new Set<string>()
    }));
  }, []);

  // Initial status refresh
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    // State
    status: state.status,
    stagedFiles: state.stagedFiles,
    isLoading: state.isLoading,
    error: state.error,
    
    // Methods
    refreshStatus,
    stageFile,
    unstageFile,
    toggleFile,
    stageAll,
    unstageAll,
    commit,
    getHistory,
    showDiff,
    revert,
    createBranch,
    switchBranch,
    resolveConflict
  };
}

export default useGitIntegration;
