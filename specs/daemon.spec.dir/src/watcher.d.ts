/**
 * File watcher for speclangd - Simulated using polling
 *
 * Generated from: @speclang/daemon/events
 *
 * Uses Node.js fs.watchFile for polling-based file watching.
 * In production, this would use inotify (Linux) or FSEvents (macOS).
 */
import { EventEmitter } from 'events';
import { DaemonConfig } from './types';
export declare class Watcher extends EventEmitter {
    private watchPaths;
    private ignorePatterns;
    private fileStates;
    private pollInterval;
    private running;
    private pollTimer?;
    private gitignore;
    private debouncer;
    constructor(config: DaemonConfig);
    /**
     * Start watching the configured directories
     */
    start(): Promise<void>;
    /**
     * Load .gitignore from project root
     */
    private loadGitignore;
    /**
     * Stop watching
     */
    stop(): void;
    /**
     * Initial scan to capture current file states
     */
    private initialScan;
    /**
     * Recursively scan directory for files
     */
    private scanDirectory;
    /**
     * Check if a path should be watched based on patterns
     */
    private shouldWatch;
    /**
     * Convert a glob pattern (with **, *, brace expansion {a,b}, .ext) into a RegExp.
     *
     * ARCH-001 fix (2026-07-04): the prior implementation did ** → .* first,
     * then * → [^/]* last — which meant the trailing * from **\/*.spec.md
     * turned the .* (multi-segment) into .[^/]* (single-segment), causing the
     * compiled regex to only match 2-segment paths. The new approach uses
     * placeholders for **/ and: any; /** (multi-directory anchors) and handles
    * brace expansion before escaping.
    */
    private globToRegex;
    /**
     * Simple glob pattern matching
     */
    private matchPattern;
    /**
     * Poll for file changes
     */
    private poll;
    /**
     * Scan directory and populate file map
     */
    private scanDirectoryToMap;
    /**
     * Force check a specific file (for manual triggers)
     */
    trigger(pathToCheck: string): Promise<void>;
}
//# sourceMappingURL=watcher.d.ts.map