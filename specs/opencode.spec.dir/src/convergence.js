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
exports.ConvergenceDetector = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class ConvergenceDetector {
    db;
    config;
    sessionManager;
    lastEditTime;
    convergenceTimer = null;
    cascadeStatus = null;
    onNotify;
    constructor(db, config, sessionManager, onNotify) {
        this.db = db;
        this.config = config;
        this.sessionManager = sessionManager;
        this.onNotify = onNotify;
        this.lastEditTime = Date.now();
        this.initSchema();
    }
    initSchema() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS convergence_state (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS cascade_status (
        id INTEGER PRIMARY KEY,
        status TEXT NOT NULL DEFAULT 'cascading',
        started INTEGER NOT NULL,
        ended INTEGER,
        files_changed INTEGER DEFAULT 0,
        test_passed INTEGER DEFAULT 0,
        test_failed INTEGER DEFAULT 0,
        test_duration INTEGER DEFAULT 0,
        commit_hash TEXT
      )
    `);
        const lastEdit = this.db.get('SELECT value FROM convergence_state WHERE key = ?', ['last_edit_time']);
        this.lastEditTime = lastEdit ? parseInt(lastEdit.value, 10) : Date.now();
        const currentCascade = this.db.get('SELECT * FROM cascade_status ORDER BY id DESC LIMIT 1');
        if (currentCascade && currentCascade.status === 'cascading') {
            this.cascadeStatus = {
                status: 'cascading',
                started: currentCascade.started,
                filesChanged: currentCascade.files_changed,
            };
        }
        else {
            this.startNewCascade();
        }
    }
    startNewCascade() {
        this.db.prepare(`
      INSERT INTO cascade_status (status, started, files_changed)
      VALUES (?, ?, ?)
    `).run('cascading', Date.now(), 0);
        this.cascadeStatus = {
            status: 'cascading',
            started: Date.now(),
            filesChanged: 0,
        };
    }
    recordFileEdit(filePath) {
        this.lastEditTime = Date.now();
        this.db.prepare('INSERT OR REPLACE INTO convergence_state (key, value) VALUES (?, ?)')
            .run('last_edit_time', this.lastEditTime.toString());
        if (this.cascadeStatus && this.cascadeStatus.status === 'cascading') {
            this.cascadeStatus.filesChanged++;
            this.db.prepare('UPDATE cascade_status SET files_changed = files_changed + 1 WHERE status = ?')
                .run('cascading');
        }
        this.scheduleConvergenceCheck();
    }
    getCascadeStatus() {
        return this.cascadeStatus;
    }
    isCascading() {
        return this.cascadeStatus?.status === 'cascading';
    }
    scheduleConvergenceCheck() {
        if (this.convergenceTimer) {
            clearTimeout(this.convergenceTimer);
        }
        this.convergenceTimer = setTimeout(async () => {
            await this.checkAndTrigger();
        }, this.config.quietPeriod * 1000);
    }
    async checkAndTrigger() {
        const quiet = Date.now() - this.lastEditTime > this.config.quietPeriod * 1000;
        if (quiet && await this.sessionManager.allIdle()) {
            await this.runPipeline();
            return true;
        }
        return false;
    }
    async finalize() {
        if (!this.cascadeStatus || this.cascadeStatus.status !== 'cascading') {
            return null;
        }
        this.notifyUser('[Speclang] Finalizing cascade...');
        if (this.convergenceTimer) {
            clearTimeout(this.convergenceTimer);
            this.convergenceTimer = null;
        }
        this.cascadeStatus.status = 'finalizing';
        await this.finalizeCascade();
        return this.cascadeStatus;
    }
    async waitForInflightEvents() {
        return new Promise(resolve => setTimeout(resolve, 500));
    }
    async verifyAgentsIdle() {
        return this.sessionManager.allIdle();
    }
    async runTests() {
        const start = Date.now();
        try {
            await execAsync('npm test -- --reporter=json --outputFilePath=/tmp/test-results.json');
            const results = await this.readTestResults();
            return {
                passed: results?.numPassedTests ?? 0,
                failed: results?.numFailedTests ?? 0,
                duration: Date.now() - start,
            };
        }
        catch {
            return {
                passed: 0,
                failed: 0,
                duration: Date.now() - start,
            };
        }
    }
    async readTestResults() {
        try {
            const { readFile } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const content = await readFile('/tmp/test-results.json', 'utf-8');
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
    async commitChanges() {
        try {
            await execAsync('git add -A');
            const { stdout } = await execAsync('git diff --staged --stat');
            if (!stdout.trim()) {
                return null;
            }
            const commitMsg = `Cascade: ${this.cascadeStatus?.filesChanged ?? 0} files updated`;
            await execAsync(`git commit -m "${commitMsg}"`);
            const { stdout: hash } = await execAsync('git rev-parse HEAD');
            return hash.trim();
        }
        catch {
            return null;
        }
    }
    notifyUser(message) {
        if (this.onNotify) {
            this.onNotify(message);
        }
        console.log(message);
    }
    async finalizeCascade() {
        try {
            await this.waitForInflightEvents();
            this.notifyUser('[Speclang] Verifying agents idle...');
            const agentsIdle = await this.verifyAgentsIdle();
            if (!agentsIdle) {
                this.notifyUser('[Speclang] Agents still active, waiting...');
                await new Promise(r => setTimeout(r, 5000));
            }
            this.notifyUser('[Speclang] Running tests...');
            const testResults = await this.runTests();
            this.notifyUser('[Speclang] Committing changes...');
            const commitHash = await this.commitChanges();
            const ended = Date.now();
            this.cascadeStatus = {
                status: 'converged',
                started: this.cascadeStatus.started,
                ended,
                filesChanged: this.cascadeStatus.filesChanged,
                testResults,
                commitHash: commitHash ?? undefined,
            };
            this.db.prepare(`
        UPDATE cascade_status
        SET status = ?, ended = ?, files_changed = ?,
            test_passed = ?, test_failed = ?, test_duration = ?, commit_hash = ?
        WHERE status = 'cascading'
      `).run('converged', ended, this.cascadeStatus.filesChanged, testResults.passed, testResults.failed, testResults.duration, commitHash);
            this.notifyUser(`[Speclang] Cascade converged! ${testResults.passed} tests passed. Ready for next input.`);
            this.startNewCascade();
        }
        catch (error) {
            console.error('[Speclang] Finalize error:', error);
        }
    }
    async runPipeline() {
        console.log('[Speclang] Cascade converged – running pipeline...');
        try {
            await execAsync('python3 generate_index.py');
            console.log('[Speclang] Index updated');
            try {
                await execAsync('python3 -c "import yaml; print(\'YAML OK\')"');
            }
            catch {
                console.log('[Speclang] Validation tools not available, skipping');
            }
            this.db.prepare(`
        UPDATE cascades SET status = 'converged', ended = ? WHERE status = 'active'
      `).run(Date.now());
            console.log('[Speclang] Pipeline complete. Ready for next cascade.');
        }
        catch (error) {
            console.error('[Speclang] Pipeline error:', error);
        }
    }
    getLastEditTime() {
        return this.lastEditTime;
    }
    isQuiet() {
        return Date.now() - this.lastEditTime > this.config.quietPeriod * 1000;
    }
    destroy() {
        if (this.convergenceTimer) {
            clearTimeout(this.convergenceTimer);
            this.convergenceTimer = null;
        }
    }
}
exports.ConvergenceDetector = ConvergenceDetector;
//# sourceMappingURL=convergence.js.map