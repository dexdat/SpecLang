/**
 * QA-SPECLANG-010 criterion (2): the tracked compiled spec-dir layer
 * (`specs/**\/src/**\/*.js`) is a projection of its `.ts` sources, and a
 * guard-bearing module may not silently diverge from its source.
 *
 * Why this is a test and not only a script: the defect it pins was invisible for
 * as long as nobody loaded the artifact. `specs/sqlite.spec.dir/src/index.ts`
 * installs the corruption guard (`openStateDatabase` / `CorruptStateDatabaseError`
 * around better-sqlite3's lazy header read), while the tracked
 * `specs/sqlite.spec.dir/src/index.js` beside it predated the guard and still
 * opened the database directly — so any consumer following the artifact
 * inherited the bypass the guard exists to prevent. Nothing failed, because
 * nothing loaded it.
 *
 * The decision under test (recorded in docs/specdir-compiled-layer.md): the layer
 * is KEPT as a tracked projection, regenerated only from source
 * (`npm run regenerate:specdir`) and enforced by
 *   1. value-export parity for every guard-bearing module (this file, below),
 *   2. the relative-`require` audit (scripts/audit-specdir-requires.mjs).
 * Wholesale regeneration is NOT the decision: compiling the whole tree today
 * surfaces latent source bugs, so only guard-bearing modules are regenerated and
 * whole-layer freshness is reported (`npm run check:specdir-parity`) rather than
 * gated. `--strict-freshness` flips that report into a gate.
 */

import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import {
  GUARD_SYMBOLS,
  extractCjsExports,
  extractTsValueExports,
  guardBearingModules,
} from "../scripts/lib/specdir-compiled-layer.mjs";
import { compareModules } from "../scripts/check-specdir-parity.mjs";

const REPO_ROOT = process.cwd();
const requireCjs = createRequire(import.meta.url);

/** The module family the criterion names by hand. */
const SQLITE_INDEX_JS = "specs/sqlite.spec.dir/src/index.js";
const SQLITE_INDEX_TS = "specs/sqlite.spec.dir/src/index.ts";

/** Run a repo script, returning its exit status and combined output. */
function runScript(relativePath: string, args: string[]): { status: number | null; output: string } {
  const result = spawnSync(process.execPath, [join(REPO_ROOT, relativePath), ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  return { status: result.status, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

describe("compiled spec-dir layer — guard-bearing symbol parity (QA-SPECLANG-010)", () => {
  it("finds the guard-bearing modules from source rather than a hardcoded list", () => {
    const modules = guardBearingModules();
    // A vacuous set would make every assertion below pass while checking nothing.
    expect(modules.length).toBeGreaterThan(0);
    const compiled = modules.map((module) => module.js);
    expect(compiled).toContain(SQLITE_INDEX_JS);
    expect(GUARD_SYMBOLS).toContain("openStateDatabase");
    expect(GUARD_SYMBOLS).toContain("CorruptStateDatabaseError");
  });

  it("exports the same value symbols as its source for every guard-bearing module", () => {
    const drifted = guardBearingModules()
      .map((module) => ({
        js: module.js,
        missing: [...module.tsExports].filter((name) => !module.jsExports.has(name)),
        extra: [...module.jsExports].filter((name) => !module.tsExports.has(name)),
      }))
      .filter((row) => row.missing.length || row.extra.length);

    // Report the exact symbol gap rather than a bare boolean.
    expect(drifted).toEqual([]);
  });

  it("carries the whole corruption-guard surface in the tracked sqlite artifact", () => {
    const modules = guardBearingModules();
    const sqlite = modules.find((module) => module.js === SQLITE_INDEX_JS);
    expect(sqlite).toBeDefined();
    expect(sqlite!.source).toBe(SQLITE_INDEX_TS);
    for (const symbol of GUARD_SYMBOLS) {
      expect(sqlite!.jsExports.has(symbol), `${SQLITE_INDEX_JS} must export ${symbol}`).toBe(true);
    }
  });

  it("loads the guard symbols from the compiled artifact at runtime", () => {
    // The regression was a .js that a consumer could require while it lacked the
    // guard; assert the symbols are actually there when the file is loaded.
    const loaded = requireCjs(join(REPO_ROOT, SQLITE_INDEX_JS)) as Record<string, unknown>;
    expect(typeof loaded.openStateDatabase).toBe("function");
    expect(typeof loaded.withStateDatabase).toBe("function");
    expect(typeof loaded.CorruptStateDatabaseError).toBe("function");
    expect(typeof loaded.stateDatabaseCorruptionMessage).toBe("function");
    expect(loaded.STATE_DB_CORRUPT_CODE).toBe("STATE_DB_CORRUPT");
  });

  it("detects a compiled artifact that is missing its source's guard exports", () => {
    // Negative control: the comparison must be able to fail. This is the shape of
    // the original defect — the source declares the guard, the artifact does not.
    const source = `
      export const STATE_DB_CORRUPT_CODE = 'STATE_DB_CORRUPT';
      export class CorruptStateDatabaseError extends Error {}
      export function openStateDatabase(path: string) { return path; }
    `;
    const staleArtifact = `
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.createDatabase = createDatabase;
      function createDatabase() { return null; }
    `;

    const sourceSymbols = extractTsValueExports(source);
    const artifactSymbols = extractCjsExports(staleArtifact);
    const missing = [...sourceSymbols].filter((name) => !artifactSymbols.has(name));

    expect(sourceSymbols.size).toBeGreaterThanOrEqual(3);
    expect(artifactSymbols.has("createDatabase")).toBe(true);
    expect(missing.sort()).toEqual([
      "CorruptStateDatabaseError",
      "STATE_DB_CORRUPT_CODE",
      "openStateDatabase",
    ]);
  });
});

describe("compiled spec-dir layer — enforcement runs (QA-SPECLANG-010)", () => {
  it("passes the guard-parity gate and reports whole-layer freshness without gating it", () => {
    // The gate is guard-module symbol parity; freshness is a report, because the
    // layer is a partial projection whose committed artifacts predate their
    // sources in places (see the decision record). Assert both halves so the
    // report cannot silently disappear either.
    const { status, output } = runScript("scripts/check-specdir-parity.mjs", ["--skip-freshness"]);
    expect(output).toMatch(/1\/1 guard modules match/);
    expect(output).toMatch(/freshness \(report only\): in sync/);
    expect(status).toBe(0);
  }, 120_000);

  it("fails the gate when a guard-bearing artifact loses a source export", () => {
    // Negative control on the exact defect shape: the source declares the guard,
    // the artifact does not. `compareModules` is the comparison the CLI exits on,
    // so a drift here is a red gate there.
    const { failures, rows } = compareModules([
      {
        js: "specs/demo.spec.dir/src/index.js",
        source: "specs/demo.spec.dir/src/index.ts",
        tsExports: new Set(["openStateDatabase", "CorruptStateDatabaseError", "createDatabase"]),
        jsExports: new Set(["createDatabase"]),
      },
      {
        js: "specs/demo.spec.dir/src/other.js",
        source: "specs/demo.spec.dir/src/other.ts",
        tsExports: new Set(["noop"]),
        jsExports: new Set(["noop"]),
      },
    ]);
    expect(failures).toBe(1);
    expect(rows[0].ok).toBe(false);
    expect(rows[0].missing.sort()).toEqual(["CorruptStateDatabaseError", "openStateDatabase"]);
    expect(rows[1].ok).toBe(true);
  });

  it("resolves every relative require in the layer, or records an accepted exception", () => {
    const { status, output } = runScript("scripts/audit-specdir-requires.mjs", []);
    expect(status).toBe(0);
    expect(output).toMatch(/0 failing, 0 stale baseline entries/);
  });

  it("audit fails on a tree with a require that resolves to nothing", () => {
    // Same proof as the negative control above, one level up: point the audit at a
    // scratch git tree whose compiled module requires a file that does not exist.
    const scratch = mkdtempSync(join(REPO_ROOT, ".tmp", "specdir-audit-"));
    try {
      mkdirSync(join(scratch, "specs", "demo.spec.dir", "src"), { recursive: true });
      writeFileSync(
        join(scratch, "specs", "demo.spec.dir", "src", "index.js"),
        '"use strict";\nconst missing = require("./gone.js");\nmodule.exports = { missing };\n',
      );
      for (const args of [["init", "-q"], ["add", "specs"]]) {
        const result = spawnSync("git", ["-C", scratch, ...args], { encoding: "utf8" });
        expect(result.status, `git ${args.join(" ")}: ${result.stderr}`).toBe(0);
      }

      const { status, output } = runScript("scripts/audit-specdir-requires.mjs", ["--root", scratch]);
      expect(output).toMatch(/UNRESOLVED specs\/demo\.spec\.dir\/src\/index\.js:\d+ {2}\.\/gone\.js/);
      expect(status).toBe(1);
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  });
});
