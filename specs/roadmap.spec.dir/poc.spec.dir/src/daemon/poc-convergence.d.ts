/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/poc-daemon.spec.md
 * Generated: 2026-03-03T05:35:00.000Z
 *
 * Edit the spec, not this file.
 */
import { EventEmitter } from 'events';
/**
 * POC Convergence Detector
 * Simple version - detects when no new events for a quiet period
 */
export declare class ConvergenceDetector extends EventEmitter {
    private lastEventTime;
    private quietPeriodMs;
    private cascadeStartTime;
    private filesChanged;
    private timer?;
    constructor(options?: {
        quietPeriodMs?: number;
    });
    /**
     * Called when a file event occurs
     */
    onFileChange(filePath: string): void;
    /**
     * Start convergence checking
     */
    private startConvergenceCheck;
    /**
     * Emit convergence event
     */
    private emitConvergence;
    /**
     * Stop convergence detector
     */
    stop(): void;
    /**
     * Get current state
     */
    getState(): {
        filesChanged: number;
        lastEventTime: number;
    };
}
//# sourceMappingURL=poc-convergence.d.ts.map