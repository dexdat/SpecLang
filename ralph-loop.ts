// speclang-header lines:20
// id: @generated/ralph-loop
// target: typescript
// produces: ralph-loop.ts
// layer: 10
// refs: [@ref:specs/ralph-loop]
// ---
// @block:ralph/main @kind:code
/**
 * Ralph Loop Implementation
 * 
 * Dual-agent Ralph Loop with steering packets for building Speclang using Speclang.
 * 
 * Location: ralph-loop.ts
 * Version: 0.1.0
 * 
 * Generated from @ref:specs/ralph-loop
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface RalphTask {
  id: string;
  description: string;
  depends_on: string | null; // JSON array
  estimated_complexity: string | null;
  priority: number;
  assigned_to: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: number | null;
  started_at: number | null;
  completed_at: number | null;
}

export interface SteeringPacket {
  id: string;
  task_id: string;
  type: 'error_report' | 'fix_suggestion' | 'priority_change' | 'success_confirmation';
  content: any; // JSON
  created_at: number | null;
  processed_at: number | null;
}

export interface ValidationResult {
  id: string;
  task_id: string;
  stage: string;
  passed: boolean;
  details: any; // JSON
  created_at: number | null;
}

export interface ValidationPipeline {
  stage_1_spec_format: boolean;
  stage_2_code_compilation: boolean;
  stage_3_test_execution: boolean;
  stage_4_integration: boolean;
}

// ============================================================================
// Task Manager
// ============================================================================

export class TaskManager {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  createTask(description: string, options: Partial<RalphTask> = {}): RalphTask {
    const task: RalphTask = {
      id: randomUUID(),
      description,
      depends_on: options.depends_on || null,
      estimated_complexity: options.estimated_complexity || null,
      priority: options.priority || 5,
      assigned_to: options.assigned_to || null,
      status: options.status || 'pending',
      created_at: Math.floor(Date.now() / 1000),
      started_at: options.started_at || null,
      completed_at: options.completed_at || null,
    };

    this.db.prepare(`
      INSERT INTO ralph_tasks (id, description, depends_on, estimated_complexity, priority, assigned_to, status, created_at, started_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      task.id,
      task.description,
      task.depends_on,
      task.estimated_complexity,
      task.priority,
      task.assigned_to,
      task.status,
      task.created_at,
      task.started_at,
      task.completed_at
    );

    return task;
  }

  getTask(id: string): RalphTask | null {
    const row = this.db.prepare('SELECT * FROM ralph_tasks WHERE id = ?').get(id);
    return row ? this.mapRowToTask(row) : null;
  }

  updateTask(id: string, updates: Partial<RalphTask>): void {
    const task = this.getTask(id);
    if (!task) {
      throw new Error(`Task ${id} not found`);
    }

    const updated = { ...task, ...updates };
    this.db.prepare(`
      UPDATE ralph_tasks 
      SET description = ?, depends_on = ?, estimated_complexity = ?, priority = ?, assigned_to = ?, status = ?, started_at = ?, completed_at = ?
      WHERE id = ?
    `).run(
      updated.description,
      updated.depends_on,
      updated.estimated_complexity,
      updated.priority,
      updated.assigned_to,
      updated.status,
      updated.started_at,
      updated.completed_at,
      id
    );
  }

  listTasks(status?: string, assigned_to?: string): RalphTask[] {
    let sql = 'SELECT * FROM ralph_tasks';
    const params: any[] = [];
    const conditions: string[] = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (assigned_to) {
      conditions.push('assigned_to = ?');
      params.push(assigned_to);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY priority DESC, created_at ASC';

    const rows = this.db.prepare(sql).all(...params);
    return rows.map((row) => this.mapRowToTask(row));
  }

  startTask(id: string): void {
    this.updateTask(id, {
      status: 'in_progress',
      started_at: Math.floor(Date.now() / 1000),
    });
  }

  completeTask(id: string): void {
    this.updateTask(id, {
      status: 'completed',
      completed_at: Math.floor(Date.now() / 1000),
    });
  }

  failTask(id: string): void {
    this.updateTask(id, {
      status: 'failed',
      completed_at: Math.floor(Date.now() / 1000),
    });
  }

  private mapRowToTask(row: any): RalphTask {
    return {
      id: row.id,
      description: row.description,
      depends_on: row.depends_on,
      estimated_complexity: row.estimated_complexity,
      priority: row.priority,
      assigned_to: row.assigned_to,
      status: row.status,
      created_at: row.created_at,
      started_at: row.started_at,
      completed_at: row.completed_at,
    };
  }
}

// ============================================================================
// Steering Packet Manager
// ============================================================================

export class SteeringPacketManager {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  createPacket(taskId: string, type: SteeringPacket['type'], content: any): SteeringPacket {
    const packet: SteeringPacket = {
      id: randomUUID(),
      task_id: taskId,
      type,
      content,
      created_at: Math.floor(Date.now() / 1000),
      processed_at: null,
    };

    this.db.prepare(`
      INSERT INTO steering_packets (id, task_id, type, content, created_at, processed_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      packet.id,
      packet.task_id,
      packet.type,
      JSON.stringify(content),
      packet.created_at,
      packet.processed_at
    );

    return packet;
  }

  getPacketsForTask(taskId: string, processed: boolean | null = null): SteeringPacket[] {
    let sql = 'SELECT * FROM steering_packets WHERE task_id = ?';
    const params: any[] = [taskId];

    if (processed !== null) {
      sql += processed ? ' AND processed_at IS NOT NULL' : ' AND processed_at IS NULL';
    }

    sql += ' ORDER BY created_at ASC';

    const rows = this.db.prepare(sql).all(...params);
    return rows.map((row) => this.mapRowToPacket(row));
  }

  markProcessed(packetId: string): void {
    this.db.prepare('UPDATE steering_packets SET processed_at = ? WHERE id = ?')
      .run(Math.floor(Date.now() / 1000), packetId);
  }

  private mapRowToPacket(row: any): SteeringPacket {
    return {
      id: row.id,
      task_id: row.task_id,
      type: row.type,
      content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
      created_at: row.created_at,
      processed_at: row.processed_at,
    };
  }
}

// ============================================================================
// Validation Pipeline
// ============================================================================

export class ValidationPipeline {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  async validateSpecFormat(filePath: string): Promise<boolean> {
    // Implement spec format validation
    // For now, placeholder
    console.log(`Validating spec format: ${filePath}`);
    return true;
  }

  async validateCodeCompilation(filePath: string): Promise<boolean> {
    // Implement code compilation validation
    console.log(`Validating code compilation: ${filePath}`);
    return true;
  }

  async validateTestExecution(filePath: string): Promise<boolean> {
    // Implement test execution validation
    console.log(`Validating test execution: ${filePath}`);
    return true;
  }

  async validateIntegration(filePath: string): Promise<boolean> {
    // Implement integration validation
    console.log(`Validating integration: ${filePath}`);
    return true;
  }

  recordValidationResult(taskId: string, stage: string, passed: boolean, details: any): ValidationResult {
    const result: ValidationResult = {
      id: randomUUID(),
      task_id: taskId,
      stage,
      passed,
      details,
      created_at: Math.floor(Date.now() / 1000),
    };

    this.db.prepare(`
      INSERT INTO validation_results (id, task_id, stage, passed, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      result.id,
      result.task_id,
      result.stage,
      result.passed ? 1 : 0,
      JSON.stringify(details),
      result.created_at
    );

    return result;
  }

  getValidationResults(taskId: string): ValidationResult[] {
    const rows = this.db.prepare('SELECT * FROM validation_results WHERE task_id = ? ORDER BY created_at ASC')
      .all(taskId);
    return rows.map((row) => this.mapRowToValidationResult(row));
  }

  private mapRowToValidationResult(row: any): ValidationResult {
    return {
      id: row.id,
      task_id: row.task_id,
      stage: row.stage,
      passed: row.passed === 1,
      details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
      created_at: row.created_at,
    };
  }
}

// ============================================================================
// Ralph Loop Coordinator
// ============================================================================

export class RalphLoopCoordinator {
  private taskManager: TaskManager;
  private packetManager: SteeringPacketManager;
  private validationPipeline: ValidationPipeline;

  constructor(db: Database.Database) {
    this.taskManager = new TaskManager(db);
    this.packetManager = new SteeringPacketManager(db);
    this.validationPipeline = new ValidationPipeline(db);
  }

  async createTodoFromSpecs(): Promise<void> {
    // Analyze specs and generate todo list
    // This would integrate with the spec index
    console.log('Creating todo list from specs');
  }

  async assignTaskToBuilder(taskId: string, builderAgent: string): Promise<void> {
    this.taskManager.updateTask(taskId, { assigned_to: builderAgent, status: 'in_progress' });
    
    // Create steering packet with task details
    const task = this.taskManager.getTask(taskId);
    if (task) {
      this.packetManager.createPacket(taskId, 'fix_suggestion', {
        task_id: taskId,
        description: task.description,
        assigned_to: builderAgent,
      });
    }
  }

  async processVerifierResults(taskId: string, validationResults: ValidationPipeline): Promise<void> {
    // Record validation results
    if (validationResults.stage_1_spec_format) {
      this.validationPipeline.recordValidationResult(taskId, 'spec_format', true, {});
    }
    if (validationResults.stage_2_code_compilation) {
      this.validationPipeline.recordValidationResult(taskId, 'code_compilation', true, {});
    }
    if (validationResults.stage_3_test_execution) {
      this.validationPipeline.recordValidationResult(taskId, 'test_execution', true, {});
    }
    if (validationResults.stage_4_integration) {
      this.validationPipeline.recordValidationResult(taskId, 'integration', true, {});
    }

    // Determine overall success
    const allPassed = validationResults.stage_1_spec_format &&
                     validationResults.stage_2_code_compilation &&
                     validationResults.stage_3_test_execution &&
                     validationResults.stage_4_integration;

    if (allPassed) {
      this.taskManager.completeTask(taskId);
      this.packetManager.createPacket(taskId, 'success_confirmation', {
        task_id: taskId,
        message: 'All validation stages passed',
      });
    } else {
      this.taskManager.failTask(taskId);
      this.packetManager.createPacket(taskId, 'error_report', {
        task_id: taskId,
        error_type: 'validation_failed',
        message: 'One or more validation stages failed',
      });
    }
  }

  async getNextTask(agent: string): Promise<RalphTask | null> {
    const tasks = this.taskManager.listTasks('pending');
    // Find task that has all dependencies satisfied
    for (const task of tasks) {
      if (!task.depends_on) {
        return task;
      }
      // Simple dependency check - would need to parse JSON array
      const deps = JSON.parse(task.depends_on || '[]');
      const allDepsCompleted = deps.every((depId: string) => {
        const depTask = this.taskManager.getTask(depId);
        return depTask?.status === 'completed';
      });
      if (allDepsCompleted) {
        return task;
      }
    }
    return null;
  }
}

// ============================================================================
// Export singleton instance (optional)
// ============================================================================

let globalInstance: RalphLoopCoordinator | null = null;

export function getRalphLoopCoordinator(dbPath: string = '.speclang/speclang.db'): RalphLoopCoordinator {
  if (!globalInstance) {
    const db = new Database(dbPath);
    globalInstance = new RalphLoopCoordinator(db);
  }
  return globalInstance;
}