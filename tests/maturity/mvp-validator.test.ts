import { describe, it, expect } from "vitest";
import { mvpValidator } from "../../src/maturity/levels/mvp-validator";

describe("MVP Validator", () => {
  it("should validate MVP spec with required fields", () => {
    const spec = {
      metadata: {
        id: "@specs/test",
        version: "1.0.0",
        tags: ["test"],
        short: "Test spec",
      },
      content: "Some content",
    };
    const result = mvpValidator.validate(spec);
    expect(result.isValid).toBe(true);
    expect(result.meetsMVPCriteria).toBe(true);
  });

  it("should reject MVP spec with missing required fields", () => {
    const spec = {
      metadata: {
        id: "@specs/test",
        // missing version
        tags: ["test"],
        short: "Test spec",
      },
    };
    const result = mvpValidator.validate(spec);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.field === "version")).toBe(true);
  });

  it("should reject MVP spec with layer > 4", () => {
    const spec = {
      metadata: {
        id: "@specs/test",
        version: "1.0.0",
        tags: ["test"],
        short: "Test spec",
        layer: 5,
      },
    };
    const result = mvpValidator.validate(spec);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.field === "layer")).toBe(true);
  });

  it("should reject MVP spec with production target", () => {
    const spec = {
      metadata: {
        id: "@specs/test",
        version: "1.0.0",
        tags: ["test"],
        short: "Test spec",
        target: "production",
      },
    };
    const result = mvpValidator.validate(spec);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.field === "target")).toBe(true);
  });

  it("should provide suggestions for improvement", () => {
    const spec = {
      metadata: {
        id: "@specs/test",
        version: "1.0.0",
        tags: ["test"],
        short: "Test spec",
      },
    };
    const result = mvpValidator.validate(spec);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it("should calculate readiness score", () => {
    const spec = {
      metadata: {
        id: "@specs/test",
        version: "1.0.0",
        tags: ["test"],
        short: "Test spec",
        layer: 2,
        description: "Test description",
        target: "internal",
      },
      content: "Some content that is longer than 500 characters. ".repeat(20),
    };
    const result = mvpValidator.canPromoteFromMVP(spec);
    expect(result.readinessScore).toBeGreaterThan(0);
  });
});
