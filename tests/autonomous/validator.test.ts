/**
 * Test validator
 */
import { describe, it, expect } from "vitest";
import {
  validateAutonomousReadiness,
  formatValidationReport,
} from "../../src/autonomous/validator.js";

describe("AutonomousValidator", () => {
  it("should validate autonomous readiness", async () => {
    const report = await validateAutonomousReadiness();

    console.log("\n=== Validation Report ===");
    console.log(formatValidationReport(report));

    expect(report).toBeDefined();
    expect(report.checks).toBeDefined();
    expect(report.checks.length).toBeGreaterThan(0);
  });
});
