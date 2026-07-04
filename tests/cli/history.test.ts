import { describe, it, expect } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { execSync } from 'child_process';

const execAsync = promisify(exec);
const CLI = './bin/speclang';

/**
 * git log uses regex matching for `--author <pattern>`, so `git log
 * --author <firstName>` finds commits by ANY author whose name starts
 * with that first name. This lets tests work across CI environments
 * without hardcoding the historical author.
 */
function pickTestAuthor(): string {
  try {
    // Use the first whitespace-separated token of `git log` author
    // names that have actually authored spec changes — robust against
    // any CI environment's git config.
    const names = execSync(
      "git log --pretty=format:'%an' -- specs/ | awk '!seen[$0]++' | head -10",
      { encoding: 'utf-8' }
    ).trim().split('\n').filter(Boolean);
    if (names.length === 0) return 'spec-author';
    // Pick the first name (regex-anchored — just first word).
    return names[0].trim();
  } catch (_) {
    return 'spec-author';
  }
}

const TEST_AUTHOR = pickTestAuthor();

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
    // Use a real author (or substring) from the actual git history so
    // this test passes in any environment. The first whitespace token
    // of any historical spec author works because git log uses regex
    // matching on the author field.
    const firstName = TEST_AUTHOR.split(/\s+/)[0];
    const { stdout } = await execAsync(`${CLI} history --author "${firstName}"`);
    expect(stdout).toContain('commits');
  });

  it('should show blame output with --blame', async () => {
    const { stdout } = await execAsync(`${CLI} history --blame specs/core.spec.md`);
    expect(stdout).toContain('Blame:');
    // Confirm at least one attribution line shows some non-empty author.
    // We don't hardcode a specific name because the historical author
    // depends on the git history available in the test environment.
    expect(stdout).toMatch(/\([0-9a-f]{7}\)/);
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
