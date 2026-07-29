/**
 * SPECLANG-GENERATED: Validation rules tests
 * Source: @speclang/validation
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  headerRule,
  idRule,
  refsRule,
  blocksRule,
  autonomousRule,
  RuleRegistry,
} from "../../src/validation/rules";
import type { ParsedSpec } from "../../src/parser/types";

describe("Validation Rules", () => {
  describe("Header Rule", () => {
    it("should pass valid header", () => {
      const spec: ParsedSpec = {
        filepath: "specs/test.spec.md",
        headerLines: 12,
        metadata: {
          id: "@specs/test",
          version: "1.0.0",
          layer: 5,
          project_level: "Alpha",
          agent_support: "agent_autonomous",
          tags: ["test"],
          short: "Test spec",
        },
        content: "# Content",
        blocks: [],
        references: [],
        headerRaw:
          "# speclang-header lines:12\nid: @specs/test\nversion: 1.0.0\nlayer: 5\nproject_level: Alpha\nagent_support: agent_autonomous\ntags: [test]\nshort: Test spec\n---\n",
      };

      const results = headerRule.check(spec);
      const errors = results.filter((r) => r.level === "error");
      expect(errors).toHaveLength(0);
    });

    it("should fail missing required fields", () => {
      const spec: ParsedSpec = {
        filepath: "specs/test.spec.md",
        headerLines: 12,
        metadata: {
          id: "",
          version: "",
        },
        content: "# Content",
        blocks: [],
        references: [],
        headerRaw: "# speclang-header lines:12\n---\n# Content",
      };

      const results = headerRule.check(spec);
      const errors = results.filter((r) => r.level === "error");
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.message.includes("id"))).toBe(true);
      expect(errors.some((e) => e.message.includes("version"))).toBe(true);
    });

    it("should fail invalid project_level", () => {
      const spec: ParsedSpec = {
        filepath: "specs/test.spec.md",
        headerLines: 12,
        metadata: {
          id: "@specs/test",
          version: "1.0.0",
          project_level: "INVALID" as any,
        },
        content: "# Content",
        blocks: [],
        references: [],
        headerRaw:
          "# speclang-header lines:12\nid: @specs/test\nversion: 1.0.0\nproject_level: INVALID\n---\n",
      };

      const results = headerRule.check(spec);
      const errors = results.filter((r) => r.level === "error");
      expect(errors.some((e) => e.message.includes("project_level"))).toBe(
        true,
      );
    });

    it("should warn on non-standard status", () => {
      const spec: ParsedSpec = {
        filepath: "specs/test.spec.md",
        headerLines: 12,
        metadata: {
          id: "@specs/test",
          version: "1.0.0",
          status: "unknown" as any,
        },
        content: "# Content",
        blocks: [],
        references: [],
        headerRaw:
          "# speclang-header lines:12\nid: @specs/test\nversion: 1.0.0\nstatus: unknown\n---\n",
      };

      const results = headerRule.check(spec);
      const warnings = results.filter((r) => r.level === "warning");
      expect(warnings.some((e) => e.message.includes("status"))).toBe(true);
    });
  });

  describe("ID Rule", () => {
    it("should pass valid ID", () => {
      const spec: ParsedSpec = {
        filepath: "specs/auth.spec.md",
        headerLines: 12,
        metadata: {
          id: "@specs/auth",
          version: "1.0.0",
        },
        content: "",
        blocks: [],
        references: [],
        headerRaw: "",
      };

      const results = idRule.check(spec);
      const errors = results.filter((r) => r.level === "error");
      expect(errors).toHaveLength(0);
    });

    it("should fail ID without @", () => {
      const spec: ParsedSpec = {
        filepath: "specs/auth.spec.md",
        headerLines: 12,
        metadata: {
          id: "specs/auth",
          version: "1.0.0",
        },
        content: "",
        blocks: [],
        references: [],
        headerRaw: "",
      };

      const results = idRule.check(spec);
      const errors = results.filter((r) => r.level === "error");
      expect(errors.some((e) => e.message.includes("start with @"))).toBe(true);
    });

    it("should fail uppercase domain", () => {
      const spec: ParsedSpec = {
        filepath: "specs/auth.spec.md",
        headerLines: 12,
        metadata: {
          id: "@Specs/Auth",
          version: "1.0.0",
        },
        content: "",
        blocks: [],
        references: [],
        headerRaw: "",
      };

      const results = idRule.check(spec);
      const errors = results.filter((r) => r.level === "error");
      expect(errors.some((e) => e.message.includes("lowercase"))).toBe(true);
    });

    it("should fail backslash in path", () => {
      const spec: ParsedSpec = {
        filepath: "specs/auth.spec.md",
        headerLines: 12,
        metadata: {
          id: "@specs/auth\\login",
          version: "1.0.0",
        },
        content: "",
        blocks: [],
        references: [],
        headerRaw: "",
      };

      const results = idRule.check(spec);
      const errors = results.filter((r) => r.level === "error");
      expect(errors.some((e) => e.message.includes("forward slashes"))).toBe(
        true,
      );
    });

    it("should fail invalid characters", () => {
      const spec: ParsedSpec = {
        filepath: "specs/auth.spec.md",
        headerLines: 12,
        metadata: {
          id: "@specs/auth@login",
          version: "1.0.0",
        },
        content: "",
        blocks: [],
        references: [],
        headerRaw: "",
      };

      const results = idRule.check(spec);
      const errors = results.filter((r) => r.level === "error");
      expect(errors.some((e) => e.message.includes("Invalid characters"))).toBe(
        true,
      );
    });
  });

  describe("Blocks Rule", () => {
    it("should pass valid blocks", () => {
      const spec: ParsedSpec = {
        filepath: "specs/auth.spec.md",
        headerLines: 12,
        metadata: {
          id: "@specs/auth",
          version: "1.0.0",
        },
        content: "# Content",
        blocks: [
          {
            id: "@block:auth/login",
            kind: "operation",
            content: "Login",
            line: 15,
          },
          {
            id: "@block:auth/user",
            kind: "entity",
            content: "User entity",
            line: 20,
          },
        ],
        references: [],
        headerRaw: "",
      };

      const results = blocksRule.check(spec);
      const errors = results.filter((r) => r.level === "error");
      expect(errors).toHaveLength(0);
    });

    it("should fail duplicate block IDs", () => {
      const spec: ParsedSpec = {
        filepath: "specs/auth.spec.md",
        headerLines: 12,
        metadata: {
          id: "@specs/auth",
          version: "1.0.0",
        },
        content: "# Content",
        blocks: [
          {
            id: "@block:auth/login",
            kind: "operation",
            content: "Login",
            line: 15,
          },
          {
            id: "@block:auth/login",
            kind: "operation",
            content: "Login 2",
            line: 20,
          },
        ],
        references: [],
        headerRaw: "",
      };

      const results = blocksRule.check(spec);
      const errors = results.filter((r) => r.level === "error");
      expect(errors.some((e) => e.message.includes("Duplicate"))).toBe(true);
    });

    it("should fail invalid block kind", () => {
      const spec: ParsedSpec = {
        filepath: "specs/auth.spec.md",
        headerLines: 12,
        metadata: {
          id: "@specs/auth",
          version: "1.0.0",
        },
        content: "# Content",
        blocks: [
          {
            id: "@block:auth/login",
            kind: "invalid_kind" as any,
            content: "Login",
            line: 15,
          },
        ],
        references: [],
        headerRaw: "",
      };

      const results = blocksRule.check(spec);
      const errors = results.filter((r) => r.level === "error");
      expect(errors.some((e) => e.message.includes("Invalid block kind"))).toBe(
        true,
      );
    });

    it("should warn on missing @block: prefix", () => {
      const spec: ParsedSpec = {
        filepath: "specs/auth.spec.md",
        headerLines: 12,
        metadata: {
          id: "@specs/auth",
          version: "1.0.0",
        },
        content: "# Content",
        blocks: [
          { id: "auth/login", kind: "operation", content: "Login", line: 15 },
        ],
        references: [],
        headerRaw: "",
      };

      const results = blocksRule.check(spec);
      const errors = results.filter((r) => r.level === "error");
      expect(errors.some((e) => e.message.includes("@block:"))).toBe(true);
    });
  });

  describe("Autonomous Rule", () => {
    it("should pass for non-autonomous specs", () => {
      const spec: ParsedSpec = {
        filepath: "specs/auth.spec.md",
        headerLines: 12,
        metadata: {
          id: "@specs/auth",
          version: "1.0.0",
          agent_support: "human_only",
        },
        content: "# Content",
        blocks: [],
        references: [],
        headerRaw: "",
      };

      const results = autonomousRule.check(spec);
      expect(results).toHaveLength(0);
    });

    it("should fail for autonomous spec missing required fields", () => {
      const spec: ParsedSpec = {
        filepath: "specs/auth.spec.md",
        headerLines: 12,
        metadata: {
          id: "@specs/auth",
          version: "1.0.0",
          agent_support: "agent_autonomous",
        },
        content: "# Content",
        blocks: [],
        references: [],
        headerRaw: "",
      };

      const results = autonomousRule.check(spec);
      const errors = results.filter((r) => r.level === "error");
      expect(errors.some((e) => e.message.includes("layer"))).toBe(true);
    });

    it("should warn on ambiguous language", () => {
      const spec: ParsedSpec = {
        filepath: "specs/auth.spec.md",
        headerLines: 12,
        metadata: {
          id: "@specs/auth",
          version: "1.0.0",
          agent_support: "agent_autonomous",
          layer: 5,
          project_level: "Alpha",
          tags: ["test"],
          short: "Test",
        },
        content: "# Content\nThis is TBD and maybe we should do something.",
        blocks: [],
        references: [],
        headerRaw: "",
      };

      const results = autonomousRule.check(spec);
      const warnings = results.filter((r) => r.level === "warning");
      expect(warnings.length).toBeGreaterThan(0);
    });

    it("should warn on operation without step-by-step", () => {
      const spec: ParsedSpec = {
        filepath: "specs/auth.spec.md",
        headerLines: 12,
        metadata: {
          id: "@specs/auth",
          version: "1.0.0",
          agent_support: "agent_autonomous",
          layer: 5,
          project_level: "Alpha",
          tags: ["test"],
          short: "Test",
        },
        content: "# Content",
        blocks: [
          {
            id: "@block:auth/login",
            kind: "operation",
            content: "Login here",
            line: 15,
          },
        ],
        references: [],
        headerRaw: "",
      };

      const results = autonomousRule.check(spec);
      const warnings = results.filter((r) => r.level === "warning");
      expect(warnings.some((e) => e.message.includes("step-by-step"))).toBe(
        true,
      );
    });
  });

  describe("Rule Registry", () => {
    it("should have all built-in rules", () => {
      const registry = new RuleRegistry();

      expect(registry.get("@validation/header")).toBeDefined();
      expect(registry.get("@validation/id")).toBeDefined();
      expect(registry.get("@validation/refs")).toBeDefined();
      expect(registry.get("@validation/blocks")).toBeDefined();
      expect(registry.get("@validation/autonomous")).toBeDefined();
    });

    it("should register and retrieve custom rules", () => {
      const registry = new RuleRegistry();

      const customRule = {
        id: "@validation/custom",
        name: "Custom Rule",
        level: "error" as const,
        check: () => [],
      };

      registry.register(customRule);
      expect(registry.get("@validation/custom")).toBeDefined();
    });

    it("should enable and disable rules", () => {
      const registry = new RuleRegistry();

      expect(registry.isEnabled("@validation/header")).toBe(true);

      registry.disable("@validation/header");
      expect(registry.isEnabled("@validation/header")).toBe(false);

      registry.enable("@validation/header");
      expect(registry.isEnabled("@validation/header")).toBe(true);
    });
  });
});
