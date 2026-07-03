import { describe, it, expect } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const CLI = './bin/speclang';

describe('history', () => {
  it('should show recent commits', async () => {
    const { stdout } = await execAsync(`${CLI} history`);
    expect(stdout).toContain('commits');
  });

  it('should support --format json output', async () => {
    const { stdout } = await execAsync(`${CLI} history --format json`);
    const result = JSON.parse(stdout);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('hash');
    expect(result[0]).toHaveProperty('author');
    expect(result[0]).toHaveProperty('message');
  });

  it('should show real file changes with --stat', async () => {
    const { stdout } = await execAsync(`${CLI} history --stat`);
    expect(stdout).toContain('Total commits:');
    expect(stdout).toContain('Files changed:');
    expect(stdout).toContain('Unique authors:');
  });

  it('should support --stat with --format json', async () => {
    const { stdout } = await execAsync(`${CLI} history --stat --format json`);
    const result = JSON.parse(stdout);
    expect(result).toHaveProperty('totalCommits');
    expect(result).toHaveProperty('filesChanged');
    expect(result).toHaveProperty('uniqueAuthors');
  });

  it('should filter by --since date', async () => {
    const { stdout } = await execAsync(`${CLI} history --since 2026-01-01`);
    expect(stdout).toContain('commits');
  });

  it('should filter by --author', async () => {
    const { stdout } = await execAsync(`${CLI} history --author "Alexis Okuwa"`);
    expect(stdout).toContain('commits');
  });

  it('should show blame output with --blame', async () => {
    const { stdout } = await execAsync(`${CLI} history --blame specs/core.spec.md`);
    expect(stdout).toContain('Alexis Okuwa');
    expect(stdout).toContain('Alexis Okuwa');
  });

  it('should support --blame with --format json', async () => {
    const { stdout } = await execAsync(`${CLI} history --blame specs/core.spec.md --format json`);
    const result = JSON.parse(stdout);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('hash');
    expect(result[0]).toHaveProperty('author');
    expect(result[0]).toHaveProperty('message');
  });

  it('should show diff between versions with --compare', async () => {
    const { stdout } = await execAsync(`${CLI} history --compare v0.1.0..v1.0.0`);
    expect(stdout).toContain('Comparing');
    expect(stdout).toContain('v0.1.0');
    expect(stdout).toContain('v1.0.0');
  });

  it('should handle nonexistent file gracefully', async () => {
    const { stdout } = await execAsync(`${CLI} history nonexistent-file.xyz`);
    expect(stdout).toContain('No history found');
  });

  it('should support --format timeline', async () => {
    const { stdout } = await execAsync(`${CLI} history --format timeline`);
    expect(stdout).toContain('2026');
  });
});
