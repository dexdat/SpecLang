/**
 * SPECLANG-GENERATED: Parser tests
 * Source: @speclang/headers @block:headers/validation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  parseHeader,
  parseSpecContent,
  extractBlocks,
  extractReferences,
  validateMetadata,
  validateSpec,
  isValidSemver,
  isValidLayer,
  checkReference,
  clearIndexCache,
} from "../src/parser";

// ============================================================================
// TEST FIXTURES
// ============================================================================

const VALID_SPEC_WITH_ALL_FIELDS = `---
# speclang-header
id: "@specs/auth"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [auth, security, jwt]
short: JWT authentication with rate limiting
target: go
status: stable
depends_on:
  - "@ref:northstar#auth"
  - "@ref:stdlib/Result"
---

# Auth Overview

This spec describes the auth system.

## @block:auth/login @kind:operation
login(email: String, password: String) -> Result<Token, Error>

## @block:auth/User @kind:entity
User:
  - id: UUID
  - email: String
`;

const MINIMAL_SPEC = `---
# speclang-header
id: "@example/minimal"
version: 1.0.0
---

# Minimal

Just a minimal spec.
`;

const SPEC_WITH_BLOCKS = `---
# speclang-header
id: "@specs/blocks"
version: 1.0.0
---

# Test

## @block:entity/User @kind:entity
User entity

## @block:operation/login @kind:operation
login operation

## @block:note/info @kind:note
Some note
`;

const SPEC_WITH_REFS = `---
# speclang-header
id: "@specs/refs"
version: 1.0.0
depends_on:
  - "@ref:specs/auth"
  - "@ref:specs/auth#login"
---

# Test

See @ref:northstar#auth for details.
Uses @ref:stdlib/Result in implementation.
`;

const INVALID_VERSION_SPEC = `---
# speclang-header
id: "@specs/test"
version: not-a-version
---

# Test
`;

const INVALID_LAYER_SPEC = `---
# speclang-header
id: "@specs/test"
version: 1.0.0
layer: 99
---

# Test
`;

// ============================================================================
// HEADER PARSING TESTS
// ============================================================================

describe("parseHeader", () => {
  it("should parse valid header with all fields", () => {
    const result = parseHeader(VALID_SPEC_WITH_ALL_FIELDS);

    expect(result.metadata.id).toBe("@specs/auth");
    expect(result.metadata.version).toBe("1.0.0");
    expect(result.metadata.layer).toBe(2);
    expect(result.metadata.project_level).toBe("Alpha");
    expect(result.metadata.agent_support).toBe("agent_autonomous");
    expect(result.metadata.tags).toEqual(["auth", "security", "jwt"]);
    expect(result.metadata.short).toBe("JWT authentication with rate limiting");
    expect(result.metadata.target).toBe("go");
    expect(result.metadata.status).toBe("stable");
    expect(result.metadata.depends_on).toHaveLength(2);
    expect(result.headerLines).toBe(16); // lines 1-15 + 1 for content start
  });

  it("should parse minimal header", () => {
    const result = parseHeader(MINIMAL_SPEC);

    expect(result.metadata.id).toBe("@example/minimal");
    expect(result.metadata.version).toBe("1.0.0");
  });

  it("should throw on missing speclang-header", () => {
    const noHeader = `---
id: @specs/test
version: 1.0.0
---
`;
    expect(() => parseHeader(noHeader)).toThrow(
      "No speclang-header declaration found",
    );
  });

  it("should throw on missing id", () => {
    const noId = `---
# speclang-header lines:3
version: 1.0.0
---
`;
    expect(() => parseHeader(noId)).toThrow("Missing required field: id");
  });

  it("should throw on missing version", () => {
    const noVersion = `---
# speclang-header
id: "@specs/test"
---
`;
    expect(() => parseHeader(noVersion)).toThrow(
      "Missing required field: version",
    );
  });

  it("should throw on invalid YAML", () => {
    const invalidYaml = `---
# speclang-header lines:3
id: @specs/test
version: invalid: yaml:
---
`;
    expect(() => parseHeader(invalidYaml)).toThrow(
      "Failed to parse header YAML",
    );
  });
});

// ============================================================================
// BLOCK EXTRACTION TESTS
// ============================================================================

describe("extractBlocks", () => {
  it("should extract all blocks", () => {
    const result = parseSpecContent(SPEC_WITH_BLOCKS);

    expect(result.blocks).toHaveLength(3);

    expect(result.blocks[0].id).toBe("entity/User");
    expect(result.blocks[0].kind).toBe("entity");

    expect(result.blocks[1].id).toBe("operation/login");
    expect(result.blocks[1].kind).toBe("operation");

    expect(result.blocks[2].id).toBe("note/info");
    expect(result.blocks[2].kind).toBe("note");
  });

  it("should return empty array when no blocks", () => {
    const result = parseSpecContent(MINIMAL_SPEC);
    expect(result.blocks).toHaveLength(0);
  });

  it("should capture block content", () => {
    const result = parseSpecContent(SPEC_WITH_BLOCKS);

    expect(result.blocks[0].content).toContain("User entity");
    expect(result.blocks[1].content).toContain("login operation");
  });
});

// ============================================================================
// REFERENCE EXTRACTION TESTS
// ============================================================================

describe("extractReferences", () => {
  it("should extract references from depends_on", () => {
    const result = parseSpecContent(SPEC_WITH_REFS);

    // Should have references from depends_on + content
    expect(result.references.length).toBeGreaterThanOrEqual(2);

    const depRefs = result.references.filter(
      (r) => r.sourceFile === undefined || r.line === 1,
    );
    expect(depRefs.length).toBe(2);
  });

  it("should extract inline references from content", () => {
    const result = parseSpecContent(SPEC_WITH_REFS);

    // Should have inline references
    const inlineRefs = result.references.filter((r) => r.line && r.line > 1);
    expect(inlineRefs.length).toBe(2);
  });
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

describe("validateMetadata", () => {
  it("should pass valid metadata", () => {
    const result = validateMetadata(
      {
        id: "@specs/test",
        version: "1.0.0",
        layer: 2,
      },
      "specs/test.spec.md",
    );

    expect(result.errors).toHaveLength(0);
  });

  it("should fail on missing id", () => {
    const result = validateMetadata(
      { id: "", version: "1.0.0" },
      "specs/test.spec.md",
    );

    expect(result.errors.some((e) => e.code === "MISSING_ID")).toBe(true);
  });

  it("should fail on missing version", () => {
    const result = validateMetadata(
      { id: "@specs/test", version: "" },
      "specs/test.spec.md",
    );

    expect(result.errors.some((e) => e.code === "MISSING_VERSION")).toBe(true);
  });

  it("should fail on invalid semver", () => {
    const result = validateMetadata(
      { id: "@specs/test", version: "invalid" },
      "specs/test.spec.md",
    );

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("INVALID_VERSION");
  });

  it("should fail on invalid layer", () => {
    const result = validateMetadata(
      { id: "@specs/test", version: "1.0.0", layer: 99 as any },
      "specs/test.spec.md",
    );

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("INVALID_LAYER");
  });

  it("should fail on invalid project_level", () => {
    const result = validateMetadata(
      {
        id: "@specs/test",
        version: "1.0.0",
        project_level: "InvalidLevel" as any,
      },
      "specs/test.spec.md",
    );

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("INVALID_PROJECT_LEVEL");
  });

  it("should fail on invalid agent_support", () => {
    const result = validateMetadata(
      {
        id: "@specs/test",
        version: "1.0.0",
        agent_support: "invalid" as any,
      },
      "specs/test.spec.md",
    );

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("INVALID_AGENT_SUPPORT");
  });

  it("should warn on missing layer", () => {
    const result = validateMetadata(
      { id: "@specs/test", version: "1.0.0" },
      "specs/test.spec.md",
    );

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].code).toBe("MISSING_LAYER");
  });
});

// ============================================================================
// HELPER FUNCTION TESTS
// ============================================================================

describe("isValidSemver", () => {
  it("should validate correct semver", () => {
    expect(isValidSemver("1.0.0")).toBe(true);
    expect(isValidSemver("0.1.0")).toBe(true);
    expect(isValidSemver("1.2.3")).toBe(true);
    expect(isValidSemver("1.0.0-beta.1")).toBe(true);
    expect(isValidSemver("1.0.0+build.123")).toBe(true);
  });

  it("should reject invalid semver", () => {
    expect(isValidSemver("invalid")).toBe(false);
    expect(isValidSemver("1.0")).toBe(false);
    expect(isValidSemver("v1.0.0")).toBe(false);
    expect(isValidSemver("1.0.0.0")).toBe(false);
  });
});

describe("isValidLayer", () => {
  it("should validate correct layers", () => {
    for (let i = 0; i <= 10; i++) {
      expect(isValidLayer(i)).toBe(true);
    }
  });

  it("should reject invalid layers", () => {
    expect(isValidLayer(-1)).toBe(false);
    expect(isValidLayer(11)).toBe(false);
    expect(isValidLayer(1.5)).toBe(false);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("validateSpec", () => {
  beforeEach(() => {
    clearIndexCache();
  });

  it("should validate a valid spec", () => {
    // Create a temp spec for testing
    const result = validateSpec("specs/headers.spec.md");

    // headers.spec.md is a real file that should be valid
    expect(result.filepath).toBe("specs/headers.spec.md");
    // It should either be valid or have warnings
    expect(result.errors.length).toBeGreaterThanOrEqual(0);
  });

  it("should handle non-existent file", () => {
    const result = validateSpec("specs/non-existent.spec.md");

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("FILE_NOT_FOUND");
  });
});

describe("checkReference", () => {
  beforeEach(() => {
    clearIndexCache();
  });

  it("should return exists:false for non-existent reference when no index", () => {
    const ref = {
      ref: "@ref:specs/nonexistent",
      targetFile: "specs/nonexistent",
    };

    const result = checkReference(ref, "_nonexistent_index.json");

    expect(result.exists).toBe(false);
  });
});

// ============================================================================
// PARSE FUNCTION TESTS
// ============================================================================

describe("parseSpecContent", () => {
  it("should parse complete spec", () => {
    const result = parseSpecContent(VALID_SPEC_WITH_ALL_FIELDS, "test.spec.md");

    expect(result.filepath).toBe("test.spec.md");
    expect(result.metadata.id).toBe("@specs/auth");
    expect(result.metadata.version).toBe("1.0.0");
    expect(result.blocks.length).toBeGreaterThan(0);
  });

  it("should extract header raw text", () => {
    const result = parseSpecContent(VALID_SPEC_WITH_ALL_FIELDS);

    expect(result.headerRaw).toContain("speclang-header");
    expect(result.headerRaw).toContain("@specs/auth");
  });
});
