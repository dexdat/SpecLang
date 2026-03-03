/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/simple-agent.spec.md
 * Generated: 2026-03-03T05:35:00.000Z
 *
 * Edit the spec, not this file.
 */
import { FileEvent } from '../types/poc';
/**
 * Simple Agent for POC
 * Single agent that converts spec changes to code
 * Simplified for POC - no multi-agent coordination needed
 */
export declare class SimpleAgent {
    private parser;
    private generator;
    constructor();
    /**
     * Handle file change event
     * Processes spec file and generates code
     * @param event - File change event
     */
    onFileChanged(event: FileEvent): Promise<void>;
    /**
     * Process a spec
     * @param spec - Parsed spec
     * @param specSlug - Filesystem-safe slug
     * @param filePath - Original file path
     */
    private processSpec;
    /**
     * Create or update symlinks
     * Falls back to copy on Windows if symlinks fail
     * @param specSlug - Filesystem-safe slug
     */
    private updateSymlinks;
    /**
     * Copy directory contents recursively (Windows fallback)
     * @param source - Source directory path
     * @param destination - Destination directory path
     */
    private copyDirectory;
}
//# sourceMappingURL=simple-agent.d.ts.map