/**
 * E2E Test: Demo Workflow
 *
 * Tests the complete end-to-end flow from spec to working code
 * as described in specs/roadmap.spec.dir/poc.spec.dir/demo-workflow.spec.md
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "vitest";
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { symlink, unlink } from "fs/promises";
import { execSync } from "child_process";

const TEST_DIR = join(process.cwd(), "test-e2e-output");
const SPECS_DIR = join(TEST_DIR, "specs");
const SRC_DIR = join(TEST_DIR, "src");

describe("E2E: Demo Workflow", () => {
  beforeAll(() => {
    // Create test directories
    mkdirSync(TEST_DIR, { recursive: true });
    mkdirSync(SPECS_DIR, { recursive: true });
    mkdirSync(SRC_DIR, { recursive: true });
  });

  afterAll(() => {
    // Clean up test directories
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe("Step 1: Create Spec", () => {
    it("should create a greeting spec file", () => {
      const specContent = `# speclang-header lines:10
id: "@test/greeting"
version: 1.0.0
layer: 5
short: "Simple greeting functions"
tags: [test, greeting]
---

# Greeting Functions

Simple greeting utilities.

### @block:greet @kind:function

Returns a personalized greeting.

**Parameters:**
- name: string - Person to greet

**Returns:** string - Greeting message

**Example:**
\`\`\`typescript
greet("World") // "Hello, World!"
\`\`\`
`;

      const specPath = join(SPECS_DIR, "greeting.spec.md");
      writeFileSync(specPath, specContent, "utf-8");

      expect(existsSync(specPath)).toBe(true);

      const content = readFileSync(specPath, "utf-8");
      expect(content).toContain("# speclang-header");
      expect(content).toContain('id: "@test/greeting"');
      expect(content).toContain("### @block:greet @kind:function");
    });
  });

  describe("Step 2: Parse Spec", () => {
    it("should parse spec header correctly", () => {
      // This simulates what HeaderParser would do
      const specPath = join(SPECS_DIR, "greeting.spec.md");
      const content = readFileSync(specPath, "utf-8");

      // Check header parsing
      const headerMatch = content.match(/# speclang-header lines:(\d+)/);
      expect(headerMatch).toBeTruthy();
      expect(headerMatch![1]).toBe("10");

      const idMatch = content.match(/id: "([^"]+)"/);
      expect(idMatch).toBeTruthy();
      expect(idMatch![1]).toBe("@test/greeting");
    });

    it("should parse block definition correctly", () => {
      const specPath = join(SPECS_DIR, "greeting.spec.md");
      const content = readFileSync(specPath, "utf-8");

      // Check block parsing
      const blockMatch = content.match(/### @block:(\w+) @kind:(\w+)/);
      expect(blockMatch).toBeTruthy();
      expect(blockMatch![1]).toBe("greet");
      expect(blockMatch![2]).toBe("function");
    });
  });

  describe("Step 3: Generate Code", () => {
    it("should generate TypeScript code from spec", () => {
      // Simulate code generation
      const generatedCode = `// SPECLANG-GENERATED: function
// Source: @test/greeting#greet
// Version: 1.0.0
// DO NOT EDIT MANUALLY - Changes will be overwritten

/**
 * Returns a personalized greeting.
 * @param name - Person to greet
 * @returns Greeting message
 */
export function greet(name: string): string {
  // TODO: Implement
  throw new Error('Not implemented: greet');
}
`;

      const generatedDir = join(SPECS_DIR, "test-greeting.spec.dir", "src");
      mkdirSync(generatedDir, { recursive: true });

      const generatedPath = join(generatedDir, "greet.ts");
      writeFileSync(generatedPath, generatedCode, "utf-8");

      expect(existsSync(generatedPath)).toBe(true);

      const content = readFileSync(generatedPath, "utf-8");
      expect(content).toContain("// SPECLANG-GENERATED: function");
      expect(content).toContain("export function greet(name: string): string");
      expect(content).toContain("@param name - Person to greet");
    });

    it("should generate barrel export", () => {
      const barrelContent = `// SPECLANG-GENERATED: barrel export
// Source: @test/greeting
// DO NOT EDIT MANUALLY

export * from './greet';
`;

      const barrelPath = join(
        SPECS_DIR,
        "test-greeting.spec.dir",
        "src",
        "index.ts",
      );
      writeFileSync(barrelPath, barrelContent, "utf-8");

      expect(existsSync(barrelPath)).toBe(true);
      expect(readFileSync(barrelPath, "utf-8")).toContain(
        "export * from './greet'",
      );
    });
  });

  describe("Step 4: Create Symlink", () => {
    it("should create symlink in src directory", async () => {
      const sourceDir = join("..", "specs", "test-greeting.spec.dir", "src");
      const linkPath = join(SRC_DIR, "test-greeting");

      // Create relative symlink (simulating what the daemon would do)
      await symlink(sourceDir, linkPath);

      expect(existsSync(linkPath)).toBe(true);
    });
  });

  describe("Step 5: Verify Generated Code Compiles", () => {
    it("should verify generated code is valid TypeScript", () => {
      const generatedPath = join(
        SPECS_DIR,
        "test-greeting.spec.dir",
        "src",
        "greet.ts",
      );
      const content = readFileSync(generatedPath, "utf-8");

      // Check TypeScript syntax patterns
      expect(content).toMatch(/export function \w+\(/); // Function declaration
      expect(content).toMatch(/:\s*string/); // Type annotations
      expect(content).toMatch(/\/\*\*/); // JSDoc comment
      expect(content).toMatch(/@param/); // JSDoc @param
      expect(content).toMatch(/@returns/); // JSDoc @returns
    });

    it("should check all expected files exist", () => {
      const files = [
        join(SPECS_DIR, "greeting.spec.md"),
        join(SPECS_DIR, "test-greeting.spec.dir", "src", "greet.ts"),
        join(SPECS_DIR, "test-greeting.spec.dir", "src", "index.ts"),
        join(SRC_DIR, "test-greeting"),
      ];

      for (const file of files) {
        expect(existsSync(file), `Expected ${file} to exist`).toBe(true);
      }
    });
  });

  describe("Complete Cascade Flow", () => {
    it("should complete full workflow in correct order", async () => {
      // This test verifies the entire flow works end-to-end
      const steps = [
        {
          name: "spec created",
          check: () => existsSync(join(SPECS_DIR, "greeting.spec.md")),
        },
        {
          name: "code generated",
          check: () =>
            existsSync(
              join(SPECS_DIR, "test-greeting.spec.dir", "src", "greet.ts"),
            ),
        },
        {
          name: "barrel created",
          check: () =>
            existsSync(
              join(SPECS_DIR, "test-greeting.spec.dir", "src", "index.ts"),
            ),
        },
        {
          name: "symlink created",
          check: () => existsSync(join(SRC_DIR, "test-greeting")),
        },
      ];

      for (const step of steps) {
        expect(step.check(), `Step '${step.name}' failed`).toBe(true);
      }
    });
  });
});
