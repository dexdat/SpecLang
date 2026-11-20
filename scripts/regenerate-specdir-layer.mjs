/**
 * Regenerate tracked compiled spec-dir artifacts from their `.ts`/`.tsx` sources.
 *
 * The tracked layer (`specs/**\/src/**\/*.js` plus its `.d.ts`/`.map` siblings)
 * is a *projection* of the `.ts` sources beside it — see
 * `docs/specdir-compiled-layer.md`. This script is the only sanctioned way to
 * change it: recompiling the source is a decision, hand-editing the artifact is
 * the defect the layer's checks exist to catch.
 *
 * It compiles with a throwaway tsconfig that EXTENDS the repo's own
 * `tsconfig.json` and overrides only the output location plus the file list, so
 * the emit options (target/module/declaration maps/...) are the project's, not a
 * copy that can drift. Only the requested modules' own artifacts are written
 * back; a dependency's emit stays untouched even when the compile had to read it.
 *
 * Freshness is judged on the LOADABLE artifacts (`.js`, `.d.ts`). Source maps are
 * rewritten alongside them, but they are excluded from the freshness verdict:
 * tsc's `mappings` encode source byte positions, so a comment-only edit to a
 * source makes every map stale without making the artifact wrong.
 *
 * Usage:
 *   node scripts/regenerate-specdir-layer.mjs                     # guard-bearing modules
 *   node scripts/regenerate-specdir-layer.mjs --module <path.ts>  # one module (repeatable)
 *   node scripts/regenerate-specdir-layer.mjs --all-stale         # every stale module in the layer
 *   node scripts/regenerate-specdir-layer.mjs --check             # verify, never write
 *
 * Exit codes: 0 = in sync (or written), 1 = drift found with --check, 2 = usage error.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import {
  ARTIFACT_KINDS,
  LOADABLE_KINDS,
  REPO_ROOT,
  guardBearingModules,
  listCompiledLayer,
  readRepoFile,
} from './lib/specdir-compiled-layer.mjs';

/**
 * Rewrite a source map's `sources` entries so they are expressed relative to the
 * repository location the map will occupy.
 *
 * tsc computes `sources` relative to the map file itself, so a compile into a
 * temporary outDir produces `../../../../home/.../index.ts` where an in-place
 * compile produces `index.ts`. The mappings themselves are location-independent;
 * normalizing this one field is what makes a temp-dir compile comparable with the
 * tracked artifact.
 *
 * @param {string} mapJson source-map text
 * @param {string} mapAbsPath where the map currently sits on disk
 * @param {string} repoMapAbsPath where the map will be committed
 * @returns {string}
 */
export function normalizeSourceMapSources(mapJson, mapAbsPath, repoMapAbsPath) {
  let parsed;
  try {
    parsed = JSON.parse(mapJson);
  } catch {
    return mapJson;
  }
  if (!Array.isArray(parsed.sources)) return mapJson;
  parsed.sources = parsed.sources.map((entry) => {
    if (typeof entry !== 'string' || entry.startsWith('<')) return entry;
    const abs = resolve(dirname(mapAbsPath), entry);
    return relative(dirname(repoMapAbsPath), abs).split(sep).join('/');
  });
  return JSON.stringify(parsed);
}

/**
 * Compile a batch of sources in one tsc invocation.
 *
 * @param {string[]} sourceRepoPaths repo-relative `.ts`/`.tsx` entry points
 * @param {string} outDir temporary emit root
 * @returns {Map<string, Record<string, string>>} source path -> artifacts by kind
 */
function compileBatch(sourceRepoPaths, outDir) {
  const configDir = mkdtempSync(join(outDir, 'cfg-'));
  const configPath = join(configDir, 'tsconfig.json');
  writeFileSync(
    configPath,
    `${JSON.stringify(
      {
        extends: join(REPO_ROOT, 'tsconfig.json'),
        compilerOptions: {
          outDir,
          rootDir: REPO_ROOT,
          noEmit: false,
          incremental: false,
          composite: false,
          tsBuildInfoFile: null,
          declaration: true,
          declarationMap: true,
          sourceMap: true,
        },
        include: [],
        files: sourceRepoPaths.map((path) => join(REPO_ROOT, path)),
      },
      null,
      2,
    )}\n`,
  );

  const tsc = join(REPO_ROOT, 'node_modules', '.bin', 'tsc');
  const result = spawnSync(tsc, ['-p', configPath], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 << 20,
  });
  // A pre-existing type error elsewhere in the graph does not stop emit, and the
  // layer has such errors today (it sits outside the build's include set). Only a
  // missing compiler or a crash is fatal here.
  if (result.error) throw new Error(`tsc failed to run: ${result.error.message}`);

  const artifacts = new Map();
  for (const sourceRepoPath of sourceRepoPaths) {
    const emittedBase = join(outDir, sourceRepoPath.replace(/\.tsx?$/, ''));
    const repoBase = join(REPO_ROOT, sourceRepoPath.replace(/\.tsx?$/, ''));
    const byKind = {};
    for (const kind of ARTIFACT_KINDS) {
      const path = emittedBase + kind;
      if (!existsSync(path)) continue;
      const text = readFileSync(path, 'utf8');
      byKind[kind] = kind.endsWith('.map')
        ? normalizeSourceMapSources(text, path, repoBase + kind)
        : text;
    }
    if (!byKind['.js']) {
      const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
      throw new Error(`tsc emitted no .js for ${sourceRepoPath}\n${output.slice(0, 2000)}`);
    }
    artifacts.set(sourceRepoPath, byKind);
  }
  return artifacts;
}

/** Compare one module's tracked loadable artifacts against a fresh compile. */
function diffModule(sourceRepoPath, emitted) {
  const repoBase = sourceRepoPath.replace(/\.tsx?$/, '');
  const drift = [];
  for (const kind of LOADABLE_KINDS) {
    const repoPath = repoBase + kind;
    const onDisk = existsSync(join(REPO_ROOT, repoPath)) ? readRepoFile(repoPath) : null;
    const fresh = emitted[kind] ?? null;
    if (onDisk === fresh) continue;
    drift.push({ repoPath, reason: onDisk === null ? 'missing' : fresh === null ? 'orphan' : 'stale' });
  }
  return drift;
}

/** True when a module's loadable artifacts already match a fresh compile. */
function isFresh(sourceRepoPath, emitted) {
  return diffModule(sourceRepoPath, emitted).length === 0;
}

/** Write fresh artifacts (maps included) for one module back into the tree. */
function writeModule(sourceRepoPath, emitted) {
  const repoBase = sourceRepoPath.replace(/\.tsx?$/, '');
  const written = [];
  for (const kind of ARTIFACT_KINDS) {
    const fresh = emitted[kind];
    if (fresh === undefined) continue;
    const target = join(REPO_ROOT, repoBase + kind);
    const current = existsSync(target) ? readFileSync(target, 'utf8') : null;
    if (current === fresh) continue;
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, fresh);
    written.push(relative(REPO_ROOT, target).split(sep).join('/'));
  }
  return written;
}

/** Parse argv. */
function parseArgs(argv) {
  const args = { check: false, allStale: false, modules: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--check') args.check = true;
    else if (arg === '--all-stale') args.allStale = true;
    else if (arg === '--module') {
      args.modules.push(resolve(REPO_ROOT, argv[i + 1] ?? ''));
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log(
        'usage: node scripts/regenerate-specdir-layer.mjs [--check] [--all-stale] [--module <src.ts> ...]',
      );
      process.exit(0);
    } else {
      console.error(`regenerate-specdir-layer: unknown argument ${arg}`);
      process.exit(2);
    }
  }
  return args;
}

/** Resolve the module list the caller asked for (repo-relative paths). */
function selectModules(args) {
  if (args.modules.length) {
    return args.modules.map((modulePath) => {
      const abs = resolve(REPO_ROOT, modulePath);
      if (!existsSync(abs)) throw new Error(`--module ${modulePath}: no such file`);
      if (!/\.tsx?$/.test(modulePath)) throw new Error(`--module ${modulePath}: not a .ts/.tsx source`);
      return relative(REPO_ROOT, abs).split(sep).join('/');
    });
  }
  if (args.allStale) return listCompiledLayer().pairs.map((pair) => pair.source);
  return guardBearingModules().map((pair) => pair.source);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const modules = selectModules(args);
  const outDir = mkdtempSync(join(tmpdir(), 'specdir-regen-'));
  const stale = [];
  const written = [];
  try {
    const artifacts = compileBatch(modules, outDir);
    for (const sourceRepoPath of modules) {
      const emitted = artifacts.get(sourceRepoPath);
      if (args.check) stale.push(...diffModule(sourceRepoPath, emitted));
      else if (!isFresh(sourceRepoPath, emitted)) written.push(...writeModule(sourceRepoPath, emitted));
    }
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }

  if (args.check) {
    if (stale.length === 0) {
      console.log(
        `regenerate-specdir-layer --check: ${modules.length} module(s) in sync with their sources`,
      );
      return 0;
    }
    console.log(`regenerate-specdir-layer --check: ${stale.length} stale loadable artifact(s)`);
    for (const row of stale) console.log(`  ${row.reason.padEnd(8)} ${row.repoPath}`);
    console.log('fix: npm run regenerate:specdir            (never hand-edit the .js)');
    return 1;
  }

  if (written.length === 0) {
    console.log(`regenerate-specdir-layer: ${modules.length} module(s) already up to date`);
    return 0;
  }
  console.log(
    `regenerate-specdir-layer: rewrote ${written.length} artifact(s) across ${modules.length} source(s)`,
  );
  for (const path of written) console.log(`  ${path}`);
  return 0;
}

process.exit(main());
