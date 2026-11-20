/**
 * Main Daemon class for speclangd simulation
 *
 * Generated from: @speclang/daemon
 *
 * This ties together all the components: watcher, router, convergence, state, IPC
 */
import { EventEmitter } from 'events';
import { Router } from './router';
import { ConvergenceDetector } from './convergence';
import { Config } from './config';
import { LockManager } from './locks';
import { SessionStore } from './session-store';
import { DaemonCommand, DaemonStatus } from './types';
/** Executor locations for the source symlink, spec tree and compiled tree. */
export declare function getPipelineExecutorCandidates(moduleUrl?: URL): string[];
export declare class Daemon extends EventEmitter {
    private watcher;
    private router;
    private convergence;
    private state;
    private ipc;
    private config;
    private lockManager;
    private sessionStore;
    private running;
    private paused;
    private pipelineFailures;
    private pipelineErrors;
    constructor(configPath?: string);
    /**
     * Initialize and start the daemon
     */
    start(): Promise<void>;
    /**
     * Stop the daemon
     */
    stop(): Promise<void>;
    /**
     * Restart the daemon
     */
    restart(): Promise<void>;
    /**
     * Handle a file event
     */
    private handleFileEvent;
    /**
     * Process a command
     */
    processCommand(command: DaemonCommand): Promise<void>;
    /**
     * Abort current cascade
     */
    abort(): Promise<void>;
    /** Publish a snapshot without letting telemetry failures break a cascade. */
    private publishMetrics;
    /**
     * Get current daemon status
     *
     * DF-SPECLANG-4: status comes from the cascade LIFECYCLE (pending work vs
     * settled), not from `isConverged()` — a quiet-period predicate that is also
     * true for a re-armed detector that never got an event. That predicate made
     * `/api/status` report `cascading` forever after the cascade drained.
     */
    getStatus(): DaemonStatus;
    /**
     * Check if daemon is running
     */
    isRunning(): boolean;
    /**
     * Check if daemon is paused
     */
    isPaused(): boolean;
    /**
     * Health check for daemon
     */
    healthCheck(): boolean;
    /**
     * Get convergence detector
     */
    getConvergence(): ConvergenceDetector;
    /**
     * Get router
     */
    getRouter(): Router;
    /**
     * Get config
     */
    getConfig(): Config;
    /**
     * Get lock manager
     */
    getLockManager(): LockManager;
    /**
     * Get session store
     */
    getSessionStore(): SessionStore;
    /**
     * Execute pipeline on convergence
     */
    private executePipeline;
    /**
     * DF-SPECLANG-024: attribute what this convergence pass WROTE and hand it to
     * the detector, which owns the user-visible count and the completion line.
     *
     * The diff is taken from the project tree, not from stage output, so a stage
     * that writes files without saying so is still counted and a stage that
     * rewrites a file with identical bytes is not.
     */
    private reportPipelineOutputs;
    /**
     * DF-SPECLANG-024: the exclusions the output snapshot uses.
     *
     * Only the FILE-shaped entries of the project's own `watch.ignore` list apply
     * (`*.log` and friends) — those are the paths the daemon already treats as
     * project noise, so a log redirected into the project while a cascade runs is
     * not counted as generated code. Directory-shaped patterns (`generated/`) are
     * deliberately NOT applied: a project may generate into a directory with that
     * name, and excluding it would under-count the very thing being measured.
     */
    private outputSnapshotOptions;
}
export declare function createDaemon(configPath?: string): Promise<Daemon>;
export declare function getDaemon(): Daemon | null;
//# sourceMappingURL=daemon.d.ts.map