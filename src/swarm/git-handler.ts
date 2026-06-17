import { execFile, execFileSync } from 'child_process';
import { randomUUID } from 'crypto';
import { join, dirname, isAbsolute, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import Database, { type Database as DatabaseType } from 'better-sqlite3';

export interface GitCommitResult {
  commitHash: string;
  changeId: string;
  parentId: string | null;
  filePath: string;
  timestamp: number;
}

export interface GitHandlerOptions {
  cwd?: string;
  gitUserName?: string;
  gitUserEmail?: string;
  enableSqliteLogging?: boolean;
  sqliteDbPath?: string;
}

const SQLITE_TABLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS git_commits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL,
    commit_hash TEXT NOT NULL,
    change_id TEXT NOT NULL UNIQUE,
    parent_change_id TEXT,
    message TEXT NOT NULL,
    session_id TEXT,
    cascade_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_git_commits_file_path ON git_commits(file_path);
  CREATE INDEX IF NOT EXISTS idx_git_commits_change_id ON git_commits(change_id);
`;

export class GitHandler {
  private cwd: string;
  private db: DatabaseType | null = null;
  private enableSqliteLogging: boolean;
  private sqliteDbPath: string;

  constructor(options?: GitHandlerOptions) {
    this.cwd = options?.cwd ?? process.cwd();
    this.enableSqliteLogging = options?.enableSqliteLogging ?? true;
    this.sqliteDbPath = options?.sqliteDbPath ?? join(this.cwd, '.speclang', 'speclang.db');

    if (options?.gitUserName) {
      try {
        execFileSync('git', ['config', 'user.name', options.gitUserName], { cwd: this.cwd });
      } catch {
        // ignore config failures
      }
    }
    if (options?.gitUserEmail) {
      try {
        execFileSync('git', ['config', 'user.email', options.gitUserEmail], { cwd: this.cwd });
      } catch {
        // ignore config failures
      }
    }

    if (this.enableSqliteLogging) {
      const dbDir = dirname(this.sqliteDbPath);
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
      }
      this.db = new Database(this.sqliteDbPath);
      this.db.exec(SQLITE_TABLE_SCHEMA);
    }
  }

  async commitFile(params: {
    filePath: string;
    sessionId?: string;
    cascadeId?: string;
    parentChangeId?: string;
  }): Promise<GitCommitResult> {
    const changeId = randomUUID();
    const resolvedPath = this.resolvePath(params.filePath);
    const timestamp = Date.now();

    try {
      await this.execGit(['add', '--', resolvedPath]);

      const diffStat = await this.execGit(['diff', '--cached', '--stat']);
      if (!diffStat.trim()) {
        return {
          commitHash: '',
          changeId,
          parentId: params.parentChangeId ?? null,
          filePath: resolvedPath,
          timestamp,
        };
      }

      const summary = this.formatSummary(diffStat, params.filePath);
      const parentStr = params.parentChangeId ? ` parent:${params.parentChangeId}` : '';
      const commitMessage = `speclang: ${summary} [change_id:${changeId}${parentStr}]`;

      await this.execGit(['commit', '-m', commitMessage]);
      const commitHash = (await this.execGit(['rev-parse', 'HEAD'])).trim();

      if (this.enableSqliteLogging && this.db) {
        const stmt = this.db.prepare(`
          INSERT INTO git_commits
            (file_path, commit_hash, change_id, parent_change_id, message, session_id, cascade_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          resolvedPath,
          commitHash,
          changeId,
          params.parentChangeId ?? null,
          commitMessage,
          params.sessionId ?? null,
          params.cascadeId ?? null,
        );
      }

      return {
        commitHash,
        changeId,
        parentId: params.parentChangeId ?? null,
        filePath: resolvedPath,
        timestamp,
      };
    } catch {
      return {
        commitHash: '',
        changeId,
        parentId: params.parentChangeId ?? null,
        filePath: resolvedPath,
        timestamp,
      };
    }
  }

  async getCommitHistory(filePath: string, limit: number = 50): Promise<GitCommitResult[]> {
    if (!this.db) return [];
    const resolvedPath = this.resolvePath(filePath);
    const rows = this.db.prepare(`
      SELECT commit_hash, change_id, parent_change_id, file_path, created_at
      FROM git_commits
      WHERE file_path = ?
      ORDER BY id DESC
      LIMIT ?
    `).all(resolvedPath, limit) as any[];

    return rows.map(r => ({
      commitHash: r.commit_hash,
      changeId: r.change_id,
      parentId: r.parent_change_id,
      filePath: r.file_path,
      timestamp: new Date(r.created_at).getTime(),
    }));
  }

  async getCausalityChain(changeId: string): Promise<GitCommitResult[]> {
    if (!this.db) return [];
    const chain: GitCommitResult[] = [];
    let current = changeId;

    while (current) {
      const row = this.db.prepare(`
        SELECT commit_hash, change_id, parent_change_id, file_path, created_at
        FROM git_commits
        WHERE change_id = ?
      `).get(current) as any;

      if (!row) break;
      chain.push({
        commitHash: row.commit_hash,
        changeId: row.change_id,
        parentId: row.parent_change_id,
        filePath: row.file_path,
        timestamp: new Date(row.created_at).getTime(),
      });
      current = row.parent_change_id;
    }

    return chain.reverse();
  }

  async getLatestCommit(filePath: string): Promise<GitCommitResult | null> {
    if (!this.db) return null;
    const resolvedPath = this.resolvePath(filePath);
    const row = this.db.prepare(`
      SELECT commit_hash, change_id, parent_change_id, file_path, created_at
      FROM git_commits
      WHERE file_path = ?
      ORDER BY id DESC
      LIMIT 1
    `).get(resolvedPath) as any;

    if (!row) return null;
    return {
      commitHash: row.commit_hash,
      changeId: row.change_id,
      parentId: row.parent_change_id,
      filePath: row.file_path,
      timestamp: new Date(row.created_at).getTime(),
    };
  }

  private execGit(args: string[]): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      execFile('git', args, { cwd: this.cwd }, (err, stdout) => {
        if (err) reject(err);
        else resolve(stdout);
      });
    });
  }

  private resolvePath(filePath: string): string {
    return isAbsolute(filePath) ? filePath : resolve(this.cwd, filePath);
  }

  private formatSummary(diffStat: string, filePath: string): string {
    const lines = diffStat.trim().split('\n');
    if (lines.length > 0 && lines[0].trim().length > 0) {
      return lines[0].trim();
    }
    return `Updated ${filePath}`;
  }
}
