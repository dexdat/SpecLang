/**
 * CLI-level regression test for REV-001: explicit but nonexistent spec-file
 * inputs must fail loudly, not be silently dropped.
 *
 * Before the fix, `bin/speclang` filtered explicit inputs with
 * `.filter(f => fs.existsSync(f))`, so `speclang generate /nope.spec.md`
 * reported "Generation complete" and exit 0 with zero files generated. The
 * same silent-drop existed in both `build` modes (normal and --json).
 *
 * Fix: `splitExplicitSpecFiles` splits explicit inputs into existing/missing;
 * every consuming command names each missing input and fails (nonzero exit,
 * or success:false in --json mode, matching that mode's existing contract).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawnSync } from "child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  existsSync,
  readdirSync,
} from "fs";
import { join } from "path";
import { tmpdir } from "os";

const CLI = join(process.cwd(), "bin/speclang");

/** Run the CLI without throwing on nonzero exit; returns {status,stdout,stderr}. */
function run(args: string[]) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: "utf-8" });
}

/** A valid one-block spec used for the "existing input" side of every case. */
function writeHelloSpec(projectDir: string): string {
  const specPath = join(projectDir, "specs", "hello.spec.md");
  writeFileSync(
    specPath,
    [
      "# speclang-header lines:2",
      `id: "@test/hello"`,
      "version: 1.0.0",
      "---",
      "",
      "# Hello",
      "",
      "### @block::hello/function @kind:code",
      "```typescript",
      "export function helloWorld(name: string): string {",
      "  return `Hello, ${name}!`;",
      "}",
      "```",
      "",
    ].join("\n"),
    "utf-8",
  );
  return specPath;
}

describe("CLI explicit-input existence check (REV-001)", () => {
  let testDir: string;
  let projectDir: string;
  let helloSpecPath: string;
  const missingSpecPath = join(tmpdir(), "rev001-nonexistent.spec.md");

  beforeAll(() => {
    testDir = mkdtempSync(join(tmpdir(), "speclang-missing-input-"));
    projectDir = join(testDir, "project");
    mkdirSync(join(projectDir, "specs"), { recursive: true });
    helloSpecPath = writeHelloSpec(projectDir);
  });

  afterAll(() => {
    if (testDir && existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("generates from a valid explicit spec and exits 0", () => {
    const outputDir = join(projectDir, "out-valid");
    const result = run([
      "generate",
      helloSpecPath,
      "--dir",
      projectDir,
      "-o",
      join(outputDir),
    ]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Generation complete");
    expect(result.stdout).toContain("Code blocks found: 1");
    expect(existsSync(join(outputDir, "hello.spec-hello-function.ts"))).toBe(true);
  });

  it("fails naming the missing input when the ONLY explicit spec does not exist", () => {
    const result = run(["generate", missingSpecPath, "--dir", projectDir]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(missingSpecPath);
    expect(result.stdout).not.toContain("Generation complete");
  });

  it("fails naming the missing input in a mixed invocation and generates nothing", () => {
    const outputDir = join(projectDir, "out-mixed");
    const result = run([
      "generate",
      helloSpecPath,
      missingSpecPath,
      "--dir",
      projectDir,
      "-o",
      join(outputDir),
    ]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(missingSpecPath);
    expect(result.stdout).not.toContain("Generation complete");
    // The valid spec must not have been silently processed either: nothing
    // was generated for the mixed invocation.
    expect(existsSync(join(outputDir, "hello.spec-hello-function.ts"))).toBe(false);
    if (existsSync(outputDir)) {
      expect(readdirSync(outputDir)).toEqual([]);
    }
  });

  it("build fails loudly for a nonexistent explicit input", () => {
    const result = run(["build", missingSpecPath, "--dir", projectDir]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(missingSpecPath);
    expect(result.stdout).not.toContain("Build complete");
  });

  it("build --json reports success:false naming the missing input", () => {
    const result = run(["build", "--json", missingSpecPath, "--dir", projectDir]);

    // JSON mode keeps its existing contract of exiting 0 on structured errors
    // and printing its banner lines before the JSON payload (same shape as the
    // existing find-failure path).
    expect(result.status).toBe(0);
    const jsonStart = result.stdout.indexOf("{");
    const payload = JSON.parse(result.stdout.slice(jsonStart));
    expect(payload.success).toBe(false);
    expect(payload.errors).toBe(1);
    expect(JSON.stringify(payload.errorDetails)).toContain(missingSpecPath);
  });
});
