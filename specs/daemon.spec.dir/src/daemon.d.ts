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
import { DaemonCommand, DaemonStatus } from './types';
export declare class Daemon extends EventEmitter {
    private watcher;
    private router;
    private convergence;
    private state;
    private ipc;
    private config;
    private lockManager;
    private running;
    private paused;
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
    /**
     * Get current daemon status
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
     * Execute pipeline on convergence
     */
    private executePipeline;
}
export declare function createDaemon(configPath?: string): Promise<Daemon>;
export declare function getDaemon(): Daemon | null;
//# sourceMappingURL=daemon.d.ts.map