/**
 * Convergence OUTPUT accounting for speclangd (DF-SPECLANG-024).
 *
 * The convergence detector used to count watcher events, and the watcher
 * reports the spec the user just SAVED — an input. A save that generated
 * nothing therefore printed "Files: 1" while the disk held zero new files.
 *
 * The only trustworthy source of "what did this convergence pass write" is the
 * project tree itself: fingerprint it immediately before the pipeline runs,
 * fingerprint it again once the pipeline is done, and diff. Files the pipeline
 * rewrote with identical bytes are NOT counted (a no-op rewrite did not change
 * anything a user can see); the daemon's own state, the VCS database and
 * installed dependencies are never counted at all.
 *
 * Kept separate from convergence.ts so the detector stays a pure accounting
 * state machine that unit tests can drive without touching the filesystem.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/** Directories that never hold convergence outputs. */
export const DEFAULT_IGNORED_DIRECTORIES = ['.git', 'node_modules', '.speclang'];

/** Hard cap on the tree walk, so a pathological project cannot stall a cascade. */
export const MAX_SNAPSHOT_FILES = 20000;

/** Files above this size are fingerprinted by size+mtime instead of content. */
const LARGE_FILE_BYTES = 4 * 1024 * 1024;

/**
 * Content fingerprint of every file under `root`, keyed by POSIX-relative path.
 */
export interface OutputSnapshot {
  root: string;
  /** relative path -> fingerprint */
  files: Map<string, string>;
  /** true when the walk hit MAX_SNAPSHOT_FILES: the snapshot is incomplete */
  truncated: boolean;
  /** directory names skipped in this snapshot (kept so a re-snapshot matches) */
  ignoreDirectories: string[];
  /** basename patterns skipped in this snapshot */
  ignoreFilePatterns: string[];
}

export interface SnapshotOptions {
  /** Directory names to skip at any depth. Defaults to DEFAULT_IGNORED_DIRECTORIES. */
  ignoreDirectories?: string[];
  /**
   * Basename globs (`*.log`, `*.tmp`, or an exact name) for files that are
   * never convergence outputs. The daemon passes the file-shaped entries of the
   * project's `watch.ignore` here, so a log the user redirects into the project
   * while a cascade runs is not mistaken for generated code.
   */
  ignoreFilePatterns?: string[];
  /** Maximum number of files to fingerprint. Defaults to MAX_SNAPSHOT_FILES. */
  maxFiles?: number;
}

/** Compile a `*`/`?` basename glob. Everything else is literal. */
function globToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

function fingerprint(filePath: string, size: number, mtimeMs: number): string {
  if (size > LARGE_FILE_BYTES) {
    return `large:${size}:${mtimeMs}`;
  }
  try {
    return crypto.createHash('sha1').update(fs.readFileSync(filePath)).digest('hex');
  } catch {
    // Unreadable file (permissions, race with a delete): fall back to metadata
    // so the path is still tracked rather than silently dropped.
    return `unreadable:${size}:${mtimeMs}`;
  }
}

/**
 * Snapshot every file under `root`.
 *
 * Symlinks are not followed: a symlinked directory (this repo's own `src/`
 * layout) must not be walked twice, and a symlinked file is not something the
 * generator wrote.
 */
export function snapshotProjectFiles(
  root: string,
  options: SnapshotOptions = {},
): OutputSnapshot {
  const ignoreDirectories = options.ignoreDirectories ?? DEFAULT_IGNORED_DIRECTORIES;
  const ignoreFilePatterns = options.ignoreFilePatterns ?? [];
  const ignoreDirSet = new Set(ignoreDirectories);
  const ignoreFileRegExps = ignoreFilePatterns.map(globToRegExp);
  const maxFiles = options.maxFiles ?? MAX_SNAPSHOT_FILES;
  const snapshot: OutputSnapshot = {
    root,
    files: new Map(),
    truncated: false,
    ignoreDirectories: [...ignoreDirectories],
    ignoreFilePatterns: [...ignoreFilePatterns],
  };

  const walk = (absoluteDir: string, relativeDir: string): void => {
    if (snapshot.truncated) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
    } catch {
      return; // vanished or unreadable directory
    }

    for (const entry of entries) {
      if (snapshot.files.size >= maxFiles) {
        snapshot.truncated = true;
        return;
      }

      const absolute = path.join(absoluteDir, entry.name);
      const relative = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        if (ignoreDirSet.has(entry.name)) continue;
        walk(absolute, relative);
      } else if (entry.isFile()) {
        if (ignoreFileRegExps.some((re) => re.test(entry.name))) continue;
        let stat: fs.Stats;
        try {
          stat = fs.statSync(absolute);
        } catch {
          continue;
        }
        snapshot.files.set(relative, fingerprint(absolute, stat.size, stat.mtimeMs));
      }
    }
  };

  walk(root, '');
  return snapshot;
}

/**
 * Paths that were CREATED or whose content CHANGED between two snapshots.
 *
 * Deletions are not outputs: a convergence pass "wrote" nothing by removing a
 * file, and counting one would reintroduce an inflated number under a different
 * name. Result is sorted so log output and assertions are deterministic.
 */
export function diffOutputSnapshots(before: OutputSnapshot, after: OutputSnapshot): string[] {
  const changed: string[] = [];
  for (const [relative, hash] of after.files) {
    if (before.files.get(relative) !== hash) {
      changed.push(relative);
    }
  }
  return changed.sort();
}
