/**
 * Shared analysis for the tracked compiled spec-dir layer
 * (`specs/**\/src/**\/*.js`, with their `.ts`/`.tsx` sources beside them).
 *
 * Why this exists: the spec-dir `.ts` files ARE the project's source of truth
 * (`src/**` holds tracked symlinks into them), and a stale compiled sibling is
 * therefore not inert decoration — `tests/workflow/conversation.test.ts` loads
 * one of them at runtime, and a `.js` that predates a guard installed in its
 * `.ts` silently bypasses that guard for any consumer of the artifact.
 *
 * The decision this module serves is recorded in
 * `docs/specdir-compiled-layer.md`: the layer is KEPT as a reviewed projection
 * of the `.ts` source, never a second source of truth, and it is enforced by
 * three checks that all read the tree (no build, no TypeScript program):
 *
 *   1. `audit-specdir-requires.mjs`  - every relative `require()` resolves,
 *      with a machine-verified accepted list for the misses.
 *   2. `check-specdir-parity.mjs`    - guard-bearing modules export the same
 *      VALUE symbols from their compiled artifact, and every tracked artifact
 *      is byte-fresh against a fresh compile of its source.
 *   3. `regenerate-specdir-layer.mjs` - the only repair path: recompile the
 *      module from its source instead of hand-editing the artifact.
 *
 * Nothing here parses JavaScript properly; it parses the shapes that matter
 * for the checks above (require specifiers, export names) and skips what it
 * cannot classify rather than guessing.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

/** Repo root: `scripts/lib/` -> two levels up. */
export const REPO_ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..', '..');

/** Symbols whose presence makes a module guard-bearing for QA-SPECLANG-010. */
export const GUARD_SYMBOLS = Object.freeze([
  'STATE_DB_CORRUPT_CODE',
  'CorruptStateDatabaseError',
  'isNotADatabaseError',
  'stateDatabaseCorruptionMessage',
  'openStateDatabase',
  'withStateDatabase',
]);

/** Extensions a CJS `require()` can land on, in Node's own resolution order. */
const RESOLVE_SUFFIXES = ['', '.js', '.json', '.node', '/index.js', '/index.json'];

/** Compiled artifacts tracked beside a spec-dir source. */
export const ARTIFACT_KINDS = Object.freeze(['.js', '.d.ts', '.js.map', '.d.ts.map']);

/**
 * Artifacts whose content a consumer actually depends on, and which the layer's
 * freshness gate therefore compares byte-for-byte. Source maps are rewritten by
 * a regeneration but never fail the gate: their `mappings` encode source byte
 * positions, so a comment-only source edit makes them stale without making the
 * artifact wrong.
 */
export const LOADABLE_KINDS = Object.freeze(['.js', '.d.ts']);

/** Run `git` from the repo root and return stdout as a string. */
function git(args) {
  return execFileSync('git', ['-C', REPO_ROOT, ...args], { encoding: 'utf8', maxBuffer: 64 << 20 });
}

/** Normalize an absolute path to a repo-relative POSIX path. */
export function toRepoPath(absPath) {
  return relative(REPO_ROOT, absPath).split(sep).join('/');
}

/** True when `path` is a tracked file in HEAD/index (we use `git ls-files`). */
function trackedSet() {
  return new Set(git(['ls-files']).split('\n').filter(Boolean));
}

/**
 * Every tracked compiled `.js` under a spec-dir `src/`, paired with its
 * `.ts`/`.tsx` source when one is tracked.
 *
 * `sources` covers `.ts` and `.tsx` because a `.tsx` component compiles to the
 * same `.js` name (the ui-dashboard components are exactly that case).
 * `orphans` are `.js` with no tracked source: plain-JS config files and
 * generated one-offs, which the parity check must not invent sources for.
 *
 * @returns {{pairs: Array<{js: string, source: string}>, orphans: string[], all: string[]}}
 */
export function listCompiledLayer() {
  const tracked = trackedSet();
  const all = [...tracked].filter((p) => /^specs\/.+\/src\/.*\.js$/.test(p)).sort();
  const pairs = [];
  const orphans = [];
  for (const js of all) {
    const base = js.replace(/\.js$/, '');
    const source = [base + '.ts', base + '.tsx'].find((candidate) => tracked.has(candidate));
    if (source) pairs.push({ js, source });
    else orphans.push(js);
  }
  return { pairs, orphans, all };
}

/**
 * Resolve a CJS `require()` specifier against the tree.
 *
 * Three outcomes matter to this layer and they are not interchangeable:
 *   - `loadable`: a file Node can require without a build (`.js`, `.json`,
 *     `.node`, or a directory with `index.js`).
 *   - `source-only`: the module exists, but only as TypeScript, so the require
 *     can only be satisfied after a compile (this is what makes the layer
 *     partial — see docs/specdir-compiled-layer.md).
 *   - `missing`: nothing by that name, in either form.
 *
 * @param {string} fromDir directory of the requiring file (absolute)
 * @param {string} specifier literal specifier (`./x`, `../x`)
 * @returns {{kind: 'loadable'|'source-only'|'missing', path: string|null}}
 */
export function resolveRequire(fromDir, specifier) {
  const base = isAbsolute(specifier) ? specifier : resolve(fromDir, specifier);
  for (const suffix of RESOLVE_SUFFIXES) {
    const candidate = base + suffix;
    if (existsSync(candidate) && !isDirectory(candidate)) {
      return { kind: 'loadable', path: toRepoPath(candidate) };
    }
  }
  const asSource = specifier.replace(/\.js$/, '');
  const sourceBase = isAbsolute(asSource) ? asSource : resolve(fromDir, asSource);
  for (const suffix of ['.ts', '.tsx']) {
    const candidate = sourceBase + suffix;
    if (existsSync(candidate) && !isDirectory(candidate)) {
      return { kind: 'source-only', path: toRepoPath(candidate) };
    }
  }
  return { kind: 'missing', path: null };
}

/** True when the path exists and is a directory (a `require()` can land on it). */
function isDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Remove `//` and block comments so name extraction cannot read prose.
 *
 * Deliberately simple: string literals are skipped so `'http://x'` survives,
 * template literals are skipped so `${...}` cannot look like a name.
 *
 * @param {string} source
 * @returns {string} comment-stripped source with newlines preserved
 */
export function stripComments(source) {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    if (ch === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        if (source[i] === '\n') out += '\n';
        i += 1;
      }
      i += 2;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      out += ch;
      i += 1;
      while (i < source.length) {
        const c = source[i];
        if (c === '\\') {
          out += c + (source[i + 1] ?? '');
          i += 2;
          continue;
        }
        out += c;
        i += 1;
        if (c === quote) break;
      }
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

/**
 * Every literal relative `require()` in a compiled module.
 *
 * Dynamic (`require(name)`) and bare (`require('yaml')`) specifiers are
 * ignored: the audit's contract is about paths, not packages.
 *
 * @param {string} source
 * @returns {Array<{specifier: string, line: number}>}
 */
export function extractRelativeRequires(source) {
  const stripped = stripComments(source);
  const out = [];
  const re = /\brequire\(\s*(['"])(\.{1,2}\/[^'"]*)\1\s*\)/g;
  for (const match of stripped.matchAll(re)) {
    const line = stripped.slice(0, match.index).split('\n').length;
    out.push({ specifier: match[2], line });
  }
  return out;
}

/**
 * VALUE export names declared or re-exported by a TypeScript source.
 *
 * Type-only exports are excluded twice: `export type { X }`, and names inside
 * `export { X }` blocks whose entry is written `type X`. Anything else in an
 * export block is treated as a value — which is what tsc emits for it.
 *
 * @param {string} source
 * @returns {Set<string>}
 */
export function extractTsValueExports(source) {
  const stripped = stripComments(source);
  const out = new Set();
  const decl = /^[ \t]*export[ \t]+(?:declare[ \t]+)?(?:abstract[ \t]+)?(?:async[ \t]+)?(?:class|function|const|let|var|enum)[ \t]+([A-Za-z_$][\w$]*)/gm;
  for (const match of stripped.matchAll(decl)) out.add(match[1]);
  const block = /^[ \t]*export[ \t]*\{([^}]*)\}/gm;
  for (const match of stripped.matchAll(block)) {
    for (const part of match[1].split(',')) {
      const entry = part.trim().replace(/\s+/g, ' ');
      if (!entry || entry.startsWith('type ')) continue;
      const alias = entry.split(' as ');
      out.add((alias[1] || alias[0]).trim());
    }
  }
  if (/^[ \t]*export[ \t]+default\b/m.test(stripped)) out.add('default');
  return out;
}

/**
 * VALUE export names a CommonJS artifact installs on `exports`.
 *
 * Covers the three shapes tsc emits (`exports.X = ...`, the
 * `exports.A = exports.B = void 0;` pre-declaration chain, and
 * `Object.defineProperty(exports, "X", ...)` re-export getters). `__esModule`
 * is an emit marker, not an export of the source, so it is dropped.
 *
 * @param {string} source
 * @returns {Set<string>}
 */
export function extractCjsExports(source) {
  const stripped = stripComments(source);
  const out = new Set();
  for (const match of stripped.matchAll(/\bexports\.([A-Za-z_$][\w$]*)\s*=/g)) out.add(match[1]);
  for (const match of stripped.matchAll(/Object\.defineProperty\(exports,\s*["']([A-Za-z_$][\w$]*)["']/g)) {
    if (match[1] !== '__esModule') out.add(match[1]);
  }
  return out;
}

/**
 * True when a source declares or re-exports one of {@link GUARD_SYMBOLS}.
 *
 * @param {string} source
 * @returns {boolean}
 */
export function isGuardBearing(source) {
  const names = extractTsValueExports(source);
  return GUARD_SYMBOLS.some((symbol) => names.has(symbol));
}

/**
 * The guard-bearing modules of the tracked layer, with both sides read.
 *
 * @returns {Array<{js: string, source: string, tsExports: Set<string>, jsExports: Set<string>}>}
 */
export function guardBearingModules() {
  const { pairs } = listCompiledLayer();
  const out = [];
  for (const pair of pairs) {
    const source = readFileSync(join(REPO_ROOT, pair.source), 'utf8');
    if (!isGuardBearing(source)) continue;
    out.push({
      ...pair,
      tsExports: extractTsValueExports(source),
      jsExports: extractCjsExports(readFileSync(join(REPO_ROOT, pair.js), 'utf8')),
    });
  }
  return out;
}

/** Read a repo-relative file as UTF-8. */
export function readRepoFile(repoPath) {
  return readFileSync(join(REPO_ROOT, repoPath), 'utf8');
}

/** True when a repo-relative path exists on disk. */
export function repoPathExists(repoPath) {
  return existsSync(join(REPO_ROOT, repoPath));
}
