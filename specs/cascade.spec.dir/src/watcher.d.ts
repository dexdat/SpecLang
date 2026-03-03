import { Trigger, FileEvent, WatchConfig, FileChangeKind } from './types';
import { TriggerHandler } from './handlers';
/**
 * Default watch configuration
 */
export declare const DEFAULT_WATCH_CONFIG: WatchConfig;
/**
 * File watcher that processes file changes into triggers
 */
export declare class TriggerWatcher {
    private config;
    private handlers;
    private pending;
    private onTrigger?;
    constructor(config?: Partial<WatchConfig>, handlers?: TriggerHandler[]);
    /**
     * Set callback for processed triggers
     */
    setTriggerCallback(callback: (trigger: Trigger) => void): void;
    /**
     * Add a handler
     */
    addHandler(handler: TriggerHandler): void;
    /**
     * Handle a file change event
     */
    onFileChange(event: FileEvent): void;
    /**
     * Process a trigger through handlers
     */
    private processTrigger;
    /**
     * Debounce file changes
     */
    private debounce;
    /**
     * Clear all pending debounces
     */
    clearPending(): void;
    /**
     * Get current configuration
     */
    getConfig(): WatchConfig;
    /**
     * Update configuration
     */
    updateConfig(config: Partial<WatchConfig>): void;
}
/**
 * Simulated file watcher for testing
 */
export declare class MockFileWatcher {
    private watcher;
    constructor(watcher: TriggerWatcher);
    /**
     * Simulate a file change
     */
    simulateChange(path: string, kind?: FileChangeKind): void;
    /**
     * Simulate multiple file changes
     */
    simulateChanges(events: Array<{
        path: string;
        kind?: FileChangeKind;
    }>): void;
}
/**
 * Create a watcher with default handlers
 */
export declare function createWatcher(handlers: TriggerHandler[], config?: Partial<WatchConfig>): TriggerWatcher;
//# sourceMappingURL=watcher.d.ts.map