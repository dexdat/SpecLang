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
/** Directories that never hold convergence outputs. */
export declare const DEFAULT_IGNORED_DIRECTORIES: string[];
/** Hard cap on the tree walk, so a pathological project cannot stall a cascade. */
export declare const MAX_SNAPSHOT_FILES = 20000;
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
/**
 * Snapshot every file under `root`.
 *
 * Symlinks are not followed: a symlinked directory (this repo's own `src/`
 * layout) must not be walked twice, and a symlinked file is not something the
 * generator wrote.
 */
export declare function snapshotProjectFiles(root: string, options?: SnapshotOptions): OutputSnapshot;
/**
 * Paths that were CREATED or whose content CHANGED between two snapshots.
 *
 * Deletions are not outputs: a convergence pass "wrote" nothing by removing a
 * file, and counting one would reintroduce an inflated number under a different
 * name. Result is sorted so log output and assertions are deterministic.
 */
export declare function diffOutputSnapshots(before: OutputSnapshot, after: OutputSnapshot): string[];
//# sourceMappingURL=outputs.d.ts.map