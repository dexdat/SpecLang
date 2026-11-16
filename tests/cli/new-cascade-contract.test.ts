/**
 * Regression coverage for DF-SPECLANG-11: `speclang new` scaffolding must
 * produce a canonical code block that the real cascade can generate.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFileSync } from "child_process";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { parseSpec, runCascade } from "../../src/cascade/index.js";

const CLI = join(process.cwd(), "bin/speclang");

function runNew(cwd: string, template?: string): string {
  const args = [CLI, "new", "proj1", "--no-git", "--dir", join(cwd, "proj1")];
  if (template) args.push("--template", template);
  return execFileSync(process.execPath, args, { cwd, encoding: "utf-8" });
}

function countFence(content: string, language: string): number {
  const re = new RegExp("^```" + language + "\\s*$", "gm");
  return (content.match(re) || []).length;
}

describe("new scaffolding → cascade contract", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "speclang-new-cascade-"));
  });

  afterEach(() => {
    if (testDir && existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  for (const template of [undefined, "http"]) {
    it(`writes canonical code scaffolding${template ? ` for ${template}` : ""}`, () => {
      expect(() => runNew(testDir, template)).not.toThrow();

      const specPath = join(testDir, "proj1", "specs", "main.spec.md");
      const content = readFileSync(specPath, "utf-8");
      expect((content.match(/^### @block::/gm) || []).length).toBeGreaterThanOrEqual(1);
      expect(countFence(content, "speclang")).toBeGreaterThanOrEqual(1);
      expect(countFence(content, "ts")).toBe(0);
      expect(content).not.toMatch(/^### @block:[^:]/m);
    });
  }

  it("generates a non-empty TypeScript file through the real cascade path", async () => {
    runNew(testDir);
    const specPath = join(testDir, "proj1", "specs", "main.spec.md");
    const content = readFileSync(specPath, "utf-8");
    const parsed = parseSpec(content);

    expect(parsed.blocks).toHaveLength(1);
    expect(parsed.blocks[0].name).toBe("main");
    expect(parsed.blocks[0].kind).toBe("code");
    expect(parsed.blocks[0].language).toBe("speclang");

    const result = await runCascade(specPath, { verbose: false });
    expect(result.warning).toBeUndefined();
    expect(result.filesGenerated.length).toBeGreaterThanOrEqual(1);
    expect(readFileSync(result.filesGenerated[0], "utf-8")).toContain("Implementation for proj1");
  });
});
