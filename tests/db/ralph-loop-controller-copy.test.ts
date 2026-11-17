/**
 * GAP-005: exactly one `LoopController`, and it is the one that can exit.
 *
 * The repository carried a SECOND `LoopController` — an unreachable copy under
 * the `src/ralph-loop/` directory module (a symlink projection of
 * `specs/ralph-loop.spec.dir/src/controller.ts`). It reproduced the exact defect
 * class GAP-004 fixed in the live implementation: `start()` set `isRunning`
 * and nothing ever reset it, no signal listener was installed, and nothing
 * looked at the launcher — so once entered, only an uncaught error or an
 * external SIGKILL got out. That is the shape that left ~29 ralph-loop
 * processes reparented to systemd --user, polling forever at 0.0% CPU
 * (GAP-004 measured ~1.6 GB RSS across 7 trees).
 *
 * Nothing imported the copy, so it could not be exercised — which is precisely
 * why it was dangerous: a future import would have reintroduced an
 * exit-less loop silently, with no failing test to notice. GAP-005 removed it
 * instead of fixing it a second time; two maintained copies of one controller is
 * the duplication that produced the drift in the first place.
 *
 * This guard keeps the removal from being undone by a copy-paste:
 *   1. neither the spec-side source nor its src/ projection exists again;
 *   2. no file under src/, bin/ or scripts/ imports the removed module;
 *   3. the ralph-loop barrel no longer re-exports `LoopController`;
 *   4. exactly ONE `LoopController` is declared under src/, and that one still
 *      carries the GAP-004 exit path (signal handler, launcher liveness, idle
 *      bound) — the reason the surviving copy is the right copy.
 *
 * The walk follows symlinks on purpose: the repo projects most of `src/` from
 * `specs/*.spec.dir/src/` with tracked symlinks (`git ls-files -s src/ralph-loop`
 * shows mode 120000), and `src/ralph-loop.ts` itself is one.
 *
 * The removed module path is assembled at runtime rather than written out, so
 * this file is not itself a hit for the acceptance grep that keys on that path.
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import type { Dirent } from "node:fs";
import { join, relative } from "node:path";

const REPO_ROOT = process.cwd();

/** The removed module path: `<dir>/<module>`, assembled so it is not a literal here. */
const REMOVED_MODULE_PATH = ["ralph-loop", "controller"].join("/");

/** The spec-side source that the removed `src/` projection pointed at. */
const SPEC_SIDE_CONTROLLER = join(REPO_ROOT, "specs", "ralph-loop.spec.dir", "src", "controller.ts");
/** The tracked symlink that made the copy look importable from `src/`. */
const SRC_SIDE_CONTROLLER = join(REPO_ROOT, "src", REMOVED_MODULE_PATH + ".ts");
/** The barrel that used to re-export the copy. */
const BARREL = join(REPO_ROOT, "specs", "ralph-loop.spec.dir", "src", "index.ts");
/** The one surviving controller — the module GAP-004 gave an exit path. */
const LIVE_CONTROLLER = "src/ralph-loop.ts";

const SOURCE_DIRS = ["src", "bin", "scripts"];
const SOURCE_EXT = /\.(ts|tsx|js|mjs|cjs)$/;

/**
 * Every source-like file under `dirs`, following symlinks (the repo projects
 * spec sources into `src/` that way). Directory symlinks are followed through a
 * visited-realpath set so a projection cycle cannot hang the suite.
 */
function sourceFiles(dirs: string[]): string[] {
  const out: string[] = [];
  const visited = new Set<string>();

  const walk = (dir: string): void => {
    let real: string;
    try {
      real = realpathSync(dir);
    } catch {
      return;
    }
    if (visited.has(real)) return;
    visited.add(real);

    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      const abs = join(dir, entry.name);

      let isDir = entry.isDirectory();
      if (entry.isSymbolicLink()) {
        try {
          isDir = statSync(abs).isDirectory();
        } catch {
          // Broken link: unreadable, so it cannot carry the removed import.
          continue;
        }
      }

      if (isDir) {
        walk(abs);
        continue;
      }
      if (SOURCE_EXT.test(entry.name)) out.push(abs);
    }
  };

  for (const dir of dirs) walk(join(REPO_ROOT, dir));
  return out;
}

/**
 * Module-specifier forms that would make the removed copy importable again.
 *
 * A bare substring match is wrong here: the LIVE controller carries a
 * provenance comment naming its spec block, which is prose, not an import.
 * Matching only the specifier forms keeps the guard strict about real
 * references while ignoring that comment.
 */
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const REMOVED = escapeRegExp(REMOVED_MODULE_PATH);
const REMOVED_MODULE_SPECIFIER = [
  new RegExp(`\\bfrom\\s*["'][^"']*${REMOVED}[^"']*["']`),
  new RegExp(`\\brequire\\s*\\(\\s*["'][^"']*${REMOVED}[^"']*["']\\s*\\)`),
  new RegExp(`\\bimport\\s*\\(\\s*["'][^"']*${REMOVED}[^"']*["']\\s*\\)`),
];

/** True when `content` imports the removed module by any supported spelling. */
function importsRemovedController(content: string): boolean {
  return REMOVED_MODULE_SPECIFIER.some((pattern) => pattern.test(content));
}

describe("GAP-005: the unreachable LoopController copy is gone", () => {
  it("removes both halves of the copy (spec-side source and its src/ projection)", () => {
    expect(existsSync(SPEC_SIDE_CONTROLLER)).toBe(false);
    expect(existsSync(SRC_SIDE_CONTROLLER)).toBe(false);
  });

  it("scans a real set of source files (the reference check is not vacuous)", () => {
    const files = sourceFiles(SOURCE_DIRS);

    // A guard over a handful of files would pass forever while the trees it is
    // supposed to police went unscanned.
    expect(files.length).toBeGreaterThan(50);
    for (const file of files) {
      expect(file.startsWith(REPO_ROOT)).toBe(true);
    }
    // The live controller is reached THROUGH a symlink; if the walk stopped at
    // symlinks this file would be missing and check 4 would have no subject.
    expect(files.map((f) => relative(REPO_ROOT, f))).toContain(LIVE_CONTROLLER);
  });

  it("no source file imports the removed module path", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles(SOURCE_DIRS)) {
      if (importsRemovedController(readFileSync(file, "utf-8"))) {
        offenders.push(relative(REPO_ROOT, file));
      }
    }

    expect(offenders).toEqual([]);
  });

  it("still detects a reintroduced import (positive control)", () => {
    // If the detector cannot fire on the shape it is meant to catch, the green
    // above means nothing. Relative and src-prefixed spellings both count, with
    // and without a `.js` suffix (the projection was a `.ts` reached via `.js`).
    expect(importsRemovedController(`import { LoopController } from "./${REMOVED_MODULE_PATH}";`)).toBe(true);
    expect(importsRemovedController(`const m = require("../../src/${REMOVED_MODULE_PATH}.js");`)).toBe(true);
    expect(importsRemovedController(`await import("./${REMOVED_MODULE_PATH}.js");`)).toBe(true);
    // Provenance prose must NOT trip it — the live controller names its block.
    expect(importsRemovedController(`// Block: implementation/${REMOVED_MODULE_PATH}`)).toBe(false);
    // And an anchored anchor: the bare word "controller" is not enough.
    expect(importsRemovedController('import { LoopController } from "./controller";')).toBe(false);
  });

  it("the ralph-loop barrel no longer re-exports LoopController", () => {
    expect(existsSync(BARREL)).toBe(true);
    const barrel = readFileSync(BARREL, "utf-8");

    // The exact export that dangled once the file was deleted.
    expect(barrel).not.toContain("from './controller'");
    // The barrel is still a barrel — it was NOT gutted to make the grep pass.
    expect(barrel).toContain("from './builder-agent'");
    expect(barrel).toContain("from './verifier-agent'");
    expect(barrel).toContain("from './types'");
  });

  it("exactly one LoopController is declared under src/, and it keeps the GAP-004 exit path", () => {
    const declaring = sourceFiles(["src"]).filter((file) =>
      /\bclass\s+LoopController\b/.test(readFileSync(file, "utf-8")),
    );

    expect(declaring.map((f) => relative(REPO_ROOT, f))).toEqual([LIVE_CONTROLLER]);

    // The surviving controller is the one with the three exit paths GAP-004
    // added; without them the single remaining copy would be the defect.
    const live = readFileSync(join(REPO_ROOT, LIVE_CONTROLLER), "utf-8");
    expect(live).toContain("SIGTERM");
    expect(live).toContain("isLauncherGone");
    expect(live).toContain("maxIdlePolls");
  });
});
