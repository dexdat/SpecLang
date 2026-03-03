/**
speclang-header lines:5
id: @specs/dashboard
version: 1.0.0
layer: 5
 */
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
export interface EventHandlers {
    'file.changed'?: (data: unknown) => void;
    'agent.spawned'?: (data: unknown) => void;
    'agent.completed'?: (data: unknown) => void;
    'cascade.converged'?: (data: unknown) => void;
    'cascade.started'?: (data: unknown) => void;
    'cascade.paused'?: (data: unknown) => void;
    'cascade.aborted'?: (data: unknown) => void;
    'cascade.error'?: (data: unknown) => void;
    'command.executed'?: (data: unknown) => void;
    'agent.error'?: (data: unknown) => void;
    [key: string]: ((data: unknown) => void) | undefined;
}
export interface UseRealTimeUpdatesOptions {
    eventsUrl?: string;
    onToast?: (message: string, type?: 'info' | 'error' | 'success') => void;
    debounceDelay?: number;
    maxEvents?: number;
    autoConnect?: boolean;
}
export interface UseRealTimeUpdatesReturn {
    events: SSEEvent[];
    isOnline: boolean;
    isUpdating: boolean;
    actionQueue: Action[];
    connect: () => void;
    disconnect: () => void;
    setHandlers: (handlers: Partial<EventHandlers>) => void;
    optimisticUpdate: <T>(action: () => Promise<T>, optimistic: () => void, rollback: () => void) => Promise<void>;
    queueAction: (action: Action) => void;
    flushQueue: () => Promise<void>;
    clearEvents: () => void;
    scheduleUpdate: (update: () => void) => void;
    getEventsByType: (type: string) => SSEEvent[];
    getLatestEvent: (type: string) => SSEEvent | null;
}
/**
 * useRealTimeUpdates React hook
 */
export declare function useRealTimeUpdates(options?: UseRealTimeUpdatesOptions): UseRealTimeUpdatesReturn;
export default useRealTimeUpdates;
//# sourceMappingURL=useRealTimeUpdates.d.ts.map