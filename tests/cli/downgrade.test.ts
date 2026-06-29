import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const CLI = path.resolve(__dirname, '..', '..', 'bin', 'speclang');
const TMP_DIR = '/tmp/speclang-test-downgrade';
const SPECS_DIR = path.join(TMP_DIR, 'specs');
const SPEC_PATH = path.join(SPECS_DIR, 'test-downgrade.spec.md');
const BACKUP_PATH = path.join(SPECS_DIR, 'test-downgrade.spec.md.bak');

let originalContent: string;

function runCli(args: string, cwd: string = TMP_DIR): { stdout: string; stderr: string; status: number | null } {
  try {
    const stdout = execSync(`${CLI} ${args}`, { cwd, encoding: 'utf-8' });
    return { stdout: stdout.trim(), stderr: '', status: 0 };
  } catch (e: any) {
    return {
      stdout: e.stdout?.toString().trim() || '',
      stderr: e.stderr?.toString().trim() || '',
      status: e.status,
    };
  }
}

beforeAll(() => {
  fs.mkdirSync(SPECS_DIR, { recursive: true });

  const specContent = `# speclang-header lines:7
id: "@test/downgrade"
version: 1.0.0
layer: 5
project_level: Alpha
tags: [test, downgrade]
---

# Test Downgrade Spec

This spec is used for testing the downgrade command.
`;

  fs.writeFileSync(SPEC_PATH, specContent);
  originalContent = fs.readFileSync(SPEC_PATH, 'utf-8');
  fs.writeFileSync(BACKUP_PATH, originalContent);
});

afterAll(() => {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
});

describe('speclang downgrade', () => {
  it('should show plan in plan mode', () => {
    const { stdout, stderr } = runCli('downgrade test-downgrade.spec.md --to MVP --plan');
    expect(stdout).toContain('Downgrade Plan');
    expect(stdout).toContain('test-downgrade.spec.md');
    expect(stdout).toContain('Alpha');
    expect(stdout).toContain('MVP');
    expect(stderr).toBe('');
  });

  it('should output valid JSON with --json --plan', () => {
    const { stdout, stderr } = runCli('downgrade test-downgrade.spec.md --to MVP --plan --json');
    const result = JSON.parse(stdout);
    expect(result).toHaveProperty('direction', 'downgrade');
    expect(result).toHaveProperty('from', 'Alpha');
    expect(result).toHaveProperty('to', 'MVP');
    expect(result).toHaveProperty('spec', 'test-downgrade.spec.md');
    expect(Array.isArray(result.steps)).toBe(true);
    expect(result.steps.length).toBeGreaterThan(0);
    expect(stderr).toBe('');
  });

  it('should execute downgrade and update the spec file', () => {
    fs.writeFileSync(SPEC_PATH, originalContent, 'utf-8');

    const { stdout, stderr } = runCli('downgrade test-downgrade.spec.md --to MVP');
    expect(stdout).toContain('Downgrade complete');
    expect(stdout).toContain('Alpha');
    expect(stdout).toContain('MVP');

    const updatedContent = fs.readFileSync(SPEC_PATH, 'utf-8');
    expect(updatedContent).toContain('project_level: MVP');

    fs.writeFileSync(SPEC_PATH, originalContent, 'utf-8');
  });

  it('should error when --to flag is missing', () => {
    const { stdout, stderr, status } = runCli('downgrade test-downgrade.spec.md');
    const output = stdout + stderr;
    expect(output).toMatch(/--to|Error|❌/);
    expect(status).toBe(1);
  });

  it('should error when invalid level name is provided', () => {
    const { stdout, stderr, status } = runCli('downgrade test-downgrade.spec.md --to INVALID_LEVEL --plan');
    const output = stdout + stderr;
    expect(output).toContain('INVALID_LEVEL');
    expect(status).toBe(1);
  });

  it('should error when target >= current level', () => {
    const { stdout, stderr, status } = runCli('downgrade test-downgrade.spec.md --to Alpha --plan');
    const output = stdout + stderr;
    expect(output).toMatch(/must go to a lower level|❌/);
    expect(status).toBe(1);
  });

  it('should error when spec file not found', () => {
    const { stdout, stderr, status } = runCli('downgrade nonexistent-file.spec.md --to MVP --plan');
    const output = stdout + stderr;
    expect(output).toContain('not found');
    expect(status).toBe(1);
  });

  it('should handle specs/ prefix without double-prefix bug', () => {
    const { stdout, stderr } = runCli('downgrade specs/test-downgrade.spec.md --to MVP --plan');
    expect(stdout).toContain('Downgrade Plan');
    expect(stdout).toContain('test-downgrade.spec.md');
    expect(stdout).toContain('Alpha');
    expect(stdout).toContain('MVP');
    expect(stderr).not.toContain('specs/specs');
    expect(stderr).toBe('');
  });

  it('should output valid JSON structure on successful execution', () => {
    try {
      fs.writeFileSync(SPEC_PATH, originalContent, 'utf-8');

      const stdout = execSync(`${CLI} downgrade test-downgrade.spec.md --to POC --json`, {
        cwd: TMP_DIR,
        encoding: 'utf-8',
      });
      const result = JSON.parse(stdout.trim());
      expect(result).toHaveProperty('status', 'success');
      expect(result).toHaveProperty('direction', 'downgrade');
      expect(result).toHaveProperty('from', 'Alpha');
      expect(result).toHaveProperty('to', 'POC');
      expect(result).toHaveProperty('spec', 'test-downgrade.spec.md');
    } finally {
      fs.writeFileSync(SPEC_PATH, originalContent, 'utf-8');
    }
  });
});
