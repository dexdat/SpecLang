/**
 * QA-SPECLANG-010 criterion (2): the tracked compiled spec-dir layer is a
 * projection of its sources, and no tracked `.js` may silently disagree with
 * the `.ts` beside it in a guard-bearing module.
 *
 * Two checks, one blocking:
 *
 *   1. SYMBOL PARITY (blocking) — for every spec-dir module whose `.ts` exports a
 *      state-DB opener or corruption diagnostic (`GUARD_SYMBOLS` in
 *      `scripts/lib/specdir-compiled-layer.mjs`), the tracked `.js` must export
 *      exactly the same VALUE symbols. This is the check that fails when a
 *      guard is added to the source and the artifact is not recompiled — the
 *      defect that let `specs/sqlite.spec.dir/src/index.js` keep serving
 *      `new Database()` to consumers while the source installed
 *      `openStateDatabase()`.
 *
 *   2. FRESHNESS (report only) — how many tracked modules differ from a fresh
 *      compile of their source (delegated to `regenerate-specdir-layer.mjs
 *      --check --all-stale`). It is NOT a gate: the layer is a partial
 *      projection whose committed artifacts predate their sources in places, and
 *      compiling the whole tree today surfaces latent source bugs (e.g.
 *      `specs/parser.spec.dir/src/header.ts` carries `@block::` where the
 *      committed artifact and the tests expect `@block:`), so a wholesale
 *      regeneration would ship behavioural regressions. Guard-bearing modules
 *      are therefore regenerated (and symbol-gated); the rest is reported so the
 *      drift stays visible. `--strict-freshness` turns the report into a gate
 *      once the layer is clean.
 *
 * Usage:
 *   node scripts/check-specdir-parity.mjs               # guard parity gate (+ freshness report)
 *   node scripts/check-specdir-parity.mjs --json        # machine-readable summary
 *   node scripts/check-specdir-parity.mjs --skip-freshness    # skip the (slow) freshness report
 *   node scripts/check-specdir-parity.mjs --strict-freshness  # also fail when anything is stale
 */

import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { REPO_ROOT, guardBearingModules } from './lib/specdir-compiled-layer.mjs';

/** Compare a list of `{ js, source, tsExports, jsExports }` modules. */
export function compareModules(modules) {
  const rows = modules.map((module) => {
    const missing = [...module.tsExports].filter((name) => !module.jsExports.has(name));
    const extra = [...module.jsExports].filter((name) => !module.tsExports.has(name));
    return { js: module.js, source: module.source, missing, extra, ok: !missing.length && !extra.length };
  });
  return { modules: rows.length, rows, failures: rows.filter((row) => !row.ok).length };
}

/** Compare the guard-bearing modules' export surfaces. */
export function checkGuardParity() {
  return compareModules(guardBearingModules());
}

/** Run the whole-layer freshness check as a subprocess (it shells out to tsc). */
export function checkFreshness() {
  const result = spawnSync(process.execPath, [join(REPO_ROOT, 'scripts/regenerate-specdir-layer.mjs'), '--check', '--all-stale'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 << 20,
  });
  return { ok: result.status === 0, output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim() };
}

function main() {
  const json = process.argv.includes('--json');
  const skipFreshness = process.argv.includes('--skip-freshness');
  const strictFreshness = process.argv.includes('--strict-freshness');

  const parity = checkGuardParity();
  const freshness = skipFreshness ? { ok: true, output: 'skipped' } : checkFreshness();

  const lines = [];
  lines.push(
    `check-specdir-parity: ${parity.modules} guard-bearing module(s)` +
      ` (state-DB opener / corruption diagnostic)`,
  );
  for (const row of parity.rows) {
    if (row.ok) continue;
    lines.push(`  DRIFT ${row.js}`);
    if (row.missing.length) lines.push(`      missing from .js: ${row.missing.join(', ')}`);
    if (row.extra.length) lines.push(`      not in .ts: ${row.extra.join(', ')}`);
  }
  lines.push(
    `  freshness (${strictFreshness ? 'gate' : 'report only'}): ${freshness.ok ? 'in sync' : 'STALE'}`,
  );
  if (!freshness.ok) lines.push(freshness.output.split('\n').slice(0, 10).map((l) => `    ${l}`).join('\n'));

  const ok = parity.failures === 0 && (!strictFreshness || freshness.ok);
  lines.push(
    `  ${ok ? 'ok' : 'FAILED'}: ${parity.modules - parity.failures}/${parity.modules} guard modules match` +
      ` their source's value exports; freshness ${freshness.ok ? 'clean' : 'stale (reported, not gated)'}`,
  );

  if (json) {
    console.log(
      JSON.stringify(
        { parity: parity.rows, failures: parity.failures, freshness: freshness.ok, freshnessBlocking: strictFreshness },
        null,
        2,
      ),
    );
  } else {
    console.log(lines.join('\n'));
  }
  process.exit(ok ? 0 : 1);
}

if (process.argv[1] && process.argv[1].endsWith('check-specdir-parity.mjs')) main();
