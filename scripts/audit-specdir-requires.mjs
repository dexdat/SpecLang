/**
 * QA-SPECLANG-010 criterion (1): the tracked compiled spec-dir layer
 * (`specs/**\/src/**\/*.js`) must not contain relative `require()` calls that
 * point at nothing.
 *
 * A stale compiled artifact is not inert: `tests/workflow/conversation.test.ts`
 * loads `specs/workflow.spec.dir/src/conversation.js` at runtime, and a `.js`
 * whose `require` target was renamed/removed in its `.ts` is a module that
 * throws MODULE_NOT_FOUND the moment a consumer follows it.
 *
 * Accepted exceptions live in `scripts/specdir-requires-baseline.json` and are
 * re-verified on every run — an entry that stops reproducing FAILS the run, and
 * an entry whose recorded `proof` no longer matches the tree FAILS too. The
 * accepted list is a decision record with evidence, not an escape hatch:
 *
 *   proof: "source-only"     the required module exists, but only as
 *                            `.ts`/`.tsx` — the layer's membership is partial
 *                            (440 compiled modules vs 1009 sources), so a
 *                            require between spec-dir modules can name a module
 *                            that was never compiled into the layer. The audit
 *                            asserts the source really is there and that no
 *                            compiled sibling exists.
 *   proof: "missing"         nothing by that name exists in either form: the
 *                            source itself imports a module that was never
 *                            created. Only accepted for artifacts with no
 *                            importer, i.e. a projection nothing can load.
 *
 * Usage:
 *   node scripts/audit-specdir-requires.mjs             # audit (exit 1 on failure)
 *   node scripts/audit-specdir-requires.mjs --json      # machine-readable summary
 *   node scripts/audit-specdir-requires.mjs --root DIR  # audit a copy of the tree
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  REPO_ROOT,
  extractRelativeRequires,
  repoPathExists,
  resolveRequire,
} from './lib/specdir-compiled-layer.mjs';

const BASELINE_PATH = 'scripts/specdir-requires-baseline.json';

/** Parse argv into the few flags this script needs. */
function parseArgs(argv) {
  const args = { json: false, root: REPO_ROOT };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') args.json = true;
    else if (arg === '--root') {
      args.root = resolve(argv[i + 1] ?? REPO_ROOT);
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log('usage: node scripts/audit-specdir-requires.mjs [--json] [--root DIR]');
      process.exit(0);
    } else {
      console.error(`audit-specdir-requires: unknown argument ${arg}`);
      process.exit(2);
    }
  }
  return args;
}

/** Tracked compiled spec-dir modules (the layer is defined by git, not the disk). */
function trackedCompiledModules(root) {
  return execFileSync('git', ['-C', root, 'ls-files', 'specs'], {
    encoding: 'utf8',
    maxBuffer: 64 << 20,
  })
    .split('\n')
    .filter((path) => /\/src\/.*\.js$/.test(path))
    .sort();
}

/** Load the accepted-requires list; a missing file means "no exceptions". */
export function loadBaseline(root) {
  const absolute = join(root, BASELINE_PATH);
  if (!existsSync(absolute)) return { accepted: [] };
  const parsed = JSON.parse(readFileSync(absolute, 'utf8'));
  if (!parsed || !Array.isArray(parsed.accepted)) {
    throw new Error(`${BASELINE_PATH}: expected an object with an "accepted" array`);
  }
  return parsed;
}

/** Stable key for matching a baseline entry to an observed require. */
function key(modulePath, specifier) {
  return `${modulePath}\u0000${specifier}`;
}

/**
 * Verify the evidence an accepted entry recorded.
 *
 * @returns {{ok: boolean, detail: string}}
 */
function verifyProof(entry, observed) {
  if (entry.proof === 'source-only') {
    if (observed.kind !== 'source-only') {
      return { ok: false, detail: `recorded source-only, but the target is now ${observed.kind}` };
    }
    const compiledSibling = observed.path.replace(/\.tsx?$/, '.js');
    if (repoPathExists(compiledSibling)) {
      return { ok: false, detail: `compiled sibling ${compiledSibling} now exists — drop the entry` };
    }
    return { ok: true, detail: `only ${observed.path} exists (no compiled sibling)` };
  }
  if (entry.proof === 'missing') {
    if (observed.kind !== 'missing') {
      return { ok: false, detail: `recorded missing, but the target is now ${observed.kind}` };
    }
    return { ok: true, detail: 'no module of that name in either form' };
  }
  if (entry.proof === 'runtime-projection') {
    if (!entry.runtimeModule || !repoPathExists(entry.runtimeModule)) {
      return { ok: false, detail: `runtimeModule ${entry.runtimeModule ?? '(none)'} does not exist` };
    }
    return { ok: true, detail: `resolves in the src/ projection as ${entry.runtimeModule}` };
  }
  return { ok: false, detail: `unknown proof class ${JSON.stringify(entry.proof)}` };
}

/**
 * Audit every tracked compiled module.
 *
 * @param {string} root repo root to audit
 * @param {{accepted: Array<{module: string, require: string, proof: string, reason: string}>}} baseline
 */
export function auditRequires(root, baseline) {
  const accepted = new Map(
    (baseline.accepted ?? []).map((entry) => [key(entry.module, entry.require), entry]),
  );
  const modules = trackedCompiledModules(root);
  const unresolved = [];
  const seen = new Set();
  let requiresChecked = 0;
  let resolvedCount = 0;

  for (const modulePath of modules) {
    const source = readFileSync(join(root, modulePath), 'utf8');
    const fromDir = dirname(join(root, modulePath));
    for (const { specifier, line } of extractRelativeRequires(source)) {
      requiresChecked += 1;
      const observed = resolveRequire(fromDir, specifier);
      if (observed.kind === 'loadable') {
        resolvedCount += 1;
        continue;
      }
      const entry = accepted.get(key(modulePath, specifier));
      if (!entry) {
        unresolved.push({
          module: modulePath,
          require: specifier,
          line,
          status: 'unresolved',
          detail:
            observed.kind === 'source-only'
              ? `only the source ${observed.path} exists — the layer has no compiled sibling for it`
              : 'no module of that name in either form',
          reason: null,
        });
        continue;
      }
      seen.add(key(modulePath, specifier));
      const proof = verifyProof(entry, observed);
      unresolved.push({
        module: modulePath,
        require: specifier,
        line,
        status: entry.proof === 'missing' ? 'accepted-unloadable' : 'accepted',
        detail: proof.detail,
        reason: entry.reason,
        ok: proof.ok,
      });
    }
  }

  const stale = [...accepted.keys()]
    .filter((entryKey) => !seen.has(entryKey))
    .map((entryKey) => {
      const [modulePath, specifier] = entryKey.split('\u0000');
      return { module: modulePath, require: specifier };
    });

  return {
    modules: modules.length,
    requiresChecked,
    resolvedCount,
    unresolved,
    stale,
    failures: unresolved.filter((row) => row.status === 'unresolved' || row.ok === false).length,
  };
}

/** Render the human-readable report. */
export function formatReport(report) {
  const lines = [];
  const accepted = report.unresolved.filter((row) => row.status !== 'unresolved').length;
  lines.push(
    `audit-specdir-requires: ${report.modules} compiled spec-dir modules, ` +
      `${report.requiresChecked} relative requires`,
  );
  for (const row of report.unresolved) {
    const label = row.status === 'unresolved' ? 'UNRESOLVED' : row.ok === false ? 'BAD PROOF' : 'accepted';
    lines.push(`  ${label} ${row.module}:${row.line}  ${row.require}`);
    lines.push(`      ${row.detail}`);
    if (row.reason) lines.push(`      why: ${row.reason}`);
  }
  for (const row of report.stale) {
    lines.push(`  STALE BASELINE ENTRY ${row.module}  "${row.require}"`);
    lines.push('      the require now resolves (or the module is gone) — drop the entry');
  }
  lines.push(
    `  ${report.failures === 0 && report.stale.length === 0 ? 'ok' : 'FAILED'}: ` +
      `${report.resolvedCount} resolve in the spec-dir tree, ` +
      `${accepted} accepted in ${BASELINE_PATH}, ` +
      `${report.failures} failing, ${report.stale.length} stale baseline entries`,
  );
  return lines.join('\n');
}

// CLI entry point (skipped when imported by the parity test).
if (process.argv[1] && process.argv[1].endsWith('audit-specdir-requires.mjs')) {
  const args = parseArgs(process.argv.slice(2));
  const report = auditRequires(args.root, loadBaseline(args.root));
  if (args.json) console.log(JSON.stringify(report, null, 2));
  else console.log(formatReport(report));
  process.exit(report.failures === 0 && report.stale.length === 0 ? 0 : 1);
}
