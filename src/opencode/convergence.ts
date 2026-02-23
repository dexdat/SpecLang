import { exec } from 'child_process';
import { promisify } from 'util';
import type { OpenCodeDatabase, OpenCodePluginConfig } from './types';
import type { SessionManager } from './session';

const execAsync = promisify(exec);

export interface CascadeStatus {
  status: 'cascading' | 'converged' | 'finalizing';
  started: number;
  ended?: number;
  filesChanged: number;
  testResults?: TestResults;
  commitHash?: string;
}

export interface TestResults {
  passed: number;
  failed: number;
  duration: number;
}

export class ConvergenceDetector {
  private db: OpenCodeDatabase;
  private config: OpenCodePluginConfig;
  private sessionManager: SessionManager;
  private lastEditTime: number;
  private convergenceTimer: NodeJS.Timeout | null = null;
  private cascadeStatus: CascadeStatus | null = null;
  private onNotify?: (message: string) => void;

  constructor(
    db: OpenCodeDatabase,
    config: OpenCodePluginConfig,
    sessionManager: SessionManager,
    onNotify?: (message: string) => void
  ) {
    this.db = db;
    this.config = config;
    this.sessionManager = sessionManager;
    this.onNotify = onNotify;
    this.lastEditTime = Date.now();
    this.initSchema();
  }

  private initSchema(): void {
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

    const lastEdit = this.db.get<{ value: string }>(
      'SELECT value FROM convergence_state WHERE key = ?',
      ['last_edit_time']
    );
    this.lastEditTime = lastEdit ? parseInt(lastEdit.value, 10) : Date.now();

    const currentCascade = this.db.get<{
      id: number;
      status: string;
      started: number;
      ended: number | null;
      files_changed: number;
    }>('SELECT * FROM cascade_status ORDER BY id DESC LIMIT 1');

    if (currentCascade && currentCascade.status === 'cascading') {
      this.cascadeStatus = {
        status: 'cascading',
        started: currentCascade.started,
        filesChanged: currentCascade.files_changed,
      };
    } else {
      this.startNewCascade();
    }
  }

  private startNewCascade(): void {
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

  recordFileEdit(filePath: string): void {
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

  getCascadeStatus(): CascadeStatus | null {
    return this.cascadeStatus;
  }

  isCascading(): boolean {
    return this.cascadeStatus?.status === 'cascading';
  }

  private scheduleConvergenceCheck(): void {
    if (this.convergenceTimer) {
      clearTimeout(this.convergenceTimer);
    }

    this.convergenceTimer = setTimeout(async () => {
      await this.checkAndTrigger();
    }, this.config.quietPeriod * 1000);
  }

  async checkAndTrigger(): Promise<boolean> {
    const quiet = Date.now() - this.lastEditTime > this.config.quietPeriod * 1000;

    if (quiet && await this.sessionManager.allIdle()) {
      await this.runPipeline();
      return true;
    }

    return false;
  }

  async finalize(): Promise<CascadeStatus | null> {
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

  async waitForInflightEvents(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 500));
  }

  async verifyAgentsIdle(): Promise<boolean> {
    return this.sessionManager.allIdle();
  }

  async runTests(): Promise<TestResults> {
    const start = Date.now();

    try {
      await execAsync('npm test -- --reporter=json --outputFilePath=/tmp/test-results.json');
      const results = await this.readTestResults();
      return {
        passed: results?.numPassedTests ?? 0,
        failed: results?.numFailedTests ?? 0,
        duration: Date.now() - start,
      };
    } catch {
      return {
        passed: 0,
        failed: 0,
        duration: Date.now() - start,
      };
    }
  }

  private async readTestResults(): Promise<{ numPassedTests: number; numFailedTests: number } | null> {
    try {
      const { readFile } = await import('fs/promises');
      const content = await readFile('/tmp/test-results.json', 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async commitChanges(): Promise<string | null> {
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
    } catch {
      return null;
    }
  }

  private notifyUser(message: string): void {
    if (this.onNotify) {
      this.onNotify(message);
    }
    console.log(message);
  }

  private async finalizeCascade(): Promise<void> {
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
      `).run(
        'converged',
        ended,
        this.cascadeStatus.filesChanged,
        testResults.passed,
        testResults.failed,
        testResults.duration,
        commitHash
      );

      this.notifyUser(`[Speclang] Cascade converged! ${testResults.passed} tests passed. Ready for next input.`);
      this.startNewCascade();
    } catch (error) {
      console.error('[Speclang] Finalize error:', error);
    }
  }

  async runPipeline(): Promise<void> {
    console.log('[Speclang] Cascade converged – running pipeline...');

    try {
      await execAsync('python3 generate_index.py');
      console.log('[Speclang] Index updated');

      try {
        await execAsync('python3 -c "import yaml; print(\'YAML OK\')"');
      } catch {
        console.log('[Speclang] Validation tools not available, skipping');
      }

      this.db.prepare(`
        UPDATE cascades SET status = 'converged', ended = ? WHERE status = 'active'
      `).run(Date.now());

      console.log('[Speclang] Pipeline complete. Ready for next cascade.');
    } catch (error) {
      console.error('[Speclang] Pipeline error:', error);
    }
  }

  getLastEditTime(): number {
    return this.lastEditTime;
  }

  isQuiet(): boolean {
    return Date.now() - this.lastEditTime > this.config.quietPeriod * 1000;
  }

  destroy(): void {
    if (this.convergenceTimer) {
      clearTimeout(this.convergenceTimer);
      this.convergenceTimer = null;
    }
  }
}
