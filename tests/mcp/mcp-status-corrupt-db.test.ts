/**
 * QA-SPECLANG-5-R6: `speclang mcp status` must not answer for state it cannot read.
 *
 * Repro that motivated this file (measured at ef9b12b9):
 *
 *   T=$(mktemp -d); mkdir -p "$T/.speclang"
 *   head -c 4096 /dev/urandom > "$T/.speclang/speclang.db"
 *   node bin/speclang mcp status -d "$T"
 *   -> "📊 SpecLang MCP Status / Project: ... / Status: Not running"   EXIT=0
 *
 * The action read only `.speclang/mcp.pid` and `.speclang/mcp.port`, so a state
 * database that is not a SQLite database at all was reported as a confident
 * "Not running" with exit 0 — precisely the silent lie the DB layer stopped
 * telling one layer down (tests/db/corrupt-state-db.test.ts). A user would read
 * "nothing is running" and never learn the project's state is unreadable.
 *
 * The probe must cover the same file `mcp start` hands the server
 * (`<project>/.speclang/speclang.db`; the MCP server takes no SPECLANG_DB
 * override) and keep today's behaviour for the states that are NOT corruption:
 * a healthy DB, a stopped server (pid file absent) and no DB at all still exit 0
 * with the normal report. `mcp status` is read-only, so it must never create the
 * state database just by looking at it.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { createDatabase, stateDatabaseCorruptionMessage } from "../../src/db/index.js";

const REPO_ROOT = process.cwd();
const CLI = join(REPO_ROOT, "bin", "speclang");

/** Write a file that exists but is not a SQLite database (the reported repro). */
function writeCorruptDb(dbPath: string): void {
  writeFileSync(dbPath, randomBytes(4096));
}

/** A valid, migrated state database — the healthy case. */
function writeValidDb(dbPath: string): void {
  const db = createDatabase({ path: dbPath });
  db.close();
}

/** Run `speclang mcp status --dir <projectDir>` exactly as an operator would. */
function runMcpStatus(projectDir: string) {
  return spawnSync(process.execPath, [CLI, "mcp", "status", "-d", projectDir], {
    cwd: REPO_ROOT,
    encoding: "utf-8",
    env: { ...process.env },
    timeout: 30_000,
  });
}

/** The lines of the shared diagnostic every surface must print verbatim. */
function diagnosticLines(dbPath: string): string[] {
  return stateDatabaseCorruptionMessage(dbPath)
    .split("\n")
    .filter((line) => line.trim().length > 0);
}

describe("speclang mcp status against the state DB (QA-SPECLANG-5-R6)", () => {
  let dir: string;

  beforeEach(() => {
    mkdirSync(join(REPO_ROOT, ".tmp"), { recursive: true });
    dir = mkdtempSync(join(REPO_ROOT, ".tmp", "mcp-status-db-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  // (a) corrupt file -------------------------------------------------------
  it("exits non-zero with the corrupt-DB diagnostic instead of reporting \"Not running\"", () => {
    const projectDir = join(dir, "corrupt-project");
    mkdirSync(join(projectDir, ".speclang"), { recursive: true });
    const corruptPath = join(projectDir, ".speclang", "speclang.db");
    writeCorruptDb(corruptPath);

    const res = runMcpStatus(projectDir);

    expect(res.status).toBe(1);
    // The same wording the library and `speclang status` print, line for line.
    for (const line of diagnosticLines(corruptPath)) {
      expect(res.stderr).toContain(line);
    }
    expect(res.stderr).toContain(corruptPath);
    expect(res.stderr).toMatch(/not a SQLite database/i);
    expect(res.stderr).toContain(`rm -f ${corruptPath}`);
    // A failure must not also print a status block — that is the silent lie.
    expect(res.stdout).not.toContain("SpecLang MCP Status");
    expect(res.stdout).not.toContain("Not running");
    // Diagnose, do not silently delete the operator's evidence.
    expect(statSync(corruptPath).size).toBe(4096);
  });

  it("still refuses when a pid file claims the server is up", () => {
    // The probe must run BEFORE the pid/port report: a stale pid file used to be
    // enough to answer "Running (PID …)" over an unreadable state DB.
    const projectDir = join(dir, "corrupt-with-pid");
    mkdirSync(join(projectDir, ".speclang"), { recursive: true });
    writeCorruptDb(join(projectDir, ".speclang", "speclang.db"));
    writeFileSync(join(projectDir, ".speclang", "mcp.pid"), String(process.pid));
    writeFileSync(join(projectDir, ".speclang", "mcp.port"), "7777");

    const res = runMcpStatus(projectDir);

    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/corrupt or not a SQLite database/i);
    expect(res.stdout).not.toContain("Running (PID");
    expect(res.stdout).not.toContain("SpecLang MCP Status");
  });

  // (b) healthy but stopped ------------------------------------------------
  it("reports a healthy, stopped server exactly as before", () => {
    const projectDir = join(dir, "stopped-project");
    mkdirSync(join(projectDir, ".speclang"), { recursive: true });
    writeValidDb(join(projectDir, ".speclang", "speclang.db"));

    const res = runMcpStatus(projectDir);

    expect(res.status).toBe(0);
    expect(res.stdout).toContain("📊 SpecLang MCP Status");
    expect(res.stdout).toContain(`Project: ${projectDir}`);
    expect(res.stdout).toContain("Status: Not running");
    expect(res.stderr).not.toMatch(/corrupt/i);
  });

  // (c) absent DB ----------------------------------------------------------
  it("reports a project with no state database at all, without creating one", () => {
    const projectDir = join(dir, "fresh-project");
    mkdirSync(projectDir, { recursive: true });

    const res = runMcpStatus(projectDir);

    expect(res.status).toBe(0);
    expect(res.stdout).toContain("Status: Not running");
    expect(res.stderr).not.toMatch(/corrupt/i);
    // A read-only report must not bring state into existence.
    expect(existsSync(join(projectDir, ".speclang", "speclang.db"))).toBe(false);
  });

  // (d) healthy and running ------------------------------------------------
  it("still reports a running server for a healthy project", () => {
    const projectDir = join(dir, "running-project");
    mkdirSync(join(projectDir, ".speclang"), { recursive: true });
    writeValidDb(join(projectDir, ".speclang", "speclang.db"));
    writeFileSync(join(projectDir, ".speclang", "mcp.pid"), String(process.pid));
    writeFileSync(join(projectDir, ".speclang", "mcp.port"), "7777");

    const res = runMcpStatus(projectDir);

    expect(res.status).toBe(0);
    expect(res.stdout).toContain(`Status: Running (PID ${process.pid})`);
    expect(res.stdout).toContain("Port: 7777");
    expect(res.stderr).not.toMatch(/corrupt/i);
  });
});
