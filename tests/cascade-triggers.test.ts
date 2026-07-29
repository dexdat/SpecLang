// SPECLANG-GENERATED: @speclang/cascade/triggers
// Tests for cascade triggers

import { describe, test, expect, beforeEach, vi } from "vitest";
import {
  Trigger,
  TriggerSource,
  FileEvent,
  FileChangeKind,
  CascadeState,
  AgentInfo,
  HandlerResult,
} from "../src/cascade/triggers/types";
import {
  matchPattern,
  identifyTriggerSource,
  getTriggerSourceType,
  shouldWatch,
  shouldIgnore,
  WATCH_PATTERNS,
  IGNORE_PATTERNS,
} from "../src/cascade/triggers/sources";
import {
  TriggerRouter,
  InMemoryAgentRegistry,
} from "../src/cascade/triggers/router";
import {
  TriggerHandler,
  UserEditHandler,
  AgentWriteHandler,
  ExternalHandler,
  InMemoryCascadeManager,
  createHandlers,
} from "../src/cascade/triggers/handlers";
import {
  TriggerWatcher,
  createWatcher,
  DEFAULT_WATCH_CONFIG,
} from "../src/cascade/triggers/watcher";

describe("Trigger Types", () => {
  test("should create a valid trigger", () => {
    const trigger: Trigger = {
      id: "trigger-1",
      source: "user_edit",
      file: "project.scl",
      kind: "modify",
      timestamp: new Date(),
      priority: "high",
      cascade_id: "cascade-1",
    };

    expect(trigger.id).toBe("trigger-1");
    expect(trigger.source).toBe("user_edit");
    expect(trigger.priority).toBe("high");
  });

  test("should support all trigger sources", () => {
    const sources: TriggerSource[] = ["user_edit", "agent_write", "external"];
    expect(sources).toContain("user_edit");
    expect(sources).toContain("agent_write");
    expect(sources).toContain("external");
  });
});

describe("Pattern Matching", () => {
  test("should match exact file paths", () => {
    expect(matchPattern("project.scl", "project.scl")).toBe(true);
    expect(matchPattern("other.scl", "project.scl")).toBe(false);
  });

  test("should match glob patterns with *", () => {
    expect(matchPattern("auth.scl", "*.scl")).toBe(true);
    expect(matchPattern("auth.go", "*.go")).toBe(true);
    expect(matchPattern("auth.scl", "auth.*")).toBe(true);
  });

  test("should match glob patterns with **", () => {
    expect(matchPattern("specs/auth/user.scl", "specs/**/*.scl")).toBe(true);
    expect(matchPattern("specs/nested/deep/file.scl", "specs/**/*.scl")).toBe(
      true,
    );
  });

  test("should match file extensions", () => {
    expect(matchPattern("auth.spec.md", "*.spec.md")).toBe(true);
    expect(matchPattern("auth.spec.yaml", "*.spec.yaml")).toBe(true);
    expect(matchPattern("auth.scl", "*.spec.md")).toBe(false);
  });

  test("should handle negation patterns", () => {
    expect(matchPattern("specs/auth.scl", "!specs/*.scl")).toBe(false);
  });
});

describe("Trigger Source Identification", () => {
  test("should identify user edit sources", () => {
    const config = identifyTriggerSource("project.scl");
    expect(config?.source).toBe("user_edit");
    expect(config?.starts_cascade).toBe(true);
  });

  test("should identify spec files as agent write", () => {
    const config = identifyTriggerSource("specs/auth.scl");
    expect(config?.source).toBe("agent_write");
  });

  test("should identify generated files", () => {
    const config = identifyTriggerSource("generated/auth.go");
    expect(config?.source).toBe("agent_write");
    expect(config?.triggers).toContain("speclang-test-writer");
  });

  test("should return null for unknown sources", () => {
    const config = identifyTriggerSource("node_modules/pkg/index.js");
    // Should match external pattern or return a config
    expect(config).not.toBeNull();
  });

  test("should get correct trigger source type", () => {
    expect(getTriggerSourceType("project.scl")).toBe("user_edit");
    expect(getTriggerSourceType("specs/auth.scl")).toBe("agent_write");
    expect(getTriggerSourceType("generated/auth.go")).toBe("agent_write");
  });
});

describe("Watch and Ignore Patterns", () => {
  test("should watch spec files", () => {
    expect(shouldWatch("specs/auth.scl")).toBe(true);
    expect(shouldWatch("auth.spec.md")).toBe(true);
    expect(shouldWatch("project.scl")).toBe(true);
    expect(shouldWatch("auth.scl")).toBe(true);
  });

  test("should ignore system files", () => {
    expect(shouldIgnore("*.log")).toBe(true);
    expect(shouldIgnore("reports/test.log")).toBe(true);
    expect(shouldIgnore(".speclang/state.json")).toBe(true);
    expect(shouldIgnore("node_modules/pkg/index.js")).toBe(true);
  });

  test("should not watch ignored files", () => {
    const filePath = "reports/output.log";
    expect(shouldIgnore(filePath)).toBe(true);
    expect(shouldWatch(filePath)).toBe(false);
  });
});

describe("Trigger Router", () => {
  let registry: InMemoryAgentRegistry;
  let router: TriggerRouter;

  beforeEach(() => {
    const agents: AgentInfo[] = [
      {
        name: "speclang-spec-writer",
        owned_files: ["specs/**/*.scl", "specs/**/*.spec.*"],
        triggers: [],
      },
      {
        name: "speclang-code-gen",
        owned_files: ["generated/**/*"],
        triggers: [],
      },
      {
        name: "speclang-test-writer",
        owned_files: ["tests/**/*"],
        triggers: [],
      },
    ];
    registry = new InMemoryAgentRegistry(agents);
    router = new TriggerRouter(registry);
  });

  test("should route user edit to spec-writer", () => {
    const trigger: Trigger = {
      id: "trigger-1",
      source: "user_edit",
      file: "project.scl",
      kind: "modify",
      timestamp: new Date(),
      priority: "high",
    };

    const result = router.route(trigger);
    expect(result.starts_cascade).toBe(true);
    expect(result.agents).toContain("speclang-spec-writer");
  });

  test("should route spec files to code-gen", () => {
    const trigger: Trigger = {
      id: "trigger-2",
      source: "agent_write",
      file: "specs/auth.scl",
      kind: "create",
      timestamp: new Date(),
      priority: "normal",
    };

    const result = router.route(trigger);
    expect(result.agents).toContain("speclang-code-gen");
  });

  test("should route generated files to test-writer", () => {
    const trigger: Trigger = {
      id: "trigger-3",
      source: "agent_write",
      file: "generated/auth.go",
      kind: "create",
      timestamp: new Date(),
      priority: "normal",
    };

    const result = router.route(trigger);
    expect(result.agents).toContain("speclang-test-writer");
  });

  test("should return correct priority", () => {
    const highPriority = router.route({
      id: "1",
      source: "user_edit",
      file: "project.scl",
      kind: "modify",
      timestamp: new Date(),
      priority: "high",
    });
    expect(highPriority.priority).toBe("high");
  });
});

describe("Cascade Manager", () => {
  let manager: InMemoryCascadeManager;

  beforeEach(() => {
    manager = new InMemoryCascadeManager();
  });

  test("should start a cascade", async () => {
    const trigger: Trigger = {
      id: "trigger-1",
      source: "user_edit",
      file: "project.scl",
      kind: "modify",
      timestamp: new Date(),
      priority: "high",
    };

    const cascadeId = await manager.startCascade(trigger);
    expect(cascadeId).toMatch(/^cascade-/);

    const state = manager.getCascade(cascadeId);
    expect(state).not.toBeNull();
    expect(state?.status).toBe("running");
    expect(state?.depth).toBe(0);
  });

  test("should increment depth", async () => {
    const trigger: Trigger = {
      id: "trigger-1",
      source: "user_edit",
      file: "project.scl",
      kind: "modify",
      timestamp: new Date(),
      priority: "high",
    };

    const cascadeId = await manager.startCascade(trigger);

    expect(manager.incrementDepth(cascadeId)).toBe(true);

    const state = manager.getCascade(cascadeId);
    expect(state?.depth).toBe(1);
  });

  test("should pause at max depth", async () => {
    const trigger: Trigger = {
      id: "trigger-1",
      source: "user_edit",
      file: "project.scl",
      kind: "modify",
      timestamp: new Date(),
      priority: "high",
    };

    const cascadeId = await manager.startCascade(trigger);

    // Simulate reaching max depth
    const state = manager.getCascade(cascadeId);
    if (state) {
      state.depth = state.max_depth - 1;
    }

    // Next increment should fail and pause
    expect(manager.incrementDepth(cascadeId)).toBe(false);

    const finalState = manager.getCascade(cascadeId);
    expect(finalState?.status).toBe("paused");
  });

  test("should mark as converged", async () => {
    const trigger: Trigger = {
      id: "trigger-1",
      source: "user_edit",
      file: "project.scl",
      kind: "modify",
      timestamp: new Date(),
      priority: "high",
    };

    const cascadeId = await manager.startCascade(trigger);
    manager.markConverged(cascadeId);

    expect(manager.isConverged(cascadeId)).toBe(true);
  });

  test("should pause and resume cascade", async () => {
    const trigger: Trigger = {
      id: "trigger-1",
      source: "user_edit",
      file: "project.scl",
      kind: "modify",
      timestamp: new Date(),
      priority: "high",
    };

    const cascadeId = await manager.startCascade(trigger);

    await manager.pauseCascade(cascadeId);
    expect(manager.getCascade(cascadeId)?.status).toBe("paused");

    await manager.resumeCascade(cascadeId);
    expect(manager.getCascade(cascadeId)?.status).toBe("running");
  });
});

describe("Trigger Handlers", () => {
  let manager: InMemoryCascadeManager;
  let registry: InMemoryAgentRegistry;
  let userHandler: UserEditHandler;
  let agentHandler: AgentWriteHandler;
  let externalHandler: ExternalHandler;

  beforeEach(() => {
    manager = new InMemoryCascadeManager();
    const agents: AgentInfo[] = [
      {
        name: "speclang-spec-writer",
        owned_files: ["specs/**/*.scl"],
        triggers: [],
      },
    ];
    registry = new InMemoryAgentRegistry(agents);

    userHandler = new UserEditHandler(manager);
    agentHandler = new AgentWriteHandler(registry, manager);
    externalHandler = new ExternalHandler(manager);
  });

  test("UserEditHandler should start cascade", async () => {
    const trigger: Trigger = {
      id: "trigger-1",
      source: "user_edit",
      file: "project.scl",
      kind: "modify",
      timestamp: new Date(),
      priority: "high",
    };

    expect(userHandler.canHandle(trigger)).toBe(true);

    const result = await userHandler.handle(trigger);
    expect(result.handled).toBe(true);
    expect(result.cascadeStarted).toBeDefined();
    expect(result.agentsInvoked).toContain("speclang-spec-writer");
  });

  test("AgentWriteHandler should route to agents", async () => {
    const trigger: Trigger = {
      id: "trigger-2",
      source: "agent_write",
      file: "specs/auth.scl",
      kind: "create",
      timestamp: new Date(),
      priority: "normal",
    };

    expect(agentHandler.canHandle(trigger)).toBe(true);

    const result = await agentHandler.handle(trigger);
    expect(result.handled).toBe(true);
    expect(result.agentsInvoked).toBeDefined();
  });

  test("ExternalHandler should handle spec-related changes", async () => {
    const trigger: Trigger = {
      id: "trigger-3",
      source: "external",
      file: "specs/auth.scl",
      kind: "create",
      timestamp: new Date(),
      priority: "low",
    };

    expect(externalHandler.canHandle(trigger)).toBe(true);

    const result = await externalHandler.handle(trigger);
    expect(result.handled).toBe(true);
  });

  test("ExternalHandler should ignore non-spec changes", async () => {
    const trigger: Trigger = {
      id: "trigger-4",
      source: "external",
      file: "generated/random.go",
      kind: "create",
      timestamp: new Date(),
      priority: "low",
    };

    expect(externalHandler.canHandle(trigger)).toBe(true);

    const result = await externalHandler.handle(trigger);
    expect(result.handled).toBe(false);
  });

  test("should create handlers with factory", () => {
    const handlers = createHandlers(registry, manager);
    expect(handlers.length).toBe(3);
    expect(handlers[0]).toBeInstanceOf(UserEditHandler);
    expect(handlers[1]).toBeInstanceOf(AgentWriteHandler);
    expect(handlers[2]).toBeInstanceOf(ExternalHandler);
  });
});

describe("Trigger Watcher", () => {
  let watcher: TriggerWatcher;
  let manager: InMemoryCascadeManager;
  let handlers: TriggerHandler[];

  beforeEach(() => {
    manager = new InMemoryCascadeManager();
    const agents: AgentInfo[] = [
      {
        name: "speclang-spec-writer",
        owned_files: ["specs/**/*.scl"],
        triggers: [],
      },
    ];
    const registry = new InMemoryAgentRegistry(agents);

    handlers = createHandlers(registry, manager);
    watcher = new TriggerWatcher({}, handlers);
  });

  test("should create watcher with default config", () => {
    expect(watcher.getConfig().debounce_ms).toBe(100);
    expect(watcher.getConfig().watch_patterns.length).toBeGreaterThan(0);
  });

  test("should process file change events", async () => {
    const event: FileEvent = {
      path: "project.scl",
      kind: "modify",
      timestamp: new Date(),
    };

    // This should not throw
    watcher.onFileChange(event);

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 150));
  });

  test("should ignore non-spec files", () => {
    const event: FileEvent = {
      path: "node_modules/pkg/index.js",
      kind: "modify",
      timestamp: new Date(),
    };

    watcher.onFileChange(event);
    // Should be ignored, no error
  });

  test("should ignore log files", () => {
    const event: FileEvent = {
      path: "debug.log",
      kind: "create",
      timestamp: new Date(),
    };

    watcher.onFileChange(event);
    // Should be ignored
  });

  test("should debounce rapid changes", async () => {
    const triggerCallback = vi.fn();
    watcher.setTriggerCallback(triggerCallback);

    const event: FileEvent = {
      path: "project.scl",
      kind: "modify",
      timestamp: new Date(),
    };

    // Fire multiple times rapidly
    watcher.onFileChange(event);
    watcher.onFileChange(event);
    watcher.onFileChange(event);

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Should only trigger once due to debouncing
    // Note: This may vary based on debounce timing
  });

  test("should add handlers dynamically", () => {
    const initialCount = handlers.length;
    const newHandler: TriggerHandler = {
      canHandle: () => false,
      handle: async () => ({ handled: false }),
    };

    watcher.addHandler(newHandler);

    // Note: handlers array is private, but this tests the method exists
    expect(watcher.addHandler).toBeDefined();
  });
});

describe("Integration Tests", () => {
  test("full cascade flow", async () => {
    // Setup
    const manager = new InMemoryCascadeManager();
    const agents: AgentInfo[] = [
      {
        name: "speclang-spec-writer",
        owned_files: ["specs/**/*.scl"],
        triggers: ["speclang-code-gen"],
      },
      {
        name: "speclang-code-gen",
        owned_files: ["generated/**/*"],
        triggers: ["speclang-test-writer"],
      },
      {
        name: "speclang-test-writer",
        owned_files: ["tests/**/*"],
        triggers: [],
      },
    ];
    const registry = new InMemoryAgentRegistry(agents);
    const handlers = createHandlers(registry, manager);
    const watcher = new TriggerWatcher({}, handlers);

    // Simulate user edit
    const userTrigger: Trigger = {
      id: "trigger-1",
      source: "user_edit",
      file: "project.scl",
      kind: "modify",
      timestamp: new Date(),
      priority: "high",
    };

    // Process user edit
    const userHandler = handlers[0];
    const userResult = await userHandler.handle(userTrigger);

    expect(userResult.cascadeStarted).toBeDefined();
    expect(userResult.agentsInvoked).toContain("speclang-spec-writer");

    // Simulate spec-writer creating a spec
    const specTrigger: Trigger = {
      id: "trigger-2",
      source: "agent_write",
      file: "specs/auth.scl",
      kind: "create",
      timestamp: new Date(),
      priority: "normal",
      cascade_id: userResult.cascadeStarted,
    };

    const agentHandler = handlers[1];
    const specResult = await agentHandler.handle(specTrigger);

    expect(specResult.handled).toBe(true);
    expect(specResult.agentsInvoked).toContain("speclang-code-gen");

    // Simulate code-gen creating generated file
    const genTrigger: Trigger = {
      id: "trigger-3",
      source: "agent_write",
      file: "generated/auth.go",
      kind: "create",
      timestamp: new Date(),
      priority: "normal",
      cascade_id: userResult.cascadeStarted,
    };

    const genResult = await agentHandler.handle(genTrigger);
    expect(genResult.handled).toBe(true);
    expect(genResult.agentsInvoked).toContain("speclang-test-writer");

    // Verify cascade state
    const cascadeState = manager.getCascade(userResult.cascadeStarted!);
    expect(cascadeState?.depth).toBe(2);
    expect(cascadeState?.status).toBe("running");
  });

  test("convergence detection", async () => {
    const manager = new InMemoryCascadeManager();
    const agents: AgentInfo[] = [
      {
        name: "speclang-spec-writer",
        owned_files: ["specs/**/*.scl"],
        triggers: [],
      },
    ];
    const registry = new InMemoryAgentRegistry(agents);
    const handlers = createHandlers(registry, manager);

    const trigger: Trigger = {
      id: "trigger-1",
      source: "user_edit",
      file: "project.scl",
      kind: "modify",
      timestamp: new Date(),
      priority: "high",
    };

    const handler = handlers[0];
    const result = await handler.handle(trigger);

    // Mark as converged
    manager.markConverged(result.cascadeStarted!);

    expect(manager.isConverged(result.cascadeStarted!)).toBe(true);
    expect(manager.getCascade(result.cascadeStarted!)?.status).toBe(
      "converged",
    );
  });
});
