#!/usr/bin/env node
/**
 * reap-test-tmp.mjs — bounded reaper for the project-local test scratch dir.
 *
 * `npm test` runs vitest with `TMPDIR=$PWD/.tmp` (see vitest.config.ts:66 CI-002),
 * so every `mkdtempSync(os.tmpdir())` in the suite leaves a session dir behind.
 * `.tmp/` is gitignored (.gitignore:98), so nothing else in the repo ever deletes
 * it: it grew to ~25k session dirs / ~1.8 GiB (including stale `*.db-wal` files
 * from SQLite runs) and kept growing. This is the reaper (QA-SPECLANG-012).
 *
 * Policy — two windows, so a live run is never a casualty:
 *   - min age (default 2h): anything whose mtime is INSIDE this window is an
 *     active or just-finished run and is skipped, always.
 *   - max age (default 24h): anything older is removed (`rm -rf` for dirs,
 *     unlink for files and symlinks).
 *   - between the two windows: left alone. The gap is deliberate — a run that
 *     finished 3h ago is not evidence of anything, and deleting it buys nothing
 *     while a retried suite might still be reading it.
 *
 * The skip window is evaluated FIRST, so if a caller passes a min age larger than
 * the max age the two windows simply overlap and nothing inside the skip window is
 * ever removed — the conservative reading, never the destructive one.
 *
 * Only DIRECT children of the root are considered, so the walk can never leave
 * the scratch dir. Symlinks are unlinked, never descended (no `rm -rf` target
 * outside the root). A concurrent run deleting a dir under us (ENOENT) is not an
 * error — the entry is already gone, which is the goal.
 *
 * Exactly one machine-readable line goes to stdout, always (also under --quiet):
 *
 *   reap-test-tmp: root=<abs> removed=<n> skipped_recent=<n> residual=<n> bytes_freed=<n> dry_run=<true|false>
 *
 * `residual` is the post-run count of immediate child directories PLUS the root
 * itself — the same number `find <root> -maxdepth 1 -type d | wc -l` prints, so
 * the log line and that command can be compared directly. Manifestation detail
 * goes to stderr, so stdout stays parseable.
 *
 * Under --dry-run, `removed` is the count that WOULD be removed and
 * `bytes_freed` the bytes that WOULD be freed; nothing is touched.
 *
 * Usage:
 *   node scripts/reap-test-tmp.mjs [--root <path>] [--max-age-hours <n>]
 *                                  [--min-age-hours <n>] [--dry-run] [--quiet]
 *   node scripts/reap-test-tmp.mjs --help
 *
 * Exit codes: 0 success (including "root does not exist" and "nothing to do"),
 *             1 a real removal/inspection failure, 2 bad usage.
 */

import { lstatSync, readdirSync, rmSync, statSync, unlinkSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const HOUR_MS = 60 * 60 * 1000;
const DEFAULT_ROOT = '.tmp';
const DEFAULT_MAX_AGE_HOURS = 24;
const DEFAULT_MIN_AGE_HOURS = 2;

const USAGE = `Usage: node scripts/reap-test-tmp.mjs [options]

  --root <path>            scratch root to reap (default: ${DEFAULT_ROOT} under cwd)
  --max-age-hours <n>      remove entries older than this many hours (default: ${DEFAULT_MAX_AGE_HOURS})
  --min-age-hours <n>      never touch entries modified within this many hours (default: ${DEFAULT_MIN_AGE_HOURS})
  --dry-run                report what would be removed; delete nothing
  --quiet                  suppress the human summary on stderr (the stdout log line still prints)
  --help                   this text

Only direct children of the root are considered. Directories are removed
recursively; files and symlinks are unlinked (never followed).`;

/* ------------------------------------------------------------------ *
 * argument parsing
 * ------------------------------------------------------------------ */

function parseArgs(argv) {
  const options = {
    root: DEFAULT_ROOT,
    maxAgeHours: DEFAULT_MAX_AGE_HOURS,
    minAgeHours: DEFAULT_MIN_AGE_HOURS,
    dryRun: false,
    quiet: false,
    help: false,
    errors: [],
  };

  const numberArg = (flag, raw) => {
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
      options.errors.push(`${flag} expects a non-negative number, got "${raw}"`);
      return null;
    }
    return value;
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const eq = arg.indexOf('=');
    const flag = eq === -1 ? arg : arg.slice(0, eq);
    const inline = eq === -1 ? undefined : arg.slice(eq + 1);
    const takeValue = () => {
      if (inline !== undefined) return inline;
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        options.errors.push(`${flag} requires a value`);
        return undefined;
      }
      i += 1;
      return next;
    };

    switch (flag) {
      case '--root': {
        const value = takeValue();
        if (value !== undefined) {
          if (value.length === 0) options.errors.push('--root requires a non-empty path');
          else options.root = value;
        }
        break;
      }
      case '--max-age-hours': {
        const value = takeValue();
        if (value !== undefined) {
          const parsed = numberArg('--max-age-hours', value);
          if (parsed !== null) options.maxAgeHours = parsed;
        }
        break;
      }
      case '--min-age-hours': {
        const value = takeValue();
        if (value !== undefined) {
          const parsed = numberArg('--min-age-hours', value);
          if (parsed !== null) options.minAgeHours = parsed;
        }
        break;
      }
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--quiet':
        options.quiet = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        options.errors.push(`unknown argument: ${arg}`);
    }
  }

  if (options.maxAgeHours <= 0) {
    options.errors.push(`--max-age-hours must be greater than 0 (got ${options.maxAgeHours})`);
  }

  return options;
}

/* ------------------------------------------------------------------ *
 * scratch-dir inspection
 * ------------------------------------------------------------------ */

/**
 * Bytes a path occupies, without ever following a symlink out of the root.
 * Directories recurse; symlinks contribute 0 (their target is not ours).
 */
function measureBytes(path, stats) {
  if (stats.isSymbolicLink()) return 0;
  if (!stats.isDirectory()) return stats.size;
  let total = 0;
  let entries;
  try {
    entries = readdirSync(path, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return 0;
    throw err;
  }
  for (const entry of entries) {
    const childPath = join(path, entry.name);
    let childStats;
    try {
      childStats = lstatSync(childPath);
    } catch (err) {
      if (err.code === 'ENOENT') continue;
      throw err;
    }
    total += measureBytes(childPath, childStats);
  }
  return total;
}

/** `find <root> -maxdepth 1 -type d | wc -l`: immediate child dirs + the root itself. */
function countResidual(root) {
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return 0;
    throw err;
  }
  // withFileTypes() is lstat-based: a symlink to a directory is NOT a directory,
  // matching `find -type d` (which does not follow symlinks by default).
  return 1 + entries.filter((entry) => entry.isDirectory()).length;
}

/**
 * Reap direct children of `root` that are older than maxAgeHours, leaving
 * anything newer than minAgeHours alone.
 *
 * @returns {{root: string, removed: number, skippedRecent: number, residual: number,
 *            bytesFreed: number, failures: string[]}}
 */
export function reap({ root, maxAgeHours = DEFAULT_MAX_AGE_HOURS, minAgeHours = DEFAULT_MIN_AGE_HOURS, dryRun = false, now = Date.now() }) {
  const absRoot = resolve(root);
  const result = {
    root: absRoot,
    removed: 0,
    skippedRecent: 0,
    residual: 0,
    bytesFreed: 0,
    failures: [],
  };

  let rootStats;
  try {
    rootStats = statSync(absRoot);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // A fresh worktree has never run the suite: nothing to reap is success.
      result.residual = 0;
      return result;
    }
    result.failures.push(`${absRoot}: ${err.code ?? err.message}`);
    return result;
  }
  if (!rootStats.isDirectory()) {
    result.failures.push(`${absRoot}: not a directory`);
    return result;
  }

  const minAgeMs = minAgeHours * HOUR_MS;
  const maxAgeMs = maxAgeHours * HOUR_MS;

  let entries;
  try {
    entries = readdirSync(absRoot, { withFileTypes: true });
  } catch (err) {
    result.failures.push(`${absRoot}: ${err.code ?? err.message}`);
    return result;
  }

  for (const entry of entries) {
    const childPath = join(absRoot, entry.name);
    let childStats;
    try {
      childStats = lstatSync(childPath);
    } catch (err) {
      // An active run can delete its own session dir mid-enumeration.
      if (err.code === 'ENOENT') continue;
      result.failures.push(`${childPath}: ${err.code ?? err.message}`);
      continue;
    }

    const ageMs = now - childStats.mtimeMs;
    if (ageMs < minAgeMs) {
      result.skippedRecent += 1;
      continue;
    }
    if (ageMs <= maxAgeMs) continue;

    let bytes = 0;
    try {
      bytes = measureBytes(childPath, childStats);
    } catch (err) {
      result.failures.push(`${childPath}: ${err.code ?? err.message}`);
      continue;
    }

    if (dryRun) {
      result.removed += 1;
      result.bytesFreed += bytes;
      continue;
    }

    try {
      if (childStats.isDirectory()) {
        rmSync(childPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
      } else {
        // Files and symlinks: unlink the entry itself, never the link target.
        unlinkSync(childPath);
      }
      result.removed += 1;
      result.bytesFreed += bytes;
    } catch (err) {
      if (err.code === 'ENOENT') {
        // Vanished under us — the entry is gone, which is what we wanted.
        result.removed += 1;
        continue;
      }
      result.failures.push(`${childPath}: ${err.code ?? err.message}`);
    }
  }

  try {
    result.residual = countResidual(absRoot);
  } catch (err) {
    result.failures.push(`${absRoot}: ${err.code ?? err.message}`);
  }

  return result;
}

/* ------------------------------------------------------------------ *
 * main
 * ------------------------------------------------------------------ */

function formatLogLine(result, dryRun) {
  return (
    `reap-test-tmp: root=${result.root} removed=${result.removed} ` +
    `skipped_recent=${result.skippedRecent} residual=${result.residual} ` +
    `bytes_freed=${result.bytesFreed} dry_run=${dryRun ? 'true' : 'false'}`
  );
}

function main(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log(USAGE);
    return 0;
  }
  if (options.errors.length > 0) {
    for (const error of options.errors) console.error(`reap-test-tmp: ${error}`);
    console.error(`\n${USAGE}`);
    return 2;
  }

  const absRoot = resolve(options.root);
  // A `--root /` typo would delete every top-level directory older than a day.
  if (absRoot === '/') {
    console.error('reap-test-tmp: refusing to reap the filesystem root');
    return 2;
  }

  const result = reap({
    root: options.root,
    maxAgeHours: options.maxAgeHours,
    minAgeHours: options.minAgeHours,
    dryRun: options.dryRun,
  });

  if (!options.quiet) {
    const verb = options.dryRun ? 'would remove' : 'removed';
    console.error(
      `reap-test-tmp: root=${result.root} — ${verb} ${result.removed} entr${result.removed === 1 ? 'y' : 'ies'} ` +
        `older than ${options.maxAgeHours}h, kept ${result.skippedRecent} touched within ${options.minAgeHours}h`
    );
  }
  console.log(formatLogLine(result, options.dryRun));

  if (result.failures.length > 0) {
    for (const failure of result.failures) console.error(`reap-test-tmp: failed ${failure}`);
    return 1;
  }
  return 0;
}

// Import-safe: `tests/specdir-compiled-parity.test.ts`-style consumers can import
// `reap()` without the CLI parsing vitest's own argv.
if (process.argv[1] && basename(process.argv[1]) === 'reap-test-tmp.mjs') {
  process.exitCode = main(process.argv.slice(2));
}
