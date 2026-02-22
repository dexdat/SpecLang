/**
 * SPECLANG-GENERATED: CLI tests
 * Source: @speclang/mcp.cli
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const CLI = 'npx tsx src/cli/index.ts';

describe('CLI Commands', () => {
  describe('search', () => {
    it('should find specs matching query', async () => {
      const { stdout } = await execAsync(`${CLI} search auth`);
      expect(stdout).toContain('Found');
      expect(stdout).toContain('@speclang/mcp.authentication');
    });

    it('should support --json output', async () => {
      const { stdout } = await execAsync(`${CLI} search auth --json`);
      const result = JSON.parse(stdout);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should support --quiet output', async () => {
      const { stdout } = await execAsync(`${CLI} search auth --quiet`);
      const lines = stdout.trim().split('\n');
      expect(lines.length).toBeGreaterThan(0);
      // IDs only, no other text
      lines.forEach(line => {
        expect(line.startsWith('@')).toBe(true);
      });
    });

    it('should filter by layer', async () => {
      const { stdout } = await execAsync(`${CLI} search mcp --layer 3`);
      expect(stdout).toContain('layer 3');
    });

    it('should filter by tags', async () => {
      const { stdout } = await execAsync(`${CLI} search mcp --tags mcp`);
      expect(stdout).toContain('Found');
    });
  });

  describe('list', () => {
    it('should list all specs', async () => {
      const { stdout } = await execAsync(`${CLI} list`);
      expect(stdout).toContain('Total specs:');
    });

    it('should support --json output', async () => {
      const { stdout } = await execAsync(`${CLI} list --json`);
      const result = JSON.parse(stdout);
      expect(result.specs).toBeDefined();
    });

    it('should filter by layer', async () => {
      const { stdout } = await execAsync(`${CLI} list --layer 0`);
      expect(stdout).toContain('Layer 0');
    });

    it('should filter by prefix', async () => {
      const { stdout } = await execAsync(`${CLI} list --prefix @speclang`);
      expect(stdout).toContain('@speclang');
    });
  });

  describe('get', () => {
    it('should get spec by ID', async () => {
      const { stdout } = await execAsync(`${CLI} get @speclang/mcp.authentication`);
      expect(stdout).toContain('@speclang/mcp.authentication');
      expect(stdout).toContain('Version:');
      expect(stdout).toContain('Layer:');
    });

    it('should support --json output', async () => {
      const { stdout } = await execAsync(`${CLI} get @speclang/mcp.authentication --json`);
      const result = JSON.parse(stdout);
      expect(result.id).toBe('@speclang/mcp.authentication');
    });

    it('should show blocks with --blocks flag', async () => {
      const { stdout } = await execAsync(`${CLI} get @speclang/mcp.authentication --blocks`);
      expect(stdout).toContain('Blocks:');
    });

    it('should error on unknown spec', async () => {
      try {
        await execAsync(`${CLI} get @unknown/spec`);
        expect(true).toBe(false); // Should not reach here
      } catch (result: unknown) {
        const { stderr } = result as { stdout: string; stderr: string };
        expect(stderr).toContain('Spec not found');
      }
    });
  });

  describe('validate', () => {
    it('should validate specs', async () => {
      const { stdout } = await execAsync(`${CLI} validate`);
      expect(stdout).toContain('=== Index Validation ===');
      expect(stdout).toContain('Total spec files:');
    });

    it('should support --json output', async () => {
      const { stdout } = await execAsync(`${CLI} validate --json`);
      const result = JSON.parse(stdout);
      expect(result.specs).toBeDefined();
    });

    it('should support --verbose for warnings', async () => {
      const { stdout } = await execAsync(`${CLI} validate --verbose`);
      expect(stdout).toContain('Warnings:');
    });
  });

  describe('index', () => {
    it('should show index stats', async () => {
      const { stdout } = await execAsync(`${CLI} index`);
      expect(stdout).toContain('=== Spec Index ===');
      expect(stdout).toContain('Total specs:');
    });

    it('should support --json output', async () => {
      const { stdout } = await execAsync(`${CLI} index --json`);
      const result = JSON.parse(stdout);
      expect(result.specs).toBeDefined();
    });

    it('should refresh index with --refresh', async () => {
      const { stdout } = await execAsync(`${CLI} index --refresh`);
      expect(stdout).toContain('Index refreshed');
    });
  });

  describe('cascade', () => {
    it('should show cascade status', async () => {
      const { stdout } = await execAsync(`${CLI} cascade status`);
      expect(stdout).toContain('=== Cascade Status ===');
    });

    it('should trigger cascade', async () => {
      const { stdout } = await execAsync(`${CLI} cascade trigger @speclang/mcp`);
      expect(stdout).toContain('=== Cascade Triggered ===');
    });

    it('should abort cascade', async () => {
      const { stdout } = await execAsync(`${CLI} cascade abort`);
      expect(stdout).toContain('Cascade aborted');
    });

    it('should support --json output', async () => {
      const { stdout } = await execAsync(`${CLI} cascade status --json`);
      const result = JSON.parse(stdout);
      expect(result.active).toBeDefined();
    });
  });

  describe('generate', () => {
    it('should run dry-run by default', async () => {
      const { stdout } = await execAsync(`${CLI} generate --dry-run`);
      expect(stdout).toContain('=== Code Generation ===');
      expect(stdout).toContain('DRY RUN');
    });

    it('should support --json output', async () => {
      const { stdout } = await execAsync(`${CLI} generate --dry-run --json`);
      const result = JSON.parse(stdout);
      expect(result.target).toBe('typescript');
    });
  });

  describe('server', () => {
    it('should show help', async () => {
      const { stdout } = await execAsync(`${CLI} server --help`);
      expect(stdout).toContain('--port');
      expect(stdout).toContain('--daemon');
      expect(stdout).toContain('--http');
    });
  });

  describe('help', () => {
    it('should show main help', async () => {
      const { stdout } = await execAsync(`${CLI} --help`);
      expect(stdout).toContain('SpecLang - Specs are source code');
      expect(stdout).toContain('search');
      expect(stdout).toContain('get');
      expect(stdout).toContain('list');
      expect(stdout).toContain('validate');
      expect(stdout).toContain('generate');
      expect(stdout).toContain('server');
      expect(stdout).toContain('index');
      expect(stdout).toContain('cascade');
    });

    it('should show command help', async () => {
      const { stdout } = await execAsync(`${CLI} search --help`);
      expect(stdout).toContain('--tags');
      expect(stdout).toContain('--layer');
      expect(stdout).toContain('--json');
      expect(stdout).toContain('--quiet');
    });
  });
});
