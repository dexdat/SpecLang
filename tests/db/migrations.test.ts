/**
 * Regression tests for the shipped SQL migrations (DF-SPECLANG-016).
 *
 * A fresh database used to get only migrations 1-2 while the shipped
 * specs/sqlite.spec.dir/src/migrations/*.sql files (cascades, sessions, ralph,
 * locks, commands, indexes) were never read at runtime - so every MCP cascade /
 * dashboard / status tool answered HTTP 500 "SqliteError: no such table:
 * cascades". These tests pin the whole shipped schema onto a fresh file DB and
 * pin the upgrade path for databases that are already at version 2.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { SpecLangDB } from "../../src/db/index.js";
import { migrations, getCurrentVersion } from "../../src/db/migrations.js";
import * as specDirMigrations from "../../specs/sqlite.spec.dir/src/migrations.js";

const LATEST_VERSION = Math.max(...migrations.map((m) => m.version));

/** Tables that the shipped .sql files are responsible for on a fresh DB. */
const REQUIRED_TABLES = [
  "schema_migrations",
  "specs",
  "sessions",
  "events",
  "commands",
  "locks",
  "recovery",
  "cascades",
  // 005_ralph.sql
  "ralph_tasks",
  "steering_packets",
  "validation_results",
];

/** Columns the MCP cascade tools read/write (specs/mcp.spec.dir/src/tools/cascade.ts). */
const CASCADE_COLUMNS = [
  "cascade_id",
  "depth",
  "status",
  "started_at",
  "converged_at",
  "root_trigger_file",
  "root_trigger",
  "created_at",
];

describe("shipped migrations", () => {
  let dir: string;
  let dbPath: string;
  let db: SpecLangDB | undefined;

  beforeEach(() => {
    mkdirSync(join(process.cwd(), ".tmp"), { recursive: true });
    dir = mkdtempSync(join(process.cwd(), ".tmp", "migrations-test-"));
    dbPath = join(dir, "speclang.db");
  });

  afterEach(() => {
    if (db) {
      db.close();
      db = undefined;
    }
    rmSync(dir, { recursive: true, force: true });
  });

  it("creates every shipped table on a fresh database", () => {
    db = new SpecLangDB({ path: dbPath });
    const result = db.initialize();

    expect(result.version).toBe(LATEST_VERSION);

    const raw = db.getDatabase();
    const tables = new Set(
      (
        raw
          .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
          .all() as Array<{ name: string }>
      ).map((row) => row.name)
    );

    for (const table of REQUIRED_TABLES) {
      expect(tables.has(table), `missing table: ${table}`).toBe(true);
    }
  });

  it("gives cascades the columns the MCP cascade tools use", () => {
    db = new SpecLangDB({ path: dbPath });
    db.initialize();

    const raw = db.getDatabase();
    const columns = new Set(
      (
        raw.prepare("PRAGMA table_info(cascades)").all() as Array<{ name: string }>
      ).map((row) => row.name)
    );

    for (const column of CASCADE_COLUMNS) {
      expect(columns.has(column), `missing cascades column: ${column}`).toBe(true);
    }

    // The query speclang_cascade_status runs must not throw on an empty DB.
    const rows = raw
      .prepare("SELECT * FROM cascades WHERE status = 'cascading'")
      .all();
    expect(rows).toEqual([]);
  });

  it("is a no-op when initialize() runs twice on the same file", () => {
    db = new SpecLangDB({ path: dbPath });
    const first = db.initialize();
    expect(first.applied).toBe(LATEST_VERSION);

    const raw = db.getDatabase();
    const before = raw
      .prepare("SELECT version, name FROM schema_migrations ORDER BY version")
      .all();

    const second = db.initialize();
    expect(second.applied).toBe(0);
    expect(second.version).toBe(first.version);

    const after = raw
      .prepare("SELECT version, name FROM schema_migrations ORDER BY version")
      .all();
    expect(after).toEqual(before);
  });

  it("upgrades an existing version-2 database cleanly", () => {
    // Rebuild the exact state of a user database that stopped at version 2:
    // migrations 1-2 already applied and recorded, nothing else.
    const legacy = new Database(dbPath);
    const upToTwo = migrations.filter((m) => m.version <= 2);
    upToTwo[0].up(legacy); // creates schema_migrations as part of version 1
    const record = legacy.prepare(
      "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)"
    );
    record.run(upToTwo[0].version, upToTwo[0].name, Date.now());
    upToTwo[1].up(legacy);
    record.run(upToTwo[1].version, upToTwo[1].name, Date.now());
    expect(getCurrentVersion(legacy)).toBe(2);
    expect(
      legacy
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cascades'")
        .get()
    ).toBeUndefined();
    legacy.close();

    db = new SpecLangDB({ path: dbPath });
    const result = db.initialize();

    expect(result.applied).toBe(LATEST_VERSION - 2);
    expect(result.version).toBe(LATEST_VERSION);

    const raw = db.getDatabase();
    expect(
      raw
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cascades'")
        .get()
    ).toBeDefined();
    // Data written before the upgrade is untouched.
    expect(raw.prepare("SELECT COUNT(*) AS n FROM specs").get()).toEqual({ n: 0 });
  });

  it("keeps the spec-dir copy (the one the MCP server loads) in lockstep", () => {
    // src/db/migrations.ts is a symlink to specs/sqlite.spec.dir/src/migrations.ts,
    // but both module paths are imported in this repo, and drift between them is
    // exactly how .sql files went unapplied. Guard the pair.
    const signature = (list: typeof migrations) =>
      list.map((m) => `${m.version}:${m.name}`);
    expect(signature(specDirMigrations.migrations)).toEqual(signature(migrations));

    const specDb = new SpecLangDB({ path: dbPath });
    db = specDb;
    expect(specDb.initialize().version).toBe(LATEST_VERSION);
  });
});
