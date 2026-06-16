export type CascadeStatus = 'idle' | 'running' | 'paused' | 'finalizing';
export interface CascadeControlState {
    status: CascadeStatus;
    canPause: boolean;
    canFinalize: boolean;
    canAbort: boolean;
    depth: number;
    currentFile: string | null;
    lastEventTime: Date | null;
}
export interface UseCascadeControlOptions {
    currentFile?: string | null;
    autoRefresh?: boolean;
    refreshInterval?: number;
    onToast?: (message: string, type?: 'info' | 'error' | 'success') => void;
}
export interface UseCascadeControlReturn {
    state: CascadeControlState;
    triggerCascade: () => Promise<void>;
    pauseResume: () => Promise<void>;
    stepMode: () => Promise<void>;
    abortCascade: () => Promise<void>;
    finalize: () => Promise<void>;
    setCurrentFile: (file: string | null) => void;
    isLoading: boolean;
    error: Error | null;
}
/**
 * useCascadeControl React hook
 */
export declare function useCascadeControl(options?: UseCascadeControlOptions): UseCascadeControlReturn;
export default useCascadeControl;
//# sourceMappingURL=useCascadeControl.d.ts.map