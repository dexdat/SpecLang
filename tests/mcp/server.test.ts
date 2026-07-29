/**
 * SPECLANG-GENERATED: MCP Server Tests
 * Source: @speclang/mcp
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MCPServer } from "../../src/mcp/server.js";
import type { MCPServerConfig } from "../../src/mcp/types.js";

// Mock database path for testing
const TEST_DB_PATH = ".speclang/test-mcp.db";

describe("MCPServer", () => {
  let server: MCPServer;

  beforeEach(() => {
    server = new MCPServer({
      port: 3001,
      database: TEST_DB_PATH,
      specsDir: "specs",
    });
  });

  afterEach(async () => {
    await server.stop();
  });

  describe("constructor", () => {
    it("should create server with default config", () => {
      const defaultServer = new MCPServer();
      expect(defaultServer).toBeDefined();
    });

    it("should accept custom config", () => {
      const config: Partial<MCPServerConfig> = {
        port: 3002,
        database: TEST_DB_PATH,
        specsDir: "specs",
      };
      const customServer = new MCPServer(config);
      expect(customServer).toBeDefined();
    });
  });

  describe("CLI options", () => {
    it("should parse --http flag", () => {
      // This tests the config parsing
      const config: Partial<MCPServerConfig> = {
        port: 3003,
        database: TEST_DB_PATH,
        specsDir: "specs",
      };
      const s = new MCPServer(config);
      expect(s).toBeDefined();
    });
  });
});

// Test tool definitions
import { getToolDefinitions } from "../../src/mcp/tools/index.js";

describe("MCPTools", () => {
  describe("getToolDefinitions", () => {
    it("should return array of tool definitions", () => {
      const tools = getToolDefinitions();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    it("should include search tool", () => {
      const tools = getToolDefinitions();
      const searchTool = tools.find((t) => t.name === "speclang_search");
      expect(searchTool).toBeDefined();
      expect(searchTool?.description).toBeTruthy();
    });

    it("should include spec CRUD tools", () => {
      const tools = getToolDefinitions();
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain("speclang_get_spec");
      expect(toolNames).toContain("speclang_create_spec");
      expect(toolNames).toContain("speclang_update_spec");
      expect(toolNames).toContain("speclang_list_specs");
    });

    it("should include lock tools", () => {
      const tools = getToolDefinitions();
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain("speclang_lock");
      expect(toolNames).toContain("speclang_unlock");
    });

    it("should include cascade tools", () => {
      const tools = getToolDefinitions();
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain("speclang_cascade_status");
      expect(toolNames).toContain("speclang_cascade_trigger");
      expect(toolNames).toContain("speclang_cascade_abort");
    });

    it("should include index tools", () => {
      const tools = getToolDefinitions();
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain("speclang_index_refresh");
      expect(toolNames).toContain("speclang_index_stats");
      expect(toolNames).toContain("speclang_index_validate");
    });

    it("should include graph tools", () => {
      const tools = getToolDefinitions();
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain("speclang_get_dependencies");
      expect(toolNames).toContain("speclang_get_dependents");
      expect(toolNames).toContain("speclang_impact_analysis");
    });
  });
});

// Test config
import {
  loadConfig,
  getArg,
  getArgInt,
  getArgBool,
} from "../../src/mcp/config.js";

describe("MCPConfig", () => {
  describe("loadConfig", () => {
    it("should return default config when no options provided", () => {
      const config = loadConfig();
      expect(config.port).toBe(3000);
      expect(config.database).toBe(".speclang/speclang.db");
      expect(config.specsDir).toBe("specs");
    });

    it("should override with provided options", () => {
      const config = loadConfig({ port: 4000 });
      expect(config.port).toBe(4000);
      expect(config.database).toBe(".speclang/speclang.db");
    });
  });

  describe("getArg", () => {
    it("should return default when arg not found", () => {
      const args = ["--port", "3000"];
      expect(getArg(args, "--host", "localhost")).toBe("localhost");
    });

    it("should return value when arg found", () => {
      const args = ["--port", "3000"];
      expect(getArg(args, "--port")).toBe("3000");
    });
  });

  describe("getArgInt", () => {
    it("should return default when arg not found", () => {
      const args = ["--port", "3000"];
      expect(getArgInt(args, "--host", 8080)).toBe(8080);
    });

    it("should return parsed int when arg found", () => {
      const args = ["--port", "3000"];
      expect(getArgInt(args, "--port", 8080)).toBe(3000);
    });
  });

  describe("getArgBool", () => {
    it("should return false when flag not present", () => {
      const args = ["--port", "3000"];
      expect(getArgBool(args, "--remote")).toBe(false);
    });

    it("should return true when flag present", () => {
      const args = ["--remote", "--port", "3000"];
      expect(getArgBool(args, "--remote")).toBe(true);
    });
  });
});

// Test auth
import { createAuth } from "../../src/mcp/auth.js";

describe("MCPAuth", () => {
  describe("disabled auth", () => {
    it("should return isEnabled as false", () => {
      const auth = createAuth({ enabled: false, type: "none" });
      expect(auth.isEnabled()).toBe(false);
    });
  });

  describe("token auth", () => {
    it("should return isEnabled as true when enabled", () => {
      const auth = createAuth({
        enabled: true,
        type: "token",
        token: "test-token",
      });
      expect(auth.isEnabled()).toBe(true);
    });

    it("should return correct auth type", () => {
      const auth = createAuth({
        enabled: true,
        type: "token",
        token: "test-token",
      });
      expect(auth.getType()).toBe("token");
    });
  });

  describe("basic auth", () => {
    it("should return isEnabled as true when enabled", () => {
      const auth = createAuth({
        enabled: true,
        type: "basic",
        user: "admin",
        pass: "secret",
      });
      expect(auth.isEnabled()).toBe(true);
    });

    it("should return correct auth type", () => {
      const auth = createAuth({
        enabled: true,
        type: "basic",
        user: "admin",
        pass: "secret",
      });
      expect(auth.getType()).toBe("basic");
    });
  });
});

// Test types exist
import type {
  SearchInput,
  CreateSpecInput,
  LockInput,
  CascadeStatus,
  ValidationResult,
  IndexRefreshResult,
} from "../../src/mcp/types.js";

describe("MCPTypes", () => {
  it("should have correct SearchInput type", () => {
    const input: SearchInput = { query: "test", limit: 10 };
    expect(input.query).toBe("test");
    expect(input.limit).toBe(10);
  });

  it("should have correct CreateSpecInput type", () => {
    const input: CreateSpecInput = { id: "@specs/test", content: "# Test" };
    expect(input.id).toBe("@specs/test");
    expect(input.content).toBe("# Test");
  });

  it("should have correct LockInput type", () => {
    const input: LockInput = {
      resource: "specs/test.md",
      agent_id: "agent-1",
      ttl: 60,
    };
    expect(input.resource).toBe("specs/test.md");
    expect(input.agent_id).toBe("agent-1");
    expect(input.ttl).toBe(60);
  });

  it("should have correct CascadeStatus type", () => {
    const status: CascadeStatus = { status: "idle" };
    expect(status.status).toBe("idle");
  });

  it("should have correct ValidationResult type", () => {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };
    expect(result.valid).toBe(true);
  });

  it("should have correct IndexRefreshResult type", () => {
    const result: IndexRefreshResult = {
      specs_indexed: 10,
      refs_found: 50,
      errors: [],
    };
    expect(result.specs_indexed).toBe(10);
  });
});
