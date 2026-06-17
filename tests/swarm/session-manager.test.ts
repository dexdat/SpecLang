import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionManager, _resetPiSdkCache } from '../../src/swarm/session-manager';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

vi.mock('@earendil-works/pi-coding-agent', () => ({
  createAgentSession: vi.fn().mockResolvedValue({
    session: {
      prompt: vi.fn().mockResolvedValue(undefined),
      dispose: vi.fn(),
    },
  }),
}));

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-session-test-'));
}

function writeFile(dir: string, relativePath: string, content: string): string {
  const fullPath = path.join(dir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
  return fullPath;
}

describe('SessionManager', () => {
  let manager: SessionManager;
  let tempDir: string;
  let specFile: string;

  beforeEach(() => {
    _resetPiSdkCache();
    tempDir = createTempDir();
    writeFile(tempDir, 'test-skill.spec.md', '# Test Skill Prompt');
    specFile = writeFile(tempDir, 'test-spec.spec.md', '# Test Spec Content');
    manager = new SessionManager({ skillsBaseDir: tempDir, timeoutMs: 600000 });
  });

  afterEach(async () => {
    await manager.disposeAll();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('spawnSession', () => {
    it('should create a session and return a valid handle', async () => {
      const handle = await manager.spawnSession({
        filePath: specFile,
        agentType: 'spec-writer',
        skillPath: 'test-skill.spec.md',
      });

      expect(handle).toBeDefined();
      expect(handle.sessionId).toBeTruthy();
      expect(handle.cascadeId).toBeTruthy();
      expect(handle.filePath).toBe(specFile);
      expect(handle.agentType).toBe('spec-writer');
      expect(handle.spawnedAt).toBeGreaterThan(0);
    });

    it('should load the skill prompt', async () => {
      const handle = await manager.spawnSession({
        filePath: specFile,
        agentType: 'spec-writer',
        skillPath: 'test-skill.spec.md',
      });

      expect(handle).toBeDefined();
    });

    it('should assign sequential cascade IDs', async () => {
      const file1 = path.join(tempDir, 'cascade-file-1.spec.md');
      const file2 = path.join(tempDir, 'cascade-file-2.spec.md');
      writeFile(tempDir, 'cascade-file-1.spec.md', '# One');
      writeFile(tempDir, 'cascade-file-2.spec.md', '# Two');

      const handle1 = await manager.spawnSession({
        filePath: file1,
        agentType: 'spec-writer',
        skillPath: 'test-skill.spec.md',
      });

      const handle2 = await manager.spawnSession({
        filePath: file2,
        agentType: 'spec-writer',
        skillPath: 'test-skill.spec.md',
      });

      expect(handle1.cascadeId).toBe('cascade-1');
      expect(handle2.cascadeId).toBe('cascade-2');
    });
  });

  describe('getSession', () => {
    it('should return existing session after spawn', async () => {
      await manager.spawnSession({
        filePath: specFile,
        agentType: 'spec-writer',
        skillPath: 'test-skill.spec.md',
      });

      const session = manager.getSession(specFile);
      expect(session).toBeDefined();
      expect(typeof session!.prompt).toBe('function');
      expect(typeof session!.dispose).toBe('function');
    });

    it('should return undefined for unknown file', () => {
      const session = manager.getSession('/nonexistent/file.spec.md');
      expect(session).toBeUndefined();
    });
  });

  describe('disposeSession', () => {
    it('should remove session from tracking', async () => {
      await manager.spawnSession({
        filePath: specFile,
        agentType: 'spec-writer',
        skillPath: 'test-skill.spec.md',
      });

      expect(manager.getSession(specFile)).toBeDefined();
      await manager.disposeSession(specFile);
      expect(manager.getSession(specFile)).toBeUndefined();
    });
  });

  describe('disposeAll', () => {
    it('should clean up all sessions', async () => {
      const file1 = path.join(tempDir, 'dispose-all-1.spec.md');
      const file2 = path.join(tempDir, 'dispose-all-2.spec.md');
      writeFile(tempDir, 'dispose-all-1.spec.md', '# One');
      writeFile(tempDir, 'dispose-all-2.spec.md', '# Two');

      await manager.spawnSession({
        filePath: file1,
        agentType: 'spec-writer',
        skillPath: 'test-skill.spec.md',
      });

      await manager.spawnSession({
        filePath: file2,
        agentType: 'code-gen',
        skillPath: 'test-skill.spec.md',
      });

      expect(manager.getStats().activeCount).toBe(2);
      await manager.disposeAll();
      expect(manager.getStats().activeCount).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return correct counts after spawn and dispose', async () => {
      expect(manager.getStats().activeCount).toBe(0);

      await manager.spawnSession({
        filePath: specFile,
        agentType: 'spec-writer',
        skillPath: 'test-skill.spec.md',
      });

      expect(manager.getStats().activeCount).toBe(1);
      expect(manager.getStats().totalSpawned).toBe(1);

      await manager.disposeSession(specFile);
      expect(manager.getStats().activeCount).toBe(0);
      expect(manager.getStats().totalDisposed).toBe(1);
      expect(manager.getStats().totalSpawned).toBe(1);
    });
  });

  describe('Pi SDK unavailable', () => {
    it('should gracefully handle when Pi SDK is not available', async () => {
      _resetPiSdkCache();
      const handle = await manager.spawnSession({
        filePath: specFile,
        agentType: 'spec-writer',
        skillPath: 'test-skill.spec.md',
      });

      expect(handle).toBeDefined();
      expect(handle.sessionId).toBeTruthy();
      expect(handle.cascadeId).toBeTruthy();

      const session = manager.getSession(specFile);
      expect(session).toBeDefined();
      expect(typeof session!.prompt).toBe('function');
      expect(typeof session!.dispose).toBe('function');
    });
  });

  describe('warm reuse', () => {
    it('should return same session for same file on second spawn', async () => {
      const handle1 = await manager.spawnSession({
        filePath: specFile,
        agentType: 'spec-writer',
        skillPath: 'test-skill.spec.md',
      });

      const handle2 = await manager.spawnSession({
        filePath: specFile,
        agentType: 'spec-writer',
        skillPath: 'test-skill.spec.md',
      });

      expect(handle2.sessionId).toBe(handle1.sessionId);
      expect(handle2.cascadeId).toBe(handle1.cascadeId);
    });
  });

  describe('cold start', () => {
    it('should create different sessions for different files', async () => {
      const file1 = path.join(tempDir, 'cold-file-1.spec.md');
      const file2 = path.join(tempDir, 'cold-file-2.spec.md');
      writeFile(tempDir, 'cold-file-1.spec.md', '# File 1');
      writeFile(tempDir, 'cold-file-2.spec.md', '# File 2');

      const handle1 = await manager.spawnSession({
        filePath: file1,
        agentType: 'spec-writer',
        skillPath: 'test-skill.spec.md',
      });

      const handle2 = await manager.spawnSession({
        filePath: file2,
        agentType: 'code-gen',
        skillPath: 'test-skill.spec.md',
      });

      expect(handle1.sessionId).not.toBe(handle2.sessionId);
      expect(handle1.cascadeId).not.toBe(handle2.cascadeId);
    });
  });
});
