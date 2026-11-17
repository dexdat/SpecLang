/**
 * QA-SPECLANG-5-R3: the Ralph Loop opened its state DB but never initialised it.
 *
 * Verified pre-fix state this file fails against — from a scratch directory with
 * an existing parent dir and no schema:
 *
 *   $ npx tsx src/ralph-loop.ts <fresh>/speclang.db
 *   Ralph Loop failed: SqliteError: no such table: tasks
 *       at Database.prepare (.../better-sqlite3/lib/methods/wrappers.js:5:21)
 *       at LoopController.getNextTask (.../ralph-loop.ts:69:33)
 *   exit=1
 *
 * and with the DEFAULT path on a project that has no `.speclang/` at all it died
 * even earlier, before any table question:
 *
 *   Ralph Loop failed: TypeError: Cannot open database because the directory
 *   does not exist
 *
 * Root cause: `openStateDatabase()` creates the file (and better-sqlite3 defers
 * every schema question to the first statement) but nothing ran a schema or
 * migration on that path. The loop's own `schema.sql` was never executed by
 * anything, and the canonical state migrations create `ralph_tasks` — a
 * different table from the `tasks` the loop queries — so "the DB was created" and
 * "the loop can run" were two different things.
 *
 * After the fix `LoopController.create()` creates the containing directory and
 * runs the canonical initialiser (`migrate`, the same code `createDatabase()`
 * runs) plus the loop's own task schema, so a fresh path is a working state DB.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawn } from "node:child_process";
import Database from "better-sqlite3";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import {
  LoopController,
  RALPH_LOOP_SCHEMA_SQL,
  RALPH_LOOP_INIT_FAILED_CODE,
  RalphLoopStateInitError,
} from "../../src/ralph-loop.js";

const REPO_ROOT = process.cwd();
const TSX = join(REPO_ROOT, "node_modules", ".bin", "tsx");
const RALPH_ENTRY = join(REPO_ROOT, "src", "ralph-loop.ts");
const CANONICAL_SCHEMA_SQL = join(REPO_ROOT, "src", "ralph-loop", "schema.sql");
const DEFAULT_DB = join(".speclang", "speclang.db");

/** Poll interval for "did the loop get its state DB ready?" */
const POLL_MS = 100;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface EntryRun {
  stdout: string;
  stderr: string;
  /** Exit code when the process ended on its own; null when it was still running. */
  exitCode: number | null;
  /** True when the loop was still alive when the state DB became ready. */
  stillRunning: boolean;
}

/**
 * Start the real entry point, wait until it has bootstrapped its state DB (or
 * died trying), then stop it.
 *
 * Polling beats a fixed sleep here: the loop is a daemon that never exits, so
 * "it is still running and its DB is ready" is the success signal, and waiting
 * for the readiness line keeps the test fast under load instead of burning a
 * fixed timeout.
 */
async function runLoopUntilReady(projectDir: string, dbPath: string, waitMs = 30_000): Promise<EntryRun> {
  const child = spawn(TSX, [RALPH_ENTRY], { cwd: projectDir, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk: Buffer) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });

  let exitCode: number | null | undefined;
  const exited = new Promise<void>((resolve) => {
    child.on("exit", (code) => {
      exitCode = code;
      resolve();
    });
  });

  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    if (exitCode !== undefined) break;
    if (existsSync(dbPath) && stderr.includes("Ralph Loop state database ready at")) break;
    await sleep(POLL_MS);
  }

  const stillRunning = exitCode === undefined;
  if (stillRunning) {
    child.kill("SIGKILL");
  }
  await exited;
  return { stdout, stderr, exitCode: exitCode ?? null, stillRunning };
}

/** Table names in a state DB, opened read-only so the assertion cannot create it. */
function tableNames(dbPath: string): string[] {
  const db = new Database(dbPath, { readonly: true });
  try {
    const rows = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all() as Array<{ name: string }>;
    return rows.map((row) => row.name);
  } finally {
    db.close();
  }
}

/** Column shape of one table, as SQLite sees it (name, type, notnull, default, pk). */
function tableShape(db: Database.Database, table: string): string[] {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
    type: string;
    notnull: number;
    dflt_value: unknown;
    pk: number;
  }>;
  return rows.map(
    (row) => `${row.name}|${row.type}|${row.notnull}|${String(row.dflt_value)}|${row.pk}`
  );
}

/** Index names on one table, excluding SQLite's implicit ones. */
function indexNames(db: Database.Database, table: string): string[] {
  const rows = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    .all(table) as Array<{ name: string }>;
  return rows.map((row) => row.name);
}

describe("Ralph Loop bootstraps a fresh state database (QA-SPECLANG-5-R3)", () => {
  let dir: string;

  beforeEach(() => {
    mkdirSync(join(REPO_ROOT, ".tmp"), { recursive: true });
    dir = mkdtempSync(join(REPO_ROOT, ".tmp", "ralph-fresh-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("creates the canonical state schema plus the loop's own tables on an absent file", async () => {
    const dbPath = join(dir, "speclang.db");
    expect(existsSync(dbPath)).toBe(false);

    const controller = await LoopController.create(dbPath);
    expect(controller).toBeDefined();

    const tables = tableNames(dbPath);
    // The table the failing query reads.
    expect(tables).toContain("tasks");
    // handleFailure() writes this one.
    expect(tables).toContain("steering_packets");
    // BuilderAgent/VerifierAgent read specs; creating only the task tables
    // would leave the loop half-initialised on its first real task.
    expect(tables).toContain("specs");
    // The canonical initialiser ran, rather than a hand-rolled subset of it.
    expect(tables).toContain("schema_migrations");

    const db = new Database(dbPath, { readonly: true });
    try {
      const row = db.prepare("SELECT MAX(version) AS version FROM schema_migrations").get() as {
        version: number | null;
      };
      expect(row.version).toBe(8);
    } finally {
      db.close();
    }
  });

  it("every statement the loop prepares runs against the freshly created DB", async () => {
    const dbPath = join(dir, "statements.db");
    const controller = await LoopController.create(dbPath);

    const db = new Database(dbPath);
    try {
      // The exact statements from getNextTask(), loadSpecs() and handleFailure().
      db.prepare("SELECT * FROM tasks WHERE status = 'pending' ORDER BY created_at LIMIT 1").get();
      expect(db.prepare("SELECT * FROM specs WHERE layer >= 3").all()).toEqual([]);
      // The canonical migration spells this column `content`; the loop writes
      // `payload`, so the additive guard has to be in place too. Prepared (not
      // run): the canonical steering_packets also foreign-keys task_id to
      // ralph_tasks, and reconciling that with the loop's own `tasks` ids is a
      // schema-design decision, not a bootstrap fix — see the residual note in
      // the commit body.
      db.prepare(
        "INSERT INTO steering_packets (task_id, type, payload, created_at) VALUES (?, ?, ?, ?)"
      );

      db.prepare(
        `INSERT INTO tasks (id, title, description, status, assigned_to, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run("task-1", "code generation", "seeded", "pending", null, 1, 1);
    } finally {
      db.close();
    }

    // Read the seeded row back through the loop's own private query, so the
    // assertion covers the code path the report named, not a copy of its SQL.
    const next = await (
      controller as unknown as { getNextTask: () => Promise<{ id: string } | null> }
    ).getNextTask();
    expect(next?.id).toBe("task-1");
  });

  it("creates a missing directory for an explicit DB path", async () => {
    const dbPath = join(dir, "nested", "state", "speclang.db");
    expect(existsSync(join(dir, "nested"))).toBe(false);

    await LoopController.create(dbPath);

    expect(existsSync(dbPath)).toBe(true);
    expect(tableNames(dbPath)).toContain("tasks");
  });

  it("keeps the compiled-in task schema identical to src/ralph-loop/schema.sql", () => {
    // Anti-drift: the DDL is compiled in (the published tarball ships dist/ only,
    // so a runtime read of schema.sql would fail for consumers). Applying both to
    // their own database is what keeps the copy honest.
    const reference = new Database(":memory:");
    const compiledIn = new Database(":memory:");
    try {
      reference.exec(readFileSync(CANONICAL_SCHEMA_SQL, "utf-8"));
      compiledIn.exec(RALPH_LOOP_SCHEMA_SQL);

      expect(tableShape(compiledIn, "tasks")).toEqual(tableShape(reference, "tasks"));
      expect(indexNames(compiledIn, "tasks")).toEqual(indexNames(reference, "tasks"));
    } finally {
      reference.close();
      compiledIn.close();
    }
  });

  it("reports an actionable init failure instead of a bare SqliteError", async () => {
    // A path whose parent component is a regular file: the directory cannot be
    // created, so the loop must say which path is unusable and how to recover.
    const blocker = join(dir, "blocker");
    writeFileSync(blocker, "not a directory");
    const dbPath = join(blocker, "speclang.db");

    let caught: unknown;
    try {
      await LoopController.create(dbPath);
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(RalphLoopStateInitError);
    const err = caught as RalphLoopStateInitError;
    expect(err.name).toBe("RalphLoopStateInitError");
    expect(err.code).toBe(RALPH_LOOP_INIT_FAILED_CODE);
    expect(err.filePath).toBe(dbPath);
    expect(err.message).toContain(dbPath);
    expect(err.message).toContain('docs/troubleshooting.md -> "Emergency Recovery"');
    expect(err.message).not.toMatch(/^SqliteError/);
  });
});

describe("Ralph Loop entry point on a fresh project (QA-SPECLANG-5-R3)", () => {
  let dir: string;

  beforeEach(() => {
    mkdirSync(join(REPO_ROOT, ".tmp"), { recursive: true });
    dir = mkdtempSync(join(REPO_ROOT, ".tmp", "ralph-fresh-entry-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("has the TypeScript runner the entry point is exercised with", () => {
    // tsx is a devDependency; without it this entry point cannot be started at
    // all, so the gap has to be loud rather than skipped.
    expect(existsSync(TSX)).toBe(true);
    expect(existsSync(RALPH_ENTRY)).toBe(true);
  });

  it("bootstraps .speclang/speclang.db and keeps looping where it used to exit 1", async () => {
    const projectDir = join(dir, "fresh-project");
    // No .speclang/ at all — the default path of a fresh project.
    mkdirSync(projectDir, { recursive: true });
    const dbPath = join(projectDir, DEFAULT_DB);

    const res = await runLoopUntilReady(projectDir, dbPath);

    // The reported failure (and the directory-missing one it hid behind) is gone.
    expect(res.stderr).not.toMatch(/SqliteError/);
    expect(res.stderr).not.toMatch(/no such table/);
    expect(res.stderr).not.toMatch(/directory does not exist/);
    expect(res.exitCode).not.toBe(1);

    // Still running when it was stopped == the loop started; pre-fix it exited 1
    // within a second of startup.
    expect(res.stillRunning).toBe(true);
    expect(res.exitCode).toBeNull();
    expect(res.stderr).toContain("Ralph Loop state database ready at");

    expect(existsSync(dbPath)).toBe(true);

    const tables = tableNames(dbPath);
    expect(tables).toContain("tasks");
    expect(tables).toContain("specs");

    const db = new Database(dbPath, { readonly: true });
    try {
      expect(db.prepare("SELECT COUNT(*) AS n FROM tasks").get()).toEqual({ n: 0 });
    } finally {
      db.close();
    }
  }, 40_000);
});
