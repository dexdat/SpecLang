/**
 * SPECLANG-GENERATED: Index updater for parent spec
 * Source: @speclang/dynamic-split/strategy @block:split/result
 */
import type { SplitFile, SplitResult } from './types';
/**
 * Update the parent index file after splitting
 */
export declare class IndexUpdater {
    /**
     * Update parent spec to be an index file
     */
    static updateParent(result: SplitResult): void;
    /**
     * Create index content for parent
     */
    static createIndexContent(parentPath: string, children: SplitFile[], metadata: Record<string, unknown>): string;
    /**
     * Convert path to spec ID
     */
    private static pathToId;
    /**
     * Get directory name from path
     */
    private static getDirName;
    /**
     * Read current parent content
     */
    static readParent(parentPath: string): string;
    /**
     * Extract metadata from parent
     */
    static extractParentMetadata(content: string): Record<string, unknown>;
    /**
     * Check if parent is an index file
     */
    static isIndexFile(parentPath: string): boolean;
    /**
     * Get all index files in specs directory
     */
    static findIndexFiles(specsDir: string): string[];
}
//# sourceMappingURL=index-updater.d.ts.map