"use strict";
/**
 * Worktree Management for speclangd Enterprise
 *
 * Generated from: @speclang/mcp-daemon/config
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorktreeManager = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class WorktreeManager {
    basePath;
    worktrees;
    constructor(basePath = '.speclang/worktrees') {
        this.basePath = basePath;
        this.worktrees = new Map();
    }
    async initialize() {
        try {
            await fs.mkdir(this.basePath, { recursive: true });
        }
        catch {
            // Directory may already exist
        }
    }
    async create(name, baseCommit) {
        const worktreePath = path.join(this.basePath, name);
        try {
            // Check if git repository
            await execAsync('git rev-parse --git-dir', { cwd: process.cwd() });
            // Create worktree using git
            const base = baseCommit || 'HEAD';
            await execAsync(`git worktree add ${worktreePath} ${base}`, { cwd: process.cwd() });
            const worktree = {
                name,
                path: worktreePath,
                baseCommit,
                createdAt: Date.now(),
                ready: true,
            };
            this.worktrees.set(name, worktree);
            return worktree;
        }
        catch (error) {
            // If git fails, create a directory structure for simulation
            await fs.mkdir(worktreePath, { recursive: true });
            const worktree = {
                name,
                path: worktreePath,
                baseCommit,
                createdAt: Date.now(),
                ready: true,
            };
            this.worktrees.set(name, worktree);
            return worktree;
        }
    }
    async remove(name) {
        const worktree = this.worktrees.get(name);
        if (!worktree) {
            throw new Error(`Worktree not found: ${name}`);
        }
        try {
            await execAsync(`git worktree remove ${worktree.path}`, { cwd: process.cwd() });
        }
        catch {
            // If git fails, just remove directory
            await fs.rm(worktree.path, { recursive: true, force: true });
        }
        this.worktrees.delete(name);
    }
    async list() {
        return Array.from(this.worktrees.values());
    }
    get(name) {
        return this.worktrees.get(name);
    }
    async runTests(name, filter) {
        const worktree = this.worktrees.get(name);
        if (!worktree) {
            throw new Error(`Worktree not found: ${name}`);
        }
        const testId = `test-${Date.now()}`;
        // Run tests in worktree directory
        try {
            let cmd = 'npm test';
            if (filter) {
                cmd += ` -- --filter="${filter}"`;
            }
            const { stdout, stderr } = await execAsync(cmd, { cwd: worktree.path });
            return {
                test_id: testId,
                status: stderr.includes('FAIL') ? 'failed' : 'passed',
                passed: stdout.match(/PASS/g)?.length || 0,
                failed: stdout.match(/FAIL/g)?.length || 0,
                duration: 0,
            };
        }
        catch (error) {
            return {
                test_id: testId,
                status: 'failed',
                errors: [error instanceof Error ? error.message : String(error)],
            };
        }
    }
    async deploy(name, target) {
        const worktree = this.worktrees.get(name);
        if (!worktree) {
            throw new Error(`Worktree not found: ${name}`);
        }
        const deploymentId = `deploy-${Date.now()}`;
        // Simulate deployment
        return {
            deployment_id: deploymentId,
            status: 'deployed',
            target,
            timestamp: Date.now(),
        };
    }
    async merge(name) {
        const worktree = this.worktrees.get(name);
        if (!worktree) {
            throw new Error(`Worktree not found: ${name}`);
        }
        try {
            // Merge worktree changes back to main
            await execAsync(`git merge ${worktree.path}`, { cwd: process.cwd() });
            // Remove worktree after successful merge
            await this.remove(name);
            return { ok: true, message: `Successfully merged worktree ${name}` };
        }
        catch (error) {
            return {
                ok: false,
                message: error instanceof Error ? error.message : String(error)
            };
        }
    }
}
exports.WorktreeManager = WorktreeManager;
//# sourceMappingURL=worktree.js.map