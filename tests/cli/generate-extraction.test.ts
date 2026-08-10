/**
 * CLI-level regression test for SL-GAP-016: `speclang generate` must extract
 * blocks in the DOCUMENTED format — `### @block::NAME @kind:code` header
 * followed by a language-tagged code fence (e.g. ```typescript).
 *
 * Before the fix, `speclang generate specs/examples.spec.dir/hello-world.spec.md
 * --dry-run` reported "Code blocks found: 0" because the extraction regexes
 * only recognized ```speclang fences with `# @kind:code` inside and the
 * single-colon `@block:` form.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { mkdtempSync, writeFileSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const CLI = join(process.cwd(), "bin/speclang");

describe("CLI generate extraction (documented @block:: format)", () => {
  let testDir: string;

  beforeAll(() => {
    testDir = mkdtempSync(join(tmpdir(), "speclang-generate-test-"));
  });

  afterAll(() => {
    if (testDir && existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("extracts a @block::NAME @kind:code block with a typescript fence", () => {
    const specPath = join(testDir, "hello.spec.md");
    writeFileSync(
      specPath,
      [
        "# speclang-header lines:2",
        "id: \"@test/hello\"",
        "version: 1.0.0",
        "---",
        "",
        "# Hello",
        "",
        "## Implementation",
        "",
        "### @block::hello/function @kind:code",
        "```typescript",
        "export function helloWorld(name: string): string {",
        "  return `Hello, ${name}!`;",
        "}",
        "```",
        "",
        "## Expected Output",
        "",
        "```",
        "Hello, SpecLang!",
        "```",
        "",
      ].join("\n"),
      "utf-8",
    );

    const stdout = execSync(`${CLI} generate ${specPath} --dry-run`, {
      encoding: "utf-8",
    });

    expect(stdout).toContain("Code blocks found: 1");
    expect(stdout).toContain("hello-function.ts");
  });

  it("extracts at least one block from the repo's hello-world example spec", () => {
    const specPath = join(process.cwd(), "specs/examples.spec.dir/hello-world.spec.md");

    const stdout = execSync(`${CLI} generate ${specPath} --dry-run`, {
      encoding: "utf-8",
    });

    expect(stdout).toContain("Code blocks found: 1");
  });

  it("still extracts ```speclang fences with # @kind:code (legacy format)", () => {
    const specPath = join(testDir, "legacy.spec.md");
    writeFileSync(
      specPath,
      [
        "# Legacy Spec",
        "",
        "```speclang",
        "# @kind:code",
        "export function legacy(): void {}",
        "```",
        "",
      ].join("\n"),
      "utf-8",
    );

    const stdout = execSync(`${CLI} generate ${specPath} --dry-run`, {
      encoding: "utf-8",
    });

    expect(stdout).toContain("Code blocks found: 1");
  });

  it("still extracts single-colon @block:NAME @kind:function blocks (legacy format)", () => {
    const specPath = join(testDir, "single-colon.spec.md");
    writeFileSync(
      specPath,
      [
        "# Single Colon Spec",
        "",
        "### @block:greeter @kind:function",
        "",
        "**Parameters:**",
        "- name: string - The name to greet",
        "",
        "**Returns:** string - Greeting",
        "",
      ].join("\n"),
      "utf-8",
    );

    const stdout = execSync(`${CLI} generate ${specPath} --dry-run`, {
      encoding: "utf-8",
    });

    expect(stdout).toContain("Code blocks found: 1");
  });
});
