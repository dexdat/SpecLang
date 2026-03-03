"use strict";
// SPECLANG-GENERATED: @speclang/cascade/triggers
// File watcher integration for cascade triggers
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockFileWatcher = exports.TriggerWatcher = exports.DEFAULT_WATCH_CONFIG = void 0;
exports.createWatcher = createWatcher;
const sources_1 = require("./sources");
/**
 * Default watch configuration
 */
exports.DEFAULT_WATCH_CONFIG = {
    watch_patterns: sources_1.WATCH_PATTERNS,
    ignore_patterns: sources_1.IGNORE_PATTERNS,
    debounce_ms: 100
};
/**
 * File watcher that processes file changes into triggers
 */
class TriggerWatcher {
    config;
    handlers;
    pending;
    onTrigger;
    constructor(config = {}, handlers = []) {
        this.config = { ...exports.DEFAULT_WATCH_CONFIG, ...config };
        this.handlers = handlers;
        this.pending = new Map();
    }
    /**
     * Set callback for processed triggers
     */
    setTriggerCallback(callback) {
        this.onTrigger = callback;
    }
    /**
     * Add a handler
     */
    addHandler(handler) {
        this.handlers.push(handler);
    }
    /**
     * Handle a file change event
     */
    onFileChange(event) {
        const filePath = event.path;
        // Check ignore patterns
        if ((0, sources_1.shouldIgnore)(filePath)) {
            return;
        }
        // Check watch patterns
        if (!(0, sources_1.shouldWatch)(filePath)) {
            return;
        }
        // Debounce to prevent rapid-fire triggers
        this.debounce(filePath, () => {
            this.processTrigger({
                id: `trigger-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                source: (0, sources_1.getTriggerSourceType)(filePath),
                file: filePath,
                kind: event.kind,
                timestamp: event.timestamp,
                priority: 'normal'
            });
        });
    }
    /**
     * Process a trigger through handlers
     */
    async processTrigger(trigger) {
        console.log(`[TriggerWatcher] Processing trigger: ${trigger.file} (${trigger.kind})`);
        for (const handler of this.handlers) {
            if (handler.canHandle(trigger)) {
                try {
                    const result = await handler.handle(trigger);
                    if (result.handled) {
                        console.log(`[TriggerWatcher] Handled by ${handler.constructor.name}`, {
                            cascade: result.cascadeStarted,
                            agents: result.agentsInvoked
                        });
                        // Notify callback if set
                        if (this.onTrigger) {
                            this.onTrigger(trigger);
                        }
                        break;
                    }
                }
                catch (error) {
                    console.error(`[TriggerWatcher] Handler error:`, error);
                }
            }
        }
    }
    /**
     * Debounce file changes
     */
    debounce(filePath, fn) {
        if (this.pending.has(filePath)) {
            clearTimeout(this.pending.get(filePath));
        }
        this.pending.set(filePath, setTimeout(() => {
            this.pending.delete(filePath);
            fn();
        }, this.config.debounce_ms));
    }
    /**
     * Clear all pending debounces
     */
    clearPending() {
        this.pending.forEach((timeout) => {
            clearTimeout(timeout);
        });
        this.pending.clear();
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
}
exports.TriggerWatcher = TriggerWatcher;
/**
 * Simulated file watcher for testing
 */
class MockFileWatcher {
    watcher;
    constructor(watcher) {
        this.watcher = watcher;
    }
    /**
     * Simulate a file change
     */
    simulateChange(path, kind = 'modify') {
        const event = {
            path,
            kind,
            timestamp: new Date()
        };
        this.watcher.onFileChange(event);
    }
    /**
     * Simulate multiple file changes
     */
    simulateChanges(events) {
        for (const event of events) {
            this.simulateChange(event.path, event.kind || 'modify');
        }
    }
}
exports.MockFileWatcher = MockFileWatcher;
/**
 * Create a watcher with default handlers
 */
function createWatcher(handlers, config) {
    return new TriggerWatcher(config, handlers);
}
//# sourceMappingURL=watcher.js.map