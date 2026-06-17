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
  return fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-specwriter-test-'));
}

function writeFile(dir: string, relativePath: string, content: string): string {
  const fullPath = path.join(dir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
  return fullPath;
}

const SKILL_FILE = 'spec-writer.spec.md';

describe('SpecWriter Skill', () => {
  describe('skill prompt file exists', () => {
    it('should have a spec-writer skill file on disk', () => {
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

    it('should load spec-writer prompt content', () => {
      const prompt = router.getSkillPrompt('spec-writer');
      expect(prompt).toBeTruthy();
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should contain SpecWriter as the agent name', () => {
      const prompt = router.getSkillPrompt('spec-writer');
      expect(prompt).toContain('SpecWriter');
    });

    it('should reference specs/**/*.scl ownership', () => {
      const prompt = router.getSkillPrompt('spec-writer');
      expect(prompt).toMatch(/specs\/\*\*\/\*\.scl/);
    });

    it('should describe on-change behavior instructions', () => {
      const prompt = router.getSkillPrompt('spec-writer');
      expect(prompt).toContain('On File Change');
      expect(prompt).toContain('Read the changed file');
      expect(prompt).toContain('Generate detailed child blocks');
      expect(prompt).toContain('Write new spec files');
      expect(prompt).toContain('Ensure all refs are valid');
    });

    it('should include output format with speclang header markers', () => {
      const prompt = router.getSkillPrompt('spec-writer');
      expect(prompt).toContain('# speclang-header');
      expect(prompt).toContain('@block:');
      expect(prompt).toContain('@ref:');
    });

    it('should return empty string when skill file does not exist', () => {
      const tmpDir = createTempDir();
      const customRouter = new AgentRouter({ skillsBaseDir: tmpDir });
      const prompt = customRouter.getSkillPrompt('spec-writer');
      expect(prompt).toBe('');
    });
  });

  describe('SessionManager spawn with spec-writer skill', () => {
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

    it('should spawn a session with spec-writer skill loaded', async () => {
      const handle = await manager.spawnSession({
        filePath: specFile,
        agentType: 'spec-writer',
        skillPath: SKILL_FILE,
      });

      expect(handle).toBeDefined();
      expect(handle.sessionId).toBeTruthy();
      expect(handle.agentType).toBe('spec-writer');
    });

    it('should inject skill content into the Pi agent prompt', async () => {
      await manager.spawnSession({
        filePath: specFile,
        agentType: 'spec-writer',
        skillPath: SKILL_FILE,
      });

      expect(createAgentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('## Skill Context'),
        }),
      );
    });

    it('should include SpecWriter content in the spawned session prompt', async () => {
      await manager.spawnSession({
        filePath: specFile,
        agentType: 'spec-writer',
        skillPath: SKILL_FILE,
      });

      expect(createAgentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('SpecWriter'),
        }),
      );
    });

    it('should include on-change instructions in the spawned session prompt', async () => {
      await manager.spawnSession({
        filePath: specFile,
        agentType: 'spec-writer',
        skillPath: SKILL_FILE,
      });

      expect(createAgentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('On File Change'),
        }),
      );
    });

    it('should include output format markers in the spawned session prompt', async () => {
      await manager.spawnSession({
        filePath: specFile,
        agentType: 'spec-writer',
        skillPath: SKILL_FILE,
      });

      expect(createAgentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('@block:'),
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

    it('should handle missing spec-writer.spec.md without throwing', () => {
      const tmpDir = createTempDir();
      const customRouter = new AgentRouter({ skillsBaseDir: tmpDir });
      expect(() => customRouter.getSkillPrompt('spec-writer')).not.toThrow();
      expect(customRouter.getSkillPrompt('spec-writer')).toBe('');
    });
  });
});
