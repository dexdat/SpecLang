// Generated from specs/implementation.spec.dir/ralph-loop-implementation.spec.md
// DO NOT EDIT MANUALLY
// Source: @speclang/implementation.ralph-loop

// eslint-disable-next-line @typescript-eslint/no-var-requires
const DatabaseModule = require('better-sqlite3');
const Database = DatabaseModule.default || DatabaseModule;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as path from 'path';
import { Task, DatabaseInstance, BuilderResult, VerificationResult } from './types';
import { BuilderAgent } from './builder-agent';
import { VerifierAgent } from './verifier-agent';

/**
 * LoopController - Main orchestrator for the Ralph Loop system
 * 
 * Coordinates the BuilderAgent and VerifierAgent to process tasks
 * from the SQLite commands table in a continuous loop.
 */
export class LoopController {
  private db!: DatabaseInstance;
  private builder: BuilderAgent;
  private verifier: VerifierAgent;
  private isRunning: boolean = false;

  constructor(db: DatabaseInstance) {
    this.db = db;
    this.builder = new BuilderAgent(db);
    this.verifier = new VerifierAgent(db);
  }

  /**
   * Create a new LoopController with a database connection
   * @param dbPath Path to SQLite database file
   * @returns Promise resolving to LoopController instance
   */
  static async create(dbPath: string = '.speclang/speclang.db'): Promise<LoopController> {
    const db = new Database(dbPath);
    return new LoopController(db);
  }

  /**
   * Start the Ralph Loop - processes tasks continuously
   */
  async start(): Promise<void> {
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
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Get the next pending task from the database
   * @returns Next task or null if no tasks available
   */
  private async getNextTask(): Promise<Task | null> {
    const stmtGetTask = this.db.prepare(`SELECT * FROM tasks WHERE status = 'pending' ORDER BY created_at LIMIT 1`);
    const task = stmtGetTask.get() as Task | null;
    return task || null;
  }

  /**
   * Process a single task through Builder and Verifier phases
   * @param task The task to process
   */
  private async processTask(task: Task): Promise<void> {
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
  private async handleFailure(task: Task, error: string): Promise<void> {
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
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
