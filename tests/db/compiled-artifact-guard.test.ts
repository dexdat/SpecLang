/**
 * QA-SPECLANG-5-R6: tracked compiled artifacts under specs/ must not re-open the
 * state database past the guarded helper.
 *
 * Why this test exists: QA-SPECLANG-5 / R2 moved every RUNTIME opener onto
 * openStateDatabase() (src/db/index.ts), so a corrupt `.speclang/speclang.db`
 * raises the shared CorruptStateDatabaseError with a path and a remedy. But the
 * compiled artifact checked in beside the ralph-loop spec —
 * `specs/ralph-loop.spec.dir/src/controller.js` — was generated BEFORE that
 * change and still read:
 *
 *   specs/ralph-loop.spec.dir/src/controller.js:34
 *       const db = new Database(dbPath);
 *
 * while its `.ts` source beside it had already been fixed. Nothing catches that
 * drift: `tsconfig.json` `include` does not cover `specs/ralph-loop.spec.dir`,
 * so no build regenerates the file, and nothing imports it, so no test ever
 * loads it. A future consumer following the artifact would inherit the bypass —
 * and the same silent failure the guard exists to prevent.
 *
 * The rule is a grep on purpose (it is exactly the grep that found the defect):
 * any TRACKED `specs/**\/src/*.js` that constructs the database directly is a
 * bypass of the single guarded open path. It cannot go stale behind a syntax
 * shape the AST would normalize away, and it needs no build.
 *
 * Scope note, measured at ef9b12b9: this literal grep catches the
 * `new Database(...)` spelling only. Artifacts compiled from
 * `import Database from 'better-sqlite3'` spell the same construction
 * `new better_sqlite3_1.default(...)` and evade it — six such tracked artifacts
 * exist today (specs/implementation.spec.dir/src/{speclang-db,ralph-loop,
 * speclang-mcp,validation-system}.js, specs/implementation.spec.dir/src/db/
 * speclang-db.js, specs/roadmap.spec.dir/poc.spec.dir/src/db/poc-db.js). They
 * are out of this task's file boundary; widening this pattern must happen
 * together with deleting/regenerating them, or the suite goes red on files this
 * task may not touch.
 */

import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = process.cwd();

/** Every tracked compiled artifact that lives in a spec's `src/` directory. */
const TRACKED_SPEC_ARTIFACT = /^specs\/.+\/src\/.+\.js$/;

/**
 * The single guarded open path and the spec projection it is generated from.
 * Their COMPILED form is allowed to name the constructor — that is the whole
 * point of the helper (tests/db/corrupt-state-db.test.ts pins its behaviour).
 */
const GUARDED_HELPER_ARTIFACTS = new Set([
  "src/db/index.js",
  "specs/sqlite.spec.dir/src/index.js",
]);

/** A direct better-sqlite3 construction: `new Database(path)`. */
const BARE_DATABASE_CONSTRUCTOR = /\bnew\s+Database\s*\(/;

interface BareConstructorHit {
  path: string;
  line: number;
  text: string;
}

/**
 * Line-oriented grep for a direct database construction.
 *
 * Pure comment lines are skipped so this guard can be documented in prose
 * (including in generated files) without tripping itself; an inline comment
 * after code still matches, because a grep should not try to parse JavaScript.
 */
function findBareDatabaseConstructors(path: string, content: string): BareConstructorHit[] {
  const hits: BareConstructorHit[] = [];
  content.split("\n").forEach((raw, index) => {
    const trimmed = raw.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) return;
    if (BARE_DATABASE_CONSTRUCTOR.test(raw)) {
      hits.push({ path, line: index + 1, text: trimmed });
    }
  });
  return hits;
}

/** The repository's tracked files under `spec`, as git reports them. */
function trackedFiles(specPath: string): string[] {
  const res = spawnSync("git", ["ls-files", "-z", "--", specPath], {
    cwd: REPO_ROOT,
    encoding: "utf-8",
    maxBuffer: 64 * 1024 * 1024,
  });
  // "trusted because it was tracked" is the premise: if git cannot answer, this
  // guard has no subject, so it fails loudly instead of passing vacuously.
  if (res.error) {
    throw new Error(`git ls-files could not run: ${res.error.message}`);
  }
  if (res.status !== 0) {
    throw new Error(`git ls-files exited ${res.status}: ${res.stderr}`);
  }
  return res.stdout.split("\0").filter((p) => p.length > 0);
}

function trackedSpecArtifacts(): string[] {
  return trackedFiles("specs").filter((p) => TRACKED_SPEC_ARTIFACT.test(p));
}

describe("compiled-artifact guard for the state-DB opener (QA-SPECLANG-5-R6)", () => {
  it("actually scans a real set of tracked specs artifacts", () => {
    const artifacts = trackedSpecArtifacts();

    // A guard over an empty (or tiny) list would pass forever while the specs
    // tree it is supposed to police went unscanned.
    expect(artifacts.length).toBeGreaterThan(50);
    // git ls-files returns repository-relative paths; the scan keys on those.
    for (const artifact of artifacts) {
      expect(artifact.startsWith("specs/")).toBe(true);
      expect(artifact.endsWith(".js")).toBe(true);
    }
  });

  it("no tracked specs/**/src/*.js opens the state DB outside the guarded helper", () => {
    const artifacts = trackedSpecArtifacts();
    const hits: BareConstructorHit[] = [];
    const unreadable: string[] = [];

    for (const artifact of artifacts) {
      if (GUARDED_HELPER_ARTIFACTS.has(artifact)) continue;
      const absolute = join(REPO_ROOT, artifact);
      if (!existsSync(absolute)) {
        // Tracked but absent from the working tree: the guard cannot read what
        // it is supposed to inspect, which is drift of the same class. Never
        // skipped silently — a guard that skips its subject always passes.
        unreadable.push(artifact);
        continue;
      }
      hits.push(...findBareDatabaseConstructors(artifact, readFileSync(absolute, "utf-8")));
    }

    expect(unreadable).toEqual([]);

    if (hits.length > 0) {
      throw new Error(
        [
          "Tracked compiled artifacts under specs/**/src construct the state database directly,",
          "bypassing the guarded open path (src/db/index.ts -> openStateDatabase /",
          "CorruptStateDatabaseError). A corrupt .speclang/speclang.db would surface a bare",
          "SqliteError, or none at all, from these files:",
          ...hits.map((hit) => `  ${hit.path}:${hit.line}  ${hit.text}`),
          "",
          "Fix: delete the stale artifact (the .ts beside it is the source, and tsconfig",
          "`include` does not cover every spec dir, so nothing regenerates it) or regenerate it",
          "through the guarded opener.",
        ].join("\n")
      );
    }
  });

  it("still catches the pre-fix artifact shape (positive control)", () => {
    // Verbatim shape of specs/ralph-loop.spec.dir/src/controller.js:34 at ef9b12b9,
    // the file this guard was written for. If the detector cannot fail on this,
    // the green above means nothing.
    const preFixArtifact = [
      '"use strict";',
      "const DatabaseModule = require('better-sqlite3');",
      "const Database = DatabaseModule.default || DatabaseModule;",
      "    static async create(dbPath = '.speclang/speclang.db') {",
      "        const db = new Database(dbPath);",
      "        return new LoopController(db);",
      "    }",
    ].join("\n");

    expect(findBareDatabaseConstructors("specs/x.spec.dir/src/controller.js", preFixArtifact)).toEqual([
      {
        path: "specs/x.spec.dir/src/controller.js",
        line: 5,
        text: "const db = new Database(dbPath);",
      },
    ]);
  });

  it("does not flag the guarded opener or prose in comments (negative control)", () => {
    const guardedArtifact = [
      "// Never `new Database(path)` here: the guard lives in src/db/index.js",
      "const index_js_1 = require('../../../src/db/index.js');",
      "const db = index_js_1.openStateDatabase(dbPath);",
    ].join("\n");

    expect(findBareDatabaseConstructors("specs/x.spec.dir/src/ok.js", guardedArtifact)).toEqual([]);
  });
});
