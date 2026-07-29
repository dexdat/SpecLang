/**
 * SPECLANG-GENERATED: Lens System Tests
 * Source: @speclang/lenses
 *
 * Tests for the Lens System - bidirectional parsers/renderers.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  initializeLenses,
  LensRegistry,
  LensConverter,
  proseLens,
  codeLens,
  entityLens,
  operationLens,
  mathLens,
  acceptanceLens,
  diagramLens,
} from "../src/lenses";
import { createDefaultContext } from "../src/lenses/registry";

describe("Lens System", () => {
  let registry: LensRegistry;
  let converter: LensConverter;

  beforeEach(() => {
    const result = initializeLenses();
    registry = result.registry;
    converter = result.converter;
  });

  describe("Prose Lens", () => {
    it("parses plain text content", async () => {
      const content = "This is a simple note about something important.";
      const context = createDefaultContext("test-prose");

      const block = await proseLens.parse(content, context);

      expect(block.id).toBe("test-prose");
      expect(block.kind).toBe("note");
      expect(block.content).toBe(content);
      expect(block.source?.lens).toBe("prose");
    });

    it("renders plain text content", async () => {
      const content = "Hello World";
      const block = {
        id: "test",
        kind: "note",
        content,
        metadata: {},
        source: { lens: "prose", original: content, line: 0 },
      };

      const result = await proseLens.render(block, createDefaultContext());

      expect(result).toBe(content);
    });
  });

  describe("Code Lens", () => {
    it("detects code blocks with language", () => {
      const content = "```typescript\nconst x = 1;\n```";
      expect(codeLens.detect(content)).toBe(true);
    });

    it("parses code with language", async () => {
      const content = "```typescript\nconst x = 1;\n```";
      const context = createDefaultContext("test-code");

      const block = await codeLens.parse(content, context);

      expect(block.kind).toBe("code");
      expect(block.metadata.language).toBe("typescript");
      expect(block.content).toBe("const x = 1;");
    });

    it("renders code block", async () => {
      const block = {
        id: "test",
        kind: "code",
        content: "const x = 1;",
        metadata: { language: "typescript" },
        source: { lens: "code", original: "", line: 0 },
      };

      const result = await codeLens.render(block, createDefaultContext());

      expect(result).toContain("```typescript");
      expect(result).toContain("const x = 1;");
      expect(result).toContain("```");
    });
  });

  describe("Entity Lens", () => {
    it("detects entity format", () => {
      const content = `User:
  id: UUID
  name: String`;
      expect(entityLens.detect(content)).toBe(true);
    });

    it("parses entity with fields", async () => {
      const content = `User:
  id: UUID
  name: String`;
      const context = createDefaultContext("test-entity");

      const block = await entityLens.parse(content, context);

      expect(block.kind).toBe("entity");
      expect(block.metadata.name).toBe("User");
      expect(block.metadata.fields).toHaveLength(2);
      expect(block.metadata.fields[0].name).toBe("id");
      expect(block.metadata.fields[0].type).toBe("UUID");
    });

    it("renders entity", async () => {
      const block = {
        id: "test",
        kind: "entity",
        content: "User",
        metadata: {
          name: "User",
          fields: [
            { name: "id", type: "UUID" },
            { name: "name", type: "String" },
          ],
        },
        source: { lens: "entity", original: "", line: 0 },
      };

      const result = await entityLens.render(block, createDefaultContext());

      expect(result).toContain("User:");
      expect(result).toContain("id: UUID");
      expect(result).toContain("name: String");
    });
  });

  describe("Operation Lens", () => {
    it("detects operation format", () => {
      const content =
        "login(email: String, password: String) -> Result<Token, Error>";
      expect(operationLens.detect(content)).toBe(true);
    });

    it("parses operation with params and steps", async () => {
      const content = `login(email: String, password: String) -> Result<Token, Error>
1. Validate email format
2. Look up user
3. Verify password`;
      const context = createDefaultContext("test-op");

      const block = await operationLens.parse(content, context);

      expect(block.kind).toBe("operation");
      expect(block.metadata.name).toBe("login");
      expect(block.metadata.params).toHaveLength(2);
      expect(block.metadata.params[0].name).toBe("email");
      expect(block.metadata.params[0].type).toBe("String");
      expect(block.metadata.returnType).toBe("Result<Token, Error>");
      expect(block.metadata.steps).toHaveLength(3);
    });

    it("renders operation", async () => {
      const block = {
        id: "test",
        kind: "operation",
        content: "login",
        metadata: {
          name: "login",
          params: [
            { name: "email", type: "String" },
            { name: "password", type: "String" },
          ],
          returnType: "Result<Token, Error>",
          steps: ["Validate email", "Verify password"],
        },
        source: { lens: "operation", original: "", line: 0 },
      };

      const result = await operationLens.render(block, createDefaultContext());

      expect(result).toContain("login(email: String, password: String)");
      expect(result).toContain("-> Result<Token, Error>");
      expect(result).toContain("1. Validate email");
      expect(result).toContain("2. Verify password");
    });
  });

  describe("Math Lens", () => {
    it("detects LaTeX math", () => {
      expect(mathLens.detect("$$T(n) = 2T(n/2) + O(n)$$")).toBe(true);
      expect(mathLens.detect("\\frac{a}{b}")).toBe(true);
    });

    it("parses block math", async () => {
      const content = "$$T(n) = O(n \\log n)$$";
      const context = createDefaultContext("test-math");

      const block = await mathLens.parse(content, context);

      expect(block.kind).toBe("math");
      expect(block.metadata.delimiter).toBe("block");
    });
  });

  describe("Acceptance Lens", () => {
    it("detects GIVEN/WHEN/THEN", () => {
      const content = `GIVEN user exists
WHEN login called
THEN returns token`;
      expect(acceptanceLens.detect(content)).toBe(true);
    });

    it("parses acceptance criteria", async () => {
      const content = `GIVEN user exists with email "test@example.com"
AND password is "secret"
WHEN login called
THEN returns Ok with valid token`;
      const context = createDefaultContext("test-acceptance");

      const block = await acceptanceLens.parse(content, context);

      expect(block.kind).toBe("acceptance");
      expect(block.metadata.given).toHaveLength(2);
      expect(block.metadata.when).toHaveLength(1);
      expect(block.metadata.then).toHaveLength(1);
    });

    it("renders acceptance criteria", async () => {
      const block = {
        id: "test",
        kind: "acceptance",
        content: "",
        metadata: {
          given: ["user exists"],
          when: ["login called"],
          then: ["returns token"],
        },
        source: { lens: "acceptance", original: "", line: 0 },
      };

      const result = await acceptanceLens.render(block, createDefaultContext());

      expect(result).toContain("GIVEN user exists");
      expect(result).toContain("WHEN login called");
      expect(result).toContain("THEN returns token");
    });
  });

  describe("Diagram Lens", () => {
    it("detects mermaid diagrams", () => {
      expect(diagramLens.detect("```mermaid\ngraph TD\nA-->B\n```")).toBe(true);
      expect(diagramLens.detect("sequenceDiagram\nA->B: hello")).toBe(true);
    });

    it("parses mermaid diagram", async () => {
      const content = "```mermaid\ngraph TD\nA-->B\n```";
      const context = createDefaultContext("test-diagram");

      const block = await diagramLens.parse(content, context);

      expect(block.kind).toBe("diagram");
      expect(block.metadata.format).toBe("mermaid");
      expect(block.metadata.diagramType).toBe("flowchart");
    });

    it("renders mermaid diagram", async () => {
      const block = {
        id: "test",
        kind: "diagram",
        content: "graph TD\nA-->B",
        metadata: { format: "mermaid", diagramType: "flowchart" },
        source: { lens: "diagram", original: "", line: 0 },
      };

      const result = await diagramLens.render(block, createDefaultContext());

      expect(result).toContain("```mermaid");
      expect(result).toContain("graph TD");
      expect(result).toContain("```");
    });
  });

  describe("Lens Registry", () => {
    it("detects correct lens by content", () => {
      const { lens } = registry.detect("```typescript\ncode```");
      expect(lens.name).toBe("code");
    });

    it("gets lens by kind", () => {
      const lens = registry.getByKind("entity");
      expect(lens?.name).toBe("entity");
    });

    it("lists all lenses", () => {
      const lenses = registry.list();
      expect(lenses.length).toBeGreaterThan(0);
      // Should be sorted by priority (highest first)
      expect(lenses[0].priority).toBeGreaterThanOrEqual(lenses[1].priority);
    });

    it("parses content using detected lens", async () => {
      const content = "```typescript\nconst x = 1;\n```";
      const block = await registry.parse(content, createDefaultContext("test"));

      expect(block.kind).toBe("code");
    });
  });

  describe("Lens Converter", () => {
    it("converts between lenses", async () => {
      const content = `User:
  id: UUID
  name: String`;
      const context = createDefaultContext("test-convert");

      // Parse with entity lens, render as code
      const result = await converter.convert(
        content,
        "entity",
        "code",
        context,
      );

      expect(result).toContain("```");
      // Entity lens stores name as content, so render will show the name
      expect(result).toContain("User");
    });

    it("auto-converts to target kind", async () => {
      const content = `User:
  id: UUID`;
      const context = createDefaultContext("test-auto");

      const result = await converter.autoConvert(content, "code", context);

      expect(result).toContain("```");
    });
  });

  describe("Round-trip", () => {
    it("parse -> render -> parse yields equivalent block", async () => {
      const original = `login(email: String, password: String) -> Result<Token, Error>
1. Validate credentials
2. Return token`;
      const context = createDefaultContext("roundtrip");

      // Parse
      const block1 = await registry.parse(original, context);

      // Render
      const rendered = await registry.render(block1, context);

      // Parse again
      const block2 = await registry.parse(rendered, context);

      // Should have same kind and metadata
      expect(block2.kind).toBe(block1.kind);
      expect(block2.metadata.name).toBe(block1.metadata.name);
      expect(block2.metadata.params).toEqual(block1.metadata.params);
    });
  });

  describe("Priority ordering", () => {
    it("higher priority lenses are detected first", () => {
      const lenses = registry.list();

      // diagramLens has priority 70, should be first
      expect(lenses[0].name).toBe("diagram");

      // proseLens has priority 0, should be last
      expect(lenses[lenses.length - 1].name).toBe("prose");
    });
  });
});
