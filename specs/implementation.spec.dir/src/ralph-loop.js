"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifierAgent = exports.BuilderAgent = exports.LoopController = void 0;
#;
speclang - header;
lines: 3;
#;
target: src / ralph - loop.ts;
// Generated from Ralph Loop implementation spec
// DO NOT EDIT MANUALLY
// Block: implementation/ralph-loop/controller
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const promises_1 = require("fs/promises");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class LoopController {
    db;
    builder;
    verifier;
    isRunning = false;
    constructor(db) {
        this.db = db;
        this.builder = new BuilderAgent(db);
        this.verifier = new VerifierAgent(db);
    }
    static async create(dbPath = '.speclang/speclang.db') {
        const db = new better_sqlite3_1.default(dbPath);
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
    async getNextTask() {
        const stmtGetTask = this.db.prepare(`SELECT * FROM tasks WHERE status = 'pending' ORDER BY created_at LIMIT 1`);
        const task = stmtGetTask.get();
        return task || null;
    }
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
            await this.handleFailure(task, verification.errors);
            return;
        }
        // Success
        const stmtUpdateDone = this.db.prepare(`UPDATE tasks SET status = 'done', assigned_to = NULL WHERE id = ?`);
        stmtUpdateDone.run(task.id);
    }
    async handleFailure(task, error) {
        // Create steering packet
        const stmtInsertSteering = this.db.prepare(`INSERT INTO steering_packets (task_id, type, payload, created_at) VALUES (?, ?, ?, ?)`);
        stmtInsertSteering.run(task.id, 'error_report', JSON.stringify({ error }), Date.now());
        // Reset task status for retry
        const stmt2 = this.db.prepare(`UPDATE tasks SET status = 'pending', assigned_to = NULL WHERE id = ?`);
        stmt2.run(task.id);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.LoopController = LoopController;
// Block: implementation/ralph-loop/builder-agent
class BuilderAgent {
    db;
    constructor(db) {
        this.db = db;
    }
    async execute(task) {
        try {
            // Read spec context
            const specs = await this.loadSpecs();
            // Determine task type
            if (task.title.includes('implementation spec')) {
                const specPath = await this.writeImplementationSpec(task);
                return { output: { specPath } };
            }
            else if (task.title.includes('code generation')) {
                const codeFiles = await this.generateCode(task);
                return { output: { codeFiles } };
            }
            else {
                return { output: null, error: `Unknown task type: ${task.title}` };
            }
        }
        catch (error) {
            return { output: null, error: error.message };
        }
    }
    async loadSpecs() {
        const stmtSelectSpecs = this.db.prepare(`SELECT * FROM specs WHERE layer >= 3`);
        const rows = stmtSelectSpecs.all();
        return rows;
    }
    async writeImplementationSpec(task) {
        // Implementation spec writing logic
        // Use existing patterns from specs/implementation/
        const specContent = `# speclang-header lines:8\n...`;
        const specPath = `specs/implementation/${task.id}.spec.md`;
        await (0, promises_1.writeFile)(specPath, specContent);
        // Update SQLite
        const stmtInsertSpec = this.db.prepare(`INSERT INTO specs (file_path, id, short_desc) VALUES (?, ?, ?)`);
        stmtInsertSpec.run(specPath, `@implementation/${task.id}`, task.description);
        return specPath;
    }
    async generateCode(task) {
        // Code generation logic
        return [];
    }
}
exports.BuilderAgent = BuilderAgent;
// Block: implementation/ralph-loop/verifier-agent
class VerifierAgent {
    db;
    constructor(db) {
        this.db = db;
    }
    async validate(task, output) {
        const errors = [];
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
    async validateSpec(specPath) {
        const errors = [];
        const content = await (0, promises_1.readFile)(specPath, 'utf-8');
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
    async validateCode(codeFiles) {
        const errors = [];
        for (const file of codeFiles) {
            if (file.endsWith('.ts')) {
                // TypeScript compilation check
                try {
                    await execAsync(`npx tsc --noEmit ${file}`);
                }
                catch (error) {
                    errors.push(`TypeScript compilation failed for ${file}: ${error.stderr}`);
                }
            }
            else if (file.endsWith('.go')) {
                // Go build check
                try {
                    await execAsync(`go build ${file}`);
                }
                catch (error) {
                    errors.push(`Go compilation failed for ${file}: ${error.stderr}`);
                }
            }
        }
        return errors;
    }
    async validateReferences() {
        const errors = [];
        // Check that all @ref:... point to existing IDs in SQLite
        const stmtSelectRefs = this.db.prepare(`SELECT refs FROM specs WHERE refs IS NOT NULL`);
        const refs = stmtSelectRefs.all();
        // Implementation omitted for brevity
        return errors;
    }
}
exports.VerifierAgent = VerifierAgent;
//# sourceMappingURL=ralph-loop.js.map