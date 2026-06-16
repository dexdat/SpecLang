"use strict";
/**
speclang-header lines:5
id: @specs/dashboard
version: 1.0.0
layer: 5
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCascadeControl = useCascadeControl;
// SPECLANG-GENERATED: @specs/ui.dir/interactions.spec.md
// DO NOT EDIT MANUALLY
// Source: @ui/interactions-cascade-control
/**
 * useCascadeControl Hook
 *
 * React hook wrapper for cascade control interactions.
 */
const react_1 = require("react");
const real_time_updates_1 = require("../interactions/real-time-updates");
// Mock MCP client - would be injected in real implementation
const mcpClient = {
    call: async (tool, params) => {
        console.log(`[MCP] Calling ${tool}:`, params);
        return { success: true };
    }
};
/**
 * useCascadeControl React hook
 */
function useCascadeControl(options = {}) {
    const { currentFile: initialFile = null, autoRefresh = true, refreshInterval = 5000, onToast } = options;
    const [state, setState] = (0, react_1.useState)({
        status: 'idle',
        canPause: false,
        canFinalize: false,
        canAbort: false,
        depth: 0,
        currentFile: initialFile,
        lastEventTime: null
    });
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const { events } = (0, real_time_updates_1.useRealTimeUpdates)({
        onToast,
        debounceDelay: 100
    });
    const refreshTimerRef = (0, react_1.useRef)(null);
    // Show toast notification
    const toast = (0, react_1.useCallback)((message, type = 'info') => {
        if (onToast) {
            onToast(message, type);
        }
        else {
            console.log(`[Toast] ${type}: ${message}`);
        }
    }, [onToast]);
    // Update state helper
    const updateState = (0, react_1.useCallback)((updates) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);
    // Refresh cascade status from server
    const refreshStatus = (0, react_1.useCallback)(async () => {
        try {
            const status = await mcpClient.call('speclang_cascade_status', {});
            updateState({
                status: status.status,
                depth: status.depth,
                lastEventTime: status.lastEventTime ? new Date(status.lastEventTime) : null,
                canPause: status.status === 'running',
                canFinalize: status.status === 'running' || status.status === 'paused',
                canAbort: status.status === 'running' || status.status === 'paused'
            });
        }
        catch (err) {
            console.error('Failed to refresh cascade status:', err);
        }
    }, [updateState]);
    // Set up auto-refresh
    (0, react_1.useEffect)(() => {
        if (autoRefresh) {
            refreshTimerRef.current = setInterval(refreshStatus, refreshInterval);
        }
        return () => {
            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current);
            }
        };
    }, [autoRefresh, refreshInterval, refreshStatus]);
    // Handle cascade events
    (0, react_1.useEffect)(() => {
        const cascadeEvents = events.filter(e => e.type.startsWith('cascade.'));
        if (cascadeEvents.length > 0) {
            const latestEvent = cascadeEvents[0];
            if (latestEvent.type === 'cascade.started') {
                updateState({ status: 'running', canPause: true, canAbort: true });
                toast('Cascade started', 'info');
            }
            else if (latestEvent.type === 'cascade.paused') {
                updateState({ status: 'paused' });
                toast('Cascade paused', 'info');
            }
            else if (latestEvent.type === 'cascade.resumed') {
                updateState({ status: 'running' });
                toast('Cascade resumed', 'info');
            }
            else if (latestEvent.type === 'cascade.converged') {
                updateState({
                    status: 'idle',
                    canPause: false,
                    canFinalize: false,
                    canAbort: false
                });
                toast('Cascade converged!', 'success');
            }
            else if (latestEvent.type === 'cascade.aborted') {
                updateState({
                    status: 'idle',
                    canPause: false,
                    canFinalize: false,
                    canAbort: false
                });
                toast('Cascade aborted', 'info');
            }
            else if (latestEvent.type === 'cascade.error') {
                updateState({
                    status: 'idle',
                    canPause: false,
                    canFinalize: false,
                    canAbort: false
                });
                toast(`Cascade error: ${latestEvent.data}`, 'error');
            }
        }
    }, [events, updateState, toast]);
    // Trigger cascade
    const triggerCascade = (0, react_1.useCallback)(async () => {
        setIsLoading(true);
        setError(null);
        try {
            await mcpClient.call('speclang_insert_command', {
                action: 'trigger',
                target_file: state.currentFile
            });
            updateState({
                status: 'running',
                canPause: true,
                canFinalize: true,
                canAbort: true
            });
            toast('Cascade triggered', 'success');
        }
        catch (err) {
            const error = err;
            setError(error);
            toast(`Failed to trigger cascade: ${error.message}`, 'error');
        }
        finally {
            setIsLoading(false);
        }
    }, [state.currentFile, updateState, toast]);
    // Pause/Resume toggle
    const pauseResume = (0, react_1.useCallback)(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const action = state.status === 'paused' ? 'resume' : 'pause';
            await mcpClient.call('speclang_insert_command', { action });
            const newStatus = action === 'pause' ? 'paused' : 'running';
            updateState({ status: newStatus });
            toast(action === 'pause' ? 'Cascade paused' : 'Cascade resumed', 'info');
        }
        catch (err) {
            const error = err;
            setError(error);
            toast(`Failed to ${state.status === 'paused' ? 'resume' : 'pause'} cascade: ${error.message}`, 'error');
        }
        finally {
            setIsLoading(false);
        }
    }, [state.status, updateState, toast]);
    // Step mode
    const stepMode = (0, react_1.useCallback)(async () => {
        if (state.status !== 'paused') {
            toast('Step mode only available when paused', 'error');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await mcpClient.call('speclang_insert_command', { action: 'step' });
            toast('Step executed', 'info');
            refreshStatus();
        }
        catch (err) {
            const error = err;
            setError(error);
            toast(`Failed to execute step: ${error.message}`, 'error');
        }
        finally {
            setIsLoading(false);
        }
    }, [state.status, toast, refreshStatus]);
    // Abort cascade
    const abortCascade = (0, react_1.useCallback)(async () => {
        if (!state.canAbort) {
            toast('Cannot abort: no active cascade', 'error');
            return;
        }
        const confirmed = window.confirm('Abort cascade and rollback changes?');
        if (!confirmed)
            return;
        setIsLoading(true);
        setError(null);
        try {
            await mcpClient.call('speclang_insert_command', { action: 'abort' });
            updateState({
                status: 'idle',
                canPause: false,
                canFinalize: false,
                canAbort: false
            });
            toast('Cascade aborted and rolled back', 'info');
        }
        catch (err) {
            const error = err;
            setError(error);
            toast(`Failed to abort cascade: ${error.message}`, 'error');
        }
        finally {
            setIsLoading(false);
        }
    }, [state.canAbort, updateState, toast]);
    // Finalize cascade
    const finalize = (0, react_1.useCallback)(async () => {
        if (!state.canFinalize) {
            toast('Cannot finalize: no active cascade', 'error');
            return;
        }
        const confirmed = window.confirm('Finalize cascade and commit changes?');
        if (!confirmed)
            return;
        setIsLoading(true);
        setError(null);
        try {
            updateState({ status: 'finalizing' });
            await mcpClient.call('speclang_insert_command', { action: 'finalize' });
            updateState({
                status: 'idle',
                canPause: false,
                canFinalize: false,
                canAbort: false
            });
            toast('Cascade finalized and committed', 'success');
        }
        catch (err) {
            const error = err;
            setError(error);
            updateState({ status: 'running' });
            toast(`Failed to finalize cascade: ${error.message}`, 'error');
        }
        finally {
            setIsLoading(false);
        }
    }, [state.canFinalize, updateState, toast]);
    // Set current file
    const setCurrentFile = (0, react_1.useCallback)((file) => {
        updateState({ currentFile: file });
    }, [updateState]);
    return {
        state,
        triggerCascade,
        pauseResume,
        stepMode,
        abortCascade,
        finalize,
        setCurrentFile,
        isLoading,
        error
    };
}
exports.default = useCascadeControl;
//# sourceMappingURL=useCascadeControl.js.map