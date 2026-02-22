// Generated from Ralph Loop implementation spec
// DO NOT EDIT MANUALLY


// Block: implementation/ralph-loop/controller
import { Database } from 'sqlite3';
import { open } from 'sqlite';
import { BuilderAgent } from './builder-agent';
import { VerifierAgent } from './verifier-agent';

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
  private db: Database;
  private builder: BuilderAgent;
  private verifier: VerifierAgent;
  private isRunning: boolean = false;

  constructor(dbPath: string = '.speclang/speclang.db') {
    this.db = await open({
      filename: dbPath,
      driver: require('sqlite3').Database
    });
    this.builder = new BuilderAgent(this.db);
    this.verifier = new VerifierAgent(this.db);
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
    const task = await this.db.get(
      `SELECT * FROM tasks WHERE status = 'pending' ORDER BY created_at LIMIT 1`
    );
    return task || null;
  }

  private async processTask(task: Task) {
    // Update status
    await this.db.run(
      `UPDATE tasks SET status = 'in_progress', assigned_to = 'builder' WHERE id = ?`,
      task.id
    );

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
    await this.db.run(
      `UPDATE tasks SET status = 'done', assigned_to = NULL WHERE id = ?`,
      task.id
    );
  }

  private async handleFailure(task: Task, error: any) {
    // Create steering packet
    await this.db.run(
      `INSERT INTO steering_packets (task_id, type, payload, created_at) VALUES (?, ?, ?, ?)`,
      [task.id, 'error_report', JSON.stringify({ error }), Date.now()]
    );

    // Reset task status for retry
    await this.db.run(
      `UPDATE tasks SET status = 'pending', assigned_to = NULL WHERE id = ?`,
      task.id
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Block: implementation/ralph-loop/builder-agent
import { Database } from 'sqlite3';
import { open } from 'sqlite';
import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';

export class BuilderAgent {
  constructor(private db: Database) {}

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
        return { error: `Unknown task type: ${task.title}` };
      }
    } catch (error) {
      return { error: error.message };
    }
  }

  private async loadSpecs(): Promise<any[]> {
    const rows = await this.db.all(`SELECT * FROM specs WHERE layer >= 3`);
    return rows;
  }

  private async writeImplementationSpec(task: Task): Promise<string> {
    // Implementation spec writing logic
    // Use existing patterns from specs/implementation/
    const specContent = `# speclang-header lines:8\n...`;
    const specPath = `specs/implementation/${task.id}.spec.md`;
    await writeFile(specPath, specContent);
    
    // Update SQLite
    await this.db.run(
      `INSERT INTO specs (file_path, id, short_desc) VALUES (?, ?, ?)`,
      [specPath, `@implementation/${task.id}`, task.description]
    );
    
    return specPath;
  }

  private async generateCode(task: Task): Promise<string[]> {
    // Code generation logic
    return [];
  }
}

// Block: implementation/ralph-loop/verifier-agent
import { Database } from 'sqlite3';
import { open } from 'sqlite';
import { readFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class VerifierAgent {
  constructor(private db: Database) {}

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
          errors.push(`TypeScript compilation failed for ${file}: ${error.stderr}`);
        }
      } else if (file.endsWith('.go')) {
        // Go build check
        try {
          await execAsync(`go build ${file}`);
        } catch (error) {
          errors.push(`Go compilation failed for ${file}: ${error.stderr}`);
        }
      }
    }
    
    return errors;
  }

  private async validateReferences(): Promise<string[]> {
    const errors: string[] = [];
    // Check that all @ref:... point to existing IDs in SQLite
    const refs = await this.db.all(`SELECT refs FROM specs WHERE refs IS NOT NULL`);
    // Implementation omitted for brevity
    return errors;
  }
}
