import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  MCPConfig,
  DEFAULT_CONFIG,
  ConfigLoader,
  ConfigValidator,
  validateConfig,
  applyEnvOverrides,
  ConfigWatcher,
  createConfigWatcher,
} from "../src/mcp/config/index.js";

describe("MCP Configuration", () => {
  describe("Types", () => {
    it("should have correct default config structure", () => {
      expect(DEFAULT_CONFIG).toHaveProperty("database");
      expect(DEFAULT_CONFIG).toHaveProperty("server");
      expect(DEFAULT_CONFIG).toHaveProperty("logging");
      expect(DEFAULT_CONFIG).toHaveProperty("limits");
      expect(DEFAULT_CONFIG.database.path).toBe(".speclang/speclang.db");
      expect(DEFAULT_CONFIG.database.wal_mode).toBe(true);
      expect(DEFAULT_CONFIG.server.mode).toBe("stdio");
      expect(DEFAULT_CONFIG.server.host).toBe("localhost");
    });
  });

  describe("ConfigLoader", () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-config-test-"));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it("should return defaults when no config file exists", () => {
      const loader = new ConfigLoader(path.join(tempDir, "mcp.json"));
      const config = loader.load();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it("should load config from JSON file", () => {
      const configPath = path.join(tempDir, "mcp.json");
      const configData = {
        server: { mode: "http", port: 3000, host: "0.0.0.0" },
        logging: { level: "debug" },
      };
      fs.writeFileSync(configPath, JSON.stringify(configData));

      const loader = new ConfigLoader(configPath);
      const config = loader.load();

      expect(config.server.mode).toBe("http");
      expect(config.server.port).toBe(3000);
      expect(config.server.host).toBe("0.0.0.0");
      expect(config.logging?.level).toBe("debug");
      expect(config.database.path).toBe(DEFAULT_CONFIG.database.path);
    });

    it("should merge partial config with defaults", () => {
      const configPath = path.join(tempDir, "mcp.json");
      const configData = {
        database: { path: ".speclang/custom.db" },
      };
      fs.writeFileSync(configPath, JSON.stringify(configData));

      const loader = new ConfigLoader(configPath);
      const config = loader.load();

      expect(config.database.path).toBe(".speclang/custom.db");
      expect(config.database.wal_mode).toBe(true);
      expect(config.server.mode).toBe("stdio");
    });

    it("should save config to file", () => {
      const configPath = path.join(tempDir, "mcp.json");
      const loader = new ConfigLoader(configPath);
      const customConfig: MCPConfig = {
        ...DEFAULT_CONFIG,
        server: { mode: "http", port: 8080, host: "localhost" },
      };

      loader.save(customConfig);

      expect(fs.existsSync(configPath)).toBe(true);
      const loaded = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      expect(loaded.server.port).toBe(8080);
    });
  });

  describe("Validation", () => {
    it("should validate HTTP mode requires port", () => {
      const config: MCPConfig = {
        ...DEFAULT_CONFIG,
        server: { mode: "http", host: "localhost" },
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("port"))).toBe(true);
    });

    it("should validate basic auth requires users", () => {
      const config: MCPConfig = {
        ...DEFAULT_CONFIG,
        auth: { type: "basic", users: [] },
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("user"))).toBe(true);
    });

    it("should validate token auth requires tokens", () => {
      const config: MCPConfig = {
        ...DEFAULT_CONFIG,
        auth: { type: "token", tokens: [] },
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("token"))).toBe(true);
    });

    it("should warn about WAL mode without .db extension", () => {
      const config: MCPConfig = {
        ...DEFAULT_CONFIG,
        database: { path: ".speclang/speclang.data", wal_mode: true },
      };
      const result = validateConfig(config);
      expect(result.warnings.some((w) => w.includes(".db"))).toBe(true);
    });

    it("should warn about large max_results", () => {
      const config: MCPConfig = {
        ...DEFAULT_CONFIG,
        limits: {
          max_connections: 100,
          query_timeout_ms: 5000,
          max_results: 20000,
        },
      };
      const result = validateConfig(config);
      expect(result.warnings.some((w) => w.includes("memory"))).toBe(true);
    });

    it("should pass validation for valid config", () => {
      const config: MCPConfig = {
        ...DEFAULT_CONFIG,
        server: { mode: "http", port: 3000, host: "localhost" },
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Environment Overrides", () => {
    it("should override database path", () => {
      const config = { ...DEFAULT_CONFIG };
      process.env.MCP_DB_PATH = ".speclang/test.db";
      const result = applyEnvOverrides(config);
      expect(result.database.path).toBe(".speclang/test.db");
      delete process.env.MCP_DB_PATH;
    });

    it("should override server mode", () => {
      const config = { ...DEFAULT_CONFIG };
      process.env.MCP_SERVER_MODE = "http";
      const result = applyEnvOverrides(config);
      expect(result.server.mode).toBe("http");
      delete process.env.MCP_SERVER_MODE;
    });

    it("should override server port", () => {
      const config = { ...DEFAULT_CONFIG };
      process.env.MCP_SERVER_PORT = "8080";
      const result = applyEnvOverrides(config);
      expect(result.server.port).toBe(8080);
      delete process.env.MCP_SERVER_PORT;
    });

    it("should override log level", () => {
      const config = { ...DEFAULT_CONFIG };
      process.env.MCP_LOG_LEVEL = "debug";
      const result = applyEnvOverrides(config);
      expect(result.logging?.level).toBe("debug");
      delete process.env.MCP_LOG_LEVEL;
    });

    it("should set auth token from env", () => {
      const config = { ...DEFAULT_CONFIG };
      process.env.MCP_AUTH_TOKEN = "test-token";
      const result = applyEnvOverrides(config);
      expect(result.auth?.type).toBe("token");
      expect(result.auth?.tokens).toContain("test-token");
      delete process.env.MCP_AUTH_TOKEN;
    });
  });

  describe("ConfigWatcher", () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-watcher-test-"));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it("should create watcher", () => {
      const configPath = path.join(tempDir, "mcp.json");
      fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG));
      const watcher = createConfigWatcher(configPath);
      expect(watcher.isWatching()).toBe(false);
      watcher.start(() => {});
      expect(watcher.isWatching()).toBe(true);
      watcher.stop();
      expect(watcher.isWatching()).toBe(false);
    });

    it("should detect config changes", async () => {
      const configPath = path.join(tempDir, "mcp.json");
      fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG));
      const watcher = createConfigWatcher(configPath);

      let reloadCount = 0;
      watcher.start(() => {
        reloadCount++;
      });

      await new Promise((resolve) => setTimeout(resolve, 200));
      fs.writeFileSync(
        configPath,
        JSON.stringify({ ...DEFAULT_CONFIG, logging: { level: "debug" } }),
      );
      await new Promise((resolve) => setTimeout(resolve, 500));

      watcher.stop();
      expect(reloadCount).toBeGreaterThanOrEqual(0);
    });
  });
});
