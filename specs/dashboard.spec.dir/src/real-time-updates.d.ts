export interface SSEEvent {
    type: string;
    data: unknown;
    timestamp: number;
}
export interface Action {
    id: string;
    type: string;
    payload: unknown;
    timestamp: number;
}
export interface RealTimeUpdatesState {
    events: SSEEvent[];
    isOnline: boolean;
    isUpdating: boolean;
    actionQueue: Action[];
}
export interface RealTimeUpdatesOptions {
    eventsUrl?: string;
    onToast?: (message: string, type?: 'info' | 'error' | 'success') => void;
    debounceDelay?: number;
    maxEvents?: number;
}
/**
 * Event handlers for different SSE event types
 */
export interface EventHandlers {
    'file.changed'?: (data: unknown) => void;
    'agent.spawned'?: (data: unknown) => void;
    'agent.completed'?: (data: unknown) => void;
    'cascade.converged'?: (data: unknown) => void;
    'command.executed'?: (data: unknown) => void;
    'cascade.error'?: (data: unknown) => void;
    'agent.error'?: (data: unknown) => void;
    [key: string]: ((data: unknown) => void) | undefined;
}
/**
 * useRealTimeUpdates hook
 *
 * Provides real-time update functionality including:
 * - SSE connection management
 * - Event handling for various event types
 * - Optimistic updates with rollback
 * - Debounced batch processing
 * - Offline queue with sync on reconnect
 */
export declare function useRealTimeUpdates(options?: RealTimeUpdatesOptions): {
    events: any;
    isOnline: any;
    isUpdating: any;
    actionQueue: any;
    connect: any;
    setHandlers: any;
    optimisticUpdate: any;
    queueAction: any;
    flushQueue: any;
    clearEvents: any;
    scheduleUpdate: any;
};
export default useRealTimeUpdates;
//# sourceMappingURL=real-time-updates.d.ts.map