/**
 * SPECLANG-GENERATED: Tests for autonomous test runner
 * Source: @speclang/autonomous-validation
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  AutonomousTestRunner,
  runAutonomousTests,
} from "../../src/autonomous/test-runner.js";
import { AUTONOMOUS_SCENARIOS } from "../../src/autonomous/scenarios.js";

describe("AutonomousTestRunner", () => {
  let runner: AutonomousTestRunner;

  beforeEach(() => {
    runner = new AutonomousTestRunner();
  });

  afterEach(() => {
    runner.stop();
  });

  describe("constructor", () => {
    it("should create a runner with default config", () => {
      expect(runner).toBeDefined();
    });

    it("should accept custom config", () => {
      const customRunner = new AutonomousTestRunner({
        parallel: true,
        maxConcurrency: 5,
      });
      expect(customRunner).toBeDefined();
    });
  });

  describe("loadTests", () => {
    it("should load all test scenarios", () => {
      const tests = runner.loadTests();
      expect(tests).toBeDefined();
      expect(tests.length).toBeGreaterThan(0);
    });

    it("should include spec_generation test", () => {
      const tests = runner.loadTests();
      const specGenTest = tests.find(
        (t) => t.scenario.type === "spec_generation",
      );
      expect(specGenTest).toBeDefined();
    });

    it("should include code_generation test", () => {
      const tests = runner.loadTests();
      const codeGenTest = tests.find(
        (t) => t.scenario.type === "code_generation",
      );
      expect(codeGenTest).toBeDefined();
    });
  });

  describe("runAll", () => {
    it("should run all tests and return report", async () => {
      const report = await runner.runAll();

      expect(report).toBeDefined();
      expect(report.total).toBeGreaterThan(0);
      expect(report.results).toBeDefined();
      expect(report.timestamp).toBeInstanceOf(Date);
    });

    it("should track passed and failed tests", async () => {
      const report = await runner.runAll();

      expect(typeof report.passed).toBe("number");
      expect(typeof report.failed).toBe("number");
      expect(report.passed + report.failed).toBe(report.total);
    });

    it("should track test duration", async () => {
      const report = await runner.runAll();

      expect(report.duration).toBeGreaterThan(0);
    });
  });

  describe("runByName", () => {
    it("should run a specific test by name", async () => {
      const result = await runner.runByName("spec_generation_basic");

      expect(result).toBeDefined();
      expect(result?.test).toBe("spec_generation_basic");
    });

    it("should return null for unknown test name", async () => {
      const result = await runner.runByName("nonexistent_test");

      expect(result).toBeNull();
    });
  });

  describe("runByType", () => {
    it("should run tests by scenario type", async () => {
      const report = await runner.runByType("spec_generation");

      expect(report).toBeDefined();
      expect(report.total).toBeGreaterThan(0);
    });
  });

  describe("stop", () => {
    it("should stop the runner", () => {
      runner.stop();
      const state = runner.getState();
      expect(state.running).toBe(false);
    });
  });

  describe("getState", () => {
    it("should return current state", () => {
      const state = runner.getState();

      expect(state).toBeDefined();
      expect(state.running).toBe(false);
      expect(state.results).toEqual([]);
    });
  });
});

describe("runAutonomousTests", () => {
  it("should run all tests by default", async () => {
    const report = await runAutonomousTests();

    expect(report).toBeDefined();
    expect(report.total).toBe(AUTONOMOUS_SCENARIOS.length);
  });

  it("should run specific test when name provided", async () => {
    const report = await runAutonomousTests("spec_generation_basic");

    expect(report).toBeDefined();
    expect(report.total).toBe(1);
    expect(report.results[0]?.test).toBe("spec_generation_basic");
  });

  it("should return empty report for unknown test", async () => {
    const report = await runAutonomousTests("unknown_test");

    expect(report.total).toBe(0);
  });
});

describe("Test scenarios", () => {
  it("should have valid structure", () => {
    for (const test of AUTONOMOUS_SCENARIOS) {
      expect(test.name).toBeDefined();
      expect(test.description).toBeDefined();
      expect(test.scenario).toBeDefined();
      expect(test.expected).toBeDefined();
      expect(test.timeout).toBeGreaterThan(0);
    }
  });

  it("should have critical tests defined", () => {
    const criticalTests = AUTONOMOUS_SCENARIOS.filter((t) => t.critical);
    expect(criticalTests.length).toBeGreaterThan(0);
  });
});
