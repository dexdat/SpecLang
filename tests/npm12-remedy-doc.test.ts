/**
 * DF-SPECLANG-019: text-parity guard for the npm >= 12 `allowScripts` remedy.
 *
 * The remedy is PRINTED by scripts/postinstall-lint-deps.sh, DOCUMENTED in
 * README.md and VERIFIED in docs/npm12-allowscripts-probe.md (against a real
 * npm 12.2.2). This test is a pure text guard: it asserts the three surfaces
 * still agree on the command strings, so a future edit to one of them cannot
 * silently leave the others telling users something different.
 *
 * It never executes npm and does no I/O beyond three small file reads.
 */

import { describe, test, expect } from "vitest";
import { readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const read = (relPath: string): string =>
  readFileSync(join(repoRoot, relPath), "utf8");

const SCRIPT = "scripts/postinstall-lint-deps.sh";
const README = "README.md";
const PROBE_DOC = "docs/npm12-allowscripts-probe.md";

/**
 * The exact command strings the printed remedy is built from. Each one must
 * appear in the script, the README and the probe transcript.
 */
const REMEDY_COMMANDS = [
  "npm install-scripts approve --no-allow-scripts-pin better-sqlite3",
  "npm rebuild better-sqlite3",
  "npm run check:sqlite-binding",
];

/** The approval JSON as the script prints it (escaped for its `echo` lines). */
const PRINTED_APPROVAL_JSON = String.raw`\"allowScripts\": { \"better-sqlite3\": true }`;

describe("npm >= 12 allowScripts remedy: script/README/probe parity", () => {
  const script = read(SCRIPT);
  const readme = read(README);
  const probeDoc = read(PROBE_DOC);

  test("scripts/postinstall-lint-deps.sh still prints the remedy commands", () => {
    // Guard the branch itself: the remedy only prints for npm >= 12.
    expect(script).toContain("-ge 12");
    for (const command of REMEDY_COMMANDS) {
      expect(script).toContain(command);
    }
  });

  test("README.md documents the same remedy commands", () => {
    for (const command of REMEDY_COMMANDS) {
      expect(readme).toContain(command);
    }
  });

  test("the probe transcript records the same remedy commands", () => {
    for (const command of REMEDY_COMMANDS) {
      expect(probeDoc).toContain(command);
    }
  });

  test("the script's approval JSON matches README.md and package.json", () => {
    // The script's echo line prints: "allowScripts": { "better-sqlite3": true }
    expect(script).toContain(PRINTED_APPROVAL_JSON);

    // The README shows the same JSON in its troubleshooting section.
    expect(readme).toContain('"allowScripts": { "better-sqlite3": true }');

    // ...and package.json really carries that approval, so the advice the
    // script gives ("this repo does") stays true.
    const pkg = JSON.parse(read("package.json")) as {
      allowScripts?: Record<string, boolean>;
    };
    expect(pkg.allowScripts?.["better-sqlite3"]).toBe(true);
  });

  test("README.md links to the probe transcript that verified the remedy", () => {
    expect(readme).toContain(PROBE_DOC);
  });
});
