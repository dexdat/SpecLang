#!/usr/bin/env node
/**
 * check_home_paths.mjs — public-posture gate for real host home paths.
 *
 * Fails (exit 1) when any TRACKED file (index scan, so pre-commit sees staged
 * content) contains a real machine-specific home path (e.g. the author's own
 * `/home/<name>/…` directory) outside the preserved `evidence/**` corpus. Shipped documentation and
 * scripts must not leak the machine they were written on.
 *
 * Placeholder home paths are explicitly allowlisted by their home-directory
 * component — a placeholder is a deliberate stand-in, not a leak:
 *
 *   /home/<user>/…        grammatical placeholder (DOC-030 convention)
 *   /home/<your-user>/…   existing convention in specs/docs.spec.dir CONFIGURATION.md
 *   /home/you/…           issue templates / onboarding examples
 *   /home/runner/…        GitHub Actions checkout path (CI)
 *
 * Fail-closed: any git plumbing error (not a repo, corrupt index, unknown
 * pathspec) exits 2 rather than silently passing. `evidence/` and
 * `.coding-hermes/` are excluded from the scan; `evidence/**` is preserved
 * verbatim as a historical record (DOC-030 ruling).
 *
 * Usage:
 *   node scripts/check_home_paths.mjs
 *
 * Exit codes:
 *   0  no disallowed home path found
 *   1  one or more disallowed home paths found (listed on stdout)
 *   2  the gate could not run (git error) — treat as failure
 */

'use strict';

import { execFileSync } from 'child_process';

// Real-home-path candidates: /home/<component>/... The component capture is
// matched against the allowlist below; anything else is a leak. A real home
// component starts with an alphanumeric or `_`/`-` (never a bare `.`), which
// keeps relative-traversal comments like `../../../../home/...` out of scope;
// placeholder components like `<user>` never match either, so they are
// implicitly safe — they stay in the allowlist purely as documentation.
const HOME_PATH_RE = /\/home\/([A-Za-z0-9_-][A-Za-z0-9._-]*)/g;

// Explicit placeholder allowlist (see header comment). Additions are
// deliberate edits to this file, reviewed as such.
const ALLOWED_HOME_COMPONENTS = new Set([
  '<user>',       // DOC-030 grammatical placeholder
  '<your-user>',  // CONFIGURATION.md placeholder (specs/docs.spec.dir/docs/)
  'you',          // issue templates / onboarding examples
  'runner',       // GitHub Actions checkout path (CI)
]);

// Preserved/historical or foreman-owned trees that never ship as product
// posture. Git pathspec exclude magic.
const EXCLUDED_PATHS = [':!evidence', ':!.coding-hermes'];

function scanIndex() {
  // `--cached` scans the index: pre-commit hooks see exactly what is staged,
  // and a fresh CI checkout's index equals HEAD, so one mode covers both.
  const args = [
    'grep',
    '--cached',
    '-I', // skip binary files
    '-n',
    '--full-name',
    '-E',
    '/home/[A-Za-z0-9._-]+',
    '--',
    ...EXCLUDED_PATHS,
  ];
  try {
    return { ok: true, stdout: execFileSync('git', args, { encoding: 'utf8' }) };
  } catch (err) {
    if (err.status === 1) {
      // git grep exit 1 = "no matches" — a clean result, not an error.
      return { ok: true, stdout: '' };
    }
    return { ok: false, stderr: err.stderr || err.message };
  }
}

function main() {
  const result = scanIndex();
  if (!result.ok) {
    console.error('check_home_paths: git grep failed — gate is fail-closed.');
    console.error(result.stderr);
    process.exit(2);
  }

  const violations = new Map(); // file -> [{ rest, components: Set }]
  for (const line of result.stdout.split('\n')) {
    if (!line) continue;
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const filePath = line.slice(0, colon);
    const rest = line.slice(colon + 1);
    const components = new Set();
    let match;
    HOME_PATH_RE.lastIndex = 0;
    while ((match = HOME_PATH_RE.exec(rest)) !== null) {
      if (!ALLOWED_HOME_COMPONENTS.has(match[1])) components.add(match[1]);
    }
    if (components.size > 0) {
      const entry = violations.get(filePath) ?? { lines: [] };
      entry.lines.push({ rest, components: [...components] });
      violations.set(filePath, entry);
    }
  }

  if (violations.size > 0) {
    let total = 0;
    for (const entry of violations.values()) total += entry.lines.length;
    console.error(
      `check_home_paths: ${total} real home-path hit(s) in ${violations.size} tracked file(s) ` +
        '(outside evidence/ and .coding-hermes/):'
    );
    for (const [filePath, entry] of violations) {
      for (const { rest, components } of entry.lines) {
        console.error(`  ${filePath}:${rest} (component "${components.map((c) => `/home/${c}`).join('", "')}")`);
      }
    }
    console.error(
      'Replace with a grammatical placeholder (/home/<user>) or a $HOME-relative form. ' +
        'Placeholder components are allowlisted in scripts/check_home_paths.mjs.'
    );
    process.exit(1);
  }

  console.log('check_home_paths: OK — no real home paths in tracked files.');
  process.exit(0);
}

main();
