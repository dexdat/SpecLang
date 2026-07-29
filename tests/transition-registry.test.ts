/**
 * SPECLANG-GENERATED: Transition Registry Tests
 * Source: specs/transition.spec.md
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  TransitionRegistry,
  TransitionRegistryImpl,
  UpgradeWorkflow,
  DowngradeWorkflow,
  Workflow,
  getDefaultRegistry,
} from "../src/transition/registry";

describe("TransitionRegistry", () => {
  let registry: TransitionRegistryImpl;

  beforeEach(() => {
    registry = new TransitionRegistryImpl();
  });

  afterEach(() => {
    registry.clear();
  });

  describe("registerUpgrade", () => {
    it("should register an upgrade workflow", () => {
      const workflow: UpgradeWorkflow = {
        type: "upgrade",
        fromLevel: "POC",
        toLevel: "MVP",
        execute: async () => {},
      };

      registry.registerUpgrade(workflow);
      expect(registry.hasWorkflow("upgrade", "POC", "MVP")).toBe(true);
    });

    it("should allow registering multiple upgrade workflows", () => {
      const workflow1: UpgradeWorkflow = {
        type: "upgrade",
        fromLevel: "POC",
        toLevel: "MVP",
        execute: async () => {},
      };

      const workflow2: UpgradeWorkflow = {
        type: "upgrade",
        fromLevel: "MVP",
        toLevel: "Alpha",
        execute: async () => {},
      };

      registry.registerUpgrade(workflow1);
      registry.registerUpgrade(workflow2);

      expect(registry.hasWorkflow("upgrade", "POC", "MVP")).toBe(true);
      expect(registry.hasWorkflow("upgrade", "MVP", "Alpha")).toBe(true);
    });

    it("should overwrite existing workflow with same key", () => {
      const workflow1: UpgradeWorkflow = {
        type: "upgrade",
        fromLevel: "POC",
        toLevel: "MVP",
        execute: async () => {
          throw new Error("first");
        },
      };

      const workflow2: UpgradeWorkflow = {
        type: "upgrade",
        fromLevel: "POC",
        toLevel: "MVP",
        execute: async () => {
          throw new Error("second");
        },
      };

      registry.registerUpgrade(workflow1);
      registry.registerUpgrade(workflow2);

      const retrieved = registry.getWorkflow("upgrade", "POC", "MVP");
      expect(retrieved).toBe(workflow2);
    });
  });

  describe("registerDowngrade", () => {
    it("should register a downgrade workflow", () => {
      const workflow: DowngradeWorkflow = {
        type: "downgrade",
        fromLevel: "Beta",
        toLevel: "Alpha",
        execute: async () => {},
      };

      registry.registerDowngrade(workflow);
      expect(registry.hasWorkflow("downgrade", "Beta", "Alpha")).toBe(true);
    });
  });

  describe("getWorkflow", () => {
    it("should retrieve a registered upgrade workflow", () => {
      const workflow: UpgradeWorkflow = {
        type: "upgrade",
        fromLevel: "MVP",
        toLevel: "Alpha",
        execute: async () => {},
      };

      registry.registerUpgrade(workflow);
      const retrieved = registry.getWorkflow("upgrade", "MVP", "Alpha");

      expect(retrieved).toBe(workflow);
    });

    it("should return null for non-existent workflow", () => {
      const retrieved = registry.getWorkflow("upgrade", "POC", "Production");
      expect(retrieved).toBeNull();
    });
  });

  describe("hasWorkflow", () => {
    it("should return true for existing workflow", () => {
      const workflow: UpgradeWorkflow = {
        type: "upgrade",
        fromLevel: "Alpha",
        toLevel: "Beta",
        execute: async () => {},
      };

      registry.registerUpgrade(workflow);
      expect(registry.hasWorkflow("upgrade", "Alpha", "Beta")).toBe(true);
    });

    it("should return false for non-existent workflow", () => {
      expect(registry.hasWorkflow("upgrade", "POC", "Beta")).toBe(false);
    });
  });

  describe("listWorkflows", () => {
    it("should list all registered workflows", () => {
      const workflow1: UpgradeWorkflow = {
        type: "upgrade",
        fromLevel: "POC",
        toLevel: "MVP",
        execute: async () => {},
      };

      const workflow2: UpgradeWorkflow = {
        type: "upgrade",
        fromLevel: "MVP",
        toLevel: "Alpha",
        execute: async () => {},
      };

      const workflow3: DowngradeWorkflow = {
        type: "downgrade",
        fromLevel: "Beta",
        toLevel: "Alpha",
        execute: async () => {},
      };

      registry.registerUpgrade(workflow1);
      registry.registerUpgrade(workflow2);
      registry.registerDowngrade(workflow3);

      const workflows = registry.listWorkflows();
      expect(workflows).toHaveLength(3);
    });

    it("should return empty array when no workflows registered", () => {
      const workflows = registry.listWorkflows();
      expect(workflows).toHaveLength(0);
    });
  });

  describe("listWorkflowKeys", () => {
    it("should list all workflow keys", () => {
      const workflow: UpgradeWorkflow = {
        type: "upgrade",
        fromLevel: "POC",
        toLevel: "MVP",
        execute: async () => {},
      };

      registry.registerUpgrade(workflow);
      const keys = registry.listWorkflowKeys();

      expect(keys).toContain("upgrade:POC:MVP");
    });
  });

  describe("clear", () => {
    it("should remove all workflows", () => {
      const workflow: UpgradeWorkflow = {
        type: "upgrade",
        fromLevel: "POC",
        toLevel: "MVP",
        execute: async () => {},
      };

      registry.registerUpgrade(workflow);
      expect(registry.listWorkflows()).toHaveLength(1);

      registry.clear();
      expect(registry.listWorkflows()).toHaveLength(0);
    });
  });
});

describe("Default Registry", () => {
  it("should return a singleton instance", () => {
    const registry1 = getDefaultRegistry();
    const registry2 = getDefaultRegistry();

    expect(registry1).toBe(registry2);
  });
});

describe("Workflow Types", () => {
  it("should correctly identify upgrade workflow type", () => {
    const workflow: UpgradeWorkflow = {
      type: "upgrade",
      fromLevel: "POC",
      toLevel: "MVP",
      execute: async () => {},
    };

    expect(workflow.type).toBe("upgrade");
  });

  it("should correctly identify downgrade workflow type", () => {
    const workflow: DowngradeWorkflow = {
      type: "downgrade",
      fromLevel: "Beta",
      toLevel: "Alpha",
      execute: async () => {},
    };

    expect(workflow.type).toBe("downgrade");
  });
});
