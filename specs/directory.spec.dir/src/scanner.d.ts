export interface SpecFileInfo {
    path: string;
    name: string;
    type: 'spec' | 'dir' | 'subspec' | 'code';
    depth: number;
    parent?: string;
}
export interface DirectoryScanResult {
    specFiles: SpecFileInfo[];
    specDirs: SpecFileInfo[];
    nestingDepth: number;
    maxDepth: number;
}
/**
 * Scan a directory for spec files and directories
 */
export declare function scanDirectory(rootPath: string, maxDepth?: number): Promise<DirectoryScanResult>;
/**
 * Get all spec files in a tree structure
 */
export declare function getSpecTree(rootPath: string): Promise<Map<string, SpecFileInfo[]>>;
/**
 * Check if a path follows spec directory conventions
 */
export declare function validateSpecPath(path: string): {
    valid: boolean;
    issues: string[];
};
//# sourceMappingURL=scanner.d.ts.map