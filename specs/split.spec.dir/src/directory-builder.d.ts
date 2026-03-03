/**
 * SPECLANG-GENERATED: Directory builder for .spec.dir/ structure
 * Source: @speclang/dynamic-split/strategy @block:split/dir-structure
 */
import type { SplitFile } from './types';
/**
 * Build and manage .spec.dir/ directory structure
 */
export declare class DirectoryBuilder {
    /**
     * Create the directory structure for split specs
     */
    static createDirStructure(parentPath: string): string;
    /**
     * Get the .spec.dir/ path from a parent spec path
     */
    static getDirPath(parentPath: string): string;
    /**
     * Check if a directory is a spec split directory
     */
    static isSpecDir(dirPath: string): boolean;
    /**
     * Get parent spec path from a directory or child file path
     */
    static getParentPath(inputPath: string): string | null;
    /**
     * List all child specs in a directory
     */
    static listChildren(dirPath: string): string[];
    /**
     * Get all spec paths in a split directory (parent + children)
     */
    static getAllSpecPaths(parentPath: string): string[];
    /**
     * Write a split file to disk
     */
    static writeSplitFile(file: SplitFile): void;
    /**
     * Write multiple split files
     */
    static writeSplitFiles(files: SplitFile[]): void;
    /**
     * Delete a split directory (for merging)
     */
    static deleteDir(parentPath: string): void;
    /**
     * Check if split directory exists
     */
    static dirExists(parentPath: string): boolean;
    /**
     * Get directory info
     */
    static getDirInfo(parentPath: string): {
        exists: boolean;
        path: string;
        childCount: number;
        children: string[];
    };
}
//# sourceMappingURL=directory-builder.d.ts.map