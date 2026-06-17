import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentRouter } from '../../src/swarm/agent-router';
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

import { createAgentSession } from '@earendil-works/pi-coding-agent';

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-orchestrator-test-'));
}

function writeFile(dir: string, relativePath: string, content: string): string {
  const fullPath = path.join(dir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
  return fullPath;
}

const SKILL_FILE = 'orchestrator.spec.md';

describe('Orchestrator Skill', () => {
  describe('skill prompt file exists', () => {
    it('should have a orchestrator skill file on disk', () => {
      const skillPath = path.join('specs', 'skills.spec.dir', SKILL_FILE);
      expect(fs.existsSync(skillPath)).toBe(true);
    });

    it('should contain valid spec content in the skill file', () => {
      const skillPath = path.join('specs', 'skills.spec.dir', SKILL_FILE);
      const content = fs.readFileSync(skillPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('# speclang-header');
    });
  });

  describe('AgentRouter.getSkillPrompt', () => {
    let router: AgentRouter;

    beforeEach(() => {
      router = new AgentRouter();
    });

    it('should load orchestrator prompt content', () => {
      const prompt = router.getSkillPrompt('orchestrator');
      expect(prompt).toBeTruthy();
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should contain Orchestrator as the agent name', () => {
      const prompt = router.getSkillPrompt('orchestrator');
      expect(prompt).toContain('Orchestrator');
    });

    it('should describe failure recovery instructions', () => {
      const prompt = router.getSkillPrompt('orchestrator');
      expect(prompt).toMatch(/failures?/);
      expect(prompt).toContain('recovery');
    });

    it('should reference cascade coordination', () => {
      const prompt = router.getSkillPrompt('orchestrator');
      expect(prompt).toContain('cascade');
      expect(prompt).toContain('paused');
    });

    it('should include recovery actions (rollback, notify, retry, pause)', () => {
      const prompt = router.getSkillPrompt('orchestrator');
      expect(prompt).toContain('rollback');
      expect(prompt).toContain('notify');
      expect(prompt).toContain('retry');
      expect(prompt).toContain('pause');
    });

    it('should return empty string when skill file does not exist', () => {
      const tmpDir = createTempDir();
      const customRouter = new AgentRouter({ skillsBaseDir: tmpDir });
      const prompt = customRouter.getSkillPrompt('orchestrator');
      expect(prompt).toBe('');
    });
  });

  describe('SessionManager spawn with orchestrator skill', () => {
    let manager: SessionManager;
    let tempDir: string;
    let specFile: string;
    let skillFile: string;

    beforeEach(() => {
      _resetPiSdkCache();
      vi.clearAllMocks();
      tempDir = createTempDir();

      const skillContent = fs.readFileSync(
        path.join('specs', 'skills.spec.dir', SKILL_FILE),
        'utf-8',
      );
      skillFile = writeFile(tempDir, SKILL_FILE, skillContent);
      specFile = writeFile(tempDir, 'test-spec.spec.md', '# Test Spec\n\nSome content');
      manager = new SessionManager({ skillsBaseDir: tempDir, timeoutMs: 600000 });
    });

    afterEach(async () => {
      await manager.disposeAll();
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should spawn a session with orchestrator skill loaded', async () => {
      const handle = await manager.spawnSession({
        filePath: specFile,
        agentType: 'orchestrator',
        skillPath: SKILL_FILE,
      });

      expect(handle).toBeDefined();
      expect(handle.sessionId).toBeTruthy();
      expect(handle.agentType).toBe('orchestrator');
    });

    it('should inject skill content into the Pi agent prompt', async () => {
      await manager.spawnSession({
        filePath: specFile,
        agentType: 'orchestrator',
        skillPath: SKILL_FILE,
      });

      expect(createAgentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('## Skill Context'),
        }),
      );
    });

    it('should include Orchestrator name in the spawned session prompt', async () => {
      await manager.spawnSession({
        filePath: specFile,
        agentType: 'orchestrator',
        skillPath: SKILL_FILE,
      });

      expect(createAgentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('Orchestrator'),
        }),
      );
    });

    it('should include failure recovery text in the spawned session prompt', async () => {
      await manager.spawnSession({
        filePath: specFile,
        agentType: 'orchestrator',
        skillPath: SKILL_FILE,
      });

      expect(createAgentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('failure'),
        }),
      );
    });

    it('should include recovery action markers in the spawned session prompt', async () => {
      await manager.spawnSession({
        filePath: specFile,
        agentType: 'orchestrator',
        skillPath: SKILL_FILE,
      });

      expect(createAgentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('rollback'),
        }),
      );
    });
  });

  describe('edge cases', () => {
    it('should return empty string from router when skill file directory is empty', () => {
      const tmpDir = createTempDir();
      const customRouter = new AgentRouter({ skillsBaseDir: tmpDir });
      const prompt = customRouter.getSkillPrompt('nonexistent-agent-type');
      expect(prompt).toBe('');
    });

    it('should handle missing orchestrator.spec.md without throwing', () => {
      const tmpDir = createTempDir();
      const customRouter = new AgentRouter({ skillsBaseDir: tmpDir });
      expect(() => customRouter.getSkillPrompt('orchestrator')).not.toThrow();
      expect(customRouter.getSkillPrompt('orchestrator')).toBe('');
    });
  });
});
