/**
 * INT-CI-5: regression tests for the sqlite-binding gate's declared-but-absent
 * fail-loud branch.
 *
 * scripts/postinstall-lint-deps.sh (check_sqlite_binding) has two branches for
 * a missing node_modules/better-sqlite3:
 *
 *   - FAIL-LOUD: package.json DECLARES better-sqlite3 but it is absent from
 *     node_modules -> prints the FAIL remedy and returns 1 (fixed in INT-CI-4;
 *     previously a silent skip). This file pins that behavior.
 *   - SKIP: package.json does not declare better-sqlite3 -> prints a skip line
 *     and returns 0.
 *
 * The gate derives PKG_ROOT from its own filesystem location (SCRIPT_DIR/..),
 * so each test builds a fixture tree containing a BYTE COPY of the repo script
 * at <fixture>/scripts/postinstall-lint-deps.sh with the fixture's own
 * package.json beside it, then runs the copy with --sqlite-binding-only. The
 * gate logic is never reimplemented in this test, and the repo's real
 * node_modules is never consulted: a fresh clone and CI behave identically.
 */

import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const SCRIPT_REL = join("scripts", "postinstall-lint-deps.sh");

/** Exact first line of the fail-loud remedy (scripts/postinstall-lint-deps.sh:34). */
const FAIL_MESSAGE =
  "FAIL: package.json declares better-sqlite3 but it is absent from node_modules.";

/** Substring of the skip line (scripts/postinstall-lint-deps.sh:42). */
const SKIP_MESSAGE = "skipping the native binding check";

/** Repo convention (vitest.config.ts GAP-003): sync spawns always get a timeout. */
const SPAWN_TIMEOUT_MS = 15_000;

let fixtureRoot: string;

beforeEach(() => {
  // os.tmpdir() resolves to the project-local .tmp/ (vitest.config.ts CI-002,
  // tests/setup-tmpdir.ts); mkdtempSync gives each test a unique directory so
  // parallel runs cannot collide.
  fixtureRoot = mkdtempSync(join(tmpdir(), "sqlite-binding-gate-"));
  mkdirSync(join(fixtureRoot, "scripts"), { recursive: true });
  // Byte copy of the real gate script into the fixture tree — the script
  // locates its package root from its own path, so the fixture must contain
  // the script itself, not a reference to the repo's copy.
  copyFileSync(join(repoRoot, SCRIPT_REL), join(fixtureRoot, SCRIPT_REL));
});

afterEach(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

function writePackageJson(pkg: Record<string, unknown>): void {
  writeFileSync(join(fixtureRoot, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
}

interface GateResult {
  status: number | null;
  output: string;
}

function runGate(): GateResult {
  // cwd is the fixture itself: nothing in the repo tree may influence the run.
  const result = spawnSync(
    "bash",
    [join(fixtureRoot, SCRIPT_REL), "--sqlite-binding-only"],
    { cwd: fixtureRoot, encoding: "utf8", timeout: SPAWN_TIMEOUT_MS },
  );
  expect(result.error).toBeUndefined();
  expect(result.signal).toBeNull();
  return {
    status: result.status,
    output: (result.stdout ?? "") + (result.stderr ?? ""),
  };
}

describe("sqlite-binding gate: declared-but-absent fail-loud branch", () => {
  test("declares better-sqlite3 but absent from node_modules -> exit 1 with the FAIL remedy", () => {
    writePackageJson({
      name: "sqlite-binding-gate-fixture",
      version: "1.0.0",
      dependencies: { "better-sqlite3": "^12.0.0" },
    });
    // No node_modules is created anywhere in the fixture: the declared
    // dependency is absent, which is exactly the INT-CI-4 fail-loud case.

    const { status, output } = runGate();

    expect(status).toBe(1);
    expect(output).toContain(FAIL_MESSAGE);
  });

  test("does not declare better-sqlite3 -> exit 0 with the skip line", () => {
    writePackageJson({
      name: "sqlite-binding-gate-fixture",
      version: "1.0.0",
      dependencies: { typescript: "^7.0.0" },
    });

    const { status, output } = runGate();

    expect(status).toBe(0);
    expect(output).toContain(SKIP_MESSAGE);
  });
});
