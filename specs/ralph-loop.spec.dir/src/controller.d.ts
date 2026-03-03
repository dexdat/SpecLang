import { DatabaseInstance } from './types';
/**
 * LoopController - Main orchestrator for the Ralph Loop system
 *
 * Coordinates the BuilderAgent and VerifierAgent to process tasks
 * from the SQLite commands table in a continuous loop.
 */
export declare class LoopController {
    private db;
    private builder;
    private verifier;
    private isRunning;
    constructor(db: DatabaseInstance);
    /**
     * Create a new LoopController with a database connection
     * @param dbPath Path to SQLite database file
     * @returns Promise resolving to LoopController instance
     */
    static create(dbPath?: string): Promise<LoopController>;
    /**
     * Start the Ralph Loop - processes tasks continuously
     */
    start(): Promise<void>;
    /**
     * Stop the Ralph Loop
     */
    stop(): void;
    /**
     * Get the next pending task from the database
     * @returns Next task or null if no tasks available
     */
    private getNextTask;
    /**
     * Process a single task through Builder and Verifier phases
     * @param task The task to process
     */
    private processTask;
    /**
     * Handle task failure by creating steering packet and resetting for retry
     * @param task The failed task
     * @param error The error message
     */
    private handleFailure;
    /**
     * Sleep for a specified number of milliseconds
     * @param ms Number of milliseconds to sleep
     */
    private sleep;
}
//# sourceMappingURL=controller.d.ts.map