/**
 * SPECLANG-GENERATED: Database tests
 * Source: @speclang/sqlite @block:sqlite/schema
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database, { type Database as DatabaseType } from "better-sqlite3";
import { SpecLangDB } from "../src/db/index.js";
import { migrate, getCurrentVersion } from "../src/db/migrations.js";
import { FullTextSearch, GraphQueries, JSONQueries } from "../src/db/search.js";
import type {
  SpecInput,
  SessionRecord,
  CommandRecord,
} from "../src/db/types.js";
import * as fs from "fs";

const TEST_DB_PATH = ".speclang/test.db";

describe("Database", () => {
  let db: SpecLangDB;

  beforeEach(() => {
    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    // Also clean up WAL files
    const walPath = TEST_DB_PATH + "-wal";
    const shmPath = TEST_DB_PATH + "-shm";
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

    db = new SpecLangDB({ path: TEST_DB_PATH, wal: true });
    db.initialize();
  });

  afterEach(() => {
    if (db) {
      db.close();
    }

    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    const walPath = TEST_DB_PATH + "-wal";
    const shmPath = TEST_DB_PATH + "-shm";
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  describe("Initialization", () => {
    it("should create database with correct version", () => {
      expect(db.getVersion()).toBe(1);
    });

    it("should apply migrations", () => {
      const result = db.initialize();
      expect(result.version).toBe(1);
      expect(result.applied).toBe(0); // Already applied
    });
  });

  describe("Specs Operations", () => {
    it("should insert a spec", () => {
      const spec: SpecInput = {
        file_path: "specs/auth.spec.md",
        id: "@speclang/auth",
        parent_id: null,
        children: [],
        tags: ["auth", "security"],
        short_desc: "Authentication spec",
        header_raw: "# speclang-header\nid: @speclang/auth",
        header_lines: 2,
        content_raw: "# Authentication\n\nThis is the auth spec.",
        last_edited: Date.now(),
      };

      db.upsertSpec(spec);
      const retrieved = db.getSpec("specs/auth.spec.md");

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe("@speclang/auth");
      expect(retrieved?.tags).toEqual(["auth", "security"]);
      expect(retrieved?.short_desc).toBe("Authentication spec");
    });

    it("should update a spec", () => {
      const spec: SpecInput = {
        file_path: "specs/auth.spec.md",
        id: "@speclang/auth",
        tags: ["auth"],
        short_desc: "Original",
      };

      db.upsertSpec(spec);

      // Update
      db.upsertSpec({
        ...spec,
        short_desc: "Updated",
      });

      const retrieved = db.getSpec("specs/auth.spec.md");
      expect(retrieved?.short_desc).toBe("Updated");
      expect(retrieved?.tags).toEqual(["auth"]);
    });

    it("should delete a spec", () => {
      const spec: SpecInput = {
        file_path: "specs/auth.spec.md",
        id: "@speclang/auth",
      };

      db.upsertSpec(spec);
      db.deleteSpec("specs/auth.spec.md");

      const retrieved = db.getSpec("specs/auth.spec.md");
      expect(retrieved).toBeUndefined();
    });

    it("should get all specs", () => {
      db.upsertSpec({ file_path: "specs/a.spec.md", id: "@specs/a", tags: [] });
      db.upsertSpec({ file_path: "specs/b.spec.md", id: "@specs/b", tags: [] });

      const specs = db.getAllSpecs();
      expect(specs.length).toBe(2);
    });
  });

  describe("Session Operations", () => {
    it("should insert a session", () => {
      const session: SessionRecord = {
        id: "session-1",
        agent: "code-gen",
        owns: ["specs/auth.spec.md"],
        status: "active",
        last_active: Date.now(),
      };

      db.upsertSession(session);
      const retrieved = db.getSession("session-1");

      expect(retrieved).toBeDefined();
      expect(retrieved?.agent).toBe("code-gen");
      expect(retrieved?.owns).toContain("specs/auth.spec.md");
    });

    it("should get active sessions", () => {
      db.upsertSession({
        id: "session-1",
        agent: "agent-1",
        owns: [],
        status: "active",
        last_active: Date.now(),
      });

      db.upsertSession({
        id: "session-2",
        agent: "agent-2",
        owns: [],
        status: "idle",
        last_active: Date.now(),
      });

      const active = db.getActiveSessions();
      expect(active.length).toBe(1);
      expect(active[0].id).toBe("session-1");
    });
  });

  describe("Event Operations", () => {
    it("should insert an event", () => {
      const eventId = db.insertEvent({
        timestamp: Date.now(),
        kind: "spec.created",
        path: "specs/auth.spec.md",
        session: "session-1",
        cascade_id: "cascade-1",
        details: { action: "created" },
      });

      expect(eventId).toBeGreaterThan(0);
    });

    it("should get events by cascade", () => {
      db.insertEvent({
        timestamp: Date.now(),
        kind: "spec.created",
        cascade_id: "cascade-1",
        path: "specs/a.md",
      });

      db.insertEvent({
        timestamp: Date.now(),
        kind: "spec.updated",
        cascade_id: "cascade-1",
        path: "specs/b.md",
      });

      const events = db.getEventsByCascade("cascade-1");
      expect(events.length).toBe(2);
    });

    it("should get recent events", () => {
      for (let i = 0; i < 5; i++) {
        db.insertEvent({
          timestamp: Date.now() - i * 1000,
          kind: "test.event",
          path: null,
        });
      }

      const events = db.getRecentEvents(3);
      expect(events.length).toBe(3);
    });
  });

  describe("Command Operations", () => {
    it("should insert a command", () => {
      const command: CommandRecord = {
        id: "cmd-1",
        session_id: "session-1",
        cascade_id: "cascade-1",
        action: "generate",
        target: "specs/auth.spec.md",
        payload: { template: "default" },
        status: "pending",
        created_at: Date.now(),
      };

      db.insertCommand(command);

      const pending = db.getPendingCommands();
      expect(pending.length).toBe(1);
      expect(pending[0].action).toBe("generate");
    });

    it("should update command status", () => {
      db.insertCommand({
        id: "cmd-1",
        action: "test",
        status: "pending",
        created_at: Date.now(),
      });

      db.updateCommandStatus("cmd-1", "running");

      const pending = db.getPendingCommands();
      expect(pending.length).toBe(0);
    });
  });

  describe("Lock Operations", () => {
    it("should acquire a lock", () => {
      const result = db.acquireLock("specs/auth.spec.md", "session-1");
      expect(result).toBe(true);
    });

    it("should not allow duplicate lock", () => {
      db.acquireLock("specs/auth.spec.md", "session-1");
      const result = db.acquireLock("specs/auth.spec.md", "session-2");
      expect(result).toBe(false);
    });

    it("should check if file is locked", () => {
      db.acquireLock("specs/auth.spec.md", "session-1");
      expect(db.isLocked("specs/auth.spec.md")).toBe(true);
    });

    it("should release a lock", () => {
      db.acquireLock("specs/auth.spec.md", "session-1");
      db.releaseLock("specs/auth.spec.md", "session-1");
      expect(db.isLocked("specs/auth.spec.md")).toBe(false);
    });

    it("should respect TTL on locks", async () => {
      db.acquireLock("specs/auth.spec.md", "session-1", 100); // 100ms TTL

      // Immediately should be locked
      expect(db.isLocked("specs/auth.spec.md")).toBe(true);

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(db.isLocked("specs/auth.spec.md")).toBe(false);
    });
  });

  describe("Recovery Operations", () => {
    it("should record recovery", () => {
      const id = db.recordRecovery("test-op", { key: "value" });
      expect(id).toBeGreaterThan(0);
    });

    it("should get unrecovered operations", () => {
      db.recordRecovery("op-1", { data: 1 });
      db.recordRecovery("op-2", { data: 2 });

      const unrecovered = db.getUnrecovered();
      expect(unrecovered.length).toBe(2);
    });

    it("should mark as recovered", () => {
      const id = db.recordRecovery("op-1", {});
      db.markRecovered(id);

      const unrecovered = db.getUnrecovered();
      expect(unrecovered.length).toBe(0);
    });
  });
});

describe("Full-Text Search", () => {
  let db: SpecLangDB;
  let fts: FullTextSearch;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    const walPath = TEST_DB_PATH + "-wal";
    const shmPath = TEST_DB_PATH + "-shm";
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

    db = new SpecLangDB({ path: TEST_DB_PATH, wal: false });
    db.initialize();
    fts = db.fts;

    // Insert test specs
    db.upsertSpec({
      file_path: "specs/auth.spec.md",
      id: "@speclang/auth",
      tags: ["auth", "security"],
      short_desc: "Authentication specification",
      header_raw: "# Authentication\nid: @speclang/auth",
      content_raw: "This spec defines authentication mechanisms.",
      header_lines: 2,
    });

    db.upsertSpec({
      file_path: "specs/login.spec.md",
      id: "@speclang/login",
      tags: ["auth", "ui"],
      short_desc: "Login form",
      header_raw: "# Login\nid: @speclang/login",
      content_raw: "Login form for user authentication.",
      header_lines: 2,
    });
  });

  afterEach(() => {
    if (db) db.close();
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    const walPath = TEST_DB_PATH + "-wal";
    const shmPath = TEST_DB_PATH + "-shm";
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  it("should search by content", () => {
    const results = fts.search({ query: "authentication", limit: 10 });
    expect(results.length).toBeGreaterThan(0);
  });

  it("should search with tag filter", () => {
    const results = fts.search({
      query: "spec",
      limit: 10,
      tags: ["auth"],
    });
    // Should have filtered results
    expect(results).toBeDefined();
  });

  it("should return empty for non-matching query", () => {
    const results = fts.search({ query: "nonexistent", limit: 10 });
    expect(results.length).toBe(0);
  });
});

describe("Graph Queries", () => {
  let db: SpecLangDB;
  let graph: GraphQueries;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    const walPath = TEST_DB_PATH + "-wal";
    const shmPath = TEST_DB_PATH + "-shm";
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

    db = new SpecLangDB({ path: TEST_DB_PATH, wal: false });
    db.initialize();
    graph = db.graph;

    // Create dependency tree
    db.upsertSpec({
      file_path: "specs/core.spec.md",
      id: "@speclang/core",
      parent_id: null,
      depends_on: [],
      tags: [],
      short_desc: "Core spec",
    });

    db.upsertSpec({
      file_path: "specs/auth.spec.md",
      id: "@speclang/auth",
      parent_id: "@speclang/core",
      depends_on: ["@speclang/core"],
      tags: [],
      short_desc: "Auth spec",
    });

    db.upsertSpec({
      file_path: "specs/login.spec.md",
      id: "@speclang/login",
      parent_id: "@speclang/auth",
      depends_on: ["@speclang/auth", "@speclang/core"],
      tags: [],
      short_desc: "Login spec",
    });
  });

  afterEach(() => {
    if (db) db.close();
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    const walPath = TEST_DB_PATH + "-wal";
    const shmPath = TEST_DB_PATH + "-shm";
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  it("should find dependents", () => {
    const dependents = graph.findDependents("@speclang/core");
    expect(dependents.length).toBe(2); // auth and login depend on core
  });

  it("should find dependencies", () => {
    const deps = graph.findDependencies("@speclang/login");
    expect(deps.length).toBe(2); // depends on auth and core
  });

  it("should get tree", () => {
    const tree = graph.getTree("specs/core.spec.md", 5);
    expect(tree.length).toBeGreaterThan(1);
  });

  it("should find ancestors", () => {
    const ancestors = graph.findAncestors("specs/login.spec.md");
    expect(ancestors.length).toBe(3); // login, auth, core
  });
});

describe("JSON Queries", () => {
  let db: SpecLangDB;
  let json: JSONQueries;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    const walPath = TEST_DB_PATH + "-wal";
    const shmPath = TEST_DB_PATH + "-shm";
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

    db = new SpecLangDB({ path: TEST_DB_PATH, wal: false });
    db.initialize();
    json = db.json;

    // Insert specs with JSON data
    db.upsertSpec({
      file_path: "specs/auth.spec.md",
      id: "@speclang/auth",
      tags: ["auth"],
      short_desc: "Auth",
      parsed_json: { domain: "auth", target: "typescript", layer: 5 },
    });

    db.upsertSpec({
      file_path: "specs/db.spec.md",
      id: "@speclang/db",
      tags: ["database"],
      short_desc: "Database",
      parsed_json: { domain: "storage", target: "sql", layer: 3 },
    });
  });

  afterEach(() => {
    if (db) db.close();
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    const walPath = TEST_DB_PATH + "-wal";
    const shmPath = TEST_DB_PATH + "-shm";
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  it("should find by tag", () => {
    const results = json.findByTag("auth");
    expect(results.length).toBe(1);
  });

  it("should find by field", () => {
    const results = json.findByField("target", "typescript");
    expect(results.length).toBe(1);
  });
});

describe("Migrations", () => {
  let db: DatabaseType;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    const walPath = TEST_DB_PATH + "-wal";
    const shmPath = TEST_DB_PATH + "-shm";
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

    db = new Database(TEST_DB_PATH);
  });

  afterEach(() => {
    if (db) db.close();
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    const walPath = TEST_DB_PATH + "-wal";
    const shmPath = TEST_DB_PATH + "-shm";
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  it("should run migrations", () => {
    const result = migrate(db);
    expect(result.currentVersion).toBe(1);
    expect(result.applied).toBe(1);
  });

  it("should not re-run migrations", () => {
    migrate(db);
    const result = migrate(db);
    expect(result.applied).toBe(0);
  });

  it("should get current version", () => {
    migrate(db);
    expect(getCurrentVersion(db)).toBe(1);
  });
});

describe("Vector Search", () => {
  let db: SpecLangDB;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    const walPath = TEST_DB_PATH + "-wal";
    const shmPath = TEST_DB_PATH + "-shm";
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

    db = new SpecLangDB({ path: TEST_DB_PATH, wal: false });
    db.initialize();
  });

  afterEach(() => {
    if (db) db.close();
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    const walPath = TEST_DB_PATH + "-wal";
    const shmPath = TEST_DB_PATH + "-shm";
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  it("should report availability correctly", () => {
    // Initially no vector table
    expect(db.vectors.isAvailable()).toBe(false);
  });

  it("should return empty results for stub implementation", () => {
    const embedding = new Array(1536).fill(0);
    const results = db.vectors.findSimilar({ embedding, limit: 5 });
    expect(results.length).toBe(0);
  });
});
