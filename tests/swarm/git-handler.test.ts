import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execFileSync } from 'child_process';
import { randomUUID } from 'crypto';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { GitHandler } from '../../src/swarm/git-handler';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const COMMIT_MSG_RE = /^speclang: .+ \[change_id:[0-9a-f-]+(?: parent:[0-9a-f-]+)?\]$/;

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-git-test-'));
}

function writeFile(dir: string, relativePath: string, content: string): string {
  const fullPath = path.join(dir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
  return fullPath;
}

function git(...args: string[]): void {
  execFileSync('git', args);
}

function gitIn(dir: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd: dir, encoding: 'utf-8' }).trim();
}

describe('GitHandler', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const d of tempDirs) {
      fs.rmSync(d, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  function setupRepo(): { tempDir: string; filePath: string } {
    const tempDir = createTempDir();
    tempDirs.push(tempDir);
    gitIn(tempDir, 'init');
    gitIn(tempDir, 'config', 'user.email', 'test@speclang.dev');
    gitIn(tempDir, 'config', 'user.name', 'SpecLang Test');
    return { tempDir, filePath: path.join(tempDir, 'test.txt') };
  }

  function initRepo(tempDir: string, filePath: string): void {
    fs.writeFileSync(filePath, 'line1\nline2\nline3\n', 'utf-8');
    gitIn(tempDir, 'add', '.');
    gitIn(tempDir, 'commit', '-m', 'initial');
  }

  function modifyFile(filePath: string): void {
    fs.appendFileSync(filePath, `change at ${Date.now()}\n`, 'utf-8');
  }

  describe('commitFile', () => {
    it('should create a per-file commit with UUID change_id', async () => {
      const { tempDir, filePath } = setupRepo();
      initRepo(tempDir, filePath);
      modifyFile(filePath);

      const handler = new GitHandler({ cwd: tempDir });
      const result = await handler.commitFile({ filePath });

      expect(result.commitHash).toBeTruthy();
      expect(result.commitHash.length).toBeGreaterThan(0);
      expect(result.changeId).toMatch(UUID_RE);
      expect(result.filePath).toBe(filePath);
      expect(result.timestamp).toBeGreaterThan(0);
      expect(result.parentId).toBeNull();
    });

    it('should format commit message as speclang: summary [change_id:...]', async () => {
      const { tempDir, filePath } = setupRepo();
      initRepo(tempDir, filePath);
      modifyFile(filePath);

      const handler = new GitHandler({ cwd: tempDir });
      const result = await handler.commitFile({ filePath });

      expect(result.commitHash).toBeTruthy();
      const msg = gitIn(tempDir, 'log', '--format=%s', '-1');
      expect(msg).toMatch(COMMIT_MSG_RE);
      expect(msg).toContain(`change_id:${result.changeId}`);
    });

    it('should cascade parent UUID via parentChangeId', async () => {
      const { tempDir, filePath } = setupRepo();
      initRepo(tempDir, filePath);

      const handler = new GitHandler({ cwd: tempDir });

      modifyFile(filePath);
      const first = await handler.commitFile({ filePath });
      expect(first.commitHash).toBeTruthy();

      modifyFile(filePath);
      const second = await handler.commitFile({ filePath, parentChangeId: first.changeId });

      expect(second.parentId).toBe(first.changeId);
      expect(second.changeId).not.toBe(first.changeId);

      const msg = gitIn(tempDir, 'log', '--format=%s', '-1');
      expect(msg).toContain(`parent:${first.changeId}`);
    });

    it('should handle no changes to commit gracefully', async () => {
      const { tempDir, filePath } = setupRepo();
      initRepo(tempDir, filePath);

      const handler = new GitHandler({ cwd: tempDir });

      const result = await handler.commitFile({ filePath });

      expect(result.commitHash).toBe('');
      expect(result.changeId).toMatch(UUID_RE);
    });

    it('should handle non-existent file gracefully', async () => {
      const { tempDir } = setupRepo();
      initRepo(tempDir, path.join(tempDir, 'dummy.txt'));

      const handler = new GitHandler({ cwd: tempDir });

      const result = await handler.commitFile({ filePath: '/nonexistent/path/file.txt' });
      expect(result.commitHash).toBe('');
      expect(result.changeId).toMatch(UUID_RE);
    });

    it('should handle missing git binary gracefully', async () => {
      const tempDir = createTempDir();
      tempDirs.push(tempDir);

      const handler = new GitHandler({ cwd: tempDir });

      const result = await handler.commitFile({ filePath: 'some-file.txt' });
      expect(result.commitHash).toBe('');
      expect(result.changeId).toMatch(UUID_RE);
    });

    it('should persist SQLite log when enableSqliteLogging is true', async () => {
      const { tempDir, filePath } = setupRepo();
      initRepo(tempDir, filePath);
      modifyFile(filePath);

      const handler = new GitHandler({
        cwd: tempDir,
        enableSqliteLogging: true,
      });
      const result = await handler.commitFile({ filePath, sessionId: 'sess-1', cascadeId: 'casc-1' });

      expect(result.commitHash).toBeTruthy();

      const db = new Database(path.join(tempDir, '.speclang', 'speclang.db'));
      const row = db.prepare('SELECT * FROM git_commits WHERE change_id = ?').get(result.changeId) as any;
      db.close();

      expect(row).toBeTruthy();
      expect(row.file_path).toBe(filePath);
      expect(row.commit_hash).toBe(result.commitHash);
      expect(row.change_id).toBe(result.changeId);
      expect(row.parent_change_id).toBeNull();
      expect(row.session_id).toBe('sess-1');
      expect(row.cascade_id).toBe('casc-1');
    });

    it('should not log to SQLite when enableSqliteLogging is false', async () => {
      const { tempDir, filePath } = setupRepo();
      initRepo(tempDir, filePath);
      modifyFile(filePath);

      const handler = new GitHandler({ cwd: tempDir, enableSqliteLogging: false });
      const result = await handler.commitFile({ filePath });

      expect(result.commitHash).toBeTruthy();

      const dbPath = path.join(tempDir, '.speclang', 'speclang.db');
      expect(fs.existsSync(dbPath)).toBe(false);
    });
  });

  describe('getCommitHistory', () => {
    it('should return commits ordered by created_at DESC', async () => {
      const { tempDir, filePath } = setupRepo();
      initRepo(tempDir, filePath);

      const handler = new GitHandler({ cwd: tempDir });

      modifyFile(filePath);
      await handler.commitFile({ filePath });

      modifyFile(filePath);
      await handler.commitFile({ filePath });

      modifyFile(filePath);
      await handler.commitFile({ filePath });

      const history = await handler.getCommitHistory(filePath);

      expect(history.length).toBe(3);
      for (let i = 1; i < history.length; i++) {
        expect(history[i - 1].timestamp).toBeGreaterThanOrEqual(history[i].timestamp);
      }
    });

    it('should respect the limit parameter', async () => {
      const { tempDir, filePath } = setupRepo();
      initRepo(tempDir, filePath);

      const handler = new GitHandler({ cwd: tempDir });

      for (let i = 0; i < 5; i++) {
        modifyFile(filePath);
        await handler.commitFile({ filePath });
      }

      const limited = await handler.getCommitHistory(filePath, 2);
      expect(limited.length).toBe(2);
    });

    it('should return empty array when no commits exist', async () => {
      const { tempDir, filePath } = setupRepo();
      initRepo(tempDir, filePath);

      const handler = new GitHandler({ cwd: tempDir });
      const history = await handler.getCommitHistory(filePath);

      expect(history).toEqual([]);
    });
  });

  describe('getCausalityChain', () => {
    it('should walk parent chain and return oldest first', async () => {
      const { tempDir, filePath } = setupRepo();
      initRepo(tempDir, filePath);

      const handler = new GitHandler({ cwd: tempDir });

      modifyFile(filePath);
      const a = await handler.commitFile({ filePath });

      modifyFile(filePath);
      const b = await handler.commitFile({ filePath, parentChangeId: a.changeId });

      modifyFile(filePath);
      const c = await handler.commitFile({ filePath, parentChangeId: b.changeId });

      const chain = await handler.getCausalityChain(c.changeId);

      expect(chain.length).toBe(3);
      expect(chain[0].changeId).toBe(a.changeId);
      expect(chain[1].changeId).toBe(b.changeId);
      expect(chain[2].changeId).toBe(c.changeId);
      expect(chain[0].timestamp).toBeLessThanOrEqual(chain[1].timestamp);
      expect(chain[1].timestamp).toBeLessThanOrEqual(chain[2].timestamp);
    });

    it('should return single-element chain for root commit', async () => {
      const { tempDir, filePath } = setupRepo();
      initRepo(tempDir, filePath);

      const handler = new GitHandler({ cwd: tempDir });

      modifyFile(filePath);
      const result = await handler.commitFile({ filePath });

      const chain = await handler.getCausalityChain(result.changeId);
      expect(chain.length).toBe(1);
      expect(chain[0].changeId).toBe(result.changeId);
    });

    it('should return empty array for unknown changeId', async () => {
      const { tempDir } = setupRepo();
      const handler = new GitHandler({ cwd: tempDir });

      const chain = await handler.getCausalityChain('nonexistent-change-id');
      expect(chain).toEqual([]);
    });
  });

  describe('getLatestCommit', () => {
    it('should return the most recent commit for a file', async () => {
      const { tempDir, filePath } = setupRepo();
      initRepo(tempDir, filePath);

      const handler = new GitHandler({ cwd: tempDir });

      modifyFile(filePath);
      await handler.commitFile({ filePath });

      modifyFile(filePath);
      const second = await handler.commitFile({ filePath });

      const latest = await handler.getLatestCommit(filePath);
      expect(latest).not.toBeNull();
      expect(latest!.changeId).toBe(second.changeId);
      expect(latest!.commitHash).toBe(second.commitHash);
    });

    it('should return null when no commits exist', async () => {
      const { tempDir, filePath } = setupRepo();
      initRepo(tempDir, filePath);

      const handler = new GitHandler({ cwd: tempDir });
      const latest = await handler.getLatestCommit(filePath);

      expect(latest).toBeNull();
    });
  });

  describe('thread safety', () => {
    it('should handle concurrent commits across multiple repos without corruption', async () => {
      const repoCount = 10;
      const repos: Array<{ tempDir: string; filePath: string; handler: GitHandler }> = [];

      for (let i = 0; i < repoCount; i++) {
        const { tempDir, filePath } = setupRepo();
        initRepo(tempDir, filePath);
        modifyFile(filePath);
        const handler = new GitHandler({ cwd: tempDir });
        repos.push({ tempDir, filePath, handler });
      }

      const results = await Promise.all(
        repos.map((r, i) => r.handler.commitFile({
          filePath: r.filePath,
          sessionId: `concurrent-${i}`,
        })),
      );

      for (const r of results) {
        expect(r.commitHash).toBeTruthy();
        expect(r.changeId).toMatch(UUID_RE);
      }

      for (const r of repos) {
        const history = await r.handler.getCommitHistory(r.filePath);
        expect(history.length).toBe(1);
      }

      const changeIds = new Set(results.map(r => r.changeId));
      expect(changeIds.size).toBe(repoCount);
    });
  });

  describe('options', () => {
    it('should use provided gitUserName and gitUserEmail', async () => {
      const { tempDir, filePath } = setupRepo();
      initRepo(tempDir, filePath);
      modifyFile(filePath);

      const handler = new GitHandler({
        cwd: tempDir,
        gitUserName: 'Custom User',
        gitUserEmail: 'custom@speclang.dev',
      });

      const result = await handler.commitFile({ filePath });
      expect(result.commitHash).toBeTruthy();

      const author = gitIn(tempDir, 'log', '--format=%an <%ae>', '-1');
      expect(author).toBe('Custom User <custom@speclang.dev>');
    });

    it('should use custom sqliteDbPath when provided', async () => {
      const { tempDir, filePath } = setupRepo();
      initRepo(tempDir, filePath);
      modifyFile(filePath);

      const customDbPath = path.join(tempDir, 'custom', 'my-log.db');
      const handler = new GitHandler({
        cwd: tempDir,
        sqliteDbPath: customDbPath,
      });

      const result = await handler.commitFile({ filePath });
      expect(result.commitHash).toBeTruthy();

      expect(fs.existsSync(customDbPath)).toBe(true);

      const db = new Database(customDbPath);
      const row = db.prepare('SELECT * FROM git_commits WHERE change_id = ?').get(result.changeId) as any;
      db.close();
      expect(row).toBeTruthy();
    });
  });
});
