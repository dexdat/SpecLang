// speclang-header lines:3
// target: src/ralph-loop.ts
// Generated from Ralph Loop implementation spec
// DO NOT EDIT MANUALLY


// Block: implementation/ralph-loop/controller
import Database from 'better-sqlite3';
// QA-SPECLANG-5-R2: the loop's state DB is opened only through the guarded
// helper, so a file that is not a SQLite database reports the actionable
// diagnostic instead of a raw SqliteError from the first prepared statement.
// (Specifier note: through the src/db projection — this spec dir's own compiled
// index.js is stale and would shadow the guarded TypeScript source for .js
// specifiers.)
import { openStateDatabase, STATE_DB_CORRUPT_CODE } from '../../../src/db/index.js';
import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'done' | 'failed';
  assigned_to: 'builder' | 'verifier' | null;
  created_at: number;
  updated_at: number;
}

export class LoopController {
  private db!: Database.Database;
  private builder: BuilderAgent;
  private verifier: VerifierAgent;
  private isRunning: boolean = false;

  constructor(db: Database.Database) {
    this.db = db;
    this.builder = new BuilderAgent(db);
    this.verifier = new VerifierAgent(db);
  }

  static async create(dbPath: string = '.speclang/speclang.db'): Promise<LoopController> {
    // QA-SPECLANG-5-R2: guarded open — the loop used to die on a raw
    // `SqliteError: file is not a database` the first time it prepared a
    // statement against a corrupt `.speclang/speclang.db`.
    const db = openStateDatabase(dbPath);
    return new LoopController(db);
  }

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

  private async getNextTask(): Promise<Task | null> {
    const stmtGetTask = this.db.prepare(`SELECT * FROM tasks WHERE status = 'pending' ORDER BY created_at LIMIT 1`);
    const task = stmtGetTask.get() as Task | null;
    return task || null;
  }

  private async processTask(task: Task) {
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
      await this.handleFailure(task, verification.errors);
      return;
    }

    // Success
    const stmtUpdateDone = this.db.prepare(`UPDATE tasks SET status = 'done', assigned_to = NULL WHERE id = ?`);
    stmtUpdateDone.run(task.id);
  }

  private async handleFailure(task: Task, error: any) {
    // Create steering packet
    const stmtInsertSteering = this.db.prepare(`INSERT INTO steering_packets (task_id, type, payload, created_at) VALUES (?, ?, ?, ?)`);
    stmtInsertSteering.run(task.id, 'error_report', JSON.stringify({ error }), Date.now());

    // Reset task status for retry
    const stmt2 = this.db.prepare(`UPDATE tasks SET status = 'pending', assigned_to = NULL WHERE id = ?`);
    stmt2.run(task.id);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Block: implementation/ralph-loop/builder-agent


export class BuilderAgent {
  constructor(private db: Database.Database) {}

  async execute(task: Task): Promise<{ output: any; error?: string }> {
    try {
      // Read spec context
      const specs = await this.loadSpecs();
      
      // Determine task type
      if (task.title.includes('implementation spec')) {
        const specPath = await this.writeImplementationSpec(task);
        return { output: { specPath } };
      } else if (task.title.includes('code generation')) {
        const codeFiles = await this.generateCode(task);
        return { output: { codeFiles } };
      } else {
        return { output: null, error: `Unknown task type: ${task.title}` };
      }
    } catch (error) {
      return { output: null, error: (error as Error).message };
    }
  }

  private async loadSpecs(): Promise<any[]> {
    const stmtSelectSpecs = this.db.prepare(`SELECT * FROM specs WHERE layer >= 3`);
    const rows = stmtSelectSpecs.all();
    return rows;
  }

  private async writeImplementationSpec(task: Task): Promise<string> {
    // Implementation spec writing logic
    // Use existing patterns from specs/implementation/
    const specContent = `# speclang-header lines:8\n...`;
    const specPath = `specs/implementation/${task.id}.spec.md`;
    await writeFile(specPath, specContent);
    
    // Update SQLite
    const stmtInsertSpec = this.db.prepare(`INSERT INTO specs (file_path, id, short_desc) VALUES (?, ?, ?)`);
    stmtInsertSpec.run(specPath, `@implementation/${task.id}`, task.description);
    
    return specPath;
  }

  private async generateCode(task: Task): Promise<string[]> {
    // Code generation logic
    return [];
  }
}

// Block: implementation/ralph-loop/verifier-agent


export class VerifierAgent {
  constructor(private db: Database.Database) {}

  async validate(task: Task, output: any): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate spec format
    if (output.specPath) {
      const specErrors = await this.validateSpec(output.specPath);
      errors.push(...specErrors);
    }

    // Validate code compilation
    if (output.codeFiles) {
      const compileErrors = await this.validateCode(output.codeFiles);
      errors.push(...compileErrors);
    }

    // Validate references
    const refErrors = await this.validateReferences();
    errors.push(...refErrors);

    return {
      success: errors.length === 0,
      errors
    };
  }

  private async validateSpec(specPath: string): Promise<string[]> {
    const errors: string[] = [];
    const content = await readFile(specPath, 'utf-8');
    
    // Check for speclang-header
    if (!content.includes('# speclang-header')) {
      errors.push(`Missing speclang-header in ${specPath}`);
    }

    // Parse header lines
    const headerMatch = content.match(/# speclang-header lines:(\d+)/);
    if (headerMatch) {
      const expectedLines = parseInt(headerMatch[1]);
      const lines = content.split('\n');
      const headerEnd = lines.findIndex(line => line.trim() === '---');
      if (headerEnd !== expectedLines - 1) {
        errors.push(`Header line count mismatch in ${specPath}`);
      }
    }

    return errors;
  }

  private async validateCode(codeFiles: string[]): Promise<string[]> {
    const errors: string[] = [];
    
    for (const file of codeFiles) {
      if (file.endsWith('.ts')) {
        // TypeScript compilation check
        try {
          await execAsync(`npx tsc --noEmit ${file}`);
        } catch (error) {
          errors.push(`TypeScript compilation failed for ${file}: ${(error as any).stderr}`);
        }
      } else if (file.endsWith('.go')) {
        // Go build check
        try {
          await execAsync(`go build ${file}`);
        } catch (error) {
          errors.push(`Go compilation failed for ${file}: ${(error as any).stderr}`);
        }
      }
    }
    
    return errors;
  }

  private async validateReferences(): Promise<string[]> {
    const errors: string[] = [];
    // Check that all @ref:... point to existing IDs in SQLite
    const stmtSelectRefs = this.db.prepare(`SELECT refs FROM specs WHERE refs IS NOT NULL`);
    const refs = stmtSelectRefs.all();
    // Implementation omitted for brevity
    return errors;
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

/**
 * Run the loop against the project state DB: `tsx src/ralph-loop.ts [dbPath]`.
 *
 * QA-SPECLANG-5-R2: a corrupt state DB must stop the loop before the first task
 * is read, and say what is wrong (which file, and the documented recovery step)
 * instead of surfacing a raw SqliteError from a prepared statement.
 */
async function main(): Promise<void> {
  const dbPath = process.argv[2] ?? '.speclang/speclang.db';

  try {
    const controller = await LoopController.create(dbPath);
    await controller.start();
  } catch (error) {
    if ((error as { code?: string } | undefined)?.code === STATE_DB_CORRUPT_CODE) {
      console.error((error as Error).message);
      process.exit(1);
    }
    console.error('Ralph Loop failed:', error);
    process.exit(1);
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  void main();
}
