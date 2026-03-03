"use strict";
// Generated from specs/implementation.spec.dir/ralph-loop-implementation.spec.md
// DO NOT EDIT MANUALLY
// Source: @speclang/implementation.ralph-loop
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoopController = void 0;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DatabaseModule = require('better-sqlite3');
const Database = DatabaseModule.default || DatabaseModule;
const builder_agent_1 = require("./builder-agent");
const verifier_agent_1 = require("./verifier-agent");
/**
 * LoopController - Main orchestrator for the Ralph Loop system
 *
 * Coordinates the BuilderAgent and VerifierAgent to process tasks
 * from the SQLite commands table in a continuous loop.
 */
class LoopController {
    db;
    builder;
    verifier;
    isRunning = false;
    constructor(db) {
        this.db = db;
        this.builder = new builder_agent_1.BuilderAgent(db);
        this.verifier = new verifier_agent_1.VerifierAgent(db);
    }
    /**
     * Create a new LoopController with a database connection
     * @param dbPath Path to SQLite database file
     * @returns Promise resolving to LoopController instance
     */
    static async create(dbPath = '.speclang/speclang.db') {
        const db = new Database(dbPath);
        return new LoopController(db);
    }
    /**
     * Start the Ralph Loop - processes tasks continuously
     */
    async start() {
        this.isRunning = true;
        while (this.isRunning) {
            const task = await this.getNextTask();
            if (!task) {
                // No pending tasks, wait for new tasks
                await this.sleep(5000);
                continue;
            }
            await this.processTask(task);
        }
    }
    /**
     * Stop the Ralph Loop
     */
    stop() {
        this.isRunning = false;
    }
    /**
     * Get the next pending task from the database
     * @returns Next task or null if no tasks available
     */
    async getNextTask() {
        const stmtGetTask = this.db.prepare(`SELECT * FROM tasks WHERE status = 'pending' ORDER BY created_at LIMIT 1`);
        const task = stmtGetTask.get();
        return task || null;
    }
    /**
     * Process a single task through Builder and Verifier phases
     * @param task The task to process
     */
    async processTask(task) {
        // Update status
        const stmtUpdateProgress = this.db.prepare(`UPDATE tasks SET status = 'in_progress', assigned_to = 'builder' WHERE id = ?`);
        stmtUpdateProgress.run(task.id);
        // Builder phase
        const builderResult = await this.builder.execute(task);
        if (builderResult.error) {
            await this.handleFailure(task, builderResult.error);
            return;
        }
        // Verifier phase
        const verification = await this.verifier.validate(task, builderResult.output);
        if (!verification.success) {
            await this.handleFailure(task, verification.errors.join(', '));
            return;
        }
        // Success
        const stmtUpdateDone = this.db.prepare(`UPDATE tasks SET status = 'done', assigned_to = NULL WHERE id = ?`);
        stmtUpdateDone.run(task.id);
    }
    /**
     * Handle task failure by creating steering packet and resetting for retry
     * @param task The failed task
     * @param error The error message
     */
    async handleFailure(task, error) {
        // Create steering packet
        const stmtInsertSteering = this.db.prepare(`INSERT INTO steering_packets (task_id, type, payload, created_at) VALUES (?, ?, ?, ?)`);
        stmtInsertSteering.run(task.id, 'error_report', JSON.stringify({ error }), Date.now());
        // Reset task status for retry
        const stmt2 = this.db.prepare(`UPDATE tasks SET status = 'pending', assigned_to = NULL WHERE id = ?`);
        stmt2.run(task.id);
    }
    /**
     * Sleep for a specified number of milliseconds
     * @param ms Number of milliseconds to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.LoopController = LoopController;
//# sourceMappingURL=controller.js.map