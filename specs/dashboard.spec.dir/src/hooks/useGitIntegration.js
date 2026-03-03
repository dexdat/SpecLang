"use strict";
/**
speclang-header lines:5
id: @specs/dashboard
version: 1.0.0
layer: 5
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGitIntegration = useGitIntegration;
// SPECLANG-GENERATED: @specs/ui.dir/interactions.spec.md
// DO NOT EDIT MANUALLY
// Source: @ui/interactions-git-integration
/**
 * useGitIntegration Hook
 *
 * React hook for git operations.
 */
const react_1 = require("react");
// Mock MCP client - would be injected in real implementation
const mcpClient = {
    call: async (tool, params) => {
        console.log(`[MCP] Calling ${tool}:`, params);
        return { success: true };
    }
};
/**
 * useGitIntegration React hook
 */
function useGitIntegration(options = {}) {
    const { autoRefresh = true, refreshInterval = 30000, onToast } = options;
    const [status, setStatus] = (0, react_1.useState)(null);
    const [stagedFiles, setStagedFiles] = (0, react_1.useState)(new Set());
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const refreshTimerRef = (0, react_1.useRef)(null);
    // Toast notification
    const toast = (0, react_1.useCallback)((message, type = 'info') => {
        if (onToast) {
            onToast(message, type);
        }
        else {
            console.log(`[Toast] ${type}: ${message}`);
        }
    }, [onToast]);
    // Refresh git status
    const refreshStatus = (0, react_1.useCallback)(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const gitStatus = await mcpClient.call('speclang_git_status', {});
            setStatus(gitStatus);
        }
        catch (err) {
            const error = err;
            setError(error);
            console.error('Failed to get git status:', error);
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    // Stage a file
    const stageFile = (0, react_1.useCallback)((file) => {
        setStagedFiles(prev => new Set([...prev, file]));
    }, []);
    // Unstage a file
    const unstageFile = (0, react_1.useCallback)((file) => {
        setStagedFiles(prev => {
            const next = new Set(prev);
            next.delete(file);
            return next;
        });
    }, []);
    // Toggle file staging
    const toggleFile = (0, react_1.useCallback)((file) => {
        setStagedFiles(prev => {
            if (prev.has(file)) {
                const next = new Set(prev);
                next.delete(file);
                return next;
            }
            else {
                return new Set([...prev, file]);
            }
        });
    }, []);
    // Stage all modified files
    const stageAll = (0, react_1.useCallback)(() => {
        if (!status)
            return;
        const allFiles = [...status.modified, ...status.untracked];
        setStagedFiles(new Set(allFiles));
    }, [status]);
    // Unstage all files
    const unstageAll = (0, react_1.useCallback)(() => {
        setStagedFiles(new Set());
    }, []);
    // Commit changes
    const commit = (0, react_1.useCallback)(async (message) => {
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
        }
        catch (err) {
            const error = err;
            setError(error);
            toast(`Failed to commit: ${error.message}`, 'error');
        }
        finally {
            setIsLoading(false);
        }
    }, [stagedFiles, toast, refreshStatus]);
    // Get commit history
    const getHistory = (0, react_1.useCallback)(async (filter) => {
        try {
            const commits = await mcpClient.call('speclang_git_log', filter || {});
            return commits;
        }
        catch (err) {
            toast(`Failed to get history: ${err}`, 'error');
            return [];
        }
    }, [toast]);
    // Show diff for commit
    const showDiff = (0, react_1.useCallback)(async (commitSha) => {
        try {
            const diff = await mcpClient.call('speclang_git_diff', { sha: commitSha });
            return diff;
        }
        catch (err) {
            toast(`Failed to get diff: ${err}`, 'error');
            return null;
        }
    }, [toast]);
    // Revert a commit
    const revert = (0, react_1.useCallback)(async (commitSha) => {
        const confirmed = window.confirm('Revert this commit?');
        if (!confirmed)
            return;
        setIsLoading(true);
        setError(null);
        try {
            await mcpClient.call('speclang_git_revert', { sha: commitSha });
            toast('Commit reverted', 'success');
            refreshStatus();
        }
        catch (err) {
            const error = err;
            setError(error);
            toast(`Failed to revert: ${error.message}`, 'error');
        }
        finally {
            setIsLoading(false);
        }
    }, [toast, refreshStatus]);
    // Create a new branch
    const createBranch = (0, react_1.useCallback)(async (name) => {
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
        }
        catch (err) {
            const error = err;
            setError(error);
            toast(`Failed to create branch: ${error.message}`, 'error');
        }
        finally {
            setIsLoading(false);
        }
    }, [toast, refreshStatus]);
    // Switch to a different branch
    const switchBranch = (0, react_1.useCallback)(async (name) => {
        if (status && status.modified.length > 0) {
            const confirmed = window.confirm('You have uncommitted changes that will be lost. Continue?');
            if (!confirmed)
                return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await mcpClient.call('speclang_git_branch', { action: 'switch', name });
            toast(`Switched to "${name}"`, 'success');
            refreshStatus();
        }
        catch (err) {
            const error = err;
            setError(error);
            toast(`Failed to switch branch: ${error.message}`, 'error');
        }
        finally {
            setIsLoading(false);
        }
    }, [status, toast, refreshStatus]);
    // Resolve a conflict
    const resolveConflict = (0, react_1.useCallback)(async (file, resolution, content) => {
        setIsLoading(true);
        setError(null);
        try {
            await mcpClient.call('speclang_git_resolve', { file, resolution, content });
            toast('Conflict resolved', 'success');
            refreshStatus();
        }
        catch (err) {
            const error = err;
            setError(error);
            toast(`Failed to resolve conflict: ${error.message}`, 'error');
        }
        finally {
            setIsLoading(false);
        }
    }, [toast, refreshStatus]);
    // Initial status refresh and auto-refresh
    (0, react_1.useEffect)(() => {
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
exports.default = useGitIntegration;
//# sourceMappingURL=useGitIntegration.js.map