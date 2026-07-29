// SPECLANG-GENERATED
// Test file for src/meta/bootstrap.ts

import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs-extra";
import * as path from "path";
import { MetaBootstrap } from "../../src/meta/bootstrap.js";

const testProjectRoot = path.join(process.cwd(), "test-temp-bootstrap");

describe("MetaBootstrap", () => {
  let bootstrap: MetaBootstrap;

  beforeAll(async () => {
    // Create temp directory for tests - clean start
    await fs.remove(testProjectRoot);
    await fs.ensureDir(testProjectRoot);
    await fs.ensureDir(path.join(testProjectRoot, "src", "db"));
    await fs.ensureDir(path.join(testProjectRoot, "specs"));
    await fs.ensureDir(
      path.join(testProjectRoot, "specs", "implementation.spec.dir"),
    );

    // Create a minimal test TypeScript file
    await fs.writeFile(
      path.join(testProjectRoot, "src", "db", "index.ts"),
      `export interface DatabaseConfig {
  path: string;
}

export class Database {
  constructor(config: DatabaseConfig) {}
  
  public query(sql: string): any[] {
    return [];
  }
}
`,
      "utf-8",
    );

    bootstrap = new MetaBootstrap(testProjectRoot);
  });

  it("should create bootstrap instance", () => {
    expect(bootstrap).toBeDefined();
  });

  it("should have initial phase status", () => {
    const phases = bootstrap.getPhaseStatus();
    expect(Array.isArray(phases)).toBe(true);
  });

  it("should run dry-run bootstrap", async () => {
    const result = await bootstrap.run(true);

    expect(result).toBeDefined();
    expect(result.duration).toBeGreaterThan(0);
    // In dry-run mode, we expect it to at least attempt phases
    expect(typeof result.success).toBe("boolean");
  });

  it("should generate specs from code", async () => {
    const specs = await bootstrap.generateSpecsFromCode();

    // This may return empty if directories don't exist or are empty
    expect(Array.isArray(specs)).toBe(true);
  });

  it("should validate self-consistency", async () => {
    const validation = await bootstrap.validateSelfConsistency();

    expect(validation).toBeDefined();
    expect(typeof validation.passed).toBe("boolean");
    expect(typeof validation.totalSpecs).toBe("number");
    expect(typeof validation.failed).toBe("number");
  });

  it("should verify equivalence", async () => {
    const equivalence = await bootstrap.verifyEquivalence();

    expect(equivalence).toBeDefined();
    expect(typeof equivalence.verified).toBe("boolean");
    expect(Array.isArray(equivalence.differences)).toBe(true);
  });

  it("should get source-spec mappings", async () => {
    const mappings = await bootstrap.getSourceSpecMappings();

    expect(Array.isArray(mappings)).toBe(true);
  });
});
