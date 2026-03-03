export type CascadeStatus = 'idle' | 'running' | 'paused' | 'finalizing';
export interface CascadeControlState {
    status: CascadeStatus;
    canPause: boolean;
    canFinalize: boolean;
    canAbort: boolean;
    currentFile: string | null;
}
export interface CascadeControlOptions {
    onToast?: (message: string, type?: 'info' | 'error' | 'success') => void;
    onStateChange?: (state: CascadeControlState) => void;
}
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
export declare function useCascadeControl(options?: CascadeControlOptions): {
    state: any;
    triggerCascade: any;
    pauseResume: any;
    stepMode: any;
    abortCascade: any;
    finalize: any;
    setCurrentFile: any;
};
export default useCascadeControl;
//# sourceMappingURL=cascade-control.d.ts.map