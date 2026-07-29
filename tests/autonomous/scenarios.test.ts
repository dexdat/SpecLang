/**
 * SPECLANG-GENERATED: Tests for autonomous test scenarios
 * Source: @speclang/autonomous-validation
 */

import { describe, it, expect } from "vitest";
import {
  AUTONOMOUS_SCENARIOS,
  getScenarioByName,
  getCriticalScenarios,
  getScenariosByType,
  validateScenarioConfig,
} from "../../src/autonomous/scenarios.js";

describe("AUTONOMOUS_SCENARIOS", () => {
  it("should have at least 5 test scenarios", () => {
    expect(AUTONOMOUS_SCENARIOS.length).toBeGreaterThanOrEqual(5);
  });

  it("should include spec_generation scenario", () => {
    const hasSpecGen = AUTONOMOUS_SCENARIOS.some(
      (s) => s.scenario.type === "spec_generation",
    );
    expect(hasSpecGen).toBe(true);
  });

  it("should include code_generation scenario", () => {
    const hasCodeGen = AUTONOMOUS_SCENARIOS.some(
      (s) => s.scenario.type === "code_generation",
    );
    expect(hasCodeGen).toBe(true);
  });

  it("should include cascade scenario", () => {
    const hasCascade = AUTONOMOUS_SCENARIOS.some(
      (s) => s.scenario.type === "cascade",
    );
    expect(hasCascade).toBe(true);
  });

  it("should include pipeline scenario", () => {
    const hasPipeline = AUTONOMOUS_SCENARIOS.some(
      (s) => s.scenario.type === "pipeline",
    );
    expect(hasPipeline).toBe(true);
  });

  it("should include self_specifying scenario", () => {
    const hasSelfSpec = AUTONOMOUS_SCENARIOS.some(
      (s) => s.scenario.type === "self_specifying",
    );
    expect(hasSelfSpec).toBe(true);
  });
});

describe("getScenarioByName", () => {
  it("should return scenario by name", () => {
    const scenario = getScenarioByName("spec_generation_basic");
    expect(scenario).toBeDefined();
    expect(scenario?.name).toBe("spec_generation_basic");
  });

  it("should return undefined for unknown name", () => {
    const scenario = getScenarioByName("nonexistent");
    expect(scenario).toBeUndefined();
  });

  it("should find code_generation_typescript", () => {
    const scenario = getScenarioByName("code_generation_typescript");
    expect(scenario).toBeDefined();
    expect(scenario?.scenario.type).toBe("code_generation");
  });
});

describe("getCriticalScenarios", () => {
  it("should return critical scenarios", () => {
    const critical = getCriticalScenarios();
    expect(critical.length).toBeGreaterThan(0);
  });

  it("should mark critical scenarios correctly", () => {
    const critical = getCriticalScenarios();
    for (const scenario of critical) {
      expect(scenario.critical).toBe(true);
    }
  });
});

describe("getScenariosByType", () => {
  it("should filter by scenario type", () => {
    const specGenScenarios = getScenariosByType("spec_generation");
    expect(specGenScenarios.length).toBeGreaterThan(0);

    for (const scenario of specGenScenarios) {
      expect(scenario.scenario.type).toBe("spec_generation");
    }
  });

  it("should return empty array for unknown type", () => {
    const unknown = getScenariosByType("unknown_type");
    expect(unknown).toEqual([]);
  });
});

describe("validateScenarioConfig", () => {
  it("should validate a correct scenario", () => {
    const scenario = AUTONOMOUS_SCENARIOS[0];
    const result = validateScenarioConfig(scenario);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should reject scenario without name", () => {
    const result = validateScenarioConfig({
      name: "",
      description: "Test",
      scenario: { type: "spec_generation", config: {} },
      expected: {
        success: true,
        metrics: { time: 1000, memory: 100, accuracy: 1 },
        artifacts: [],
      },
      timeout: 1000,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Test name is required");
  });

  it("should reject scenario without description", () => {
    const result = validateScenarioConfig({
      name: "test",
      description: "",
      scenario: { type: "spec_generation", config: {} },
      expected: {
        success: true,
        metrics: { time: 1000, memory: 100, accuracy: 1 },
        artifacts: [],
      },
      timeout: 1000,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Test description is required");
  });

  it("should reject scenario with negative timeout", () => {
    const result = validateScenarioConfig({
      name: "test",
      description: "Test description",
      scenario: { type: "spec_generation", config: {} },
      expected: {
        success: true,
        metrics: { time: 1000, memory: 100, accuracy: 1 },
        artifacts: [],
      },
      timeout: -1,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Test timeout must be positive");
  });
});

describe("Scenario structure", () => {
  it("all scenarios should have valid timeouts", () => {
    for (const scenario of AUTONOMOUS_SCENARIOS) {
      expect(scenario.timeout).toBeGreaterThan(0);
    }
  });

  it("all scenarios should have valid expected metrics", () => {
    for (const scenario of AUTONOMOUS_SCENARIOS) {
      expect(scenario.expected.metrics.time).toBeGreaterThan(0);
      expect(scenario.expected.metrics.memory).toBeGreaterThan(0);
      expect(scenario.expected.metrics.accuracy).toBeGreaterThanOrEqual(0);
      expect(scenario.expected.metrics.accuracy).toBeLessThanOrEqual(1);
    }
  });

  it("all scenarios should have artifacts array", () => {
    for (const scenario of AUTONOMOUS_SCENARIOS) {
      expect(Array.isArray(scenario.expected.artifacts)).toBe(true);
    }
  });
});
