/**
 * DF-SPECLANG-016: regression for the missing `cascades` table.
 *
 * The shipped migration `003_cascades.sql` was never loaded by
 * `specs/sqlite.spec.dir/src/migrations.ts`, so every MCP cascade/dashboard/status
 * tool 500ed with `SqliteError: no such table: cascades`. These tests exercise the
 * DB layer on a freshly-created database file (the MCP tools talk to the same
 * SpecLangDB instance) and pin the column set the consumers rely on.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { SpecLangDB } from "../../src/db/index.js";
import { getCurrentVersion, migrate, rollback } from "../../src/db/migrations.js";

const CASCADES_SQL = join(
  process.cwd(),
  "specs/sqlite.spec.dir/src/migrations/003_cascades.sql"
);

interface TableInfoRow {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

/** Column names declared inside the first CREATE TABLE block of a .sql file. */
function columnsFromSqlFile(sql: string): string[] {
  const tableBlock = sql.match(
    /CREATE TABLE IF NOT EXISTS cascades\s*\(([\s\S]*?)\)\s*;/i
  );
  if (!tableBlock) return [];
  return tableBlock[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("--"))
    .map((line) => line.split(/\s+/)[0])
    .filter((name) => /^[a-z_][a-z0-9_]*$/i.test(name));
}

describe("cascades migration (DF-SPECLANG-016)", () => {
  let tmpDir: string;
  let dbPath: string;
  let db: SpecLangDB;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "speclang-cascades-"));
    dbPath = join(tmpDir, "speclang.db");
    db = new SpecLangDB({ path: dbPath });
  });

  afterEach(() => {
    try {
      db.close();
    } catch {
      // already closed by the test
    }
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates the cascades table on a fresh database", () => {
    const result = db.initialize();

    expect(result.version).toBe(3);
    expect(result.applied).toBe(3);
    expect(db.getVersion()).toBe(3);
    expect(getCurrentVersion(db.getDatabase())).toBe(3);

    const raw = db.getDatabase();
    const table = raw
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'cascades'")
      .get() as { name: string } | undefined;
    expect(table?.name).toBe("cascades");

    const columns = (raw.prepare("PRAGMA table_info(cascades)").all() as TableInfoRow[]).map(
      (c) => c.name
    );
    expect(columns.sort()).toEqual(
      [
        "cascade_id",
        "converged_at",
        "created_at",
        "depth",
        "root_trigger",
        "root_trigger_file",
        "started_at",
        "status",
      ].sort()
    );

    const indexes = (
      raw
        .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'cascades'")
        .all() as Array<{ name: string }>
    ).map((i) => i.name);
    expect(indexes).toEqual(
      expect.arrayContaining([
        "idx_cascades_status",
        "idx_cascades_started_at",
        "idx_cascades_converged_at",
        "idx_cascades_root_trigger_file",
      ])
    );
  });

  it("accepts the INSERT/SELECT the MCP cascade tools issue", () => {
    db.initialize();
    const raw = db.getDatabase();

    // specs/mcp.spec.dir/src/tools/cascade.ts:81 - exact column set of the INSERT.
    const nowSeconds = Math.floor(Date.now() / 1000);
    expect(() =>
      raw
        .prepare(
          `INSERT INTO cascades (cascade_id, root_trigger, status, depth, created_at)
           VALUES (?, ?, 'cascading', 0, ?)`
        )
        .run("cascade-test-1", "specs/foo.spec.md", nowSeconds)
    ).not.toThrow();

    // cascade.ts:28 - status scan (`SELECT *` materialises every column).
    const active = raw
      .prepare("SELECT * FROM cascades WHERE status = 'cascading'")
      .all() as Array<Record<string, unknown>>;
    expect(active).toHaveLength(1);
    expect(active[0].cascade_id).toBe("cascade-test-1");
    expect(active[0].root_trigger).toBe("specs/foo.spec.md");
    expect(active[0].created_at).toBe(nowSeconds);

    // dashboard.ts:185-186 / commands.ts:35 - count + max(depth).
    const count = raw
      .prepare("SELECT COUNT(*) as count FROM cascades WHERE status = 'cascading'")
      .get() as { count: number };
    expect(count.count).toBe(1);

    raw
      .prepare("UPDATE cascades SET depth = ? WHERE cascade_id = ?")
      .run(4, "cascade-test-1");
    const depth = raw
      .prepare("SELECT MAX(depth) as max_depth FROM cascades WHERE status = 'cascading'")
      .get() as { max_depth: number | null };
    expect(depth.max_depth).toBe(4);

    // sse.ts:240 / mcp server.ts:425 - convergence polling.
    raw
      .prepare("UPDATE cascades SET status = 'converged', converged_at = ? WHERE cascade_id = ?")
      .run(nowSeconds + 5, "cascade-test-1");
    const converged = raw
      .prepare("SELECT * FROM cascades WHERE converged_at IS NOT NULL AND converged_at > ?")
      .all(nowSeconds) as Array<{ cascade_id: string; created_at: number; converged_at: number }>;
    expect(converged).toHaveLength(1);
    expect(converged[0].cascade_id).toBe("cascade-test-1");
    expect(converged[0].converged_at - converged[0].created_at).toBe(5);

    // root_trigger_file and started_at are part of the union even though no
    // consumer writes them today; assert they are writable so future code can.
    expect(() =>
      raw
        .prepare(
          "UPDATE cascades SET started_at = ?, root_trigger_file = ? WHERE cascade_id = ?"
        )
        .run(nowSeconds, "specs/foo.spec.md", "cascade-test-1")
    ).not.toThrow();
  });

  it("is idempotent: re-running migrations applies nothing and keeps version 3", () => {
    db.initialize();
    const second = db.initialize();
    expect(second.applied).toBe(0);
    expect(second.version).toBe(3);

    const rerun = migrate(db.getDatabase());
    expect(rerun.applied).toBe(0);
    expect(rerun.currentVersion).toBe(3);
  });

  it("upgrades a pre-existing version-2 database in place", () => {
    // Real installs sit at version 2; roll back to that state and re-initialize
    // to prove the v3 migration applies to an existing db, not just a fresh one.
    db.initialize();
    expect(rollback(db.getDatabase(), 2)).toBe(true);
    expect(getCurrentVersion(db.getDatabase())).toBe(2);
    const gone = db
      .getDatabase()
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'cascades'")
      .get();
    expect(gone).toBeUndefined();

    const upgraded = db.initialize();
    expect(upgraded.applied).toBe(1);
    expect(upgraded.version).toBe(3);
    expect(
      db
        .getDatabase()
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'cascades'")
        .get()
    ).toBeDefined();

    expect(() =>
      db
        .getDatabase()
        .prepare(
          "INSERT INTO cascades (cascade_id, root_trigger, status, depth, created_at) VALUES (?,?,?,?,?)"
        )
        .run("cascade-upgrade-1", "upgrade-trigger", "cascading", 1, Math.floor(Date.now() / 1000))
    ).not.toThrow();
  });

  it("keeps the shipped 003_cascades.sql column set in sync with the migration", () => {
    expect(existsSync(CASCADES_SQL)).toBe(true);
    const specColumns = columnsFromSqlFile(readFileSync(CASCADES_SQL, "utf-8"));
    expect(specColumns.length).toBeGreaterThan(0);

    db.initialize();
    const liveColumns = (
      db.getDatabase().prepare("PRAGMA table_info(cascades)").all() as TableInfoRow[]
    ).map((c) => c.name);

    expect(liveColumns.sort()).toEqual([...specColumns].sort());
  });
});
