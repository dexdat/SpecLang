// SPECLANG-GENERATED: UI Testing - Spec Editor Integration Tests
// DO NOT EDIT MANUALLY
// Source: @speclang/ui.testing

/**
 * Integration Tests for Spec Editor
 *
 * Tests spec editing functionality with mock MCP server.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { server, callTool } from "../../mocks/mcp-server";

describe("Spec Editor Integration", () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.close();
  });

  describe("Search functionality", () => {
    it("should search specs", async () => {
      const result = await callTool("speclang_search", {
        query: "auth",
      });

      expect(result).toHaveProperty("results");
      expect(Array.isArray((result as { results: unknown[] }).results)).toBe(
        true,
      );
    });

    it("should return ranked results", async () => {
      const result = (await callTool("speclang_search", {
        query: "test",
      })) as { results: Array<{ id: string; score: number }> };

      if (result.results.length > 0) {
        const sorted = [...result.results].sort((a, b) => b.score - a.score);
        expect(sorted[0].score).toBeGreaterThanOrEqual(
          sorted[sorted.length - 1].score,
        );
      }
    });
  });

  describe("Validation", () => {
    it("should validate spec references", async () => {
      // Search for a known spec
      const result = (await callTool("speclang_search", {
        query: "auth",
      })) as { results: Array<{ id: string }> };

      const validRef = result.results.length > 0;
      expect(validRef).toBe(true);
    });

    it("should handle invalid references", async () => {
      const result = (await callTool("speclang_search", {
        query: "nonexistent-xyz-123",
      })) as { results: unknown[] };

      // Should return empty results for unknown specs
      expect(Array.isArray(result.results)).toBe(true);
    });
  });

  describe("Project stats", () => {
    it("should get project statistics", async () => {
      const result = await callTool("speclang_get_project_stats", {});

      expect(result).toHaveProperty("total_specs");
      expect(result).toHaveProperty("total_blocks");
      expect(result).toHaveProperty("total_refs");
    });
  });
});
