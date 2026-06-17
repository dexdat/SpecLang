import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentRouter } from '../../src/swarm/agent-router';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-router-test-'));
}

function writeFile(dir: string, relativePath: string, content: string): string {
  const fullPath = path.join(dir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
  return fullPath;
}

describe('AgentRouter', () => {
  let router: AgentRouter;

  beforeEach(() => {
    router = new AgentRouter();
  });

  describe('route()', () => {
    it('should route specs/**/*.spec.md paths to spec-writer', () => {
      const result = router.route('specs/core.spec.md');
      expect(result.agentType).toBe('spec-writer');
    });

    it('should route specs/**/*.spec.yaml paths to spec-writer', () => {
      const result = router.route('specs/config.spec.yaml');
      expect(result.agentType).toBe('spec-writer');
    });

    it('should route *.scl files to spec-writer', () => {
      const result = router.route('project.scl');
      expect(result.agentType).toBe('spec-writer');
    });

    it('should route specs/nested path .spec.md to spec-writer', () => {
      const result = router.route('specs/deep/nested/file.spec.md');
      expect(result.agentType).toBe('spec-writer');
    });

    it('should route generated/**/*.go to code-gen-go', () => {
      const result = router.route('generated/foo.go');
      expect(result.agentType).toBe('code-gen-go');
    });

    it('should route generated/**/*.ts to code-gen-ts', () => {
      const result = router.route('generated/bar.ts');
      expect(result.agentType).toBe('code-gen-ts');
    });

    it('should route generated/**/*.py to code-gen-py', () => {
      const result = router.route('generated/baz.py');
      expect(result.agentType).toBe('code-gen-py');
    });

    it('should route generated/**/*.rs to code-gen-rs', () => {
      const result = router.route('generated/qux.rs');
      expect(result.agentType).toBe('code-gen-rs');
    });

    it('should route tests/**/*.test.spec.ts to test-writer', () => {
      const result = router.route('tests/swarm/agent-router.test.spec.ts');
      expect(result.agentType).toBe('test-writer');
    });

    it('should route tests/**/*.test.spec.py to test-writer', () => {
      const result = router.route('tests/feature.test.spec.py');
      expect(result.agentType).toBe('test-writer');
    });

    it('should route unknown paths to spec-writer as default', () => {
      const result = router.route('src/utils/helper.ts');
      expect(result.agentType).toBe('spec-writer');
    });

    it('should route README.md to spec-writer as default', () => {
      const result = router.route('README.md');
      expect(result.agentType).toBe('spec-writer');
    });

    it('should route generated/nested/foo.go to code-gen-go', () => {
      const result = router.route('generated/nested/deep/foo.go');
      expect(result.agentType).toBe('code-gen-go');
    });

    it('should return correct skillPath in route result', () => {
      const result = router.route('specs/core.spec.md');
      expect(result.skillPath).toBeTruthy();
      expect(result.skillPath).toContain('spec-writer');
    });

    it('should return correct ownershipPattern in route result', () => {
      const result = router.route('generated/foo.go');
      expect(result.ownershipPattern).toBe('generated/**/*.go');
    });
  });

  describe('getOwnershipPattern()', () => {
    it('should return specs pattern for spec-writer', () => {
      expect(router.getOwnershipPattern('spec-writer')).toBe('specs/**/*.spec.{md,yaml,scl}');
    });

    it('should return go pattern for code-gen-go', () => {
      expect(router.getOwnershipPattern('code-gen-go')).toBe('generated/**/*.go');
    });

    it('should return ts pattern for code-gen-ts', () => {
      expect(router.getOwnershipPattern('code-gen-ts')).toBe('generated/**/*.ts');
    });

    it('should return test pattern for test-writer', () => {
      expect(router.getOwnershipPattern('test-writer')).toBe('tests/**/*.test.spec.*');
    });

    it('should return nested pattern for code-gen', () => {
      expect(router.getOwnershipPattern('code-gen')).toBe('generated/**/*.{go,ts,py,rs}');
    });

    it('should return empty string for unknown agent type', () => {
      expect(router.getOwnershipPattern('nonexistent-agent')).toBe('');
    });
  });

  describe('getSkillPrompt()', () => {
    it('should read spec-writer skill file from disk', () => {
      const prompt = router.getSkillPrompt('spec-writer');
      expect(prompt).toBeTruthy();
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should return empty string for non-existent skill file', () => {
      const tmpDir = createTempDir();
      const customRouter = new AgentRouter({ skillsBaseDir: tmpDir });
      const prompt = customRouter.getSkillPrompt('spec-writer');
      expect(prompt).toBe('');
    });

    it('should cache skill prompts and not re-read file', () => {
      const tmpDir = createTempDir();
      writeFile(tmpDir, 'spec-writer.spec.md', '# Original Content');
      const customRouter = new AgentRouter({ skillsBaseDir: tmpDir });

      const firstRead = customRouter.getSkillPrompt('spec-writer');
      expect(firstRead).toBe('# Original Content');

      writeFile(tmpDir, 'spec-writer.spec.md', '# Modified Content');

      const secondRead = customRouter.getSkillPrompt('spec-writer');
      expect(secondRead).toBe('# Original Content');
    });

    it('should respect custom skillsBaseDir', () => {
      const tmpDir = createTempDir();
      writeFile(tmpDir, 'spec-writer.spec.md', '# Custom Skill Prompt');
      const customRouter = new AgentRouter({ skillsBaseDir: tmpDir });
      const prompt = customRouter.getSkillPrompt('spec-writer');
      expect(prompt).toBe('# Custom Skill Prompt');
    });

    it('should return empty string for unknown agent type with missing file', () => {
      const tmpDir = createTempDir();
      const customRouter = new AgentRouter({ skillsBaseDir: tmpDir });
      const prompt = customRouter.getSkillPrompt('unknown-agent-type');
      expect(prompt).toBe('');
    });

    it('should log warning when skill file is missing', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const tmpDir = createTempDir();
      const customRouter = new AgentRouter({ skillsBaseDir: tmpDir });
      customRouter.getSkillPrompt('spec-writer');
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('constructor options', () => {
    it('should default skillsBaseDir to specs/skills.spec.dir', () => {
      const defaultRouter = new AgentRouter();
      const prompt = defaultRouter.getSkillPrompt('spec-writer');
      expect(prompt).toBeTruthy();
    });

    it('should accept custom skillsBaseDir', () => {
      const tmpDir = createTempDir();
      writeFile(tmpDir, 'spec-writer.spec.md', '# Custom');
      const customRouter = new AgentRouter({ skillsBaseDir: tmpDir });
      const prompt = customRouter.getSkillPrompt('spec-writer');
      expect(prompt).toBe('# Custom');
    });
  });
});
