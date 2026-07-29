import { describe, it, expect, beforeEach } from "vitest";
import { UpgradePlanner } from "../../src/transition/upgrade/planner";
import { UpgradeValidator } from "../../src/transition/upgrade/validator";
import { UpgradeExecutor } from "../../src/transition/upgrade/executor";
import { registerUpgradeWorkflows } from "../../src/transition/upgrade/index";
import { TransitionRegistryImpl } from "../../src/transition/registry";
import type {
  SpecRef,
  UpgradePlan,
  ValidationResult,
  ExecutionResult,
} from "../../src/transition/upgrade/types";

describe("UpgradePlanner", () => {
  let planner: UpgradePlanner;

  beforeEach(() => {
    planner = new UpgradePlanner();
  });

  describe("plan", () => {
    it("should create a plan for POC to MVP transition", () => {
      const specs: SpecRef[] = [{ id: "@specs/core" }];
      const plan = planner.plan("POC", "MVP", specs);

      expect(plan.from).toBe("POC");
      expect(plan.to).toBe("MVP");
      expect(plan.specs).toHaveLength(1);
      expect(plan.checks.length).toBeGreaterThan(0);
      expect(plan.estimatedDuration).toBeGreaterThan(0);
    });

    it("should create a plan for MVP to Alpha transition", () => {
      const specs: SpecRef[] = [
        { id: "@specs/core" },
        { id: "@specs/auth", name: "Auth" },
      ];
      const plan = planner.plan("MVP", "Alpha", specs);

      expect(plan.from).toBe("MVP");
      expect(plan.to).toBe("Alpha");
      expect(plan.specs).toHaveLength(2);
    });

    it("should create a plan for Alpha to Beta transition", () => {
      const plan = planner.plan("Alpha", "Beta", [{ id: "@specs/core" }]);

      expect(plan.from).toBe("Alpha");
      expect(plan.to).toBe("Beta");
    });

    it("should create a plan for Beta to Production transition", () => {
      const plan = planner.plan("Beta", "Production", [{ id: "@specs/core" }]);

      expect(plan.from).toBe("Beta");
      expect(plan.to).toBe("Production");
    });

    it("should include required approvals for Production target", () => {
      const plan = planner.plan("Beta", "Production", [{ id: "@specs/core" }]);

      expect(plan.requiredApprovals).toBeDefined();
      expect(plan.requiredApprovals).toContain("production_readiness_review");
      expect(plan.requiredApprovals).toContain("security_review");
    });

    it("should throw for invalid transition path", () => {
      expect(() => {
        planner.plan("POC", "Production", [{ id: "@specs/core" }]);
      }).toThrow("No upgrade path defined");
    });
  });

  describe("check", () => {
    it("should return check results for a spec", () => {
      const spec: SpecRef = { id: "@specs/core", name: "Core Spec" };
      const results = planner.check("POC", "MVP", spec);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty("check");
      expect(results[0]).toHaveProperty("passed");
      expect(results[0]).toHaveProperty("message");
    });

    it("should mark automated checks as passed", () => {
      const spec: SpecRef = { id: "@specs/core" };
      const results = planner.check("POC", "MVP", spec);
      const automatedChecks = results.filter((r) => r.check.automated);

      for (const result of automatedChecks) {
        expect(result.passed).toBe(true);
      }
    });

    it("should mark manual checks as pending", () => {
      const spec: SpecRef = { id: "@specs/core" };
      const results = planner.check("POC", "MVP", spec);
      const manualChecks = results.filter((r) => !r.check.automated);

      for (const result of manualChecks) {
        expect(result.passed).toBe(true);
        expect(result.message).toContain("Manual check");
      }
    });
  });

  describe("isValidTransition", () => {
    it("should return true for valid project level transitions", () => {
      expect(planner.isValidTransition("POC", "MVP")).toBe(true);
      expect(planner.isValidTransition("MVP", "Alpha")).toBe(true);
      expect(planner.isValidTransition("Alpha", "Beta")).toBe(true);
      expect(planner.isValidTransition("Beta", "Production")).toBe(true);
    });

    it("should return true for valid agent support transitions", () => {
      expect(planner.isValidTransition("human_only", "agent_assisted")).toBe(
        true,
      );
      expect(
        planner.isValidTransition("agent_assisted", "agent_autonomous"),
      ).toBe(true);
    });

    it("should return false for invalid transitions", () => {
      expect(planner.isValidTransition("POC", "Production")).toBe(false);
      expect(planner.isValidTransition("Alpha", "POC")).toBe(false);
    });
  });

  describe("listTransitionPaths", () => {
    it("should list all available transition paths", () => {
      const paths = planner.listTransitionPaths();

      expect(paths.length).toBeGreaterThanOrEqual(6);
      expect(paths).toContainEqual({
        from: "POC",
        to: "MVP",
        type: "project_level",
      });
      expect(paths).toContainEqual({
        from: "human_only",
        to: "agent_assisted",
        type: "agent_support",
      });
    });
  });
});

describe("UpgradeValidator", () => {
  let planner: UpgradePlanner;
  let validator: UpgradeValidator;

  beforeEach(() => {
    planner = new UpgradePlanner();
    validator = new UpgradeValidator();
  });

  describe("validate", () => {
    it("should validate a POC to MVP plan with basic checks", () => {
      const plan = planner.plan("POC", "MVP", [{ id: "@specs/core" }]);
      const result = validator.validate(plan);

      expect(result.valid).toBe(true);
      expect(result.checks.length).toBeGreaterThan(0);
    });

    it("should return blocking checks for failed validations", () => {
      const plan = planner.plan("MVP", "Alpha", []);
      const result = validator.validate(plan);

      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("checks");
      expect(result).toHaveProperty("blockingChecks");
    });

    it("should identify phase-specific validation for POC→MVP", () => {
      const plan = planner.plan("POC", "MVP", [{ id: "@specs/core" }]);
      const result = validator.validate(plan);

      const hasPhaseCheck = result.checks.some(
        (c) => c.name === "phase_basic_validation",
      );
      expect(hasPhaseCheck).toBe(true);
    });

    it("should identify phase-specific validation for MVP→Alpha", () => {
      const plan = planner.plan("MVP", "Alpha", [{ id: "@specs/core" }]);
      const result = validator.validate(plan);

      const hasRefsCheck = result.checks.some(
        (c) => c.name === "phase_refs_and_tests",
      );
      expect(hasRefsCheck).toBe(true);
    });

    it("should identify phase-specific validation for Alpha→Beta", () => {
      const plan = planner.plan("Alpha", "Beta", [{ id: "@specs/core" }]);
      const result = validator.validate(plan);

      const hasStepByStep = result.checks.some(
        (c) => c.name === "phase_step_by_step",
      );
      const hasComprehensiveTests = result.checks.some(
        (c) => c.name === "phase_comprehensive_tests",
      );
      expect(hasStepByStep).toBe(true);
      expect(hasComprehensiveTests).toBe(true);
    });

    it("should identify phase-specific validation for Beta→Production", () => {
      const plan = planner.plan("Beta", "Production", [{ id: "@specs/core" }]);
      const result = validator.validate(plan);

      const hasSecurity = result.checks.some(
        (c) => c.name === "phase_security_validation",
      );
      const hasAutonomous = result.checks.some(
        (c) => c.name === "phase_autonomous_validation",
      );
      expect(hasSecurity).toBe(true);
      expect(hasAutonomous).toBe(true);
    });

    it("should include production readiness check for Beta→Production", () => {
      const plan = planner.plan("Beta", "Production", [{ id: "@specs/core" }]);
      const result = validator.validate(plan);

      const readinessCheck = result.checks.find(
        (c) => c.name === "phase_production_readiness",
      );
      expect(readinessCheck).toBeDefined();
      expect(readinessCheck!.passed).toBe(true);
    });

    it("should validate agent support transitions", () => {
      const plan = planner.plan("human_only", "agent_assisted", [
        { id: "@specs/core" },
      ]);
      const result = validator.validate(plan);

      expect(result.valid).toBe(true);
      const hasAgentReadiness = result.checks.some(
        (c) => c.name === "phase_agent_readiness",
      );
      expect(hasAgentReadiness).toBe(true);
    });
  });
});

describe("UpgradeExecutor", () => {
  let planner: UpgradePlanner;
  let executor: UpgradeExecutor;

  beforeEach(() => {
    planner = new UpgradePlanner();
    executor = new UpgradeExecutor();
  });

  describe("execute", () => {
    it("should execute a plan successfully", async () => {
      const plan = planner.plan("POC", "MVP", [{ id: "@specs/core" }]);
      const result = await executor.execute(plan);

      expect(result.success).toBe(true);
      expect(result.plan.from).toBe("POC");
      expect(result.plan.to).toBe("MVP");
    });

    it("should return execution timestamp", async () => {
      const plan = planner.plan("MVP", "Alpha", [{ id: "@specs/core" }]);
      const result = await executor.execute(plan);

      expect(result.executedAt).toBeDefined();
      expect(new Date(result.executedAt!).getTime()).not.toBeNaN();
    });

    it("should include pending approvals as warnings", async () => {
      const plan = planner.plan("Beta", "Production", [{ id: "@specs/core" }]);
      const result = await executor.execute(plan);

      expect(result.warnings).toBeDefined();
      if (result.warnings) {
        const approvalWarning = result.warnings.some((w) =>
          w.includes("approvals"),
        );
        expect(approvalWarning).toBe(true);
      }
    });

    it("should handle plan without approvals gracefully", async () => {
      const plan: UpgradePlan = {
        from: "POC",
        to: "MVP",
        specs: [{ id: "@specs/core" }],
        checks: [],
      };
      const result = await executor.execute(plan);

      expect(result.success).toBe(true);
    });
  });

  describe("rollback", () => {
    it("should not throw when rolling back a successful result", async () => {
      const plan = planner.plan("POC", "MVP", [{ id: "@specs/core" }]);
      const result: ExecutionResult = {
        success: true,
        plan,
        executedAt: new Date().toISOString(),
      };

      await expect(executor.rollback(plan, result)).resolves.not.toThrow();
    });

    it("should not throw when rolling back a failed result", async () => {
      const plan = planner.plan("POC", "MVP", [{ id: "@specs/core" }]);
      const result: ExecutionResult = {
        success: false,
        plan,
        errors: ["Execution failed: timeout"],
      };

      await expect(executor.rollback(plan, result)).resolves.not.toThrow();
    });

    it("should handle rollback with warnings", async () => {
      const plan = planner.plan("POC", "MVP", [{ id: "@specs/core" }]);
      const result: ExecutionResult = {
        success: false,
        plan,
        warnings: ["Approval not granted"],
        errors: ["Validation failed"],
      };

      await expect(executor.rollback(plan, result)).resolves.not.toThrow();
    });
  });
});

describe("Upgrade Workflow Registration", () => {
  it("should register all predefined workflows", () => {
    const registry = new TransitionRegistryImpl();
    registerUpgradeWorkflows(registry);

    expect(registry.hasWorkflow("upgrade", "POC", "MVP")).toBe(true);
    expect(registry.hasWorkflow("upgrade", "MVP", "Alpha")).toBe(true);
    expect(registry.hasWorkflow("upgrade", "Alpha", "Beta")).toBe(true);
    expect(registry.hasWorkflow("upgrade", "Beta", "Production")).toBe(true);
    expect(
      registry.hasWorkflow("upgrade", "human_only", "agent_assisted"),
    ).toBe(true);
    expect(
      registry.hasWorkflow("upgrade", "agent_assisted", "agent_autonomous"),
    ).toBe(true);
  });

  it("should register exactly 6 workflows", () => {
    const registry = new TransitionRegistryImpl();
    registerUpgradeWorkflows(registry);

    const workflows = registry.listWorkflows();
    expect(workflows).toHaveLength(6);
  });

  it("registered workflows should execute without error for valid states", async () => {
    const registry = new TransitionRegistryImpl();
    registerUpgradeWorkflows(registry);

    const workflow = registry.getWorkflow("upgrade", "POC", "MVP");
    expect(workflow).not.toBeNull();

    await expect(workflow!.execute()).resolves.not.toThrow();
  });
});
