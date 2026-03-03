"use strict";
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
exports.GitIntegration = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const path = __importStar(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class GitIntegration {
    projectDir;
    constructor(projectDir) {
        this.projectDir = projectDir;
    }
    async isGitRepo() {
        try {
            await execAsync('git rev-parse --is-inside-work-tree', { cwd: this.projectDir });
            return true;
        }
        catch {
            return false;
        }
    }
    async commitFile(filePath, message, options = {}) {
        const { changeId, parentChangeId } = options;
        const absPath = path.isAbsolute(filePath) ? filePath : path.join(this.projectDir, filePath);
        let commitMessage = `speclang: ${message}`;
        if (changeId || parentChangeId) {
            const metadata = [];
            if (changeId)
                metadata.push(`change_id:${changeId}`);
            if (parentChangeId)
                metadata.push(`parent:${parentChangeId}`);
            commitMessage += ` [${metadata.join(' ')}]`;
        }
        try {
            await execAsync(`git add "${absPath}"`, { cwd: this.projectDir });
            await execAsync(`git commit --only "${absPath}" -m "${commitMessage}"`, { cwd: this.projectDir });
            console.log(`[Speclang] Committed: ${filePath}`);
        }
        catch (error) {
            console.error(`[Speclang] Failed to commit ${filePath}:`, error);
            throw error;
        }
    }
    async commitFiles(files, options = {}) {
        for (const file of files) {
            await this.commitFile(file.path, file.message, options);
        }
    }
    async getLastCommitMessage() {
        try {
            const { stdout } = await execAsync('git log -1 --pretty=%B', { cwd: this.projectDir });
            return stdout.trim();
        }
        catch {
            return null;
        }
    }
    async getFileLastModified(filePath) {
        try {
            const { stdout } = await execAsync(`git log -1 --format=%cd --date=iso "${filePath}"`, { cwd: this.projectDir });
            return new Date(stdout.trim());
        }
        catch {
            return null;
        }
    }
    async hasUncommittedChanges() {
        try {
            const { stdout } = await execAsync('git status --porcelain', { cwd: this.projectDir });
            return stdout.trim().length > 0;
        }
        catch {
            return false;
        }
    }
    async getChangedFiles() {
        try {
            const { stdout } = await execAsync('git status --porcelain', { cwd: this.projectDir });
            return stdout
                .split('\n')
                .filter(line => line.trim())
                .map(line => line.substring(3).trim());
        }
        catch {
            return [];
        }
    }
}
exports.GitIntegration = GitIntegration;
//# sourceMappingURL=git.js.map