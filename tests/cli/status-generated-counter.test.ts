import { describe, expect, it } from "vitest";
import { execFileSync } from "child_process";
import { existsSync, mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const REPO_ROOT = process.cwd();
const CLI = join(REPO_ROOT, "bin/speclang");

function run(args: string[], cwd = REPO_ROOT): string {
  return execFileSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: "utf-8",
  });
}

describe("speclang status generated-files counter (DF-SPECLANG-027)", () => {
  it("counts files in the default src/generated output of a scaffold", () => {
    const root = mkdtempSync(join(tmpdir(), "speclang-status-generated-"));
    const project = join(root, "demo");
    try {
      run(["new", "demo", "--no-git", "--dir", project]);
      const generated = run(["generate", "-d", project]);
      expect(generated).toContain("Files written: 1");
      expect(existsSync(join(project, "src", "generated"))).toBe(true);

      const status = run(["status", "-d", project]);
      expect(status).toMatch(/Generated files: [1-9]\d*/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("omits the generated-files line when neither generated directory exists", () => {
    const root = mkdtempSync(join(tmpdir(), "speclang-status-empty-"));
    try {
      const status = run(["status", "-d", root]);
      expect(status).not.toContain("Generated files:");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps the legacy generated directory as a fallback", () => {
    const root = mkdtempSync(join(tmpdir(), "speclang-status-legacy-"));
    try {
      require("fs").mkdirSync(join(root, "generated"));
      require("fs").writeFileSync(join(root, "generated", "generated-file.ts"), "export {};\n");
      const status = run(["status", "-d", root]);
      expect(status).toContain("Generated files: 1");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("does not fail when run against the SpecLang repository root", () => {
    expect(() => run(["status", "-d", REPO_ROOT])).not.toThrow();
  });
});
