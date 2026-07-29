import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

import {
  DEFAULT_DIRECTORY_PATTERN,
  DEFAULT_NAMING_RULES,
  DEFAULT_DEPTH_CONTROL,
} from "../src/directory/structure.js";
import {
  createSpec,
  SQLITE_TREE_QUERIES,
  GIT_IGNORE_RULES,
} from "../src/directory/creator.js";
import { scanDirectory, validateSpecPath } from "../src/directory/scanner.js";

describe("Directory Structure System", () => {
  const testDir = join(__dirname, "temp-test-dir");

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe("Default Patterns", () => {
    it("should have default directory pattern", () => {
      expect(DEFAULT_DIRECTORY_PATTERN.spec_file).toContain("auth.scl");
      expect(DEFAULT_DIRECTORY_PATTERN.spec_dir).toContain("auth.dir/");
      expect(DEFAULT_DIRECTORY_PATTERN.nesting).toContain(
        "auth.dir/login.dir/",
      );
    });

    it("should have default naming rules", () => {
      expect(DEFAULT_NAMING_RULES.spec_files).toContain(
        "lowercase with hyphens",
      );
      expect(DEFAULT_NAMING_RULES.spec_dirs).toContain(
        "auth.spec.md → auth.dir/",
      );
    });

    it("should have default depth control", () => {
      expect(DEFAULT_DEPTH_CONTROL.level_0.files).toBe("project.scl");
      expect(DEFAULT_DEPTH_CONTROL.level_1.owner).toBe("spec-writer");
      expect(DEFAULT_DEPTH_CONTROL.level_10.owner).toBe("code-gen");
    });
  });

  describe("Spec Creation", () => {
    it("should create spec file when parent is a spec file", async () => {
      const parentSpec = join(testDir, "auth.spec.md");
      await writeFile(parentSpec, "# Test parent spec");

      const specPath = await createSpec({
        parent: parentSpec,
        name: "login",
        kind: "operation",
      });

      expect(specPath).toContain("auth.dir/login.spec.yaml");
      expect(existsSync(specPath)).toBe(true);

      // Check that auth.dir/ was created
      const authDir = join(testDir, "auth.dir");
      expect(existsSync(authDir)).toBe(true);
    });

    it("should create spec file when parent is a directory", async () => {
      const parentDir = join(testDir, "auth.dir");
      await mkdir(parentDir, { recursive: true });

      const specPath = await createSpec({
        parent: parentDir,
        name: "entities",
        kind: "entity",
      });

      expect(specPath).toContain("auth.dir/entities.spec.yaml");
      expect(existsSync(specPath)).toBe(true);
    });

    it("should create subdirectory for code specs", async () => {
      const parentSpec = join(testDir, "auth.spec.md");
      await writeFile(parentSpec, "# Test parent spec");

      const specPath = await createSpec({
        parent: parentSpec,
        name: "handler",
        kind: "code",
      });

      expect(specPath).toContain("auth.dir/handler.spec.ts");
      expect(existsSync(specPath)).toBe(true);

      // Check that handler.dir/ was created
      const handlerDir = specPath.replace(".spec.ts", ".dir");
      expect(existsSync(handlerDir)).toBe(true);
    });
  });

  describe("Directory Scanning", () => {
    beforeEach(async () => {
      // Create a test structure
      await writeFile(join(testDir, "project.scl"), "# Project");
      await writeFile(join(testDir, "auth.spec.md"), "# Auth");

      const authDir = join(testDir, "auth.dir");
      await mkdir(authDir);
      await writeFile(join(authDir, "entities.spec.yaml"), "# Entities");
      await writeFile(join(authDir, "operations.spec.yaml"), "# Operations");

      const loginDir = join(authDir, "login.dir");
      await mkdir(loginDir);
      await writeFile(join(loginDir, "handler.go.spec"), "# Handler");
    });

    it("should scan directory and find spec files", async () => {
      const result = await scanDirectory(testDir);

      expect(result.specFiles).toHaveLength(5); // project.scl, auth.spec.md, entities.spec.yaml, operations.spec.yaml, handler.go.spec
      expect(result.specDirs).toHaveLength(2); // auth.dir, login.dir
      expect(result.nestingDepth).toBeGreaterThan(0);
    });

    it("should identify spec file types", async () => {
      const result = await scanDirectory(testDir);

      const authSpec = result.specFiles.find((f) => f.name === "auth.spec.md");
      expect(authSpec?.type).toBe("spec");

      const handlerSpec = result.specFiles.find(
        (f) => f.name === "handler.go.spec",
      );
      expect(handlerSpec?.type).toBe("code");
    });
  });

  describe("Path Validation", () => {
    it("should validate correct spec paths", () => {
      expect(validateSpecPath("auth.spec.md").valid).toBe(true);
      expect(validateSpecPath("user-profile.spec.yaml").valid).toBe(true);
      expect(validateSpecPath("auth.dir/").valid).toBe(true);
      expect(validateSpecPath("handler.go.spec").valid).toBe(true);
    });

    it("should reject invalid spec paths", () => {
      expect(validateSpecPath("auth_spec.md").valid).toBe(false);
      expect(validateSpecPath("Auth.spec.md").valid).toBe(false);
      expect(validateSpecPath("test.txt").valid).toBe(false);
    });
  });

  describe("SQLite Queries", () => {
    it("should have valid SQLite tree queries", () => {
      expect(SQLITE_TREE_QUERIES.getChildren).toContain("SELECT");
      expect(SQLITE_TREE_QUERIES.getFullTree).toContain("WITH RECURSIVE");
      expect(SQLITE_TREE_QUERIES.getParent).toContain("SELECT");
    });
  });

  describe("Git Ignore Rules", () => {
    it("should have git ignore rules", () => {
      expect(GIT_IGNORE_RULES).toContain(".speclang/");
      expect(GIT_IGNORE_RULES).toContain("!*.dir/");
      expect(GIT_IGNORE_RULES).toContain("!specs/");
    });
  });
});
