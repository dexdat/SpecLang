/**
 * SPECLANG-GENERATED: Tests for TypeScript generator
 * Source: @speclang/codegen @block:typescript-test
 */

import { describe, it, expect } from "vitest";
import { TypeScriptGenerator } from "../../src/codegen/targets/typescript";
import type { CodeSpec } from "../../src/codegen/types";

describe("codegen/targets/typescript", () => {
  const generator = new TypeScriptGenerator();

  describe("mapType", () => {
    it("should map String to string", () => {
      expect(generator.mapType("String")).toBe("string");
    });

    it("should map Int to number", () => {
      expect(generator.mapType("Int")).toBe("number");
    });

    it("should map Bool to boolean", () => {
      expect(generator.mapType("Bool")).toBe("boolean");
    });

    it("should map Date to Date", () => {
      expect(generator.mapType("Date")).toBe("Date");
    });

    it("should map UUID to string", () => {
      expect(generator.mapType("UUID")).toBe("string");
    });

    it("should map Array<T> to T[]", () => {
      expect(generator.mapType("Array<string>")).toBe("string[]");
    });

    it("should map Optional<T> to T | null", () => {
      expect(generator.mapType("Optional<string>")).toBe("string | null");
    });
  });

  describe("generate", () => {
    it("should generate code from spec with blocks", () => {
      const spec: CodeSpec = {
        header: {
          id: "@test/user",
          version: "1.0.0",
        },
        target: {
          language: "typescript",
          outputPath: "src/test",
        },
        blocks: [
          {
            id: "test/user",
            kind: "code",
            language: "typescript",
            content: "export interface User { id: string; }",
            refs: [],
            line: 1,
          },
        ],
        imports: [],
        sourceFile: "test.spec",
      };

      const files = generator.generate(spec);

      expect(files.length).toBeGreaterThan(0);
      expect(files[0].language).toBe("typescript");
      expect(files[0].content).toContain("SPECLANG-GENERATED");
    });

    it("should create file header with proper format", () => {
      const spec: CodeSpec = {
        header: {
          id: "@test/header",
          version: "1.0.0",
        },
        target: {
          language: "typescript",
          outputPath: "src/test",
        },
        blocks: [],
        imports: [],
        sourceFile: "test.spec",
      };

      const header = generator.fileHeader(spec);

      expect(header).toContain("SPECLANG-GENERATED");
      expect(header).toContain("test.spec");
    });
  });

  describe("formatImports", () => {
    it("should format imports correctly", () => {
      const imports = ["./user", "../auth/login"];
      const formatted = generator.formatImports(imports);

      expect(formatted).toContain("import { user } from './user'");
      expect(formatted).toContain("import { login } from '../auth/login'");
    });
  });
});
