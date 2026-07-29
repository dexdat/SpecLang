/**
 * Tests for CLI Init Command
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("CLI Init Command", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "speclang-init-test-"));
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("initCommand", () => {
    it("should initialize project with default name", async () => {
      const { initCommand } = await import("../src/cli/commands/init.js");

      await initCommand({
        name: "test-project",
        targetDir: testDir,
        initGit: false,
        json: true,
      });

      const projectPath = path.join(testDir, "test-project");
      expect(fs.existsSync(path.join(projectPath, "project.scl"))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, ".speclangrc"))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, ".gitignore"))).toBe(true);
    });

    it("should initialize in current directory with dot", async () => {
      const { initCommand } = await import("../src/cli/commands/init.js");

      await initCommand({
        name: ".",
        targetDir: testDir,
        initGit: false,
        json: true,
      });

      expect(fs.existsSync(path.join(testDir, "project.scl"))).toBe(true);
    });

    it("should fail for existing project without force", async () => {
      const { initCommand } = await import("../src/cli/commands/init.js");

      await initCommand({
        name: "existing",
        targetDir: testDir,
        initGit: false,
        json: false,
      });

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const exitSpy = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);

      await initCommand({
        name: "existing",
        targetDir: testDir,
        initGit: false,
        force: false,
        json: false,
      });

      expect(exitSpy).toHaveBeenCalledWith(1);

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it("should create project with custom targets", async () => {
      const { initCommand } = await import("../src/cli/commands/init.js");

      await initCommand({
        name: "multi-target",
        targetDir: testDir,
        targets: ["typescript", "python", "go"],
        initGit: false,
        json: true,
      });

      const projectScl = fs.readFileSync(
        path.join(testDir, "multi-target", "project.scl"),
        "utf-8",
      );
      expect(projectScl).toContain("typescript");
      expect(projectScl).toContain("python");
      expect(projectScl).toContain("go");
    });

    it("should create correct directory structure", async () => {
      const { initCommand } = await import("../src/cli/commands/init.js");

      await initCommand({
        name: "struct-test",
        targetDir: testDir,
        initGit: false,
        json: true,
      });

      const projectRoot = path.join(testDir, "struct-test");
      expect(fs.existsSync(path.join(projectRoot, "specs"))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, "tests"))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, "generated"))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, ".speclang"))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, ".speclang", "locks"))).toBe(
        true,
      );
      expect(fs.existsSync(path.join(projectRoot, ".speclang", "cache"))).toBe(
        true,
      );
    });

    it("should create initial spec file", async () => {
      const { initCommand } = await import("../src/cli/commands/init.js");

      await initCommand({
        name: "my-awesome-app",
        targetDir: testDir,
        initGit: false,
        json: true,
      });

      const projectRoot = path.join(testDir, "my-awesome-app");
      expect(
        fs.existsSync(path.join(projectRoot, "specs", "my-awesome-app.scl")),
      ).toBe(true);
    });

    it("should create initial test spec file", async () => {
      const { initCommand } = await import("../src/cli/commands/init.js");

      await initCommand({
        name: "test-app",
        targetDir: testDir,
        initGit: false,
        json: true,
      });

      const projectRoot = path.join(testDir, "test-app");
      expect(
        fs.existsSync(
          path.join(projectRoot, "tests", "test-app.test.spec.scl"),
        ),
      ).toBe(true);
    });

    it("should output JSON when requested", async () => {
      const { initCommand } = await import("../src/cli/commands/init.js");

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await initCommand({
        name: "json-test",
        targetDir: testDir,
        initGit: false,
        json: true,
      });

      const output = consoleSpy.mock.calls[0]?.[0];
      expect(() => JSON.parse(output)).not.toThrow();
      expect(JSON.parse(output).success).toBe(true);

      consoleSpy.mockRestore();
    });
  });
});
