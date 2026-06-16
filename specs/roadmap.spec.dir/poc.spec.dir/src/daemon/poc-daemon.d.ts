/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/poc-daemon.spec.md
 * Generated: 2026-03-03T05:35:00.000Z
 *
 * Edit the spec, not this file.
 */
/**
 * Main entry point that wires all POC components together.
 */
export declare class PocDaemon {
    private watcher;
    private router;
    private agent;
    private convergence;
    private isRunning;
    constructor();
    /**
     * Setup event handlers between components
     */
    private setupEventHandlers;
    /**
     * Start the POC daemon
     */
    start(): Promise<void>;
    /**
     * Process existing specs on startup
     * Ensures all specs have generated code
     */
    private processExistingSpecs;
    /**
     * Process a single spec file
     */
    private processSpecFile;
    /**
     * Check if spec is up to date
     */
    private isUpToDate;
    /**
     * Convert spec path to generated path
     */
    private getGeneratedPath;
    /**
     * Stop the daemon
     */
    stop(): Promise<void>;
    /**
     * Check if daemon is running
     */
    getIsRunning(): boolean;
}
//# sourceMappingURL=poc-daemon.d.ts.map