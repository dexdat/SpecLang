"use strict";
/**
 * Debounce utility for batching rapid file events
 *
 * Generated from: @speclang/daemon/events
 *
 * Batches rapid file changes within a time window to prevent
 * overwhelming the system with too many events.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Debouncer = void 0;
const events_1 = require("events");
const types_1 = require("./types");
class Debouncer extends events_1.EventEmitter {
    events;
    timer;
    windowMs;
    maxBatchSize;
    pending;
    constructor(options = {}) {
        super();
        this.events = [];
        this.windowMs = options.windowMs ?? 100;
        this.maxBatchSize = options.maxBatchSize ?? 50;
        this.pending = false;
    }
    /**
     * Add an event to the batch
     */
    add(event) {
        // Merge events for same file (keep latest)
        const existingIndex = this.events.findIndex(e => e.path === event.path);
        if (existingIndex >= 0) {
            // Update existing event (merge create/modify/delete logic)
            const existing = this.events[existingIndex];
            if (event.kind === types_1.FileEventKind.Delete) {
                // If delete, mark as deleted (or remove if was create)
                if (existing.kind === types_1.FileEventKind.Create) {
                    this.events.splice(existingIndex, 1);
                }
                else {
                    this.events[existingIndex] = event;
                }
            }
            else {
                // Modify or Create - just update
                this.events[existingIndex] = event;
            }
        }
        else {
            this.events.push(event);
        }
        // Check if we should flush immediately
        if (this.events.length >= this.maxBatchSize) {
            this.flush();
        }
        else if (!this.pending) {
            this.pending = true;
            this.timer = setTimeout(() => this.flush(), this.windowMs);
        }
    }
    /**
     * Flush all pending events
     */
    flush() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
        if (this.events.length === 0) {
            this.pending = false;
            return;
        }
        const events = [...this.events];
        this.events = [];
        this.pending = false;
        const batchEvent = {
            events,
            timestamp: Date.now(),
        };
        this.emit('batch', batchEvent);
    }
    /**
     * Get current batch size
     */
    get pendingCount() {
        return this.events.length;
    }
    /**
     * Check if there are pending events
     */
    get isPending() {
        return this.pending;
    }
    /**
     * Clear all pending events without emitting
     */
    clear() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
        this.events = [];
        this.pending = false;
    }
}
exports.Debouncer = Debouncer;
//# sourceMappingURL=debounce.js.map