/**
 * SPECLANG-GENERATED: Symlinks module tests
 * Source: @speclang/symlinks
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import {
  createSymlinks,
  createSymlink,
  removeSymlink,
} from "../src/symlinks/creator.js";
import {
  verifySymlinks,
  verifySymlink,
  scanSymlinks,
  repairSymlinks,
} from "../src/symlinks/verifier.js";
import {
  rebuild,
  quickRebuild,
  getPhysicalPath,
} from "../src/symlinks/rebuilder.js";
import type { SpecWithTarget, SymlinkEntry } from "../src/symlinks/types.js";

describe("Symlinks Module", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), "speclang-symlinks-"));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe("createSymlink", () => {
    it("should create a valid symlink", async () => {
      // Create a test file
      const physicalPath = path.join(testDir, "physical", "test.txt");
      await fs.mkdir(path.dirname(physicalPath), { recursive: true });
      await fs.writeFile(physicalPath, "test content");

      // Create symlink
      const logicalPath = path.join(testDir, "logical", "test.txt");
      const entry = await createSymlink(logicalPath, physicalPath);

      expect(entry.isValid).toBe(true);
      expect(entry.logicalPath).toBe(logicalPath);
      expect(entry.physicalPath).toBe(physicalPath);

      // Verify symlink works
      const content = await fs.readFile(logicalPath, "utf-8");
      expect(content).toBe("test content");
    });

    it("should handle existing symlinks", async () => {
      const physicalPath = path.join(testDir, "physical", "test.txt");
      await fs.mkdir(path.dirname(physicalPath), { recursive: true });
      await fs.writeFile(physicalPath, "original");

      const logicalPath = path.join(testDir, "logical", "test.txt");

      // Create first symlink
      await createSymlink(logicalPath, physicalPath);

      // Update physical file
      await fs.writeFile(physicalPath, "updated");

      // Recreate symlink
      const entry = await createSymlink(logicalPath, physicalPath);

      expect(entry.isValid).toBe(true);
      const content = await fs.readFile(logicalPath, "utf-8");
      expect(content).toBe("updated");
    });
  });

  describe("removeSymlink", () => {
    it("should remove an existing symlink", async () => {
      const physicalPath = path.join(testDir, "physical", "test.txt");
      await fs.mkdir(path.dirname(physicalPath), { recursive: true });
      await fs.writeFile(physicalPath, "test");

      const logicalPath = path.join(testDir, "logical", "test.txt");
      await createSymlink(logicalPath, physicalPath);

      const removed = await removeSymlink(logicalPath);
      expect(removed).toBe(true);

      // Verify symlink is gone
      await expect(fs.lstat(logicalPath)).rejects.toThrow();
    });

    it("should return false for non-symlink", async () => {
      const filePath = path.join(testDir, "file.txt");
      await fs.writeFile(filePath, "test");

      const removed = await removeSymlink(filePath);
      expect(removed).toBe(false);
    });
  });

  describe("verifySymlink", () => {
    it("should verify a valid symlink", async () => {
      const physicalPath = path.join(testDir, "physical", "test.txt");
      await fs.mkdir(path.dirname(physicalPath), { recursive: true });
      await fs.writeFile(physicalPath, "test");

      const logicalPath = path.join(testDir, "logical", "test.txt");
      await createSymlink(logicalPath, physicalPath);

      const result = await verifySymlink(logicalPath, physicalPath);
      expect(result.isValid).toBe(true);
      expect(result.exists).toBe(true);
    });

    it("should detect broken symlinks", async () => {
      const physicalPath = path.join(testDir, "physical", "test.txt");
      await fs.mkdir(path.dirname(physicalPath), { recursive: true });
      // Don't create the physical file - symlink will be broken

      const logicalPath = path.join(testDir, "logical", "test.txt");
      const dir = path.dirname(logicalPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.symlink(physicalPath, logicalPath);

      const result = await verifySymlink(logicalPath);
      expect(result.isValid).toBe(false);
      expect(result.exists).toBe(true);
    });

    it("should return exists:false for missing symlinks", async () => {
      const result = await verifySymlink(path.join(testDir, "nonexistent.txt"));
      expect(result.exists).toBe(false);
    });
  });

  describe("scanSymlinks", () => {
    it("should find all symlinks in directory tree", async () => {
      // Create structure with symlinks
      const physicalDir = path.join(testDir, "physical");
      await fs.mkdir(physicalDir, { recursive: true });
      await fs.writeFile(path.join(physicalDir, "a.txt"), "a");
      await fs.writeFile(path.join(physicalDir, "b.txt"), "b");

      const logicalDir = path.join(testDir, "logical");
      await fs.mkdir(logicalDir, { recursive: true });
      await fs.symlink(
        path.join(physicalDir, "a.txt"),
        path.join(logicalDir, "a.txt"),
      );
      await fs.symlink(
        path.join(physicalDir, "b.txt"),
        path.join(logicalDir, "b.txt"),
      );

      const symlinks = await scanSymlinks(logicalDir);
      expect(symlinks.length).toBe(2);
    });
  });

  describe("verifySymlinks", () => {
    it("should categorize symlinks as valid, broken, or missing", async () => {
      const physicalDir = path.join(testDir, "physical");
      await fs.mkdir(physicalDir, { recursive: true });
      await fs.writeFile(path.join(physicalDir, "valid.txt"), "valid");

      const logicalDir = path.join(testDir, "logical");
      await fs.mkdir(logicalDir, { recursive: true });

      // Valid symlink
      await fs.symlink(
        path.join(physicalDir, "valid.txt"),
        path.join(logicalDir, "valid.txt"),
      );

      // Broken symlink
      await fs.symlink(
        path.join(physicalDir, "broken.txt"),
        path.join(logicalDir, "broken.txt"),
      );

      const symlinks: SymlinkEntry[] = [
        {
          logicalPath: path.join(logicalDir, "valid.txt"),
          physicalPath: path.join(physicalDir, "valid.txt"),
          isValid: false,
        },
        {
          logicalPath: path.join(logicalDir, "broken.txt"),
          physicalPath: path.join(physicalDir, "broken.txt"),
          isValid: false,
        },
        {
          logicalPath: path.join(logicalDir, "missing.txt"),
          physicalPath: path.join(physicalDir, "missing.txt"),
          isValid: false,
        },
      ];

      const result = await verifySymlinks(symlinks);

      expect(result.valid.length).toBe(1);
      expect(result.broken.length).toBe(1);
      expect(result.missing.length).toBe(1);
    });
  });

  describe("repairSymlinks", () => {
    it("should repair broken symlinks", async () => {
      const physicalDir = path.join(testDir, "physical");
      await fs.mkdir(physicalDir, { recursive: true });
      await fs.writeFile(path.join(physicalDir, "test.txt"), "test");

      const logicalDir = path.join(testDir, "logical");
      await fs.mkdir(logicalDir, { recursive: true });

      // Create broken symlink
      await fs.symlink(
        path.join(physicalDir, "nonexistent.txt"),
        path.join(logicalDir, "test.txt"),
      );

      const symlinks: SymlinkEntry[] = [
        {
          logicalPath: path.join(logicalDir, "test.txt"),
          physicalPath: path.join(physicalDir, "test.txt"),
          isValid: false,
        },
      ];

      const result = await repairSymlinks(symlinks);

      expect(result.repaired.length).toBe(1);
      expect(result.failed.length).toBe(0);

      // Verify it's now valid
      const verifyResult = await verifySymlink(
        path.join(logicalDir, "test.txt"),
        path.join(physicalDir, "test.txt"),
      );
      expect(verifyResult.isValid).toBe(true);
    });
  });

  describe("getPhysicalPath", () => {
    it("should resolve symlink to physical path", async () => {
      const physicalPath = path.join(testDir, "physical", "test.txt");
      await fs.mkdir(path.dirname(physicalPath), { recursive: true });
      await fs.writeFile(physicalPath, "test");

      const logicalPath = path.join(testDir, "logical", "test.txt");
      await createSymlink(logicalPath, physicalPath);

      const resolved = await getPhysicalPath(logicalPath);
      expect(resolved).toBe(physicalPath);
    });

    it("should return path for non-symlink files", async () => {
      const filePath = path.join(testDir, "file.txt");
      await fs.writeFile(filePath, "test");

      const resolved = await getPhysicalPath(filePath);
      expect(resolved).toBe(filePath);
    });

    it("should return null for missing files", async () => {
      const resolved = await getPhysicalPath(
        path.join(testDir, "nonexistent.txt"),
      );
      expect(resolved).toBeNull();
    });
  });

  describe("rebuild", () => {
    it("should rebuild symlinks from specs", async () => {
      const specsDir = path.join(testDir, "specs");
      await fs.mkdir(specsDir, { recursive: true });

      // Create spec file in physical location
      const physicalPath = path.join(specsDir, "auth", "login.go");
      await fs.mkdir(path.dirname(physicalPath), { recursive: true });
      await fs.writeFile(physicalPath, "// generated code");

      const specs: SpecWithTarget[] = [
        {
          filePath: physicalPath,
          metadata: { id: "test", version: "1.0.0" } as any,
          target: path.join(testDir, "src", "auth", "login.go"),
        },
      ];

      const result = await rebuild(specs, { verify: false });

      expect(result.symlinked.length).toBe(1);
      expect(result.errors.length).toBe(0);

      // Verify symlink was created
      const verifyResult = await verifySymlink(
        path.join(testDir, "src", "auth", "login.go"),
        physicalPath,
      );
      expect(verifyResult.isValid).toBe(true);
    });

    it("should handle clean option in test directory", async () => {
      // This test verifies clean works when we change to the test directory
      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        // Create files that would be cleaned
        await fs.mkdir("src", { recursive: true });
        await fs.writeFile("src/existing.txt", "existing");

        // Run rebuild with clean
        const specs: SpecWithTarget[] = [];
        await rebuild(specs, { clean: true });

        // File should be removed
        await expect(
          fs.readFile("src/existing.txt", "utf-8"),
        ).rejects.toThrow();
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe("quickRebuild", () => {
    it("should recreate symlinks without regeneration", async () => {
      const specsDir = path.join(testDir, "specs");
      await fs.mkdir(specsDir, { recursive: true });

      const physicalPath = path.join(specsDir, "test.ts");
      await fs.writeFile(physicalPath, "export const x = 1;");

      const specs: SpecWithTarget[] = [
        {
          filePath: physicalPath,
          metadata: { id: "test", version: "1.0.0" } as any,
          target: path.join(testDir, "src", "test.ts"),
        },
      ];

      const result = await quickRebuild(specs);

      expect(result.symlinked.length).toBe(1);
      expect(result.generated.length).toBe(0); // No regeneration
    });
  });
});
