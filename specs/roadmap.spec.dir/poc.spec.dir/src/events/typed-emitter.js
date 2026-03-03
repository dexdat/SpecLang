"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/events.spec.md
 * Generated: 2026-03-03T04:20:00.000Z
 *
 * Edit the spec, not this file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypedEventEmitter = void 0;
const events_1 = require("events");
// ============================================
// TypedEventEmitter Implementation
// ============================================
/**
 * Generic event emitter with typed events
 * Extends Node.js EventEmitter with type safety
 *
 * @example
 * ```typescript
 * const emitter = new TypedEventEmitter<FileWatcherEvents>();
 * emitter.on('change', (event) => console.log(event.path));
 * emitter.emit('change', { type: 'modified', path: '/test.txt', timestamp: Date.now() });
 * ```
 */
class TypedEventEmitter extends events_1.EventEmitter {
    // Map from original handlers to wrapped handlers for proper cleanup
    handlerMap = new Map();
    /**
     * Register event handler with type safety
     */
    on(event, handler) {
        // Wrap handler with error catching
        const wrappedHandler = (data) => {
            try {
                handler(data);
            }
            catch (error) {
                console.error(`[TypedEventEmitter] Uncaught error in handler for event "${event}":`, error);
                this.emit('error', error);
            }
        };
        // Store reference to wrapped handler for off() removal
        this.handlerMap.set(handler, wrappedHandler);
        return super.on(event, wrappedHandler);
    }
    /**
     * Remove event handler with type safety
     */
    off(event, handler) {
        // Remove the wrapped handler if it exists
        const wrappedHandler = this.handlerMap.get(handler) || handler;
        this.handlerMap.delete(handler);
        return super.off(event, wrappedHandler);
    }
    /**
     * Emit event with type safety
     */
    emit(event, data) {
        // For 'error' event, emit directly without wrapping
        if (event === 'error') {
            return super.emit(event, data);
        }
        // For other events, emit safely
        try {
            return super.emit(event, data);
        }
        catch (error) {
            console.error(`[TypedEventEmitter] Error emitting event "${event}":`, error);
            super.emit('error', error);
            return false;
        }
    }
    /**
     * Register one-time handler with type safety
     */
    once(event, handler) {
        // Wrap handler with error catching
        const wrappedHandler = (data) => {
            try {
                handler(data);
            }
            catch (error) {
                console.error(`[TypedEventEmitter] Uncaught error in once handler for event "${event}":`, error);
                this.emit('error', error);
            }
        };
        this.handlerMap.set(handler, wrappedHandler);
        return super.once(event, wrappedHandler);
    }
    /**
     * Get listener count for an event
     */
    listenerCount(event) {
        return super.listenerCount(event);
    }
    /**
     * Remove all listeners and clean up resources
     */
    dispose() {
        this.removeAllListeners();
        this.handlerMap.clear();
    }
}
exports.TypedEventEmitter = TypedEventEmitter;
//# sourceMappingURL=typed-emitter.js.map