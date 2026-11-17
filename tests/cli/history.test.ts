import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import { exec, execSync, execFileSync, spawnSync } from "child_process";
import { promisify } from "util";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { homedir, tmpdir } from "os";
import { dirname, join } from "path";

const execAsync = promisify(exec);
const CLI = "./bin/speclang";
const CLI_ABS = join(process.cwd(), "bin/speclang");

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
      { encoding: "utf-8" },
    )
      .trim()
      .split("\n")
      .filter(Boolean);
    if (names.length === 0) return "spec-author";
    // Pick the first name (regex-anchored — just first word).
    return names[0].trim();
  } catch (_) {
    return "spec-author";
  }
}

const TEST_AUTHOR = pickTestAuthor();

describe("history", () => {
  it("should show recent commits", async () => {
    const { stdout } = await execAsync(`${CLI} history`);
    expect(stdout).toContain("commits");
  });

  it("should support --format json output", async () => {
    const { stdout } = await execAsync(`${CLI} history --format json`);
    const result = JSON.parse(stdout);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("hash");
    expect(result[0]).toHaveProperty("author");
    expect(result[0]).toHaveProperty("message");
  });

  it("should show real file changes with --stat", async () => {
    const { stdout } = await execAsync(`${CLI} history --stat`);
    expect(stdout).toContain("Total commits:");
    expect(stdout).toContain("Files changed:");
    expect(stdout).toContain("Unique authors:");
  });

  it("should support --stat with --format json", async () => {
    const { stdout } = await execAsync(`${CLI} history --stat --format json`);
    const result = JSON.parse(stdout);
    expect(result).toHaveProperty("totalCommits");
    expect(result).toHaveProperty("filesChanged");
    expect(result).toHaveProperty("uniqueAuthors");
  });

  it("should filter by --since date", async () => {
    const { stdout } = await execAsync(`${CLI} history --since 2026-01-01`);
    expect(stdout).toContain("commits");
  });

  it("should filter by --author", async () => {
    // Use a real author (or substring) from the actual git history so
    // this test passes in any environment. The first whitespace token
    // of any historical spec author works because git log uses regex
    // matching on the author field.
    const firstName = TEST_AUTHOR.split(/\s+/)[0];
    const { stdout } = await execAsync(
      `${CLI} history --author "${firstName}"`,
    );
    expect(stdout).toContain("commits");
  });

  it("should show blame output with --blame", async () => {
    const { stdout } = await execAsync(
      `${CLI} history --blame specs/core.spec.md`,
    );
    expect(stdout).toContain("Blame:");
    // Confirm at least one attribution line shows some non-empty author.
    // We don't hardcode a specific name because the historical author
    // depends on the git history available in the test environment.
    expect(stdout).toMatch(/\([0-9a-f]{7}\)/);
  });

  it("should support --blame with --format json", async () => {
    const { stdout } = await execAsync(
      `${CLI} history --blame specs/core.spec.md --format json`,
    );
    const result = JSON.parse(stdout);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("hash");
    expect(result[0]).toHaveProperty("author");
    expect(result[0]).toHaveProperty("message");
  });

  it("should show diff between versions with --compare", async () => {
    const { stdout } = await execAsync(
      `${CLI} history --compare v0.1.0..v1.0.0`,
    );
    expect(stdout).toContain("Comparing");
    expect(stdout).toContain("v0.1.0");
    expect(stdout).toContain("v1.0.0");
  });

  it("should handle nonexistent file gracefully", async () => {
    const { stdout } = await execAsync(`${CLI} history nonexistent-file.xyz`);
    expect(stdout).toContain("No history found");
  });

  it("should support --format timeline", async () => {
    const { stdout } = await execAsync(`${CLI} history --format timeline`);
    expect(stdout).toContain("2026");
  });
});

interface CliRun {
  status: number | null;
  stdout: string;
  stderr: string;
}

function runHistory(cwd: string, args: string[] = [], env?: NodeJS.ProcessEnv): CliRun {
  const result = spawnSync(process.execPath, [CLI_ABS, "history", ...args], {
    cwd,
    encoding: "utf-8",
    env: env ? { ...process.env, ...env } : process.env,
  });
  return {
    status: result.status,
    stdout: String(result.stdout ?? ""),
    stderr: String(result.stderr ?? ""),
  };
}

/**
 * A directory that is outside every git repository, or null when no such
 * scratch location exists in this environment. TMPDIR points at the
 * project-local `.tmp/` (which is INSIDE this repository), so each candidate is
 * probed with `git rev-parse --show-toplevel` before it is used.
 */
function makeDirOutsideGitRepo(prefix: string): string | null {
  for (const root of [tmpdir(), homedir(), "/var/tmp"]) {
    let dir: string;
    try {
      dir = mkdtempSync(join(root, prefix));
    } catch (_) {
      continue;
    }
    const probe = spawnSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: dir,
      encoding: "utf-8",
    });
    if (probe.status !== 0) return dir;
    rmSync(dir, { recursive: true, force: true });
  }
  return null;
}

const OUTSIDE_REPO_DIR = makeDirOutsideGitRepo("speclang-history-norepo-");

/**
 * DF-SPECLANG-5-R5: crash paths on a FRESH project. `speclang history` in a
 * repository that has no commits yet (unborn HEAD) used to reject with
 * simple-git's raw
 *   GitError: fatal: your current branch 'master' does not have any commits yet
 * plus a node stack trace and exit 1 — the first thing a new user sees after
 * `git init`. History is a read-only report, so the answer is "no commits yet"
 * with an actionable next step and a clean exit; every mode (log, --stat,
 * --blame, --compare, --format json|timeline) must stay crash-free.
 */
describe("history on a repository with no commits (DF-SPECLANG-5-R5)", () => {
  let emptyRepo: string;

  beforeEach(() => {
    emptyRepo = mkdtempSync(join(tmpdir(), "speclang-history-empty-"));
    execFileSync("git", ["init", "-q", "."], { cwd: emptyRepo, encoding: "utf-8" });
  });

  afterEach(() => {
    rmSync(emptyRepo, { recursive: true, force: true });
  });

  afterAll(() => {
    if (OUTSIDE_REPO_DIR) rmSync(OUTSIDE_REPO_DIR, { recursive: true, force: true });
  });

  it("prints a graceful, actionable message instead of a GitError", () => {
    const run = runHistory(emptyRepo);
    const output = `${run.stdout}${run.stderr}`;

    expect(run.status).toBe(0);
    expect(run.stdout).toContain("No commits yet");
    expect(run.stdout).toContain("git commit");
    expect(output).not.toContain("GitError");
    expect(output).not.toMatch(/^\s+at .*\(.*:\d+:\d+\)$/m);
  });

  it("keeps --format json machine-readable", () => {
    const run = runHistory(emptyRepo, ["--format", "json"]);

    expect(run.status).toBe(0);
    expect(JSON.parse(run.stdout)).toEqual([]);
    expect(`${run.stdout}${run.stderr}`).not.toContain("GitError");
  });

  it("keeps the --stat JSON shape stable with zero commits", () => {
    const run = runHistory(emptyRepo, ["--stat", "--format", "json"]);

    expect(run.status).toBe(0);
    expect(JSON.parse(run.stdout)).toEqual({
      totalCommits: 0,
      uniqueAuthors: 0,
      filesChanged: 0,
      dateRange: null,
    });
  });

  it("reports every mode (--stat, --blame, --compare, timeline) without a GitError", () => {
    for (const args of [["--stat"], ["--blame"], ["--compare", "v1..v2"], ["--format", "timeline"]]) {
      const label = args.join(" ");
      const run = runHistory(emptyRepo, args);
      const output = `${run.stdout}${run.stderr}`;

      expect(run.status, label).toBe(0);
      expect(output, label).not.toContain("GitError");
      expect(run.stdout, label).toContain("No commits yet");
    }
  });

  it("reports a missing git binary as such instead of crashing", () => {
    const run = runHistory(emptyRepo, [], { PATH: "/nonexistent-bin-dir" });
    const output = `${run.stdout}${run.stderr}`;

    expect(run.status).toBe(2);
    expect(run.stdout).toContain("not available on PATH");
    expect(output).not.toContain("GitError");
  });

  it.skipIf(!OUTSIDE_REPO_DIR)(
    "reports a non-repository directory with a defined exit code (no crash)",
    () => {
      const run = runHistory(OUTSIDE_REPO_DIR as string);
      const output = `${run.stdout}${run.stderr}`;

      expect(run.status).toBe(2);
      expect(run.stdout).toContain("not inside a git repository");
      expect(run.stdout).toContain("git init");
      expect(output).not.toContain("GitError");
    },
  );

  it("still reads history from a BARE repository (not mislabelled as no-repo)", () => {
    // A bare repo answers `git rev-parse --is-inside-work-tree` with "false",
    // so a `checkIsRepo()` based guard would claim "not a git repository" for
    // a history that `git log` reads perfectly well.
    const origin = mkdtempSync(join(tmpdir(), "speclang-history-bare-src-"));
    const bare = join(mkdtempSync(join(tmpdir(), "speclang-history-bare-")), "repo.git");
    const author = ["-c", "user.name=History Test", "-c", "user.email=history@example.invalid"];
    try {
      execFileSync("git", ["init", "-q", "."], { cwd: origin, encoding: "utf-8" });
      mkdirSync(join(origin, "specs"), { recursive: true });
      writeFileSync(join(origin, "specs", "core.spec.md"), "# core\n");
      execFileSync("git", [...author, "add", "-A"], { cwd: origin, encoding: "utf-8" });
      execFileSync("git", [...author, "commit", "-q", "-m", "spec: seed core"], {
        cwd: origin,
        encoding: "utf-8",
      });
      execFileSync("git", ["clone", "-q", "--bare", origin, bare], { encoding: "utf-8" });

      const run = runHistory(bare);
      expect(run.status).toBe(0);
      expect(run.stdout).toContain("1 commits");
      expect(`${run.stdout}${run.stderr}`).not.toContain("not inside a git repository");
    } finally {
      rmSync(origin, { recursive: true, force: true });
      rmSync(dirname(bare), { recursive: true, force: true });
    }
  });
});
