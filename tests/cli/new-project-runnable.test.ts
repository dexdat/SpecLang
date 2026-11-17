/**
 * UX-003 regression: a project created by `speclang new` must be runnable.
 *
 * Before the fix the scaffold declared
 *   devDependencies: { "speclang": "file:<the checkout that ran `speclang new`>" }
 * — an absolute path that exists on exactly one machine (npm install then dies
 * with ENOENT for every other user) — and its npm scripts called a bare
 * `speclang`, which resolved only if the CLI happened to be on PATH. Following
 * the printed next steps (npm install; speclang validate) left a stranger with
 * no working CLI at all.
 *
 * The scaffold now ships scripts/speclang.cjs, which resolves a real CLI at
 * runtime ($SPECLANG_CLI -> node_modules/speclang -> node_modules/.bin/speclang
 * -> the CLI that generated the project) and every npm script calls the shim.
 *
 * These tests assert the CONTRACT of the emitted files, not their prose, and
 * they deliberately do not run `npm install` (zero third-party deps => nothing
 * to install) so they stay offline and fast.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFileSync } from "child_process";
import { mkdtempSync, readFileSync, rmSync, existsSync, statSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const REPO_ROOT = process.cwd();
const CLI = join(REPO_ROOT, "bin/speclang");
const CLI_VERSION: string = JSON.parse(
  readFileSync(join(REPO_ROOT, "package.json"), "utf-8"),
).version;

function scaffold(cwd: string, name: string, extra: string[] = []): string {
  return execFileSync(
    process.execPath,
    [CLI, "new", name, "--no-git", "--dir", join(cwd, name), ...extra],
    { cwd, encoding: "utf-8" },
  );
}

function read(projectPath: string, file: string): string {
  return readFileSync(join(projectPath, file), "utf-8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("new scaffolding -> runnable project (UX-003)", () => {
  let testDir: string;
  let projectPath: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "speclang-new-runnable-"));
    projectPath = join(testDir, "demo");
    scaffold(testDir, "demo");
  });

  afterEach(() => {
    if (testDir && existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("does not pin the CLI to the machine that scaffolded the project", () => {
    const pkgText = read(projectPath, "package.json");
    const pkg = JSON.parse(pkgText) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    // No file: dependency, and no absolute path anywhere in the manifest.
    expect(pkgText).not.toContain("file:");
    expect(pkgText).not.toContain(REPO_ROOT);
    expect(pkg.devDependencies).toEqual({});
    expect(pkg.dependencies).toEqual({});
  });

  it("declares npm scripts that resolve without a global speclang on PATH", () => {
    const pkg = JSON.parse(read(projectPath, "package.json")) as {
      scripts: Record<string, string>;
    };

    const expected: Record<string, string> = {
      speclang: "node scripts/speclang.cjs",
      validate: "node scripts/speclang.cjs validate",
      generate: "node scripts/speclang.cjs generate",
      start: "node scripts/speclang.cjs start",
      build: "node scripts/speclang.cjs generate",
      test: "node scripts/speclang.cjs validate",
      dev: "node scripts/speclang.cjs start",
    };
    expect(pkg.scripts).toEqual(expected);

    // No script may call a bare `speclang` — that only worked with a global
    // install, and `test` used to recurse into `npm test`.
    for (const [name, command] of Object.entries(pkg.scripts)) {
      expect(command.startsWith("speclang "), `script ${name} calls bare speclang`).toBe(false);
    }
  });

  it("ships an executable shim that runs the real CLI", () => {
    const shimPath = join(projectPath, "scripts", "speclang.cjs");
    expect(existsSync(shimPath)).toBe(true);
    expect(statSync(shimPath).mode & 0o111).not.toBe(0);

    const out = execFileSync(process.execPath, [shimPath, "--version"], {
      cwd: projectPath,
      encoding: "utf-8",
    });
    expect(out.trim()).toBe(CLI_VERSION);
  });

  it("honours the SPECLANG_CLI override in both directions", () => {
    const shimPath = join(projectPath, "scripts", "speclang.cjs");

    // Positive: an explicit CLI wins.
    const overridden = execFileSync(process.execPath, [shimPath, "--version"], {
      cwd: projectPath,
      encoding: "utf-8",
      env: { ...process.env, SPECLANG_CLI: CLI },
    });
    expect(overridden.trim()).toBe(CLI_VERSION);

    // Negative: a bogus override fails loudly instead of silently falling back
    // to some other CLI.
    let failure: { status?: number; stderr?: string } | undefined;
    try {
      execFileSync(process.execPath, [shimPath, "--version"], {
        cwd: projectPath,
        encoding: "utf-8",
        env: { ...process.env, SPECLANG_CLI: join(testDir, "does-not-exist") },
      });
    } catch (err) {
      failure = err as { status?: number; stderr?: string };
    }
    expect(failure, "a bogus SPECLANG_CLI must not exit 0").toBeDefined();
    expect(failure?.status).toBe(127);
    expect(String(failure?.stderr)).toContain("SPECLANG_CLI");
  });

  it("keeps the one machine-specific path inside the overridable fallback only", () => {
    const shim = read(projectPath, "scripts/speclang.cjs");
    const recorded = shim.match(new RegExp(escapeRegExp(CLI), "g")) ?? [];

    // Exactly one occurrence: the GENERATOR_CLI fallback, which
    // $SPECLANG_CLI overrides (asserted above).
    expect(recorded).toHaveLength(1);
    expect(shim).toContain('const GENERATOR_CLI = ');
    expect(shim).toContain("process.env.SPECLANG_CLI");

    // The generated manifest carries no machine-specific path at all.
    expect(read(projectPath, "package.json")).not.toContain(REPO_ROOT);
  });

  it("documents the commands that actually work", () => {
    const readme = read(projectPath, "README.md");

    expect(readme).toContain("npm run validate");
    expect(readme).toContain("npm run generate");
    expect(readme).toContain("scripts/speclang.cjs");
    expect(readme).toContain("SPECLANG_CLI");
    // It must not send the reader down the broken path: no file: dependency
    // (mentioning the pattern while explaining why it is wrong is fine).
    expect(readme).not.toMatch(/file:\//);
  });

  it("prints next steps that match the shipped scripts", () => {
    const stdout = execFileSync(
      process.execPath,
      [CLI, "new", "demo-next", "--no-git", "--dir", join(testDir, "demo-next")],
      { cwd: testDir, encoding: "utf-8" },
    );

    expect(stdout).toContain("npm run validate");
    expect(stdout).toContain("npm run generate");
    expect(stdout).toContain("scripts/speclang.cjs");
  });

  it("gives --bare projects the same runnable shim", () => {
    const bareName = "bare1";
    scaffold(testDir, bareName, ["--bare"]);
    const barePath = join(testDir, bareName);

    expect(existsSync(join(barePath, "scripts", "speclang.cjs"))).toBe(true);
    expect(existsSync(join(barePath, "package.json"))).toBe(true);
    expect(existsSync(join(barePath, "README.md"))).toBe(true);

    const pkg = JSON.parse(read(barePath, "package.json")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts.validate).toBe("node scripts/speclang.cjs validate");

    const out = execFileSync(
      process.execPath,
      [join(barePath, "scripts", "speclang.cjs"), "--version"],
      { cwd: barePath, encoding: "utf-8" },
    );
    expect(out.trim()).toBe(CLI_VERSION);
  });
});
