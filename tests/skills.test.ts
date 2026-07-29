// SPECLANG-GENERATED
// Source: @speclang/skills
// DO NOT EDIT MANUALLY

import { describe, it, expect, beforeEach } from "vitest";
import { SkillRegistry, SkillLoader, SkillExecutor } from "../src/skills";
import type { Skill, SkillEvent, SkillContext } from "../src/skills/types";

describe("SkillRegistry", () => {
  let registry: SkillRegistry;

  beforeEach(() => {
    registry = new SkillRegistry();
  });

  it("registers and retrieves a skill", () => {
    const skill: Skill = {
      name: "test-skill",
      description: "Test skill",
      version: "0.1.0",
      triggers: [{ event: "file.edited" }],
      owns: [],
      priority: 0,
      systemPrompt: "Test",
      prompts: {},
    };

    registry.register(skill);
    const retrieved = registry.get("test-skill");
    expect(retrieved).toEqual(skill);
  });

  it("returns undefined for unknown skill", () => {
    expect(registry.get("unknown")).toBeUndefined();
  });

  it("unregisters a skill", () => {
    const skill: Skill = {
      name: "test-skill",
      description: "Test",
      version: "0.1.0",
      triggers: [{ event: "file.edited" }],
      owns: [],
      priority: 0,
      systemPrompt: "",
      prompts: {},
    };

    registry.register(skill);
    expect(registry.get("test-skill")).toBeDefined();
    registry.unregister("test-skill");
    expect(registry.get("test-skill")).toBeUndefined();
  });

  it("gets skills by trigger", () => {
    const skill1: Skill = {
      name: "skill1",
      description: "Skill 1",
      version: "0.1.0",
      triggers: [{ event: "file.edited", pattern: "specs/*.spec.md" }],
      owns: [],
      priority: 0,
      systemPrompt: "",
      prompts: {},
    };
    const skill2: Skill = {
      name: "skill2",
      description: "Skill 2",
      version: "0.1.0",
      triggers: [{ event: "file.created" }],
      owns: [],
      priority: 0,
      systemPrompt: "",
      prompts: {},
    };

    registry.register(skill1);
    registry.register(skill2);

    const event: SkillEvent = {
      type: "file.edited",
      path: "specs/test.spec.md",
    };
    const skills = registry.getByTrigger(event);
    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe("skill1");
  });
});

describe("SkillLoader", () => {
  let registry: SkillRegistry;
  let loader: SkillLoader;

  beforeEach(() => {
    registry = new SkillRegistry();
    loader = new SkillLoader(registry);
  });

  it("can be instantiated", () => {
    expect(loader).toBeDefined();
  });

  it("loads a skill file", async () => {
    // Load the spec-writer skill file
    const skill = await loader.loadFile(".opencode/skills/spec-writer.md");
    expect(skill).toBeDefined();
    expect(skill!.name).toBe("spec-writer");
    expect(skill!.triggers).toHaveLength(3);
    expect(skill!.priority).toBe(100);
  });

  it("loads skills directory", async () => {
    const count = await loader.loadDirectory(".opencode/skills");
    expect(count).toBeGreaterThan(0);
    // Check that some skills were registered
    expect(registry.get("spec-writer")).toBeDefined();
    expect(registry.get("code-gen")).toBeDefined();
    expect(registry.get("test-writer")).toBeDefined();
    expect(registry.get("back-sync")).toBeDefined();
    expect(registry.get("Orchestrator")).toBeDefined();
  });
});

describe("SkillExecutor", () => {
  let registry: SkillRegistry;
  let executor: SkillExecutor;

  beforeEach(() => {
    registry = new SkillRegistry();
    executor = new SkillExecutor(registry);
  });

  it("executes a skill", async () => {
    const skill: Skill = {
      name: "test-skill",
      description: "Test",
      version: "0.1.0",
      triggers: [],
      owns: [],
      priority: 0,
      systemPrompt: "Test prompt",
      prompts: {},
    };
    registry.register(skill);

    const context: SkillContext = {
      event: { type: "test" },
      session: {} as any,
      db: {} as any,
      config: {} as any,
    };

    const result = await executor.execute("test-skill", context);
    expect(result.success).toBe(true);
    expect(result.message).toContain("test-skill");
  });

  it("returns failure for unknown skill", async () => {
    const context: SkillContext = {
      event: { type: "test" },
      session: {} as any,
      db: {} as any,
      config: {} as any,
    };

    const result = await executor.execute("unknown", context);
    expect(result.success).toBe(false);
    expect(result.message).toContain("not found");
  });
});
