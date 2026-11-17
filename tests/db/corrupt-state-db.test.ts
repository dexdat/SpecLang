/**
 * QA-SPECLANG-5: a corrupt state database must fail loudly instead of degrading
 * into a silent no-op.
 *
 * Repro that motivated this file: with 4KB of random bytes at
 * `<project>/.speclang/speclang.db`, `speclang status` printed a normal status
 * block ("Daemon: Not running") and exited 0 — the DB was never opened, so
 * nothing could notice it was not a database at all. Every command that *did*
 * open it died later with a bare `SqliteError: file is not a database`: no path,
 * no remedy.
 *
 * These tests pin the three states that matter:
 *   (a) corrupt file  -> typed CorruptStateDatabaseError + non-zero CLI exit
 *   (b) missing file  -> fresh state, no error
 *   (c) valid file    -> unchanged behaviour
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import {
  SpecLangDB,
  createDatabase,
  CorruptStateDatabaseError,
  STATE_DB_CORRUPT_CODE,
  isNotADatabaseError,
  stateDatabaseCorruptionMessage,
} from "../../src/db/index.js";

const REPO_ROOT = process.cwd();
const CLI = join(REPO_ROOT, "bin", "speclang");

/** Write a file that exists but is not a SQLite database (the reported repro). */
function writeCorruptDb(dbPath: string): void {
  writeFileSync(dbPath, randomBytes(4096));
}

/** Run `speclang status --dir <projectDir>` exactly as an operator would. */
function runStatus(projectDir: string) {
  const env = { ...process.env };
  // status must read the project's own DB, not a caller's override.
  delete env.SPECLANG_DB;
  return spawnSync(process.execPath, [CLI, "status", "-d", projectDir], {
    cwd: REPO_ROOT,
    encoding: "utf-8",
    env,
    timeout: 30_000,
  });
}

describe("corrupt state database (QA-SPECLANG-5)", () => {
  let dir: string;
  let dbPath: string;

  beforeEach(() => {
    mkdirSync(join(REPO_ROOT, ".tmp"), { recursive: true });
    dir = mkdtempSync(join(REPO_ROOT, ".tmp", "corrupt-db-test-"));
    dbPath = join(dir, "speclang.db");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  // (a) corrupt file -------------------------------------------------------
  it("refuses a file that is not a SQLite database, with a typed actionable error", () => {
    writeCorruptDb(dbPath);

    let caught: unknown;
    try {
      new SpecLangDB({ path: dbPath });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(CorruptStateDatabaseError);
    const err = caught as CorruptStateDatabaseError;
    expect(err.name).toBe("CorruptStateDatabaseError");
    expect(err.code).toBe(STATE_DB_CORRUPT_CODE);
    expect(err.filePath).toBe(dbPath);
    expect(err.sqliteCode).toBe("SQLITE_NOTADB");
    // Names the file, says what is wrong, names the remedy.
    expect(err.message).toContain(dbPath);
    expect(err.message).toMatch(/corrupt or not a SQLite database/i);
    expect(err.message).toContain(`rm -f ${dbPath}`);
    expect(err.message).toContain("Emergency Recovery");
    expect(err.message).toBe(stateDatabaseCorruptionMessage(dbPath));
    // Reported, never "repaired" behind the operator's back.
    expect(statSync(dbPath).size).toBe(4096);
  });

  it("fails through createDatabase() too, so every DB consumer inherits the guard", () => {
    writeCorruptDb(dbPath);
    expect(() => createDatabase({ path: dbPath })).toThrow(CorruptStateDatabaseError);
  });

  it("classifies only not-a-database failures as corruption", () => {
    expect(
      isNotADatabaseError(Object.assign(new Error("file is not a database"), { code: "SQLITE_NOTADB" }))
    ).toBe(true);
    expect(
      isNotADatabaseError(Object.assign(new Error("no such table: specs"), { code: "SQLITE_ERROR" }))
    ).toBe(false);
    expect(isNotADatabaseError(undefined)).toBe(false);
  });

  // (b) missing file -------------------------------------------------------
  it("treats a missing state database as fresh state, not an error", () => {
    expect(existsSync(dbPath)).toBe(false);

    const db = new SpecLangDB({ path: dbPath });
    try {
      const result = db.initialize();
      expect(result.version).toBeGreaterThan(0);
      expect(db.getVersion()).toBe(result.version);
      expect(db.getAllSpecs()).toEqual([]);
    } finally {
      db.close();
    }

    // Opening it is what creates the file; there was simply no state yet.
    expect(existsSync(dbPath)).toBe(true);
  });

  // (c) valid file ---------------------------------------------------------
  it("opens a valid state database normally", () => {
    const db = createDatabase({ path: dbPath });
    try {
      db.upsertSpec({ file_path: "specs/qa.spec.md", id: "@qa/state" });
      expect(db.getSpec("specs/qa.spec.md")?.id).toBe("@qa/state");
    } finally {
      db.close();
    }

    const reopened = createDatabase({ path: dbPath });
    try {
      expect(reopened.getSpec("specs/qa.spec.md")?.id).toBe("@qa/state");
    } finally {
      reopened.close();
    }
  });
});

describe("speclang status against the state DB (QA-SPECLANG-5)", () => {
  let dir: string;

  beforeEach(() => {
    mkdirSync(join(REPO_ROOT, ".tmp"), { recursive: true });
    dir = mkdtempSync(join(REPO_ROOT, ".tmp", "status-corrupt-db-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("exits non-zero and prints the corrupt-DB diagnostic naming the path", () => {
    const projectDir = join(dir, "project");
    mkdirSync(join(projectDir, ".speclang"), { recursive: true });
    const corruptPath = join(projectDir, ".speclang", "speclang.db");
    writeCorruptDb(corruptPath);

    const res = runStatus(projectDir);

    expect(res.status).toBe(1);
    // Both copies of the wording (library + CLI) must stay identical.
    const diagnostic = stateDatabaseCorruptionMessage(corruptPath);
    for (const line of diagnostic.split("\n").filter((l) => l.trim().length > 0)) {
      expect(res.stderr).toContain(line);
    }
    expect(res.stderr).toContain(corruptPath);
    expect(res.stderr).toMatch(/not a SQLite database/i);
    expect(res.stderr).toContain(`rm -f ${corruptPath}`);
    // A failure must not also print a normal-looking status block.
    expect(res.stdout).not.toContain("SpecLang Status");
    expect(res.stdout).not.toContain("Daemon:");
  });

  it("still exits 0 with normal output when there is no state database at all", () => {
    const projectDir = join(dir, "fresh-project");
    mkdirSync(projectDir, { recursive: true });

    const res = runStatus(projectDir);

    expect(res.status).toBe(0);
    expect(res.stdout).toContain("📊 SpecLang Status");
    expect(res.stdout).toContain("Daemon: Not running");
    expect(res.stderr).not.toMatch(/corrupt/i);
    // status is a read-only report: it must not create state just by looking.
    expect(existsSync(join(projectDir, ".speclang", "speclang.db"))).toBe(false);
  });

  it("still exits 0 when the state database is valid", () => {
    const projectDir = join(dir, "valid-project");
    mkdirSync(join(projectDir, ".speclang"), { recursive: true });
    const validPath = join(projectDir, ".speclang", "speclang.db");
    const db = createDatabase({ path: validPath });
    db.close();

    const res = runStatus(projectDir);

    expect(res.status).toBe(0);
    expect(res.stdout).toContain("Daemon: Not running");
    expect(res.stderr).not.toMatch(/corrupt/i);
  });
});
