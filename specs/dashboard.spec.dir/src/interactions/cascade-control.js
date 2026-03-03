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
 * Cascade Control Interactions
 *
 * Handles trigger, pause/resume, step, abort, and finalize operations
 * for the cascade system via MCP commands.
 */
const react_1 = require("react");
// Mock MCP client - in real implementation would use actual MCP client
const mcpClient = {
    call: async (tool, params) => {
        console.log(`[MCP] Calling ${tool}:`, params);
        return { success: true };
    }
};
/**
 * useCascadeControl hook
 *
 * Provides cascade control functionality including:
 * - triggerCascade: Start a new cascade
 * - pauseResume: Toggle pause/resume state
 * - stepMode: Execute one cascade step
 * - abortCascade: Emergency stop with rollback
 * - finalize: Complete cascade and commit changes
 */
function useCascadeControl(options = {}) {
    const { onToast, onStateChange } = options;
    const [state, setState] = (0, react_1.useState)({
        status: 'idle',
        canPause: false,
        canFinalize: false,
        canAbort: false,
        currentFile: null
    });
    const toast = (0, react_1.useCallback)((message, type = 'info') => {
        if (onToast) {
            onToast(message, type);
        }
        else {
            console.log(`[Toast] ${type}: ${message}`);
        }
    }, [onToast]);
    const notifyStateChange = (0, react_1.useCallback)((newState) => {
        setState(newState);
        if (onStateChange) {
            onStateChange(newState);
        }
    }, [onStateChange]);
    /**
     * Trigger a new cascade
     */
    const triggerCascade = (0, react_1.useCallback)(async () => {
        try {
            await mcpClient.call('speclang_insert_command', {
                action: 'trigger',
                target_file: state.currentFile
            });
            toast('Cascade triggered', 'success');
            notifyStateChange({
                ...state,
                status: 'running',
                canPause: true,
                canFinalize: true,
                canAbort: true
            });
        }
        catch (error) {
            toast(`Failed to trigger cascade: ${error}`, 'error');
        }
    }, [state.currentFile, toast, notifyStateChange, state]);
    /**
     * Toggle pause/resume state
     */
    const pauseResume = (0, react_1.useCallback)(async () => {
        try {
            const action = state.status === 'paused' ? 'resume' : 'pause';
            await mcpClient.call('speclang_insert_command', { action });
            const newStatus = action === 'pause' ? 'paused' : 'running';
            toast(action === 'pause' ? 'Cascade paused' : 'Cascade resumed', 'info');
            notifyStateChange({
                ...state,
                status: newStatus
            });
        }
        catch (error) {
            toast(`Failed to ${state.status === 'paused' ? 'resume' : 'pause'} cascade: ${error}`, 'error');
        }
    }, [state, toast, notifyStateChange]);
    /**
     * Execute one step of the cascade (step mode)
     */
    const stepMode = (0, react_1.useCallback)(async () => {
        if (state.status !== 'paused') {
            toast('Step mode only available when paused', 'error');
            return;
        }
        try {
            await mcpClient.call('speclang_insert_command', { action: 'step' });
            toast('Step executed', 'info');
        }
        catch (error) {
            toast(`Failed to execute step: ${error}`, 'error');
        }
    }, [state.status, toast]);
    /**
     * Abort cascade with confirmation and rollback
     */
    const abortCascade = (0, react_1.useCallback)(async () => {
        if (!state.canAbort) {
            toast('Cannot abort: no active cascade', 'error');
            return;
        }
        const confirmed = window.confirm('Abort cascade and rollback changes?');
        if (!confirmed)
            return;
        try {
            await mcpClient.call('speclang_insert_command', { action: 'abort' });
            toast('Cascade aborted and rolled back', 'info');
            notifyStateChange({
                ...state,
                status: 'idle',
                canPause: false,
                canFinalize: false,
                canAbort: false
            });
        }
        catch (error) {
            toast(`Failed to abort cascade: ${error}`, 'error');
        }
    }, [state, toast, notifyStateChange]);
    /**
     * Finalize cascade with confirmation
     */
    const finalize = (0, react_1.useCallback)(async () => {
        if (!state.canFinalize) {
            toast('Cannot finalize: no active cascade', 'error');
            return;
        }
        const confirmed = window.confirm('Finalize cascade and commit changes?');
        if (!confirmed)
            return;
        try {
            notifyStateChange({
                ...state,
                status: 'finalizing'
            });
            await mcpClient.call('speclang_insert_command', { action: 'finalize' });
            toast('Cascade finalized and committed', 'success');
            notifyStateChange({
                ...state,
                status: 'idle',
                canPause: false,
                canFinalize: false,
                canAbort: false
            });
        }
        catch (error) {
            toast(`Failed to finalize cascade: ${error}`, 'error');
            notifyStateChange({
                ...state,
                status: 'running'
            });
        }
    }, [state, toast, notifyStateChange]);
    /**
     * Set current file for cascade targeting
     */
    const setCurrentFile = (0, react_1.useCallback)((file) => {
        setState(prev => ({ ...prev, currentFile: file }));
    }, []);
    return {
        state,
        triggerCascade,
        pauseResume,
        stepMode,
        abortCascade,
        finalize,
        setCurrentFile
    };
}
exports.default = useCascadeControl;
//# sourceMappingURL=cascade-control.js.map