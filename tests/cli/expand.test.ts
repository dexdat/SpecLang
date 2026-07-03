import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const CLI = path.resolve(__dirname, '..', '..', 'bin', 'speclang');
const TMP_DIR = path.join(os.tmpdir(), 'speclang-test-expand');
const SPECS_DIR = path.join(TMP_DIR, 'specs');

function runCli(args: string, cwd: string = TMP_DIR): { stdout: string; stderr: string } {
  try {
    const stdout = execSync(`${CLI} ${args}`, { cwd, encoding: 'utf-8' });
    return { stdout: stdout.trim(), stderr: '' };
  } catch (e: any) {
    return { stdout: e.stdout?.trim() || '', stderr: e.stderr?.trim() || '' };
  }
}

beforeAll(() => {
  fs.mkdirSync(SPECS_DIR, { recursive: true });

  const spec1 = `# speclang-header lines:7
id: "@test/expand-alpha"
version: 1.0.0
layer: 5
project_level: Alpha
tags: [test, expand]
---

# Test Expand Alpha

### @block:${'test-alpha'} @kind:test
\`\`\`speclang
# @block:test/test-alpha @kind:test
This is a test block for expand testing.
\`\`\`

### @block:${'test-beta'} @kind:code
\`\`\`speclang
# @block:test/test-beta @kind:code
Another test block.
\`\`\`
`;
  fs.writeFileSync(path.join(SPECS_DIR, 'test-expand.spec.md'), spec1);

  const spec2 = `# speclang-header lines:7
id: "@test/expand-gamma"
version: 1.0.0
layer: 5
project_level: MVP
tags: [test, expand]
---

# Test Expand Gamma

### @block:${'gamma-block'} @kind:impl
\`\`\`speclang
# @block:test/gamma-block @kind:impl
Gamma block content.
\`\`\`
`;
  fs.writeFileSync(path.join(SPECS_DIR, 'test-gamma.spec.md'), spec2);
});

afterAll(() => {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
});

describe('speclang expand', () => {
  it('should expand by spec#block format with spec-prefixed block name', () => {
    const { stdout, stderr } = runCli('expand "test-expand.spec.md#test/test-alpha"');
    expect(stdout).toContain('Found 1 block(s)');
    expect(stdout).toContain('@block:test/test-alpha');
    expect(stdout).toContain('This is a test block for expand testing');
    expect(stderr).toBe('');
  });

  it('should expand by block name only searching all specs', () => {
    const { stdout, stderr } = runCli('expand "alpha"');
    expect(stdout).toContain('Found 1 block(s)');
    expect(stdout).toContain('@block:test/test-alpha');
    expect(stderr).toBe('');
  });

  it('should support --depth flag', () => {
    const { stdout, stderr } = runCli('expand "test-expand.spec.md#test/test-alpha" --depth 2');
    expect(stdout).toContain('Found 1 block(s)');
    expect(stdout).toContain('@block:test/test-alpha');
  });

  it('should support --no-ai flag', () => {
    const { stdout, stderr } = runCli('expand "test-expand.spec.md#test/test-alpha" --no-ai');
    expect(stdout).toContain('Found 1 block(s)');
    expect(stdout).toContain('@block:test/test-alpha');
    expect(stdout).not.toContain('AI expansion');
  });

  it('should support --verbose flag', () => {
    const { stdout, stderr } = runCli('expand "test-expand.spec.md#test/test-alpha" --verbose');
    expect(stdout).toContain('Found 1 block(s)');
    expect(stdout).toContain('@block:test/test-alpha');
  });

  it('should error when no specs directory', () => {
    const emptyDir = path.join(os.tmpdir(), 'speclang-expand-empty');
    fs.mkdirSync(emptyDir, { recursive: true });
    try {
      const { stdout, stderr } = runCli('expand "test.spec.md#block"', emptyDir);
      const output = stdout + stderr;
      expect(output).toMatch(/No specs directory|Error|❌/);
    } finally {
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it('should error when block not found', () => {
    const { stdout, stderr } = runCli('expand "nonexistent-block-that-does-not-exist"');
    const output = stdout + stderr;
    expect(output).toMatch(/Block not found|❌/);
  });

  it('should error when no block-id argument is missing (commander handles this)', () => {
    try {
      const stdout = execSync(`${CLI} expand`, { cwd: TMP_DIR, encoding: 'utf-8' });
      expect(stdout).toContain('Usage');
    } catch (e: any) {
      expect(e.status).toBe(1);
    }
  });
});
