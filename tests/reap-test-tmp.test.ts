/**
 * QA-SPECLANG-012: the `.tmp` test-scratch reaper.
 *
 * `npm test` runs vitest with `TMPDIR=$PWD/.tmp` (vitest.config.ts, CI-002), so every
 * `mkdtempSync(os.tmpdir())` in the suite leaves a session dir behind, and `.tmp/` is
 * gitignored — nothing in the repo ever deleted it. `scripts/reap-test-tmp.mjs` is the
 * bounded reaper: remove direct children older than 24h, never touch anything modified
 * in the last 2h (so a live run is not a casualty).
 *
 * These tests drive the REAL CLI (spawnSync of the script, like
 * tests/specdir-compiled-parity.test.ts) against a fixture root, and pin the mtime
 * semantics with `fs.utimes` instead of sleeping, so nothing depends on the clock
 * moving while the test runs.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  lutimesSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO_ROOT = process.cwd();
const SCRIPT = join(REPO_ROOT, "scripts", "reap-test-tmp.mjs");
const HOUR_S = 60 * 60;

/** One machine-readable line on stdout, e.g. `reap-test-tmp: root=… removed=2 …`. */
interface ReapLine {
  root: string;
  removed: number;
  skipped_recent: number;
  residual: number;
  bytes_freed: number;
  dry_run: boolean;
}

function runReaper(args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

/** Parse the single stdout log line; throws when the shape is wrong (that is the assertion). */
function parseReapLine(stdout: string): ReapLine {
  const lines = stdout.split("\n").filter((line) => line.trim() !== "");
  expect(lines).toHaveLength(1);
  const line = lines[0];
  const match = line.match(
    /^reap-test-tmp: root=(\S+) removed=(\d+) skipped_recent=(\d+) residual=(\d+) bytes_freed=(\d+) dry_run=(true|false)$/,
  );
  expect(match).not.toBeNull();
  const [, root, removed, skippedRecent, residual, bytesFreed, dryRun] = match as RegExpMatchArray;
  return {
    root,
    removed: Number(removed),
    skipped_recent: Number(skippedRecent),
    residual: Number(residual),
    bytes_freed: Number(bytesFreed),
    dry_run: dryRun === "true",
  };
}

/** Count immediate child dirs + the root itself: `find <root> -maxdepth 1 -type d | wc -l`. */
function countLikeFind(root: string): number {
  const output = spawnSync("sh", ["-c", `find ${JSON.stringify(root)} -maxdepth 1 -type d | wc -l`], {
    encoding: "utf8",
  });
  return Number((output.stdout ?? "0").trim());
}

function backdate(path: string, hoursAgo: number): void {
  const seconds = Math.floor(Date.now() / 1000) - Math.round(hoursAgo * HOUR_S);
  utimesSync(path, seconds, seconds);
}

describe("scripts/reap-test-tmp.mjs — bounded .tmp reaper (QA-SPECLANG-012)", () => {
  let root: string;

  beforeEach(() => {
    // Fixture lives in the OS temp dir (which the suite redirects to .tmp/, CI-002).
    root = mkdtempSync(join(tmpdir(), "reap-test-tmp-"));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("removes old dirs and old files, keeps a recently-touched dir", () => {
    const oldDir = join(root, "session-old");
    const oldFile = join(root, "session-old.db-wal");
    const recentDir = join(root, "session-active");

    mkdirSync(oldDir);
    writeFileSync(join(oldDir, "payload.bin"), Buffer.alloc(2048, 7));
    writeFileSync(oldFile, Buffer.alloc(1024, 3));
    mkdirSync(recentDir);
    writeFileSync(join(recentDir, "in-flight.txt"), "still running");

    backdate(oldDir, 48);
    backdate(oldFile, 48);
    // recentDir keeps "now" as its mtime — the active-run window.

    const before = countLikeFind(root);
    const { status, stdout, stderr } = runReaper(["--root", root]);
    const line = parseReapLine(stdout);

    expect(status, stderr).toBe(0);
    expect(existsSync(oldDir)).toBe(false);
    expect(existsSync(oldFile)).toBe(false);
    expect(existsSync(recentDir)).toBe(true);
    expect(readFileSync(join(recentDir, "in-flight.txt"), "utf8")).toBe("still running");

    expect(line.dry_run).toBe(false);
    expect(line.removed).toBe(2);
    expect(line.skipped_recent).toBe(1);
    expect(line.bytes_freed).toBeGreaterThanOrEqual(2048 + 1024);
    expect(line.root).toBe(root);
    // Residual is the same number `find <root> -maxdepth 1 -type d | wc -l` prints.
    expect(line.residual).toBe(countLikeFind(root));
    expect(line.residual).toBe(before - 1);
  });

  it("deletes nothing under --dry-run but reports what it would remove", () => {
    const oldDir = join(root, "session-old");
    const oldFile = join(root, "session-old.db-wal");
    mkdirSync(oldDir);
    writeFileSync(join(oldDir, "payload.bin"), Buffer.alloc(512, 1));
    writeFileSync(oldFile, "wal");
    backdate(oldDir, 48);
    backdate(oldFile, 48);

    const { status, stdout, stderr } = runReaper(["--root", root, "--dry-run"]);
    const line = parseReapLine(stdout);

    expect(status, stderr).toBe(0);
    expect(existsSync(oldDir)).toBe(true);
    expect(existsSync(oldFile)).toBe(true);
    expect(line.dry_run).toBe(true);
    expect(line.removed).toBe(2);
    expect(line.bytes_freed).toBeGreaterThan(0);
  });

  it("treats a missing root as a clean no-op (a fresh worktree has no .tmp)", () => {
    const missing = join(root, "does-not-exist");

    const { status, stdout, stderr } = runReaper(["--root", missing, "--quiet"]);
    const line = parseReapLine(stdout);

    expect(status, stderr).toBe(0);
    expect(stderr).toBe("");
    expect(line.removed).toBe(0);
    expect(line.residual).toBe(0);
    expect(line.dry_run).toBe(false);
    expect(existsSync(missing)).toBe(false);
  });

  it("unlinks an old symlink without touching the directory it points at", () => {
    const outside = join(root, "outside-the-root");
    const linkRoot = join(root, "scratch");
    mkdirSync(outside);
    mkdirSync(linkRoot);
    writeFileSync(join(outside, "must-survive.txt"), "keep me");
    const link = join(linkRoot, "session-link");
    symlinkSync(outside, link);
    // lutimesSync, not utimesSync: utimes() follows the link, which would backdate
    // the TARGET directory and leave the link itself looking freshly created.
    const seconds = Math.floor(Date.now() / 1000) - 48 * HOUR_S;
    lutimesSync(link, seconds, seconds);

    const { status, stdout, stderr } = runReaper(["--root", linkRoot]);
    const line = parseReapLine(stdout);

    expect(status, stderr).toBe(0);
    expect(existsSync(link)).toBe(false);
    expect(existsSync(outside)).toBe(true);
    expect(readFileSync(join(outside, "must-survive.txt"), "utf8")).toBe("keep me");
    expect(line.removed).toBe(1);
  });

  it("leaves the 2h-24h window alone and honours --max-age-hours/--min-age-hours", () => {
    const threeHoursOld = join(root, "three-hours");
    const fiveDaysOld = join(root, "five-days");
    mkdirSync(threeHoursOld);
    mkdirSync(fiveDaysOld);
    backdate(threeHoursOld, 3);
    backdate(fiveDaysOld, 5 * 24);

    const defaultRun = parseReapLine(runReaper(["--root", root]).stdout);
    expect(defaultRun.removed).toBe(1);
    expect(existsSync(threeHoursOld)).toBe(true);
    expect(existsSync(fiveDaysOld)).toBe(false);

    // Widening the recent window protects the 3h dir; the 5-day dir is already gone.
    mkdirSync(fiveDaysOld);
    backdate(fiveDaysOld, 5 * 24);
    const widened = parseReapLine(
      runReaper(["--root", root, "--max-age-hours", "1", "--min-age-hours", "4"]).stdout,
    );
    expect(widened.skipped_recent).toBe(1);
    expect(widened.removed).toBe(1);
    expect(existsSync(threeHoursOld)).toBe(true);
  });
});
