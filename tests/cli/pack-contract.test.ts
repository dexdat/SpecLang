/**
 * Pack contract: everything `scripts.postinstall` invokes must ship in the tarball.
 *
 * UX-001: `files` did not include `scripts/postinstall-lint-deps.sh`, so `npm pack`
 * shipped zero files under `package/scripts/` while package.json still declared
 * `postinstall: bash scripts/postinstall-lint-deps.sh`. Every fresh consumer install
 * died with `npm error code 127 ... No such file or directory`.
 *
 * These tests read the REAL pack contract (`npm pack --dry-run --json`, offline) and
 * check the declared postinstall command against the tarball's file list. They spawn
 * no CLI, hit no network, and cost one dry-run pack.
 */
import { describe, it, expect } from "vitest";
import { execFileSync } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PACK_TIMEOUT_MS = 120_000;

interface PackFileEntry {
  path: string;
  size?: number;
  mode?: number;
}

interface PackManifest {
  files: PackFileEntry[];
  filename?: string;
}

function readPackageJson(): {
  scripts?: Record<string, string>;
  [key: string]: unknown;
} {
  return JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf-8"),
  );
}

/** Run `npm pack --dry-run --json` in the repo root and return the packed file list. */
function packDryRun(): PackManifest {
  const stdout = execFileSync(
    "npm",
    ["pack", "--dry-run", "--json", "--offline"],
    {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      timeout: Math.max(PACK_TIMEOUT_MS, 60_000),
      maxBuffer: 64 * 1024 * 1024,
      env: {
        ...process.env,
        npm_config_offline: "true",
        npm_config_update_notifier: "false",
        npm_config_audit: "false",
        npm_config_fund: "false",
      },
    },
  );
  const parsed = JSON.parse(stdout);
  // `npm pack --json` emits either an array (npm 7+ style) or an object keyed by
  // package name. Accept both shapes.
  const entry = Array.isArray(parsed)
    ? parsed[0]
    : parsed[Object.keys(parsed)[0]];
  expect(entry, "npm pack --dry-run --json produced no package entry").toBeTruthy();
  expect(Array.isArray(entry.files)).toBe(true);
  return entry as PackManifest;
}

/**
 * Extract repo-relative script paths referenced by a postinstall command,
 * e.g. `bash scripts/postinstall-lint-deps.sh` -> ["scripts/postinstall-lint-deps.sh"].
 *
 * Only plain relative paths are returnable: absolute paths, `$VAR` interpolations
 * and shell built-ins cannot be part of the pack contract, so they are skipped.
 */
function referencedScriptPaths(command: string): string[] {
  const found: string[] = [];
  const re = /(?:^|[\s;&|(])(?:bash|sh|node)\s+((?:"[^"]+"|'[^']+'|\S+))/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(command)) !== null) {
    let token = match[1].trim();
    if (
      (token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'"))
    ) {
      token = token.slice(1, -1);
    }
    if (!token) continue;
    // Flags (-e, --input-type), variables and absolute paths are not pack-contract material.
    if (token.startsWith("-")) continue;
    if (token.includes("$")) continue;
    if (path.isAbsolute(token) || token.startsWith("~")) continue;
    found.push(token);
  }
  return found;
}

function normalizeRepoRelative(p: string): string {
  return path.posix.normalize(p.replace(/^\.\//, ""));
}

describe("npm pack contract (UX-001)", () => {
  it("ships every script that scripts.postinstall invokes", () => {
    const pkg = readPackageJson();
    const postinstall = pkg.scripts?.postinstall;
    const manifest = packDryRun();
    const packedPaths = new Set(manifest.files.map((f) => normalizeRepoRelative(f.path)));

    // A pack that produces nothing is a broken contract regardless of postinstall.
    expect(packedPaths.size).toBeGreaterThan(0);

    if (!postinstall) {
      // No postinstall hook: nothing can dangle. Pack itself succeeded above,
      // which is all this contract guarantees for that configuration.
      expect(postinstall).toBeUndefined();
      return;
    }

    const referenced = referencedScriptPaths(postinstall);
    const missing = referenced.filter(
      (rel) => !packedPaths.has(normalizeRepoRelative(rel)),
    );

    expect(
      missing,
      `scripts.postinstall runs \`${postinstall}\` but npm pack omits: ${missing.join(", ")}. ` +
        `A consumer install fails with "code 127 ... No such file or directory" — ` +
        `add them to package.json "files" or remove the referenced command.`,
    ).toEqual([]);
  }, PACK_TIMEOUT_MS);

  it("references resolvable paths that exist on disk too", () => {
    const pkg = readPackageJson();
    const postinstall = pkg.scripts?.postinstall;
    if (!postinstall) return;

    const referenced = referencedScriptPaths(postinstall);
    for (const rel of referenced) {
      expect(
        fs.existsSync(path.join(REPO_ROOT, rel)),
        `scripts.postinstall references ${rel}, which does not exist in the repo`,
      ).toBe(true);
    }
  }, PACK_TIMEOUT_MS);

  it("postinstall script is a no-op exiting 0 without devDependencies", () => {
    const pkg = readPackageJson();
    const postinstall = pkg.scripts?.postinstall;
    if (!postinstall) return;

    const referenced = referencedScriptPaths(postinstall);
    // Only exercise the shell-script form; that is what a consumer install executes.
    const script = referenced.find((rel) => rel.endsWith(".sh"));
    if (!script) return;

    // Fresh consumer install layout: the package content, NO node_modules.
    const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "speclang-pack-noop-"));
    try {
      const src = path.join(REPO_ROOT, script);
      const dest = path.join(scratch, script);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      fs.chmodSync(dest, 0o755);

      const result = execFileSync("bash", [script], {
        cwd: scratch,
        encoding: "utf-8",
        timeout: 60_000,
      });
      // Absent devDependencies must be a clean skip, never a failure.
      expect(result).toContain("skipping postinstall");
    } finally {
      fs.rmSync(scratch, { recursive: true, force: true });
    }
  }, PACK_TIMEOUT_MS);
});
