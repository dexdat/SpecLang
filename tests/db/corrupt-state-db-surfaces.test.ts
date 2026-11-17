/**
 * QA-SPECLANG-5-R2: the corrupt-state-DB guard used to cover only the SpecLangDB
 * path. The standalone MCP server (src/speclang-mcp.ts) and the Ralph Loop
 * (src/ralph-loop.ts, src/ralph-loop/controller.ts) opened
 * `.speclang/speclang.db` with `new Database(...)` directly, so 4KB of random
 * bytes at that path surfaced a raw `SqliteError: file is not a database` —
 * no path, no remedy — from both.
 *
 * Pre-fix shape this file fails against (verified by reverting the opener in
 * src/speclang-mcp.ts + src/ralph-loop.ts to `new Database(...)`):
 *   - `new SpeclangDatabase(path)` threw a bare SqliteError (SQLITE_NOTADB) whose
 *     message carried no DB path and no recovery step;
 *   - `LoopController.create(path)` rejected with the same bare SqliteError;
 *   - both entry points exited 1 but printed that raw error, which the
 *     `.not.toMatch(/SqliteError/)` assertions below reject.
 *
 * After the fix every opener goes through openStateDatabase() and reports the
 * shared CorruptStateDatabaseError diagnostic (file path + the documented
 * docs/troubleshooting.md "Emergency Recovery" step).
 *
 * The same three states as tests/db/corrupt-state-db.test.ts are pinned per
 * surface: corrupt -> typed diagnostic, missing -> fresh state, valid ->
 * unchanged behaviour.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";

import { SpeclangDatabase } from "../../src/speclang-mcp.js";
import { LoopController } from "../../src/ralph-loop.js";
import {
  CorruptStateDatabaseError,
  STATE_DB_CORRUPT_CODE,
  stateDatabaseCorruptionMessage,
} from "../../src/db/index.js";

const REPO_ROOT = process.cwd();
const TSX = join(REPO_ROOT, "node_modules", ".bin", "tsx");
const MCP_ENTRY = join(REPO_ROOT, "src", "speclang-mcp.ts");
const RALPH_ENTRY = join(REPO_ROOT, "src", "ralph-loop.ts");
const DEFAULT_DB = join(".speclang", "speclang.db");

/** Write a file that exists but is not a SQLite database (the reported repro). */
function writeCorruptDb(dbPath: string): void {
  writeFileSync(dbPath, randomBytes(4096));
}

/** Run a TypeScript entry point the way an operator would, in its own project dir. */
function runEntry(entry: string, projectDir: string) {
  return spawnSync(TSX, [entry], {
    cwd: projectDir,
    encoding: "utf-8",
    // Both entry points talk stdio; a closed stdin proves they exit on their own.
    input: "",
    timeout: 60_000,
  });
}

/** The lines of the diagnostic every surface must print verbatim. */
function diagnosticLines(dbPath: string): string[] {
  return stateDatabaseCorruptionMessage(dbPath)
    .split("\n")
    .filter((line) => line.trim().length > 0);
}

describe("corrupt state database reaches the MCP and Ralph Loop openers (QA-SPECLANG-5-R2)", () => {
  let dir: string;
  let dbPath: string;

  beforeEach(() => {
    mkdirSync(join(REPO_ROOT, ".tmp"), { recursive: true });
    dir = mkdtempSync(join(REPO_ROOT, ".tmp", "corrupt-surfaces-"));
    dbPath = join(dir, "speclang.db");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  // MCP surface ------------------------------------------------------------
  it("MCP database handle refuses a corrupt file with the shared diagnostic", () => {
    writeCorruptDb(dbPath);

    let caught: unknown;
    try {
      new SpeclangDatabase(dbPath);
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(CorruptStateDatabaseError);
    const err = caught as CorruptStateDatabaseError;
    expect(err.name).toBe("CorruptStateDatabaseError");
    expect(err.code).toBe(STATE_DB_CORRUPT_CODE);
    expect(err.filePath).toBe(dbPath);
    expect(err.sqliteCode).toBe("SQLITE_NOTADB");
    // Same wording as the SpecLangDB path: names the file and the remedy.
    expect(err.message).toBe(stateDatabaseCorruptionMessage(dbPath));
    expect(err.message).toContain(dbPath);
    expect(err.message).toContain("Emergency Recovery");
    expect(err.message).toContain(`rm -f ${dbPath}`);
    // The raw better-sqlite3 error must not be what the operator sees.
    expect(err.message).not.toMatch(/^SqliteError/);
    expect(err.message).not.toBe(String((err.cause as Error | undefined)?.message ?? ""));
    // Reported, never "repaired" behind the operator's back.
    expect(statSync(dbPath).size).toBe(4096);
  });

  it("MCP database handle still bootstraps a healthy (absent) file", () => {
    expect(existsSync(dbPath)).toBe(false);

    const db = new SpeclangDatabase(dbPath);
    const rows = db.query(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'specs'"
    );
    expect(rows).toHaveLength(1);
    expect(db.query("SELECT * FROM specs")).toEqual([]);

    // Opening it is what creates the file; there was simply no state yet.
    expect(existsSync(dbPath)).toBe(true);
  });

  // Ralph Loop surface -----------------------------------------------------
  it("Ralph Loop refuses a corrupt file with the shared diagnostic", async () => {
    writeCorruptDb(dbPath);

    let caught: unknown;
    try {
      await LoopController.create(dbPath);
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(CorruptStateDatabaseError);
    const err = caught as CorruptStateDatabaseError;
    expect(err.code).toBe(STATE_DB_CORRUPT_CODE);
    expect(err.filePath).toBe(dbPath);
    expect(err.message).toBe(stateDatabaseCorruptionMessage(dbPath));
    expect(err.message).not.toMatch(/^SqliteError/);
    expect(statSync(dbPath).size).toBe(4096);
  });

  it("Ralph Loop still opens a healthy (absent) file", async () => {
    expect(existsSync(dbPath)).toBe(false);

    const controller = await LoopController.create(dbPath);
    expect(controller).toBeDefined();
    expect(existsSync(dbPath)).toBe(true);
  });
});

describe("corrupt state database stops the real entry points (QA-SPECLANG-5-R2)", () => {
  let dir: string;

  beforeEach(() => {
    mkdirSync(join(REPO_ROOT, ".tmp"), { recursive: true });
    dir = mkdtempSync(join(REPO_ROOT, ".tmp", "corrupt-entries-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("has the TypeScript runner the entry points are exercised with", () => {
    // tsx is a devDependency (package.json); without it these two entry points
    // cannot be started at all, so the gap has to be loud, not skipped.
    expect(existsSync(TSX)).toBe(true);
    expect(existsSync(MCP_ENTRY)).toBe(true);
    expect(existsSync(RALPH_ENTRY)).toBe(true);
  });

  it("MCP status/tool entry exits non-zero with the diagnostic, not a SqliteError", () => {
    const projectDir = join(dir, "mcp-project");
    mkdirSync(join(projectDir, ".speclang"), { recursive: true });
    const corruptPath = join(projectDir, DEFAULT_DB);
    writeCorruptDb(corruptPath);

    const res = runEntry(MCP_ENTRY, projectDir);

    expect(res.status).toBe(1);
    for (const line of diagnosticLines(DEFAULT_DB)) {
      expect(res.stderr).toContain(line);
    }
    expect(res.stderr).toMatch(/corrupt or not a SQLite database/);
    expect(res.stderr).toContain("docs/troubleshooting.md");
    // The raw better-sqlite3 failure is what this change removed.
    expect(res.stderr).not.toMatch(/SqliteError/);
    // A failed start must not also claim the server is up.
    expect(res.stdout).not.toContain("Speclang MCP server running");
    // Diagnose, do not silently delete the operator's evidence.
    expect(statSync(corruptPath).size).toBe(4096);
  });

  it("Ralph Loop entry exits non-zero with the diagnostic, not a SqliteError", () => {
    const projectDir = join(dir, "ralph-project");
    mkdirSync(join(projectDir, ".speclang"), { recursive: true });
    const corruptPath = join(projectDir, DEFAULT_DB);
    writeCorruptDb(corruptPath);

    const res = runEntry(RALPH_ENTRY, projectDir);

    expect(res.status).toBe(1);
    for (const line of diagnosticLines(DEFAULT_DB)) {
      expect(res.stderr).toContain(line);
    }
    expect(res.stderr).toMatch(/corrupt or not a SQLite database/);
    expect(res.stderr).toContain("docs/troubleshooting.md");
    expect(res.stderr).not.toMatch(/SqliteError/);
    expect(statSync(corruptPath).size).toBe(4096);
  });
});
