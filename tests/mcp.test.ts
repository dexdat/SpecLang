import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Test MCP server configuration and integration
// The MCP server is implemented in src/mcp/server.ts

describe("MCP Server", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("Configuration", () => {
    it("should use correct config structure", async () => {
      // Import and check the types
      const { DEFAULT_MCP_CONFIG } = await import("../src/mcp/types.js");

      expect(DEFAULT_MCP_CONFIG.port).toBe(3000);
      expect(DEFAULT_MCP_CONFIG.host).toBe("0.0.0.0");
      expect(DEFAULT_MCP_CONFIG.database).toBe(".speclang/speclang.db");
      expect(DEFAULT_MCP_CONFIG.serverMode).toBe("http");
      expect(DEFAULT_MCP_CONFIG.specsDir).toBe("specs");
    });

    it("should have correct auth config", async () => {
      const { DEFAULT_MCP_CONFIG } = await import("../src/mcp/types.js");

      expect(DEFAULT_MCP_CONFIG.auth.enabled).toBe(false);
      expect(DEFAULT_MCP_CONFIG.auth.type).toBe("none");
    });

    it("should have correct SSE config", async () => {
      const { DEFAULT_MCP_CONFIG } = await import("../src/mcp/types.js");

      expect(DEFAULT_MCP_CONFIG.sse.enabled).toBe(true);
      expect(DEFAULT_MCP_CONFIG.sse.heartbeatInterval).toBe(30000);
    });

    it("should have correct limits config", async () => {
      const { DEFAULT_MCP_CONFIG } = await import("../src/mcp/types.js");

      expect(DEFAULT_MCP_CONFIG.limits?.maxConnections).toBe(100);
      expect(DEFAULT_MCP_CONFIG.limits?.queryTimeoutMs).toBe(5000);
      expect(DEFAULT_MCP_CONFIG.limits?.maxResults).toBe(1000);
    });
  });

  describe("Server Creation", () => {
    it("should be able to instantiate server with defaults", async () => {
      // Dynamic import to test module loading
      const mod = await import("../src/mcp/server.js");
      expect(mod.MCPServer).toBeDefined();
    });
  });

  describe("Tool Definitions", () => {
    it("should have tool registry module", async () => {
      const mod = await import("../src/mcp/tools/index.js");
      expect(mod.MCPToolRegistry).toBeDefined();
      expect(mod.getToolDefinitions).toBeDefined();
    });

    it("should provide all required tools", async () => {
      const { getToolDefinitions } = await import("../src/mcp/tools/index.js");
      const tools = getToolDefinitions();

      // Check key tools exist
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain("speclang_search");
      expect(toolNames).toContain("speclang_get_spec");
      expect(toolNames).toContain("speclang_create_spec");
      expect(toolNames).toContain("speclang_update_spec");
      expect(toolNames).toContain("speclang_list_specs");
      expect(toolNames).toContain("speclang_lock");
      expect(toolNames).toContain("speclang_unlock");
      expect(toolNames).toContain("speclang_cascade_status");
      expect(toolNames).toContain("speclang_cascade_trigger");
      expect(toolNames).toContain("speclang_index_refresh");
      expect(toolNames).toContain("speclang_get_dependencies");
      expect(toolNames).toContain("speclang_get_status");
      expect(toolNames).toContain("speclang_query_events");
      expect(toolNames).toContain("speclang_query_commands");
    });

    it("should have correct number of tools", async () => {
      const { getToolDefinitions } = await import("../src/mcp/tools/index.js");
      const tools = getToolDefinitions();

      // Should have 30+ tools
      expect(tools.length).toBeGreaterThanOrEqual(30);
    });
  });

  describe("Tool Handlers", () => {
    let dbPath: string;

    beforeEach(() => {
      dbPath = path.join(tempDir, "test.db");
    });

    it("should have search handler", async () => {
      const { SearchToolHandler } = await import("../src/mcp/tools/search.js");
      expect(SearchToolHandler).toBeDefined();
    });

    it("should have specs handler", async () => {
      const { SpecsToolHandler } = await import("../src/mcp/tools/specs.js");
      expect(SpecsToolHandler).toBeDefined();
    });

    it("should have locks handler", async () => {
      const { LocksToolHandler } = await import("../src/mcp/tools/locks.js");
      expect(LocksToolHandler).toBeDefined();
    });

    it("should have cascade handler", async () => {
      const { CascadeToolHandler } =
        await import("../src/mcp/tools/cascade.js");
      expect(CascadeToolHandler).toBeDefined();
    });

    it("should have index handler", async () => {
      const { IndexToolHandler } =
        await import("../src/mcp/tools/index-tools.js");
      expect(IndexToolHandler).toBeDefined();
    });

    it("should have dashboard handler", async () => {
      const { DashboardToolHandler } =
        await import("../src/mcp/tools/dashboard.js");
      expect(DashboardToolHandler).toBeDefined();
    });

    it("should have commands handler", async () => {
      const { CommandsToolHandler } =
        await import("../src/mcp/tools/commands.js");
      expect(CommandsToolHandler).toBeDefined();
    });
  });

  describe("Auth Module", () => {
    it("should have auth module", async () => {
      const { createAuth } = await import("../src/mcp/auth.js");
      expect(createAuth).toBeDefined();
    });

    it("should create auth with none type", async () => {
      const { createAuth } = await import("../src/mcp/auth.js");
      const auth = createAuth({ enabled: false, type: "none" });
      expect(auth.isEnabled()).toBe(false);
    });
  });

  describe("SSE Module", () => {
    it("should have SSE module", async () => {
      const { createSSEManager } = await import("../src/mcp/sse.js");
      expect(createSSEManager).toBeDefined();
    });
  });

  describe("Config Module", () => {
    it("should have config module", async () => {
      const { loadConfig } = await import("../src/mcp/config.js");
      expect(loadConfig).toBeDefined();
    });

    it("should load default config", async () => {
      const { loadConfig } = await import("../src/mcp/config.js");
      const config = loadConfig();

      expect(config.port).toBe(3000);
      expect(config.host).toBe("0.0.0.0");
      expect(config.serverMode).toBe("http");
    });
  });

  describe("Types", () => {
    // Note: TypeScript interfaces are not exported as runtime values
    // The types are tested via the tool definitions and config
    it("should have correct config with type properties", async () => {
      const { DEFAULT_MCP_CONFIG } = await import("../src/mcp/types.js");

      // Config should have all required properties
      expect(DEFAULT_MCP_CONFIG).toHaveProperty("port");
      expect(DEFAULT_MCP_CONFIG).toHaveProperty("host");
      expect(DEFAULT_MCP_CONFIG).toHaveProperty("database");
      expect(DEFAULT_MCP_CONFIG).toHaveProperty("serverMode");
      expect(DEFAULT_MCP_CONFIG).toHaveProperty("specsDir");
      expect(DEFAULT_MCP_CONFIG).toHaveProperty("auth");
      expect(DEFAULT_MCP_CONFIG).toHaveProperty("sse");
    });

    it("should have correct SearchInput structure", async () => {
      // Verify the structure via tool definitions
      const { getToolDefinitions } = await import("../src/mcp/tools/index.js");
      const tools = getToolDefinitions();
      const searchTool = tools.find((t) => t.name === "speclang_search");

      const props = searchTool!.inputSchema.properties as Record<
        string,
        unknown
      >;
      expect(props.query).toBeDefined();
      expect(props.limit).toBeDefined();
    });

    it("should have correct LockInput structure", async () => {
      const { getToolDefinitions } = await import("../src/mcp/tools/index.js");
      const tools = getToolDefinitions();
      const lockTool = tools.find((t) => t.name === "speclang_lock");

      const props = lockTool!.inputSchema.properties as Record<string, unknown>;
      expect(props.resource).toBeDefined();
      expect(props.agent_id).toBeDefined();
      expect(props.ttl).toBeDefined();
    });

    it("should have correct CommandInput structure", async () => {
      const { getToolDefinitions } = await import("../src/mcp/tools/index.js");
      const tools = getToolDefinitions();
      const cmdTool = tools.find((t) => t.name === "speclang_insert_command");

      const props = cmdTool!.inputSchema.properties as Record<string, unknown>;
      expect(props.cascade_id).toBeDefined();
      expect(props.action).toBeDefined();
      expect(props.target_file).toBeDefined();
      expect(props.priority).toBeDefined();
    });
  });

  describe("MCP Server Integration", () => {
    it("should export main server class", async () => {
      const { MCPServer } = await import("../src/mcp/server.js");
      expect(MCPServer).toBeDefined();
      expect(typeof MCPServer).toBe("function");
    });

    it("should export index with all modules", async () => {
      const index = await import("../src/mcp/index.js");

      expect(index.MCPServer).toBeDefined();
    });
  });
});

describe("MCP Tool Registry Integration", () => {
  let tempDir: string;
  let dbPath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-tools-integration-"));
    dbPath = path.join(tempDir, "test.db");
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("Tool Execution Flow", () => {
    it("should provide tool definitions with proper schemas", async () => {
      const { getToolDefinitions } = await import("../src/mcp/tools/index.js");
      const tools = getToolDefinitions();

      for (const tool of tools) {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
      }
    });

    it("should have valid search tool schema", async () => {
      const { getToolDefinitions } = await import("../src/mcp/tools/index.js");
      const tools = getToolDefinitions();
      const searchTool = tools.find((t) => t.name === "speclang_search");

      expect(searchTool).toBeDefined();
      expect(searchTool!.inputSchema.required).toContain("query");

      const props = searchTool!.inputSchema.properties as Record<
        string,
        unknown
      >;
      expect(props.query).toBeDefined();
      expect(props.limit).toBeDefined();
    });

    it("should have valid lock tool schema", async () => {
      const { getToolDefinitions } = await import("../src/mcp/tools/index.js");
      const tools = getToolDefinitions();
      const lockTool = tools.find((t) => t.name === "speclang_lock");

      expect(lockTool).toBeDefined();
      expect(lockTool!.inputSchema.required).toContain("resource");
      expect(lockTool!.inputSchema.required).toContain("agent_id");
    });

    it("should have valid cascade trigger schema", async () => {
      const { getToolDefinitions } = await import("../src/mcp/tools/index.js");
      const tools = getToolDefinitions();
      const triggerTool = tools.find(
        (t) => t.name === "speclang_cascade_trigger",
      );

      expect(triggerTool).toBeDefined();
      expect(triggerTool!.inputSchema.required).toContain("spec_id");
      expect(triggerTool!.inputSchema.required).toContain("change_type");
    });
  });

  describe("Command Queue Tools", () => {
    it("should have all command queue operations", async () => {
      const { getToolDefinitions } = await import("../src/mcp/tools/index.js");
      const tools = getToolDefinitions();
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain("speclang_query_commands");
      expect(toolNames).toContain("speclang_insert_command");
      expect(toolNames).toContain("speclang_update_command");
      expect(toolNames).toContain("speclang_delete_command");
      expect(toolNames).toContain("speclang_get_next_command");
      expect(toolNames).toContain("speclang_clear_completed");
      expect(toolNames).toContain("speclang_batch_insert");
    });
  });

  describe("Graph Tools", () => {
    it("should have dependency analysis tools", async () => {
      const { getToolDefinitions } = await import("../src/mcp/tools/index.js");
      const tools = getToolDefinitions();
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain("speclang_get_dependencies");
      expect(toolNames).toContain("speclang_get_dependents");
      expect(toolNames).toContain("speclang_impact_analysis");
    });
  });
});
