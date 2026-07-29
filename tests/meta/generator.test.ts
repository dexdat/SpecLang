// SPECLANG-GENERATED
// Test file for src/meta/generator.ts

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs-extra";
import * as path from "path";
import { SpecGenerator } from "../../src/meta/generator.js";

const testProjectRoot = path.join(process.cwd(), "test-temp-meta");

describe("SpecGenerator", () => {
  let generator: SpecGenerator;

  beforeAll(async () => {
    // Create temp directory for tests
    await fs.remove(testProjectRoot);
    await fs.ensureDir(testProjectRoot);
    await fs.ensureDir(path.join(testProjectRoot, "src", "test"));
    await fs.ensureDir(path.join(testProjectRoot, "specs"));

    // Create a test TypeScript file
    await fs.writeFile(
      path.join(testProjectRoot, "src", "test", "example.ts"),
      `export interface TestInterface {
  id: number;
  name: string;
}

export class TestClass {
  private value: string;
  
  constructor(value: string) {
    this.value = value;
  }
  
  public getValue(): string {
    return this.value;
  }
}

export function testFunction(): void {
  console.log("test");
}

export const TEST_CONSTANT = "test";
`,
      "utf-8",
    );

    generator = new SpecGenerator(testProjectRoot);
  });

  it("should generate spec from TypeScript file", async () => {
    const result = await generator.generateFromTypeScript(
      "src/test/example.ts",
    );

    expect(result.success).toBe(true);
    expect(result.spec).toBeDefined();
    expect(result.spec?.header).toBeDefined();
    expect(result.spec?.blocks).toBeDefined();
    expect(result.spec?.blocks.length).toBeGreaterThan(0);
  });

  it("should extract interface as entity block", async () => {
    const result = await generator.generateFromTypeScript(
      "src/test/example.ts",
    );

    expect(result.success).toBe(true);
    const hasInterface = result.spec?.blocks.some(
      (b) => b.id === "testinterface",
    );
    expect(hasInterface).toBe(true);
  });

  it("should extract class as entity block", async () => {
    const result = await generator.generateFromTypeScript(
      "src/test/example.ts",
    );

    expect(result.success).toBe(true);
    const hasClass = result.spec?.blocks.some((b) => b.id === "testclass");
    expect(hasClass).toBe(true);
  });

  it("should extract function as code block", async () => {
    const result = await generator.generateFromTypeScript(
      "src/test/example.ts",
    );

    expect(result.success).toBe(true);
    const hasFunction = result.spec?.blocks.some(
      (b) => b.id === "testfunction",
    );
    expect(hasFunction).toBe(true);
  });

  it("should handle non-existent file", async () => {
    const result = await generator.generateFromTypeScript("src/nonexistent.ts");

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should generate spec with correct header", async () => {
    const result = await generator.generateFromTypeScript(
      "src/test/example.ts",
    );

    expect(result.success).toBe(true);
    // The ID should contain 'example' from the filename
    expect(result.spec?.header.id).toContain("example");
    expect(result.spec?.header.layer).toBe(5);
    expect(result.spec?.header.project_level).toBe("Alpha");
    expect(result.spec?.header.agent_support).toBe("agent_autonomous");
  });

  it("should generate from Go file", async () => {
    // Create a test Go file
    await fs.writeFile(
      path.join(testProjectRoot, "src", "test", "example.go"),
      `package test

type TestStruct struct {
    ID   int
    Name string
}

func NewTestStruct(id int, name string) *TestStruct {
    return &TestStruct{ID: id, Name: name}
}

const TestConstant = "test"
`,
      "utf-8",
    );

    const result = await generator.generateFromGo("src/test/example.go");

    expect(result.success).toBe(true);
    expect(result.spec?.blocks.length).toBeGreaterThan(0);
  });

  it("should generate from Python file", async () => {
    // Create a test Python file
    await fs.writeFile(
      path.join(testProjectRoot, "src", "test", "example.py"),
      `class TestClass:
    def __init__(self, value: str):
        self.value = value
    
    def get_value(self) -> str:
        return self.value

def test_function():
    pass

TEST_CONSTANT = "test"
`,
      "utf-8",
    );

    const result = await generator.generateFromPython("src/test/example.py");

    expect(result.success).toBe(true);
    expect(result.spec?.blocks.length).toBeGreaterThan(0);
  });

  it("should generate project spec", async () => {
    const projectSpec = await generator.generateProjectSpec();

    expect(projectSpec).toBeDefined();
    // Northstar may or may not exist depending on test setup
    expect(Array.isArray(projectSpec.core)).toBe(true);
    expect(Array.isArray(projectSpec.components)).toBe(true);
  });
});
