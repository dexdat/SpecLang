import { exec } from 'child_process';
import { promisify } from 'util';
import type { OpenCodeDatabase, OpenCodePluginConfig } from './types';
import type { SessionManager } from './session';

const execAsync = promisify(exec);

export class ConvergenceDetector {
  private db: OpenCodeDatabase;
  private config: OpenCodePluginConfig;
  private sessionManager: SessionManager;
  private lastEditTime: number;
  private convergenceTimer: NodeJS.Timeout | null = null;

  constructor(
    db: OpenCodeDatabase,
    config: OpenCodePluginConfig,
    sessionManager: SessionManager
  ) {
    this.db = db;
    this.config = config;
    this.sessionManager = sessionManager;
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

    const lastEdit = this.db.get<{ value: string }>(
      'SELECT value FROM convergence_state WHERE key = ?',
      ['last_edit_time']
    );
    this.lastEditTime = lastEdit ? parseInt(lastEdit.value, 10) : Date.now();
  }

  recordFileEdit(filePath: string): void {
    this.lastEditTime = Date.now();
    this.db.prepare('INSERT OR REPLACE INTO convergence_state (key, value) VALUES (?, ?)')
      .run('last_edit_time', this.lastEditTime.toString());

    this.scheduleConvergenceCheck();
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
