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
  return fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-codegen-test-'));
}

function writeFile(dir: string, relativePath: string, content: string): string {
  const fullPath = path.join(dir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
  return fullPath;
}

const SKILL_FILE = 'code-gen.spec.md';

describe('CodeGen Skill', () => {
  describe('skill prompt file exists', () => {
    it('should have the code-gen.spec.md file on disk at specs/skills.spec.dir/code-gen.spec.md', () => {
      const skillPath = path.join('specs', 'skills.spec.dir', SKILL_FILE);
      expect(fs.existsSync(skillPath)).toBe(true);
    });

    it('should contain valid spec content (has speclang-header, has content)', () => {
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

    it('should load code-gen prompt content (non-empty, length > 0)', () => {
      const prompt = router.getSkillPrompt('code-gen');
      expect(prompt).toBeTruthy();
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should contain CodeGen as the agent name', () => {
      const prompt = router.getSkillPrompt('code-gen');
      expect(prompt).toContain('CodeGen');
    });

    it("should reference 'owns' declaration (generated/**/*.{go,ts,py,rs,java})", () => {
      const prompt = router.getSkillPrompt('code-gen');
      expect(prompt).toMatch(/generated\/\*\*\/\*\.\{go,ts,py,rs,java\}/);
    });

    it('should describe on-change behavior with On File Change section', () => {
      const prompt = router.getSkillPrompt('code-gen');
      expect(prompt).toContain('On File Change');
      expect(prompt).toContain('Read the spec file');
      expect(prompt).toContain('Resolve all @ref references');
      expect(prompt).toContain('Generate code for each @block');
      expect(prompt).toContain('Write to generated/{lang}/');
    });

    it('should include SPECLANG markers in the prompt', () => {
      const prompt = router.getSkillPrompt('code-gen');
      expect(prompt).toContain('SPECLANG-ID');
      expect(prompt).toContain('SPECLANG-GENERATED');
      expect(prompt).toContain('SPECLANG-NORTHSTAR');
    });

    it('should include code generation rules', () => {
      const prompt = router.getSkillPrompt('code-gen');
      expect(prompt).toContain('Code Generation Rules');
      expect(prompt).toContain('Every generated file must have SPECLANG markers');
    });

    it('should return empty string for non-existent agent type', () => {
      const tmpDir = createTempDir();
      const customRouter = new AgentRouter({ skillsBaseDir: tmpDir });
      const prompt = customRouter.getSkillPrompt('code-gen');
      expect(prompt).toBe('');
    });

    it('should handle missing code-gen.spec.md without throwing', () => {
      const tmpDir = createTempDir();
      const customRouter = new AgentRouter({ skillsBaseDir: tmpDir });
      expect(() => customRouter.getSkillPrompt('code-gen')).not.toThrow();
      expect(customRouter.getSkillPrompt('code-gen')).toBe('');
    });
  });

  describe('SessionManager spawn with code-gen skill', () => {
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

    it('should spawn a session with code-gen skill loaded', async () => {
      const handle = await manager.spawnSession({
        filePath: specFile,
        agentType: 'code-gen',
        skillPath: SKILL_FILE,
      });

      expect(handle).toBeDefined();
      expect(handle.sessionId).toBeTruthy();
      expect(handle.agentType).toBe('code-gen');
    });

    it('should inject skill content into the Pi agent prompt', async () => {
      await manager.spawnSession({
        filePath: specFile,
        agentType: 'code-gen',
        skillPath: SKILL_FILE,
      });

      expect(createAgentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('## Skill Context'),
        }),
      );
    });

    it('should include CodeGen content in spawned session prompt', async () => {
      await manager.spawnSession({
        filePath: specFile,
        agentType: 'code-gen',
        skillPath: SKILL_FILE,
      });

      expect(createAgentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('CodeGen'),
        }),
      );
    });

    it('should include on-change instructions in spawned session prompt', async () => {
      await manager.spawnSession({
        filePath: specFile,
        agentType: 'code-gen',
        skillPath: SKILL_FILE,
      });

      expect(createAgentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('On File Change'),
        }),
      );
    });

    it('should include code generation rules in spawned session prompt', async () => {
      await manager.spawnSession({
        filePath: specFile,
        agentType: 'code-gen',
        skillPath: SKILL_FILE,
      });

      expect(createAgentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('Code Generation Rules'),
        }),
      );
    });

    it('should include SPECLANG markers in spawned session prompt', async () => {
      await manager.spawnSession({
        filePath: specFile,
        agentType: 'code-gen',
        skillPath: SKILL_FILE,
      });

      expect(createAgentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('SPECLANG-ID'),
        }),
      );
    });
  });

  describe('edge cases', () => {
    it('should return empty string when skill directory is empty', () => {
      const tmpDir = createTempDir();
      const customRouter = new AgentRouter({ skillsBaseDir: tmpDir });
      const prompt = customRouter.getSkillPrompt('nonexistent-agent-type');
      expect(prompt).toBe('');
    });

    it('should handle missing code-gen.spec.md without throwing', () => {
      const tmpDir = createTempDir();
      const customRouter = new AgentRouter({ skillsBaseDir: tmpDir });
      expect(() => customRouter.getSkillPrompt('code-gen')).not.toThrow();
      expect(customRouter.getSkillPrompt('code-gen')).toBe('');
    });
  });
});
