"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/poc-daemon.spec.md
 * Generated: 2026-03-03T05:35:00.000Z
 *
 * Edit the spec, not this file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvergenceDetector = void 0;
const events_1 = require("events");
/**
 * POC Convergence Detector
 * Simple version - detects when no new events for a quiet period
 */
class ConvergenceDetector extends events_1.EventEmitter {
    lastEventTime;
    quietPeriodMs;
    cascadeStartTime;
    filesChanged;
    timer;
    constructor(options) {
        super();
        this.quietPeriodMs = options?.quietPeriodMs || 5000; // 5 seconds default
        this.lastEventTime = Date.now();
        this.cascadeStartTime = Date.now();
        this.filesChanged = new Set();
        this.startConvergenceCheck();
    }
    /**
     * Called when a file event occurs
     */
    onFileChange(filePath) {
        this.lastEventTime = Date.now();
        this.filesChanged.add(filePath);
    }
    /**
     * Start convergence checking
     */
    startConvergenceCheck() {
        // Check every 500ms
        this.timer = setInterval(() => {
            const now = Date.now();
            const timeSinceLastEvent = now - this.lastEventTime;
            if (timeSinceLastEvent >= this.quietPeriodMs && this.filesChanged.size > 0) {
                this.emitConvergence();
            }
        }, 500);
    }
    /**
     * Emit convergence event
     */
    emitConvergence() {
        const duration = Date.now() - this.cascadeStartTime;
        const event = {
            timestamp: Date.now(),
            filesChanged: Array.from(this.filesChanged),
            cascadeDepth: 1, // POC: always depth 1
            duration,
            tasksExecuted: this.filesChanged.size,
            successRate: 1.0
        };
        // Reset for next cascade
        this.filesChanged = new Set();
        this.cascadeStartTime = Date.now();
        this.emit('converged', event);
    }
    /**
     * Stop convergence detector
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }
    /**
     * Get current state
     */
    getState() {
        return {
            filesChanged: this.filesChanged.size,
            lastEventTime: this.lastEventTime
        };
    }
}
exports.ConvergenceDetector = ConvergenceDetector;
//# sourceMappingURL=poc-convergence.js.map