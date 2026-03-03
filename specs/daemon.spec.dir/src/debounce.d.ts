/**
 * Debounce utility for batching rapid file events
 *
 * Generated from: @speclang/daemon/events
 *
 * Batches rapid file changes within a time window to prevent
 * overwhelming the system with too many events.
 */
import { EventEmitter } from 'events';
import { FileEvent } from './types';
export interface DebounceOptions {
    /** Time window in milliseconds (default: 100ms) */
    windowMs: number;
    /** Maximum events to batch (default: 50) */
    maxBatchSize: number;
}
export interface BatchEvent {
    events: FileEvent[];
    timestamp: number;
}
export declare class Debouncer extends EventEmitter {
    private events;
    private timer?;
    private windowMs;
    private maxBatchSize;
    private pending;
    constructor(options?: Partial<DebounceOptions>);
    /**
     * Add an event to the batch
     */
    add(event: FileEvent): void;
    /**
     * Flush all pending events
     */
    flush(): void;
    /**
     * Get current batch size
     */
    get pendingCount(): number;
    /**
     * Check if there are pending events
     */
    get isPending(): boolean;
    /**
     * Clear all pending events without emitting
     */
    clear(): void;
}
//# sourceMappingURL=debounce.d.ts.map