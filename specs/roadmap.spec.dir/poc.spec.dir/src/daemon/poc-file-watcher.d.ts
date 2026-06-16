/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/poc-daemon.spec.md
 * Generated: 2026-03-03T05:35:00.000Z
 *
 * Edit the spec, not this file.
 */
import { EventEmitter } from 'events';
/**
 * POC File Watcher
 * Simple wrapper around Node.js fs.watch
 */
export declare class FileWatcher extends EventEmitter {
    private watcher?;
    private watchDir;
    private ignorePatterns;
    constructor(options?: {
        watchDir?: string;
        ignorePatterns?: string[];
    });
    /**
     * Start watching the spec directory
     */
    watch(directory: string): Promise<void>;
    /**
     * Check if file should be ignored
     */
    private shouldIgnore;
    /**
     * Check if file is a spec file
     */
    private isSpecFile;
    /**
     * Map fs event type to our event type
     */
    private mapEventType;
    /**
     * Stop watching
     */
    stop(): Promise<void>;
    /**
     * Get initial list of spec files
     */
    getSpecFiles(): Promise<string[]>;
}
//# sourceMappingURL=poc-file-watcher.d.ts.map